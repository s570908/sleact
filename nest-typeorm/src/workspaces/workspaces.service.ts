import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import selectForUserFields from 'src/data/user-select';
import { PrismaService } from 'src/prisma/prisma.service';
import { Repository } from 'typeorm';
import { ChannelMembers } from '../entities/ChannelMembers';
import { Channels } from '../entities/Channels';
import { Users } from '../entities/Users';
import { WorkspaceMembers } from '../entities/WorkspaceMembers';
import { Workspaces } from '../entities/Workspaces';

@Injectable()
export class WorkspacesService {
  constructor(
    private readonly prismaService: PrismaService,
    @InjectRepository(Workspaces)
    private workspacesRepository: Repository<Workspaces>,
    @InjectRepository(Channels)
    private channelsRepository: Repository<Channels>,
    @InjectRepository(WorkspaceMembers)
    private workspaceMembersRepository: Repository<WorkspaceMembers>,
    @InjectRepository(ChannelMembers)
    private channelMembersRepository: Repository<ChannelMembers>,
    @InjectRepository(Users)
    private usersRepository: Repository<Users>,
  ) {}

  async findById(id: number) {
    const aWorkspace = await this.prismaService.workspaces.findUnique({
      where: { id: id },
    });
    return aWorkspace;
    //return this.workspacesRepository.findOne({ where: { id } });
  }

  async findMyWorkspaces(myId: number) {
    const aMyWorkspaceMembers =
      await this.prismaService.workspaceMembers.findMany({
        where: { User: { id: myId } },
        select: { WorkspaceId: true },
      });
    const aFoundWorkspaces = await this.prismaService.workspaces.findMany({
      where: {
        id: { in: aMyWorkspaceMembers.map((wm) => wm.WorkspaceId) },
      },
    });
    console.log('findMyWorkspaces(myId) ', myId, aFoundWorkspaces);
    return aFoundWorkspaces;

    // // Method 1:  https://newbedev.com/typeorm-query-entity-based-on-relation-property
    // const myWorkspaces = this.workspacesRepository
    //   .createQueryBuilder('Workspaces')
    //   .innerJoin('Workspaces.WorkspaceMembers', 'workspaceMembers')
    //   .where('workspaceMembers.UserId = :id', { id: myId })
    //   .getMany();
    // console.log('findMyWorkspaces(myId: number): ', await myWorkspaces);
    // return myWorkspaces;

    // //Method2:  https://newbedev.com/typeorm-query-entity-based-on-relation-property
    // console.log('======>Method2');
    // return this.workspacesRepository.find({
    //   join: {
    //     alias: 'workspaces',
    //     innerJoin: { WorkspaceMembers: 'workspaces.WorkspaceMembers' },
    //   },
    //   where: (qb: any) => {
    //     qb.where(
    //       // Filter related fields.
    //       'WorkspaceMembers.UserId = :id',
    //       { id: myId },
    //     ).andWhere({
    //       // Filter workspaces fields if any
    //     });
    //   },
    // });

    // This doesn't work because
    // At the time of writing, there is no way to create a where clause on a joined table using repo.find(...).
    // You can join (doc) but the where clause only affects the entity of the repository.
    // TypeORM also silently ignores invalid where clauses, so be careful about those.
    // https://stackoverflow.com/questions/52246722/how-to-query-a-many-to-many-relation-with-typeorm
    // return this.workspacesRepository.find({
    //   relations: ['WorkspaceMembers'],
    //   where: {
    //     WorkspaceMembers: { userId: myId },  // 이것은 동작하지 않습니다. 왜냐하면 where절은 오직 workspacesRepository의 entity에서만
    //                                          // 동작하기 때문입니다.
    //   },
    // });
  }

