import { Connection } from "typeorm";
import { Factory, Seeder } from "typeorm-seeding";
import { Channels } from "../../entities/Channels";
import { Workspaces } from "../../entities/Workspaces";

export class CreateInitialData implements Seeder {
  public async run(factory: Factory, connection: Connection): Promise<any> {
    await connection
      .createQueryBuilder()
      .insert()
      .into(Workspaces)
      .values([
        { id: 1, name: "Slack", url: "slack" },
        { id: 2, name: "English", url: "english" },
        { id: 3, name: "Sleact", url: "sleact" },
      ])
      .execute();

    await connection
      .createQueryBuilder()
      .insert()
      .into(Channels)
      .values([
        { id: 1, name: "general", WorkspaceId: 3, private: false },
        { id: 2, name: "MCL", WorkspaceId: 3, private: false },
        { id: 3, name: "Wattize", WorkspaceId: 3, private: false },
        { id: 4, name: "MyFamily", WorkspaceId: 3, private: false },
      ])
      .execute();

    // repository 방식도 가능하다.
    // const wsData = [{ id: 1, name: "Math", url: "math" }];
    // await connection.getRepository(Workspaces).save(wsData);
  }
}
