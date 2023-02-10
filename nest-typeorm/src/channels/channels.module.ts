import { Module } from '@nestjs/common';
// import { TypeOrmModule } from '@nestjs/typeorm';
// import { ChannelChats } from '../entities/ChannelChats';
// import { ChannelMembers } from '../entities/ChannelMembers';
// import { Channels } from '../entities/Channels';
// import { Users } from '../entities/Users';
// import { Workspaces } from '../entities/Workspaces';
import { ChannelsService } from './channels.service';
import { ChannelsController } from './channels.controller';
import { EventsModule } from '../events/events.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [
    // TypeOrmModule.forFeature([
    //   Channels,
    //   ChannelChats,
    //   Users,
    //   Workspaces,
    //   ChannelMembers,
    // ]),
    EventsModule, // 여기에 넣어야 한다.
    PrismaModule,
  ],
  providers: [ChannelsService], // 여기에 EventsGateway를 넣으면, new EventsGateway()가 되는 것이다. 즉 새로운 인스턴스가 하나 더 생성되므로 요기에 넣지 않도록 한다.
  controllers: [ChannelsController],
})
export class ChannelsModule {}
