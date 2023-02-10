import { Injectable } from '@nestjs/common';
import { PassportSerializer } from '@nestjs/passport';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserDto } from 'src/users/dto/user.dto';
import { UserNotFoundException } from 'src/users/exceptions/userNotFound.exception';

@Injectable()
export class LocalSerializer extends PassportSerializer {
  constructor(private readonly prismaService: PrismaService) {
    super();
  }

  serializeUser(user: UserDto, done: CallableFunction) {
    //console.log('serializeUser--user: ', user);
    done(null, user.id);
  }

  async deserializeUser(userId: string, done: CallableFunction) {
    const user = await this.prismaService.users.findUnique({
      where: {
        id: +userId,
      },
      select: {
        id: true,
        email: true,
        //password: true,
        Workspaces: true,
        WorkspaceMembers: {
          select: {
            WorkspaceId: true,
          },
        },
      },
    });
    if (!user) {
      console.log('deserializeUser: User not found');
      throw new UserNotFoundException();
    }
    //console.log('deserializeUser--user ', user);
    const workspaces = await this.prismaService.workspaces.findMany({
      where: {
        id: { in: user.WorkspaceMembers.map((wm) => wm.WorkspaceId) },
      },
    });
    if (user?.WorkspaceMembers) {
      user.Workspaces = workspaces;
      delete user.WorkspaceMembers;
    }
    done(null, user);
    //console.log('deserializeUser--user ', user);

    // Method 2

    // For test purpose of Method 1, commented out because it works good.
    // const aUser = await this.usersRepository
    //   .createQueryBuilder('users')
    //   .innerJoinAndSelect(
    //     'users.WorkspaceMembers',
    //     'workspaceMembers',
    //     'workspaceMembers.UserId = :userId',
    //     { userId },
    //   )
    //   .innerJoinAndSelect('workspaceMembers.Workspace', 'Workspace')
    //   .getOne();
    // //.getMany();
    // console.log('deserializeUser--aUser ', aUser);

    // if (aUser?.WorkspaceMembers) {
    //   aUser.Workspaces = aUser.WorkspaceMembers.map((wm) => wm.Workspace);
    //   delete aUser.WorkspaceMembers;
    //   delete aUser.createdAt;
    //   delete aUser.updatedAt;
    //   delete aUser.deletedAt;
    // }
    // console.log('deserializeUser--aUser ', aUser);

    // return await this.usersRepository
    //   .createQueryBuilder('users')
    //   .innerJoinAndSelect(
    //     'users.WorkspaceMembers',
    //     'workspaceMembers',
    //     'workspaceMembers.UserId = :userId',
    //     { userId },
    //   )
    //   .innerJoinAndSelect('workspaceMembers.Workspace', 'Workspace')
    //   .getOne()
    //   .then((user) => {
    //     if (user?.WorkspaceMembers) {
    //       user.Workspaces = user.WorkspaceMembers.map((wm) => wm.Workspace);
    //       delete user.WorkspaceMembers;
    //       delete user.createdAt;
    //       delete user.updatedAt;
    //       delete user.deletedAt;
    //     }
    //     console.log('deserializeUser--user: ', user);
    //     done(null, user);
    //   })
    //   .catch((error) => done(error));

    // Method 1

    //   const myWorkSpaces = await this.workspacesRepository
    //     .createQueryBuilder('workspaces')
    //     .innerJoin('workspaces.WorkspaceMembers', 'workspaceMembers')
    //     .where('workspaceMembers.UserId = :id', { id: userId })
    //     .getMany();
    //   return await this.usersRepository
    //     .findOneOrFail(
    //       {
    //         id: +userId,
    //       },
    //       {
    //         select: ['id', 'email', 'nickname'],
    //       },
    //     )
    //     .then((user) => {
    //       user.Workspaces = myWorkSpaces;
    //       console.log('deserializeUser--user: ', user);
    //       done(null, user);
    //     })
    //     .catch((error) => done(error));
  }
}
