import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialCoreSchema1793740134137 implements MigrationInterface {
  name = 'InitialCoreSchema1793740134137';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "audit_logs" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "tenant_id" uuid,
                "actor_user_id" uuid,
                "action" character varying(100) NOT NULL,
                "resource_type" character varying(100) NOT NULL,
                "resource_id" character varying(100),
                "metadata" jsonb NOT NULL DEFAULT '{}',
                "ip_address" character varying(45),
                "user_agent" character varying(512),
                "occurred_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "pk_audit_logs" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "ix_audit_logs_tenant_id_occurred_at" ON "audit_logs" ("tenant_id", "occurred_at")
        `);
    await queryRunner.query(`
            CREATE TABLE "tenants" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "type" character varying(32) NOT NULL,
                "name" character varying(200) NOT NULL,
                "slug" character varying(100) NOT NULL,
                "status" character varying(32) NOT NULL DEFAULT 'ACTIVE',
                "settings" jsonb NOT NULL DEFAULT '{}',
                CONSTRAINT "uq_tenants_slug" UNIQUE ("slug"),
                CONSTRAINT "pk_tenants" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "users" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "email" character varying(320) NOT NULL,
                "password_hash" character varying(255) NOT NULL,
                "given_name" character varying(100) NOT NULL,
                "family_name" character varying(100) NOT NULL,
                "status" character varying(32) NOT NULL DEFAULT 'PENDING_VERIFICATION',
                "last_login_at" TIMESTAMP WITH TIME ZONE,
                CONSTRAINT "uq_users_email" UNIQUE ("email"),
                CONSTRAINT "pk_users" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "stored_files" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "tenant_id" uuid NOT NULL,
                "storage_driver" character varying(32) NOT NULL,
                "storage_key" character varying(512) NOT NULL,
                "original_name" character varying(255) NOT NULL,
                "mime_type" character varying(255) NOT NULL,
                "size_bytes" bigint NOT NULL,
                "checksum_sha256" character(64) NOT NULL,
                "uploaded_by_user_id" uuid,
                CONSTRAINT "uq_stored_files_storage_key" UNIQUE ("storage_key"),
                CONSTRAINT "pk_stored_files" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "ix_stored_files_tenant_id" ON "stored_files" ("tenant_id")
        `);
    await queryRunner.query(`
            CREATE TABLE "professional_profiles" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "user_id" uuid NOT NULL,
                "display_name" character varying(200) NOT NULL,
                "license_number" character varying(100),
                "specialties" text array NOT NULL DEFAULT '{}',
                CONSTRAINT "uq_professional_profiles_user_id" UNIQUE ("user_id"),
                CONSTRAINT "pk_professional_profiles" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "memberships" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "tenant_id" uuid NOT NULL,
                "user_id" uuid NOT NULL,
                "role" character varying(32) NOT NULL,
                "status" character varying(32) NOT NULL DEFAULT 'INVITED',
                CONSTRAINT "uq_memberships_tenant_id_user_id" UNIQUE ("tenant_id", "user_id"),
                CONSTRAINT "pk_memberships" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "ix_memberships_tenant_id" ON "memberships" ("tenant_id")
        `);
    await queryRunner.query(`
            CREATE INDEX "ix_memberships_user_id" ON "memberships" ("user_id")
        `);
    await queryRunner.query(`
            ALTER TABLE "stored_files"
            ADD CONSTRAINT "fk_stored_files_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "stored_files"
            ADD CONSTRAINT "fk_stored_files_uploaded_by_user_id" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "users"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "professional_profiles"
            ADD CONSTRAINT "fk_professional_profiles_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "memberships"
            ADD CONSTRAINT "fk_memberships_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "memberships"
            ADD CONSTRAINT "fk_memberships_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "memberships" DROP CONSTRAINT "fk_memberships_user_id"
        `);
    await queryRunner.query(`
            ALTER TABLE "memberships" DROP CONSTRAINT "fk_memberships_tenant_id"
        `);
    await queryRunner.query(`
            ALTER TABLE "professional_profiles" DROP CONSTRAINT "fk_professional_profiles_user_id"
        `);
    await queryRunner.query(`
            ALTER TABLE "stored_files" DROP CONSTRAINT "fk_stored_files_uploaded_by_user_id"
        `);
    await queryRunner.query(`
            ALTER TABLE "stored_files" DROP CONSTRAINT "fk_stored_files_tenant_id"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."ix_memberships_user_id"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."ix_memberships_tenant_id"
        `);
    await queryRunner.query(`
            DROP TABLE "memberships"
        `);
    await queryRunner.query(`
            DROP TABLE "professional_profiles"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."ix_stored_files_tenant_id"
        `);
    await queryRunner.query(`
            DROP TABLE "stored_files"
        `);
    await queryRunner.query(`
            DROP TABLE "users"
        `);
    await queryRunner.query(`
            DROP TABLE "tenants"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."ix_audit_logs_tenant_id_occurred_at"
        `);
    await queryRunner.query(`
            DROP TABLE "audit_logs"
        `);
  }
}
