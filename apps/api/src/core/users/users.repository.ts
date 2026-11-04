import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersRepository {
  constructor(@InjectRepository(User) private readonly repository: Repository<User>) {}

  findById(id: string): Promise<User | null> {
    return this.repository.findOneBy({ id });
  }

  findByEmail(normalizedEmail: string): Promise<User | null> {
    return this.repository.findOneBy({ email: normalizedEmail });
  }

  /** Incluye `passwordHash` (excluido por defecto). Uso exclusivo de la autenticación. */
  findByEmailWithPassword(normalizedEmail: string): Promise<User | null> {
    return this.repository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email: normalizedEmail })
      .getOne();
  }

  async markLogin(id: string): Promise<void> {
    await this.repository.update({ id }, { lastLoginAt: new Date() });
  }

  async update(id: string, changes: Partial<User>): Promise<void> {
    if (Object.keys(changes).length === 0) return;
    await this.repository.update({ id }, changes);
  }
}
