import { type UserProfileResponse } from '@care/api-contracts';
import { Injectable } from '@nestjs/common';
import { type EntityManager } from 'typeorm';
import { normalizeEmail } from '@care/shared-utils';
import { type User } from './entities/user.entity';
import { UsersRepository } from './users.repository';

/** Perfil público: nunca incluye el hash de la contraseña ni claves de almacenamiento. */
export function toUserProfileResponse(user: User): UserProfileResponse {
  return {
    id: user.id,
    email: user.email,
    givenName: user.givenName,
    familyName: user.familyName,
    status: user.status,
    createdAt: user.createdAt.toISOString(),
    hasAvatar: Boolean(user.avatarStorageKey),
    avatarUpdatedAt: user.avatarUpdatedAt?.toISOString() ?? null,
  };
}

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  findById(id: string, manager?: EntityManager): Promise<User | null> {
    return this.usersRepository.findById(id, manager);
  }

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findByEmail(normalizeEmail(email));
  }

  findByEmailWithPassword(email: string): Promise<User | null> {
    return this.usersRepository.findByEmailWithPassword(normalizeEmail(email));
  }

  markLogin(id: string): Promise<void> {
    return this.usersRepository.markLogin(id);
  }

  update(
    id: string,
    changes: Partial<
      Pick<
        User,
        'givenName' | 'familyName' | 'avatarStorageKey' | 'avatarMimeType' | 'avatarUpdatedAt'
      >
    >,
    manager?: EntityManager,
  ): Promise<void> {
    return this.usersRepository.update(id, changes, manager);
  }
}
