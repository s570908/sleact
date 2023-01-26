import { Injectable } from '@nestjs/common';
import { PassportSerializer } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { Workspaces } from 'src/entities/Workspaces';
import { Repository } from 'typeorm';
import { Users } from '../entities/Users';
import { AuthService } from './auth.service';

@Injectable()
export class LocalSerializer extends PassportSerializer {
  constructor(
    private readonly authService: AuthService,
    @InjectRepository(Users) private usersRepository: Repository<Users>,
    @InjectRepository(Workspaces)
    private workspacesRepository: Repository<Workspaces>,
  ) {
    super();
  }

  serializeUser(user: Users, done: CallableFunction) {
    //console.log('serializeUser--user: ', user);
    done(null, user.id);
  }

  async deserializeUser(userId: string, done: CallableFunction) {
    const myWorkSpaces = await this.workspacesRepository
      .createQueryBuilder('workSpaces')
      .innerJoin('workSpaces.WorkspaceMembers', 'workSpaceMembers')
      .where('workSpaceMembers.UserId = :id', { id: userId })
      .getMany();
    const user = await this.usersRepository.findOneOrFail(
      {
        id: +userId,
      },
      {
        select: ['id', 'email', 'nickname'],
      },
    );
    user.Workspaces = myWorkSpaces;
    console.log('deserializeUser--userId user ', userId, user);

    return await this.usersRepository
      .findOneOrFail(
        {
          id: +userId,
        },
        {
          select: ['id', 'email', 'nickname'],
        },
      )
      .then((user) => {
        user.Workspaces = myWorkSpaces;
        console.log('deserializeUser--user: ', user);
        done(null, user);
      })
      .catch((error) => done(error));
  }
}
