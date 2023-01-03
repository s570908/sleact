import { Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway';

@Module({
  providers: [EventsGateway],
  exports: [EventsGateway], // EventsGateway 인스턴스를 남들이 사용할 수 있게 해준다.
})
export class EventsModule {}
