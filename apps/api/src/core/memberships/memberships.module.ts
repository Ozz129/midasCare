import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Membership } from './entities/membership.entity';
import { MembershipsRepository } from './memberships.repository';
import { MembershipsService } from './memberships.service';

/** Vinculación usuario ↔ tenant, estado de la membresía y rol dentro del tenant. */
@Module({
  imports: [TypeOrmModule.forFeature([Membership])],
  providers: [MembershipsRepository, MembershipsService],
  exports: [MembershipsService],
})
export class MembershipsModule {}
