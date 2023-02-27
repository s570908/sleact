import { Injectable } from '@nestjs/common';
import selectForUserFields from 'src/data/user-select';
// import { InjectRepository } from '@nestjs/typeorm';
import { PrismaService } from 'src/prisma/prisma.service';
// import { MoreThan, Repository } from 'typeorm';
// import { ChannelChats } from '../entities/ChannelChats';
// import { ChannelMembers } from '../entities/ChannelMembers';
// import { Channels } from '../entities/Channels';
// import { Users } from '../entities/Users';
// import { Workspaces } from '../entities/Workspaces';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class ChannelsService {
  constructor(
    private readonly prismaService: PrismaService,
    // @InjectRepository(Channels)
    // private channelsRepository: Repository<Channels>,
    // @InjectRepository(ChannelMembers)
    // private channelMembersRepository: Repository<ChannelMembers>,
    // @InjectRepository(Workspaces)
    // private workspacesRepository: Repository<Workspaces>,
    // @InjectRepository(ChannelChats)
    // private channelChatsRepository: Repository<ChannelChats>,
    // @InjectRepository(Users)
    // private usersRepository: Repository<Users>,
    private readonly eventsGateway: EventsGateway,
  ) {}

  async findById(id: number) {
    return this.prismaService.channels.findUnique({
      where: { id: id },
    });
    //return this.channelsRepository.findOne({ where: { id } });
  }

  async getWorkspaceChannels(url: string, myId: number) {
    //console.log('getWorkspaceChannels url myId ', url, myId);
    const channels = await this.prismaService.channelMembers.findMany({
      where: {
        UserId: myId,
      },
      select: {
        ChannelId: true,
      },
    });
    //console.log('getWorkspaceChannels channels ', channels);
    const foundChannels = await this.prismaService.channels.findMany({
      where: {
        id: { in: channels.map((ch) => ch.ChannelId) },
        Workspace: {
          url: url,
        },
      },
    });
    //console.log('getWorkspaceChannels foundChannels ', foundChannels);
    return await this.prismaService.channels.findMany({
      where: {
        id: { in: channels.map((ch) => ch.ChannelId) },
        Workspace: {
          url: url,
        },
      },
    });
    // return this.channelsRepository
    //   .createQueryBuilder('channels')
    //   .innerJoinAndSelect(
    //     'channels.ChannelMembers',
    //     'channelMembers',
    //     'channelMembers.userId = :myId',
    //     { myId },
    //   )
    //   .innerJoinAndSelect(
    //     'channels.Workspace',
    //     'workspace',
    //     'workspace.url = :url',
    //     { url },
    //   )
    //   .getMany();
  }

  async getWorkspaceChannel(url: string, name: string) {
    return await this.prismaService.channels.findFirst({
      where: {
        name: name,
        Workspace: {
          url: url,
        },
      },
    });
    // return this.channelsRepository
    //   .createQueryBuilder('channel')
    //   .innerJoin('channel.Workspace', 'workspace', 'workspace.url = :url', {
    //     url,
    //   })
    //   .where('channel.name = :name', { name })
    //   .getOne();
  }

  async createWorkspaceChannels(url: string, name: string, myId: number) {
    return await this.prismaService
      .$transaction(async () => {
        const newChannel = await this.prismaService.channels.create({
          data: {
            name: name,
            Workspace: {
              connect: {
                url: url,
              },
            },
          },
        });
        const newChannelMember = await this.prismaService.channelMembers.create(
          {
            data: {
              ChannelId: newChannel.id,
              UserId: myId,
            },
          },
        );
        // console.log(
        //   'createWorkspaceChannels(url: string, name: string, myId: number)',
        //   url,
        //   name,
        //   myId,
        // );
        // console.log(
        //   'createWorkspaceChannels newChannel, newChannelMember ',
        //   newChannel,
        //   newChannelMember,
        // );
        return newChannel;
      })
      .catch((error) => {
        console.error(error);
        throw error;
      });

    // const workspace = await this.workspacesRepository.findOne({
    //   where: { url },
    // });
    // const channel = new Channels();
    // channel.name = name;
    // channel.WorkspaceId = workspace.id;
    // const channelReturned = await this.channelsRepository.save(channel);
    // const channelMember = new ChannelMembers();
    // channelMember.UserId = myId;
    // channelMember.ChannelId = channelReturned.id;
    // await this.channelMembersRepository.save(channelMember);
  }

  async getWorkspaceChannelMembers(url: string, name: string) {
    const foundChannel = await this.prismaService.channels.findFirst({
      where: {
        name: name,
        Workspace: {
          url: url,
        },
      },
    });
    //console.log('getWorkspaceChannelMembers foundChannels ', foundChannel);
    const memebers = await this.prismaService.users.findMany({
      where: {
        ChannelMembers: {
          // "every" will return all related records that match or have no relations.
          // https://github.com/prisma/prisma/issues/6456   matthewmueller commented on Apr 14, 2021
          // foundChannel.id를 44라고 가정하자. "every"로 변경한다면 44 channel에만 참여하고 있거나 어떤 채널에도 참여하고 있지 않은
          // users를 리턴한다.
          // "some"은 44 channel에는 반드시  참여하고 있는 users를 필터링한다. 다른 채널에 참여하였거나 말거나 상관없다.
          some: {
            ChannelId: foundChannel.id,
          },
        },
      },
    });
    //console.log('getWorkspaceChannelMembers members ', memebers);
    return memebers;

    // const channel = await this.channelsRepository
    //   .createQueryBuilder('channel')
    //   .innerJoin('channel.Workspace', 'workspace', 'workspace.url = :url', {
    //     url,
    //   })
    //   .where('channel.name = :name', { name })
    //   .getOne();
    // if (!channel) {
    //   return null; // TODO: 이 때 어떻게 에러 발생?
    // }

    // return this.usersRepository
    //   .createQueryBuilder('user')
    //   .innerJoin(
    //     'user.ChannelMembers',
    //     'channelMembers',
    //     'channelMembers.ChannelId = :channelId',
    //     {
    //       channelId: channel.id,
    //     },
    //   )
    //   .getMany();
  }

  async createWorkspaceChannelMembers(url, name, email) {
    // console.log(
    //   'createWorkspaceChannelMembers(url, name, email) ',
    //   url,
    //   name,
    //   email,
    // );
    // url workspace에 있는 name channel을 찾는다.
    // url workspace에 있는 email user를 찾는다.
    // 이 name channel에 email user를 기록한다. 즉, email user를 channelMember에 기록한다.

    const foundChannel = await this.prismaService.channels.findFirst({
      where: {
        name: name,
        Workspace: {
          url: url,
        },
      },
    });
    if (!foundChannel) {
      return null; // TODO: 이 때 어떻게 에러 발생?
    }
    //console.log('createWorkspaceChannelMembers: foundChannel ', foundChannel);

    const member = await this.prismaService.users.findFirst({
      where: {
        email: email,
        WorkspaceMembers: {
          // "every" will return all related records that match or have no relations.
          // https://github.com/prisma/prisma/issues/6456   matthewmueller commented on Apr 14, 2021
          // foundChannel.id를 44라고 가정하자. "every"로 변경한다면 44 channel에만 참여하고 있거나 어떤 채널에도 참여하고 있지 않은
          // users를 리턴한다.
          // "some"은 44 channel에는 반드시  참여하고 있는 users를 필터링한다. 다른 채널에 참여하였거나 말거나 상관없다.

          some: {
            WorkspaceId: foundChannel.WorkspaceId,
          },
        },
      },
    });

    //console.log('createWorkspaceChannelMembers: memeber ', member);

    const channelMember = await this.prismaService.channelMembers.create({
      data: {
        ChannelId: foundChannel.id,
        UserId: member.id,
      },
    });

    //console.log('createWorkspaceChannelMembers: channelMember ', channelMember);

    return channelMember;

    // const channel = await this.channelsRepository
    //   .createQueryBuilder('channel')
    //   .innerJoin('channel.Workspace', 'workspace', 'workspace.url = :url', {
    //     url,
    //   })
    //   .where('channel.name = :name', { name })
    //   .getOne();
    // if (!channel) {
    //   return null; // TODO: 이 때 어떻게 에러 발생?
    // }
    // console.log('createWorkspaceChannelMembers: channel ', channel);

    /*

    const user = await this.usersRepository
      .createQueryBuilder('user')
      .where('user.email = :email', { email })
      .innerJoin(
        'user.WorkspaceMembers',
        'workspaceMembers',
        'workspaceMembers.WorkspaceId = :workspaceId',
        {
          workspaceId: channel.WorkspaceId,
        },
      )
      .getOne();

    // const user = await this.usersRepository
    //   .createQueryBuilder('user')
    //   .where('user.email = :email', { email })
    //   .innerJoin('user.OwnedWorkspaces', 'workspace', 'workspace.url = :url', {
    //     url,
    //   })
    //   .getOne();
    console.log('createWorkspaceChannelMembers: user ', user);
    if (!user) {
      return null;
    }

    const channelMember = new ChannelMembers();
    channelMember.ChannelId = channel.id;
    channelMember.UserId = user.id;
    return await this.channelMembersRepository.save(channelMember);

    */
  }

  async getWorkspaceChannelChats(
    url: string,
    name: string,
    perPage: number,
    page: number,
  ) {
    const chats = await this.prismaService.channelChats.findMany({
      where: {
        Channel: {
          name: name,
          Workspace: {
            url: url,
          },
        },
      },
      include: {
        User: selectForUserFields,
      },
      take: perPage,
      skip: perPage * (page - 1),
      orderBy: {
        createdAt: 'desc',
      },
    });
    // console.log(
    //   'getWorkspaceChannelChats url, name, perPage, page, chats: ',
    //   url,
    //   name,
    //   perPage,
    //   page,
    //   chats,
    // );

    return chats;

    // return this.channelChatsRepository
    //   .createQueryBuilder('channelChats')
    //   .innerJoin('channelChats.Channel', 'channel', 'channel.name = :name', {
    //     name,
    //   })
    //   .innerJoin('channel.Workspace', 'workspace', 'workspace.url = :url', {
    //     url,
    //   })
    //   .innerJoinAndSelect('channelChats.User', 'user')
    //   .orderBy('channelChats.createdAt', 'DESC')
    //   .take(perPage)
    //   .skip(perPage * (page - 1))
    //   .getMany();
  }

  async createWorkspaceChannelChats(
    //// postChat 33강
    url: string,
    name: string,
    content: string,
    myId: number,
  ) {
    const aChannel = await this.prismaService.channels.findFirst({
      where: {
        name: name,
        Workspace: {
          url: url,
        },
      },
    });
    const chatWithUser = await this.prismaService.channelChats.create({
      data: {
        content: content,
        User: {
          connect: {
            id: myId,
          },
        },
        Channel: {
          connect: {
            id: aChannel.id,
          },
        },
      },
      include: {
        User: selectForUserFields,
        Channel: true,
      },
    });
    // console.log(
    //   'createWorkspaceChannelChats(url, name, content, myId) chatWithUser: ',
    //   url,
    //   name,
    //   content,
    //   myId,
    //   chatWithUser,
    // );

    // const channel = await this.channelsRepository
    //   .createQueryBuilder('channel')
    //   .innerJoin('channel.Workspace', 'workspace', 'workspace.url = :url', {
    //     url,
    //   })
    //   .where('channel.name = :name', { name })
    //   .getOne();
    // const chats = new ChannelChats();
    // chats.content = content;
    // chats.UserId = myId;
    // chats.ChannelId = channel.id;
    // const savedChat = await this.channelChatsRepository.save(chats);
    // const chatWithUser = await this.channelChatsRepository.findOne({
    //   where: { id: savedChat.id },
    //   relations: ['User', 'Channel'],
    // });
    // console.log(
    //   'chatWithUser.ChannelId, chatWithUser ',
    //   chatWithUser.ChannelId,
    //   chatWithUser,
    // );

    // socket.io로 워크스페이스 + 채널 사용자에게 전송
    this.eventsGateway.server
      // .of(`/ws-${url}`)
      .to(`/ws-${url}-${chatWithUser.ChannelId}`)
      .emit('message', chatWithUser);
  }

  async createWorkspaceChannelImages(
    url: string,
    name: string,
    files: Express.Multer.File[],
    myId: number,
  ) {
    console.log(
      'createWorkspaceChannelImages(url, name, files, myId)==> ',
      url,
      name,
      files,
      myId,
    );

    const aChannel = await this.prismaService.channels.findFirst({
      where: {
        name: name,
        Workspace: {
          url: url,
        },
      },
    });

    console.log('createWorkspaceChannelImages-- channel: ', aChannel);

    for (let i = 0; i < files.length; i++) {
      const aChatWithUser = await this.prismaService.channelChats.create({
        data: {
          content: files[i].path,
          User: {
            connect: {
              id: myId,
            },
          },
          Channel: {
            connect: {
              id: aChannel.id,
            },
          },
        },
        include: {
          User: selectForUserFields,
          Channel: true,
        },
      });

      console.log(
        'createWorkspaceChannelImages-- aChatWithUser: ',
        aChatWithUser,
      );

      this.eventsGateway.server
        // .of(`/ws-${url}`)
        .to(`/ws-${url}-${aChatWithUser.ChannelId}`)
        .emit('message', aChatWithUser);
    }

    // const channel = await this.channelsRepository
    //   .createQueryBuilder('channel')
    //   .innerJoin('channel.Workspace', 'workspace', 'workspace.url = :url', {
    //     url,
    //   })
    //   .where('channel.name = :name', { name })
    //   .getOne();
    // console.log('createWorkspaceChannelImages-- channel: ', channel);
    // for (let i = 0; i < files.length; i++) {
    //   const chats = new ChannelChats();
    //   chats.content = files[i].path;
    //   chats.UserId = myId;
    //   chats.ChannelId = channel.id;
    //   const savedChat = await this.channelChatsRepository.save(chats);
    //   const chatWithUser = await this.channelChatsRepository.findOne({
    //     where: { id: savedChat.id },
    //     relations: ['User', 'Channel'],
    //   });
    //   this.eventsGateway.server
    //     // .of(`/ws-${url}`)
    //     .to(`/ws-${url}-${chatWithUser.ChannelId}`)
    //     .emit('message', chatWithUser);
    // }
  }

  async getChannelUnreadsCount(url, name, after) {
    //console.log('getChannelUnreadsCount(url, name, after) ', url, name, after);

    const aChannel = await this.prismaService.channels.findFirst({
      where: {
        name: name,
        Workspace: {
          url: url,
        },
      },
    });

    //console.log('getChannelUnreadsCount-- aChannel ', aChannel);

    return await this.prismaService.channelChats.count({
      where: {
        ChannelId: aChannel.id,
        createdAt: {
          gt: new Date(after),
        },
      },
    });

    // const channel = await this.channelsRepository
    //   .createQueryBuilder('channel')
    //   .innerJoin('channel.Workspace', 'workspace', 'workspace.url = :url', {
    //     url,
    //   })
    //   .where('channel.name = :name', { name })
    //   .getOne();
    // return this.channelChatsRepository.count({
    //   where: {
    //     ChannelId: channel.id,
    //     createdAt: MoreThan(new Date(after)),
    //   },
    // });
  }
}