  async createWorkspace(name: string, url: string, myId: number) {
    console.log(
      'createWorkspace(name, url, myId) name, url, myId: ',
      name,
      url,
      myId,
    );
    return await this.prismaService
      .$transaction(async () => {
        const aNewWorkspace = await this.prismaService.workspaces.create({
          data: {
            name: name,
            url: url,
            OwnerId: myId,
          },
        });
        const aNewWorkspaceMember =
          await this.prismaService.workspaceMembers.create({
            data: {
              UserId: myId,
              WorkspaceId: aNewWorkspace.id,
            },
          });
        const aNewChannel = await this.prismaService.channels.create({
          data: {
            name: '일반',
            WorkspaceId: aNewWorkspace.id,
          },
        });
        const aNewChannelMember =
          await this.prismaService.channelMembers.create({
            data: {
              UserId: myId,
              ChannelId: aNewChannel.id,
            },
          });

        console.log(
          'createWorkspace--aNewWorkspace, aNewWorkspaceMember,  aNewChannel, aNewChannelMember ',
          aNewWorkspace,
          aNewWorkspaceMember,
          aNewChannel,
          aNewChannelMember,
        );

        return aNewWorkspace;
      })
      .catch((error) => {
        console.error(error);
        throw error;
      });

    // const workspace = new Workspaces();
    // workspace.name = name;
    // workspace.url = url;
    // workspace.OwnerId = myId;
    // const returnedWorkspace = await this.workspacesRepository.save(workspace);
    // const workspaceMember = new WorkspaceMembers();
    // workspaceMember.UserId = myId;
    // workspaceMember.WorkspaceId = returnedWorkspace.id;
    // const returnedWorkspaceMember = await this.workspaceMembersRepository.save(
    //   workspaceMember,
    // );
    // const channel = new Channels();
    // channel.name = '일반';
    // channel.WorkspaceId = returnedWorkspace.id;
    // const returnedChannel = await this.channelsRepository.save(channel);
    // const channelMember = new ChannelMembers();
    // channelMember.UserId = myId;
    // channelMember.ChannelId = returnedChannel.id;
    // const returnedChannelMember = await this.channelMembersRepository.save(
    //   channelMember,
    // );

    // console.log(
    //   'createWorkspace--returnedWorkspace, returnedWorkspaceMember,  returnedChannel, returnedChannelMember ',
    //   returnedWorkspace,
    //   returnedWorkspaceMember,
    //   returnedChannel,
    //   returnedChannelMember,
    // );
  }

  async getWorkspaceMembers(url: string) {
    const aMyWorkspace = await this.prismaService.workspaces.findUnique({
      where: { url: url },
    });
    const aWorkspaceMemebers =
      await this.prismaService.workspaceMembers.findMany({
        where: {
          WorkspaceId: aMyWorkspace.id,
        },
      });
    const aMemebers = await this.prismaService.users.findMany({
      where: {
        id: { in: aWorkspaceMemebers.map((wm) => wm.UserId) },
      },
      select: { ...selectForUserFields.select },
    });
    //console.log('getWorkspaceMembers--url,aMembers ', url, aMemebers);
    return aMemebers;

    // return this.usersRepository
    //   .createQueryBuilder('user')
    //   .innerJoin('user.WorkspaceMembers', 'members')
    //   .innerJoin('members.Workspace', 'workspace', 'workspace.url = :url', {
    //     url,
    //   })
    //   .getMany();
  }

