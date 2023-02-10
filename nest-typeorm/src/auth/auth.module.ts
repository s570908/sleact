import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from 'src/prisma/prisma.module';

import { AuthService } from './auth.service';
import { LocalSerializer } from './local.serializer';
import { LocalStrategy } from './local.strategy';

@Module({
  imports: [PassportModule.register({ session: true }), PrismaModule],
  providers: [AuthService, LocalStrategy, LocalSerializer],
})
export class AuthModule {}
