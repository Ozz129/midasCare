import { MigrationInterface, QueryRunner } from 'typeorm';

export class AuthSessions1793807874479 implements MigrationInterface {
  name = 'AuthSessions1793807874479';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "auth_sessions" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "user_id" uuid NOT NULL,
                "token_hash" character(64) NOT NULL,
                "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
                "revoked_at" TIMESTAMP WITH TIME ZONE,
                "last_used_at" TIMESTAMP WITH TIME ZONE,
                "ip_address" character varying(45),
                "user_agent" character varying(512),
                CONSTRAINT "uq_auth_sessions_token_hash" UNIQUE ("token_hash"),
                CONSTRAINT "pk_auth_sessions" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "ix_auth_sessions_user_id" ON "auth_sessions" ("user_id")
        `);
    await queryRunner.query(`
            ALTER TABLE "auth_sessions"
            ADD CONSTRAINT "fk_auth_sessions_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "auth_sessions" DROP CONSTRAINT "fk_auth_sessions_user_id"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."ix_auth_sessions_user_id"
        `);
    await queryRunner.query(`
            DROP TABLE "auth_sessions"
        `);
  }
}
