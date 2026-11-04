import { MigrationInterface, QueryRunner } from 'typeorm';

export class ProfileMedia1793810883426 implements MigrationInterface {
  name = 'ProfileMedia1793810883426';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "users"
            ADD "avatar_storage_key" character varying(512)
        `);
    await queryRunner.query(`
            ALTER TABLE "users"
            ADD "avatar_mime_type" character varying(32)
        `);
    await queryRunner.query(`
            ALTER TABLE "users"
            ADD "avatar_updated_at" TIMESTAMP WITH TIME ZONE
        `);
    await queryRunner.query(`
            ALTER TABLE "professional_profiles"
            ADD "signature_storage_key" character varying(512)
        `);
    await queryRunner.query(`
            ALTER TABLE "professional_profiles"
            ADD "signature_mime_type" character varying(32)
        `);
    await queryRunner.query(`
            ALTER TABLE "professional_profiles"
            ADD "signature_updated_at" TIMESTAMP WITH TIME ZONE
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "professional_profiles" DROP COLUMN "signature_updated_at"
        `);
    await queryRunner.query(`
            ALTER TABLE "professional_profiles" DROP COLUMN "signature_mime_type"
        `);
    await queryRunner.query(`
            ALTER TABLE "professional_profiles" DROP COLUMN "signature_storage_key"
        `);
    await queryRunner.query(`
            ALTER TABLE "users" DROP COLUMN "avatar_updated_at"
        `);
    await queryRunner.query(`
            ALTER TABLE "users" DROP COLUMN "avatar_mime_type"
        `);
    await queryRunner.query(`
            ALTER TABLE "users" DROP COLUMN "avatar_storage_key"
        `);
  }
}
