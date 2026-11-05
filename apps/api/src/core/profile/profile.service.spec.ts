import { UnauthorizedException } from '@nestjs/common';
import { type DataSource, type EntityManager } from 'typeorm';
import { type StorageProvider } from '../../infrastructure/storage/storage-provider';
import { type AuditService } from '../audit/audit.service';
import { type ProfessionalProfile } from '../professionals/entities/professional-profile.entity';
import { type ProfessionalsService } from '../professionals/professionals.service';
import { type User } from '../users/entities/user.entity';
import { type UsersService } from '../users/users.service';
import { ProfileService } from './profile.service';

const USER_ID = '9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d';

function buildUser(): User {
  return {
    id: USER_ID,
    email: 'ana@example.com',
    givenName: 'Ana',
    familyName: 'Pérez',
    status: 'ACTIVE',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    avatarStorageKey: null,
    avatarMimeType: null,
    avatarUpdatedAt: null,
  } as unknown as User;
}

function buildProfile(): ProfessionalProfile {
  return {
    id: '1d2e3f40-5a6b-4c7d-8e9f-0a1b2c3d4e5f',
    userId: USER_ID,
    displayName: 'Ana Pérez',
    licenseNumber: 'COP-123',
    specialties: ['PSYCHOLOGY'],
    signatureStorageKey: null,
    signatureMimeType: null,
    signatureUpdatedAt: null,
  } as unknown as ProfessionalProfile;
}

/**
 * Pruebas unitarias de ProfileService.update(): verifican que todas las lecturas y
 * escrituras usan el EntityManager de la transacción y que un fallo se propaga
 * (lo que provoca el ROLLBACK en TypeORM). El rollback real contra PostgreSQL se
 * verifica en test/profile-transaction.e2e-spec.ts.
 */
describe('ProfileService.update', () => {
  const manager = { name: 'transaction-manager' } as unknown as EntityManager;
  const transaction = jest.fn(async (work: (entityManager: EntityManager) => Promise<unknown>) =>
    work(manager),
  );
  const dataSource = { transaction } as unknown as DataSource;

  const usersService = { findById: jest.fn(), update: jest.fn() };
  const professionalsService = {
    getOrCreate: jest.fn(),
    save: jest.fn(),
    findProfileByUserId: jest.fn(),
  };
  const auditService = { record: jest.fn() };

  const service = new ProfileService(
    dataSource,
    usersService as unknown as UsersService,
    professionalsService as unknown as ProfessionalsService,
    auditService as unknown as AuditService,
    {} as StorageProvider,
  );

  let profile: ProfessionalProfile;

  beforeEach(() => {
    jest.clearAllMocks();
    profile = buildProfile();
    usersService.findById.mockResolvedValue(buildUser());
    usersService.update.mockResolvedValue(undefined);
    professionalsService.getOrCreate.mockResolvedValue(profile);
    professionalsService.save.mockImplementation(async (saved: ProfessionalProfile) => saved);
    professionalsService.findProfileByUserId.mockResolvedValue(profile);
    auditService.record.mockResolvedValue(undefined);
  });

  it('actualiza User, ProfessionalProfile y auditoría dentro de una única transacción', async () => {
    const result = await service.update(USER_ID, {
      givenName: 'Ana María',
      displayName: 'Ps. Ana María Pérez',
      specialties: ['PSYCHOLOGY', 'NEUROPSYCHOLOGY'],
    });

    expect(transaction).toHaveBeenCalledTimes(1);
    expect(usersService.findById).toHaveBeenNthCalledWith(1, USER_ID, manager);
    expect(usersService.update).toHaveBeenCalledWith(USER_ID, { givenName: 'Ana María' }, manager);
    expect(professionalsService.getOrCreate).toHaveBeenCalledWith(
      USER_ID,
      'Ana María Pérez',
      manager,
    );
    expect(professionalsService.save).toHaveBeenCalledWith(
      expect.objectContaining({
        displayName: 'Ps. Ana María Pérez',
        specialties: ['PSYCHOLOGY', 'NEUROPSYCHOLOGY'],
      }),
      manager,
    );
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'profile.update',
        metadata: { fields: ['givenName', 'displayName', 'specialties'] },
      }),
      manager,
    );
    // La respuesta se lee después del COMMIT, fuera de la transacción.
    expect(usersService.findById).toHaveBeenLastCalledWith(USER_ID, undefined);
    expect(result.professional?.displayName).toBe('Ps. Ana María Pérez');
  });

  it('no abre escrituras profesionales ni auditoría si no hay cambios', async () => {
    await service.update(USER_ID, { givenName: 'Ana' });

    expect(transaction).toHaveBeenCalledTimes(1);
    expect(usersService.update).toHaveBeenCalledWith(USER_ID, {}, manager);
    expect(professionalsService.getOrCreate).not.toHaveBeenCalled();
    expect(auditService.record).not.toHaveBeenCalled();
  });

  it('propaga el fallo al guardar el perfil profesional (rollback) y omite la auditoría', async () => {
    const failure = new Error('fallo al guardar el perfil profesional');
    professionalsService.save.mockRejectedValueOnce(failure);

    await expect(
      service.update(USER_ID, { givenName: 'Ana María', displayName: 'Ps. Ana' }),
    ).rejects.toBe(failure);

    expect(usersService.update).toHaveBeenCalledWith(USER_ID, { givenName: 'Ana María' }, manager);
    expect(auditService.record).not.toHaveBeenCalled();
    // Sin lectura final: no se devuelve un estado que no se confirmó.
    expect(usersService.findById).toHaveBeenCalledTimes(1);
  });

  it('propaga el fallo de la auditoría (rollback de User y ProfessionalProfile)', async () => {
    const failure = new Error('fallo de auditoría');
    auditService.record.mockRejectedValueOnce(failure);

    await expect(
      service.update(USER_ID, { familyName: 'Gómez', licenseNumber: 'COP-999' }),
    ).rejects.toBe(failure);

    expect(usersService.update).toHaveBeenCalledWith(USER_ID, { familyName: 'Gómez' }, manager);
    expect(professionalsService.save).toHaveBeenCalledWith(
      expect.objectContaining({ licenseNumber: 'COP-999' }),
      manager,
    );
    expect(usersService.findById).toHaveBeenCalledTimes(1);
  });

  it('responde 401 sin escribir nada si el usuario no existe', async () => {
    usersService.findById.mockResolvedValueOnce(null);

    await expect(service.update(USER_ID, { givenName: 'Ana María' })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(usersService.update).not.toHaveBeenCalled();
    expect(professionalsService.save).not.toHaveBeenCalled();
    expect(auditService.record).not.toHaveBeenCalled();
  });
});
