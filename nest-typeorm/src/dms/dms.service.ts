import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { onlineMap } from 'src/events/onlineMap';
import { PrismaService } from 'src/prisma/prisma.service';
import { MoreThan, Repository } from 'typeorm';
import { DMs } from '../entities/DMs';
import { Users } from '../entities/Users';
import { Workspaces } from '../entities/Workspaces';
import { EventsGateway } from '../events/events.gateway';

function getKeyByValue(object, value) {
  return Object.keys(object).find((key) => object[key] === value);
}

const selectForUserFields = {
  select: {
    id: true,
    email: true,
    nickname: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
  },
};

@Injectable()
export class DMsService {
  constructor(
    private readonly prismaService: PrismaService,
    // @InjectRepository(Workspaces)
    // private workspacesRepository: Repository<Workspaces>,
    // @InjectRepository(DMs) private dmsRepository: Repository<DMs>,
    // @InjectRepository(Users) private usersRepository: Repository<Users>,
    private readonly eventsGateway: EventsGateway,
  ) {}

  async getWorkspaceDMs(url: string, myId: number) {
    const aDMs = await this.prismaService.dMs.findMany({
      where: {
        SenderId: myId,
        Workspaces: {
          url: url,
        },
      },
    });
    console.log('getWorkspaceDMs url myId aUsers ', url, myId, aDMs);
    return aDMs;

    // return (
    //   this.dmsRepository
    //     .createQueryBuilder('dms')
    //     .innerJoin('dms.Sender', 'sender', 'sender.id = :myId', { myId })
    //     .innerJoin('dms.Workspace', 'workspace', 'workspace.url = :url', {
    //       url,
    //     })
    //     //.groupBy('dms.ReceiverId');
    //     .getMany()
    // );
  }

