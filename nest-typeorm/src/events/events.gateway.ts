import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { onlineMap } from './onlineMap';

@WebSocketGateway({ namespace: /\/ws-.+/ })
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() public server: Server;

  @SubscribeMessage('test')
  handleTest(@MessageBody() data: string) {
    console.log('test', data);
  }

  // front에서 사용자가 login을 하면, 'workspace/sleact/channel/일반"으로 redirect한다. 이 page에서 workspace를 하나 선택하면,
  // 예를 들어, 'slack'을 선택하면 front는 로그인 user가 가입되어 있는 slack의 모든 channel들을 가져온다.
  // login 이벤트를 backend로 송부한다. 이 이벤트 속에는 로그인 user가 가입한 channel들이 들어 있다.
  // backend는 이 각각의 채널에 대응하는 socketIO의 room, /ws-<workspaceName>-<channelId>, 에 사용자 소켓을 등록한다.
  // 다음의 로그를 참조하기 바란다.
  /****
  
    join /ws-slack 9
    join /ws-slack 10
    join /ws-slack 20
    join /ws-slack 21
    join /ws-slack 30
    join /ws-slack 33
    join /ws-slack 42
    join /ws-slack 44
    join /ws-slack 57

   */
  @SubscribeMessage('login')
  handleLogin(
    @MessageBody() data: { id: number; channels: number[] },
    @ConnectedSocket() socket: Socket,
  ) {
    const newNamespace = socket.nsp;
    console.log('login', newNamespace);

    // workspace url과socket id를 키로 하여서 user id를 기록한다.
    onlineMap[socket.nsp.name][socket.id] = data.id;

    // workspace url에 속한 모든 user의 id array를 페이로드로 만들어서 이벤트로 송부한다.
    newNamespace.emit('onlineList', Object.values(onlineMap[socket.nsp.name]));
    data.channels.forEach((channel) => {
      console.log('join', socket.nsp.name, channel);
      socket.join(`${socket.nsp.name}-${channel}`);
    });
  }

  afterInit(server: Server): any {
    console.log('init');
  }

  handleConnection(@ConnectedSocket() socket: Socket) {
    console.log('connected', socket.nsp.name);
    if (!onlineMap[socket.nsp.name]) {
      onlineMap[socket.nsp.name] = {};
    }
    // broadcast to all clients in the given sub-namespace
    socket.emit('hello', socket.nsp.name);
  }

  handleDisconnect(@ConnectedSocket() socket: Socket) {
    console.log('disconnected', socket.nsp.name);
    const newNamespace = socket.nsp;
    delete onlineMap[socket.nsp.name][socket.id];
    newNamespace.emit('onlineList', Object.values(onlineMap[socket.nsp.name]));
  }
}
