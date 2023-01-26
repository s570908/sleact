import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChannelMembers } from '../entities/ChannelMembers';
import { Channels } from '../entities/Channels';
import { Users } from '../entities/Users';
import { WorkspaceMembers } from '../entities/WorkspaceMembers';
import { Workspaces } from '../entities/Workspaces';

@Injectable()
export class WorkspacesService {
  @InjectRepository(Workspaces)
  private workspacesRepository: Repository<Workspaces>;
  @InjectRepository(Channels)
  private channelsRepository: Repository<Channels>;
  @InjectRepository(WorkspaceMembers)
  private workspaceMembersRepository: Repository<WorkspaceMembers>;
  @InjectRepository(ChannelMembers)
  private channelMembersRepository: Repository<ChannelMembers>;
  @InjectRepository(Users)
  private usersRepository: Repository<Users>;

  async findById(id: number) {
    return this.workspacesRepository.findOne({ where: { id } });
  }

  async findMyWorkspaces(myId: number) {
    // // Method 1:  https://newbedev.com/typeorm-query-entity-based-on-relation-property
    // const myWorkSpaces = this.workspacesRepository
    //   .createQueryBuilder('workSpaces')
    //   .innerJoin('workSpaces.WorkspaceMembers', 'workSpaceMembers')
    //   .where('workSpaceMembers.UserId = :id', { id: myId })
    //   .getMany();
    // console.log('findMyWorkspaces(myId: number): ', await myWorkSpaces);
    // return myWorkSpaces;

    //Method2:  https://newbedev.com/typeorm-query-entity-based-on-relation-property
    console.log('======>Method2');
    return this.workspacesRepository.find({
      join: {
        alias: 'workspaces',
        innerJoin: { WorkspaceMembers: 'workspaces.WorkspaceMembers' },
      },
      where: (qb: any) => {
        qb.where(
          // Filter related fields.
          'WorkspaceMembers.UserId = :id',
          { id: myId },
        ).andWhere({
          // Filter workspaces fileds if any
        });
      },
    });

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
    const workspace = new Workspaces();
    workspace.name = name;
    workspace.url = url;
    workspace.OwnerId = myId;
    const returned = await this.workspacesRepository.save(workspace);
    const workspaceMember = new WorkspaceMembers();
    workspaceMember.UserId = myId;
    workspaceMember.WorkspaceId = returned.id;
    await this.workspaceMembersRepository.save(workspaceMember);
    const channel = new Channels();
    channel.name = '일반';
    channel.WorkspaceId = returned.id;
    const channelReturned = await this.channelsRepository.save(channel);
    const channelMember = new ChannelMembers();
    channelMember.UserId = myId;
    channelMember.ChannelId = channelReturned.id;
    await this.channelMembersRepository.save(channelMember);
  }

  async getWorkspaceMembers(url: string) {
    return this.usersRepository
      .createQueryBuilder('user')
      .innerJoin('user.WorkspaceMembers', 'members')
      .innerJoin('members.Workspace', 'workspace', 'workspace.url = :url', {
        url,
      })
      .getMany();
  }

  async getWorkspaceChannels(url: string) {
    return this.channelsRepository
      .createQueryBuilder('channel')
      .innerJoin('channel.Workspace', 'workspace', 'workspace.url = :url', {
        url,
      })
      .getMany();
  }

  async createWorkspaceMembers(url: string, email: any) {
    console.log('createWorkspaceMembers: url, email ', url, email);
    const workspace = await this.workspacesRepository.findOne({
      where: { url },
      join: {
        alias: 'workspace',
        innerJoinAndSelect: {
          channels: 'workspace.Channels',
        },
      },
    });
    const user = await this.usersRepository.findOne({ where: { email } });
    console.log('createWorkspaceMembers: workspace, user ', workspace, user);
    if (!user) {
      return null;
    }
    const workspaceMember = new WorkspaceMembers();
    workspaceMember.WorkspaceId = workspace.id;
    workspaceMember.UserId = user.id;
    await this.workspaceMembersRepository.save(workspaceMember);
    const channelMember = new ChannelMembers();
    channelMember.ChannelId = workspace.Channels.find(
      (v) => v.name === '일반',
    ).id;
    channelMember.UserId = user.id;
    await this.channelMembersRepository.save(channelMember);
  }

  async getWorkspaceMember(url: string, id: number) {
    console.log('getWorkspaceMember: url, id ', url, id);
    return this.usersRepository
      .createQueryBuilder('user')
      .where('user.id = :id', { id })
      .innerJoin('user.WorkspaceMembers', 'members')
      .innerJoin('members.Workspace', 'workspace', 'workspace.url = :url', {
        url,
      })
      .getOne();
  }

  async deleteWorkspaceMember(url: string, id: number) {
    console.log('deleteWorkspaceMember: url, id ', url, id);
    const workspaceMember = await this.workspaceMembersRepository
      .createQueryBuilder('workspaceMember')
      .innerJoin('workspaceMember.User', 'user', 'user.id = :id', {
        id,
      })
      .innerJoin(
        'workspaceMember.Workspace',
        'workspace',
        'workspace.url = :url',
        {
          url,
        },
      )
      .getOne();
    const result = await this.workspaceMembersRepository.delete({
      UserId: workspaceMember.UserId,
    });
    if (result.affected === 0) {
      throw new NotFoundException(
        `could not find a workspaceMember(url, id): (${url}, ${id})`,
      );
    }
    return 'ok';
  }
}
