import { useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const backUrl = process.env.NODE_ENV === 'production' ? 'https://sleact.nodebird.com' : 'http://localhost:3095';

// socket.io: namespace and room
// sleact:    workspace and channel/dm
// index signatue [key: string] : key type을 선언할 경우 사용한다.
// 사용:
//    const[socket, disconnet]  = useSocket(workspace);
//    useEffect(()=> {
//      socket.on('message', callback);
//      socket.emit('message', data);
//      disconnect();
//    })

const sockets: { [key: string]: Socket } = {};
const useSocket = (workspace?: string): [Socket | undefined, () => void] => {
  const disconnect = useCallback(() => {
    if (workspace && sockets[workspace]) {
      sockets[workspace].disconnect();
      delete sockets[workspace];
    }
  }, [workspace]);
  if (!workspace) {
    return [undefined, disconnect];
  }
  if (!sockets[workspace]) {
    sockets[workspace] = io(`${backUrl}/ws-${workspace}`, {
      transports: ['websocket'],
      //withCredentials: true,
    });
    console.info('create socket', workspace, sockets[workspace]);
  }

  return [sockets[workspace], disconnect];
};

export default useSocket;