  async createWorkspaceMembers(url: string, email: any) {
    //console.log('createWorkspaceMembers: url, email ', url, email);
    const aReturnedWorkspaceMemebers = await this.prismaService
      .$transaction(async () => {
        const aWorkspace = await this.prismaService.workspaces.findUnique({
          where: { url: url },
          include: { Channels: true },
        });

        const aUser = await this.prismaService.users.findUnique({
          where: {
            email: email,
          },
          select: { ...selectForUserFields.select },
        });

        // console.log(
        //   'createWorkspaceMembers: workspace, user ',
        //   aWorkspace,
        //   aUser,
        // );

        if (!aUser) {
          return null;
        }

        const aWorkspaceMemebers =
          await this.prismaService.workspaceMembers.create({
            data: {
              WorkspaceId: aWorkspace.id,
              UserId: aUser.id,
            },
          });

        const aChannelMember = await this.prismaService.channelMembers.create({
          data: {
            ChannelId: aWorkspace.Channels.find((v) => v.name === '일반').id,
            UserId: aUser.id,
          },
        });

        // console.log(
        //   'createWorkspaceMembers: aWorkspaceMemebers, aChannelMember ',
        //   aWorkspaceMemebers,
        //   aChannelMember,
        // );

        return aWorkspaceMemebers;
      })
      .catch((error) => {
        console.error(error);
        throw error;
      });

    return aReturnedWorkspaceMemebers;

    // const workspace = await this.workspacesRepository.findOne({
    //   where: { url },
    //   join: {
    //     alias: 'workspace',
    //     innerJoinAndSelect: {
    //       channels: 'workspace.Channels',
    //     },
    //   },
    // });
    // const user = await this.usersRepository.findOne({ where: { email } });
    // console.log('createWorkspaceMembers: workspace, user ', workspace, user);
    // if (!user) {
    //   return null;
    // }
    // const workspaceMember = new WorkspaceMembers();
    // workspaceMember.WorkspaceId = workspace.id;
    // workspaceMember.UserId = user.id;
    // const returnedWorkspaceMembers = await this.workspaceMembersRepository.save(
    //   workspaceMember,
    // );
    // const channelMember = new ChannelMembers();
    // channelMember.ChannelId = workspace.Channels.find(
    //   (v) => v.name === '일반',
    // ).id;
    // channelMember.UserId = user.id;
    // const returnedChannelMembers = await this.channelMembersRepository.save(
    //   channelMember,
    // );
    // console.log(
    //   'createWorkspaceMembers: returnedWorkspaceMembers, returnedChannelMembers:: ',
    //   returnedWorkspaceMembers,
    //   returnedChannelMembers,
    // );
  }

  async getWorkspaceMember(url: string, id: number) {
    //console.log('getWorkspaceMember: url, id ', url, id);
    const aFoundWorkspace =
      await this.prismaService.workspaces.findUniqueOrThrow({
        where: {
          url: url,
        },
      });
    const aFoundWorkspaceMember =
      await this.prismaService.workspaceMembers.findFirstOrThrow({
        where: {
          WorkspaceId: aFoundWorkspace.id,
          UserId: id,
        },
      });
    const aFoundUser = await this.prismaService.users.findUniqueOrThrow({
      where: { id: aFoundWorkspaceMember.UserId },
      select: { ...selectForUserFields.select },
    });
    // console.log(
    //   'getWorkspaceMember-- aFoundWorkspaceMember, aFoundUser ',
    //   aFoundWorkspaceMember,
    //   aFoundUser,
    // );
    return aFoundUser;

    // const user = await this.usersRepository
    //   .createQueryBuilder('user')
    //   .where('user.id = :id', { id })
    //   .innerJoin('user.WorkspaceMembers', 'members')
    //   .innerJoin('members.Workspace', 'workspace', 'workspace.url = :url', {
    //     url,
    //   })
    //   .getOne();

    // console.log('getWorkspaceMember-- user ', user);

    // return user;
  }

  async deleteWorkspaceMember(url: string, id: number) {
    console.log('deleteWorkspaceMember: url, id ', url, id);
    const aWorkspace = await this.prismaService.workspaces.findUnique({
      where: { url: url },
    });
    const aWorkspaceMemeber = await this.prismaService.workspaceMembers.delete({
      where: {
        WorkspaceId_UserId: { WorkspaceId: aWorkspace.id, UserId: id },
      },
    });
    console.log(
      'deleteWorkspaceMember--aWorkspaceMemeber: ',
      aWorkspaceMemeber,
    );
    // const workspaceMember = await this.workspaceMembersRepository
    //   .createQueryBuilder('workspaceMember')
    //   .innerJoin('workspaceMember.User', 'user', 'user.id = :id', {
    //     id,
    //   })
    //   .innerJoin(
    //     'workspaceMember.Workspace',
    //     'workspace',
    //     'workspace.url = :url',
    //     {
    //       url,
    //     },
    //   )
    //   .getOne();
    // console.log('deleteWorkspaceMember: workspaceMember ', workspaceMember);
    // const result = await this.workspaceMembersRepository.delete({
    //   UserId: workspaceMember.UserId,
    // });
    // if (result.affected === 0) {
    //   throw new NotFoundException(
    //     `could not find a workspaceMember(url, id): (${url}, ${id})`,
    //   );
    // }
    return 'ok';
  }
}
