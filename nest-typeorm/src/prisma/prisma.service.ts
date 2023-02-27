import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();

    this.$use(async (params, next) => {
      if (params.action === 'delete') {
        params.action = 'update';
        params.args['data'] = { softDeletedAt: new Date() };
      } else if (params.action === 'deleteMany') {
        params.action = 'updateMany';
        if (params.args.data !== undefined) {
          params.args.data['softDeletedAt'] = new Date();
        } else {
          params.args['data'] = { softDeletedAt: new Date() };
        }
      }
      return next(params);
    });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
