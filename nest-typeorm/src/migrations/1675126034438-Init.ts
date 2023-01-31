import {MigrationInterface, QueryRunner} from "typeorm";

export class Init1675126034438 implements MigrationInterface {
    name = 'Init1675126034438'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`workspacemembers\` ADD CONSTRAINT \`FK_77afc26dfe5a8633e6ce35eaa44\` FOREIGN KEY (\`WorkspaceId\`) REFERENCES \`workspaces\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`channelmembers\` ADD CONSTRAINT \`FK_e53905ed6170fb65083051881e7\` FOREIGN KEY (\`ChannelId\`) REFERENCES \`channels\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`channelmembers\` DROP FOREIGN KEY \`FK_e53905ed6170fb65083051881e7\``);
        await queryRunner.query(`ALTER TABLE \`workspacemembers\` DROP FOREIGN KEY \`FK_77afc26dfe5a8633e6ce35eaa44\``);
    }

}
