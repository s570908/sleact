import { MigrationInterface, QueryRunner } from "typeorm";

export class categoryToType1663600619019 implements MigrationInterface {
  name = "categoryToType1663600619019";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE `mentions` RENAME COLUMN `category` TO `type`",
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "ALTER TABLE `mentions` RENAME COLUMN `type` TO `category`",
    );
  }
}
