import { ForbiddenException, Injectable } from '@nestjs/common';
//import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserNotFoundException } from './exceptions/userNotFound.exception';

//const prisma = new PrismaClient();

@Injectable()
export class UsersService {
  constructor(private readonly prismaService: PrismaService) {}

  async findByEmail(email: string) {
    // return this.usersRepository.findOne({
    //   where: { email },
    //   select: ['id', 'email', 'password'],
    // });
    const user = await this.prismaService.users.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
        email: true,
        password: true,
      },
    });
    if (!user) {
      throw new UserNotFoundException();
    }

    return user;
  }

  async join(email: string, nickname: string, password: string) {
    return await this.prismaService
      .$transaction(async () => {
        const user = await this.prismaService.users.findUnique({
          where: {
            email,
          },
        });
        if (user) {
          //console.log('이미 존재하는 사용자 user ', user);
          throw new ForbiddenException('이미 존재하는 사용자입니다');
        }
        const hashedPassword = await bcrypt.hash(password, 12);
        const returned = await this.prismaService.users.create({
          data: {
            email: email,
            nickname: nickname,
            password: hashedPassword,
          },
        });
        const workspaceMember =
          await this.prismaService.workspaceMembers.create({
            data: {
              UserId: returned.id,
              WorkspaceId: 1,
            },
          });
        // For rollback test
        // if (true) {
        //   throw new Error(`Make error and check the result for rollback`);
        // }
        const channelMember = await this.prismaService.channelMembers.create({
          data: {
            UserId: returned.id,
            ChannelId: 1,
          },
        });
        return true;
        // console.log(
        //   'join-- returned, workspaceMember, channelMember ',
        //   returned,
        //   workspaceMember,
        //   channelMember,
        // );
      })
      .catch((error) => {
        console.error(error);
        throw error;
      });
  }

  /*

  async join(email: string, nickname: string, password: string) {
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    const user = await queryRunner.manager
      .getRepository(Users)
      .findOne({ where: { email } });
    if (user) {
      throw new ForbiddenException('이미 존재하는 사용자입니다');
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    try {
      const returned = await queryRunner.manager.getRepository(Users).save({
        email,
        nickname,
        password: hashedPassword,
      });
      const workspaceMember = queryRunner.manager
        .getRepository(WorkspaceMembers)
        .create();
      workspaceMember.UserId = returned.id;
      workspaceMember.WorkspaceId = 1;
      await queryRunner.manager
        .getRepository(WorkspaceMembers)
        .save(workspaceMember);
      await queryRunner.manager.getRepository(ChannelMembers).save({
        UserId: returned.id,
        ChannelId: 1,
      });
      await queryRunner.commitTransaction();
      return true;
    } catch (error) {
      console.error(error);
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  */
}
