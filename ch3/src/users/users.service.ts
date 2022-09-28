import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Users } from "../entities/Users";
import { Connection, Repository } from "typeorm";
import bcrypt from "bcrypt";
import { WorkspaceMembers } from "../entities/WorkspaceMembers";
import { ChannelMembers } from "../entities/ChannelMembers";
import { query } from "express";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Users)
    private usersRepository: Repository<Users>,
    @InjectRepository(WorkspaceMembers)
    private workspaceMembersRepository: Repository<WorkspaceMembers>,
    @InjectRepository(ChannelMembers)
    private channelMembersRepository: Repository<ChannelMembers>,
    private connection: Connection,
  ) {}

  getUser() {}

  // https://orkhan.gitbook.io/typeorm/docs/transactions
  /*
  // create a new query runner
  const queryRunner = dataSource.createQueryRunner()

  // establish real database connection using our new query runner
  await queryRunner.connect()

  // now we can execute any queries on a query runner, for example:
  await queryRunner.query("SELECT * FROM users")

  // we can also access entity manager that works with connection created by a query runner:
  const users = await queryRunner.manager.find(User)

  // lets now open a new transaction:
  await queryRunner.startTransaction()

  try {
    // execute some operations on this transaction:
    await queryRunner.manager.save(user1)
    await queryRunner.manager.save(user2)
    await queryRunner.manager.save(photos)

    // commit transaction now:
    await queryRunner.commitTransaction()
  } catch (err) {
      // since we have errors let's rollback changes we made
      await queryRunner.rollbackTransaction()
  } finally {
      // you need to release query runner which is manually created:
      await queryRunner.release()
  }
  */
  async join(email: string, nickname: string, password: string) {
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    const user = await this.usersRepository.findOne({ where: { email } });
    if (user) {
      throw new Error("이미 존재하는 사용자입니다.");
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    try {
      const returned = await queryRunner.manager.getRepository(Users).save({
        email,
        nickname,
        password: hashedPassword,
      });
      // 롤백 테스트 후에 comment out 할 것
      throw new Error("롤백되나 보아라!");
      await queryRunner.manager.getRepository(WorkspaceMembers).save({
        UserId: returned.id,
        WorkspaceId: 1,
      });
      await queryRunner.manager.getRepository(ChannelMembers).save({
        UserId: returned.id,
        ChannelId: 1,
      });
      await queryRunner.commitTransaction();
      return true;
    } catch (error) {
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }
  }
}