  async getWorkspaceDMChats(
    url: string,
    id: number,
    myId: number,
    perPage: number,
    page: number,
  ) {
    // console.log(
    //   'getWorkspaceDMChats(url, id, myId, perPage, page) ',
    //   url,
    //   id,
    //   myId,
    //   perPage,
    //   page,
    // );

    const aDMs = await this.prismaService.dMs.findMany({
      where: {
        OR: [
          {
            SenderId: myId,
            ReceiverId: id,
            Workspaces: {
              url: url,
            },
          },
          {
            SenderId: id,
            ReceiverId: myId,
            Workspaces: {
              url: url,
            },
          },
        ],
      },
      include: {
        Sender: selectForUserFields,
        Receiver: selectForUserFields,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: perPage,
      skip: perPage * (page - 1),
    });

    console.log('getWorkspaceDMChats ', aDMs);

    return aDMs;

    // return this.dmsRepository
    //   .createQueryBuilder('dms')
    //   .innerJoinAndSelect('dms.Sender', 'sender')
    //   .innerJoinAndSelect('dms.Receiver', 'receiver')
    //   .innerJoin('dms.Workspace', 'workspace')
    //   .where('workspace.url = :url', { url })
    //   .andWhere(
    //     '((dms.SenderId = :myId AND dms.ReceiverId = :id) OR (dms.ReceiverId = :myId AND dms.SenderId = :id))',
    //     { id, myId },
    //   )
    //   .orderBy('dms.createdAt', 'DESC')
    //   .take(perPage)
    //   .skip(perPage * (page - 1))
    //   .getMany();
  }

  async createWorkspaceDMChats(
    url: string,
    content: string,
    id: number,
    myId: number,
  ) {
    const aDmWithSender = await this.prismaService.dMs.create({
      data: {
        Sender: {
          connect: {
            id: myId,
          },
        },
        Receiver: {
          connect: {
            id: id,
          },
        },
        content: content,
        Workspaces: {
          connect: {
            url: url,
          },
        },
      },
      include: {
        Sender: selectForUserFields,
        Workspaces: {
          select: {
            url: true,
          },
        },
      },
    });
    const aWorkspace = aDmWithSender.Workspaces;
    delete aDmWithSender.Workspaces;
    console.log(
      'createWorkspaceDMChats-- aDmWithSender aWorkspace ',
      aDmWithSender,
      aWorkspace,
    );

    const aReceiverSocketId = getKeyByValue(
      onlineMap[`/ws-${aWorkspace.url}`],
      Number(id),
    );
    this.eventsGateway.server.to(aReceiverSocketId).emit('dm', aDmWithSender);

    // const workspace = await this.workspacesRepository.findOne({
    //   where: { url },
    // });
    // const dm = new DMs();
    // dm.SenderId = myId;
    // dm.ReceiverId = id;
    // dm.content = content;
    // dm.WorkspaceId = workspace.id;
    // const savedDm = await this.dmsRepository.save(dm);
    // const dmWithSender = await this.dmsRepository.findOne({
    //   where: { id: savedDm.id },
    //   relations: ['Sender'],
    // });
    // console.log('createWorkspaceDMChats-- dmWithSender ', dmWithSender);

    // const receiverSocketId = getKeyByValue(
    //   onlineMap[`/ws-${workspace.url}`],
    //   Number(id),
    // );
    // this.eventsGateway.server.to(receiverSocketId).emit('dm', dmWithSender);
  }

  async createWorkspaceDMImages(
    url: string,
    files: Express.Multer.File[],
    id: number,
    myId: number,
  ) {
    console.log(
      'createWorkspaceDMImages(url, files, id, myId)==> ',
      url,
      files,
      id,
      myId,
    );
    const aWorkspace = await this.prismaService.workspaces.findUnique({
      where: { url },
    });
    for (let i = 0; i < files.length; i++) {
      const aDmWithSender = await this.prismaService.dMs.create({
        data: {
          content: files[i].path,
          Sender: {
            connect: { id: myId },
          },
          Receiver: {
            connect: { id: id },
          },
          Workspaces: {
            connect: {
              id: aWorkspace.id,
            },
          },
        },
        include: {
          Sender: selectForUserFields,
        },
      });
      const aReceiverSocketId = getKeyByValue(
        onlineMap[`/ws-${aWorkspace.url}`],
        Number(id),
      );
      console.log(
        'createWorkspaceDMImages-- aDmWithSender, aReceiverSocketId ',
        aDmWithSender,
        aReceiverSocketId,
      );
      this.eventsGateway.server.to(aReceiverSocketId).emit('dm', aDmWithSender);
    }

    // const workspace = await this.workspacesRepository.findOne({
    //   where: { url },
    // });
    // for (let i = 0; i < files.length; i++) {
    //   const dm = new DMs();
    //   dm.SenderId = myId;
    //   dm.ReceiverId = id;
    //   dm.content = files[i].path;
    //   dm.WorkspaceId = workspace.id;
    //   const savedDm = await this.dmsRepository.save(dm);
    //   const dmWithSender = await this.dmsRepository.findOne({
    //     where: { id: savedDm.id },
    //     relations: ['Sender'],
    //   });
    //   const receiverSocketId = getKeyByValue(
    //     onlineMap[`/ws-${workspace.url}`],
    //     Number(id),
    //   );
    //   console.log(
    //     'createWorkspaceDMImages-- dmWithSender, receiverSocketId ',
    //     dmWithSender,
    //     receiverSocketId,
    //   );
    //   this.eventsGateway.server.to(receiverSocketId).emit('dm', dmWithSender);
    // }
  }

  async getDMUnreadsCount(url, id, myId, after) {
    // console.log(
    //   'getDMUnreadsCount(url, id, myId, after) ',
    //   url,
    //   id,
    //   myId,
    //   after,
    // );

    const aWorkspace = await this.prismaService.workspaces.findUnique({
      where: {
        url: url,
      },
    });

    const aCount = await this.prismaService.dMs.count({
      where: {
        Workspaces: {
          id: aWorkspace.id,
        },
        Sender: {
          id: id,
        },
        Receiver: {
          id: myId,
        },
        createdAt: {
          gt: new Date(after),
        },
      },
    });
    //console.log('getDMUnreadsCount-- aWorkspace, aCount ', aWorkspace, aCount);
    return aCount;

    // const workspace = await this.workspacesRepository.findOne({
    //   where: { url },
    // });
    // return this.dmsRepository.count({
    //   where: {
    //     WorkspaceId: workspace.id,
    //     SenderId: id,
    //     ReceiverId: myId,
    //     createdAt: MoreThan(new Date(after)),
    //   },
    // });
  }
}
