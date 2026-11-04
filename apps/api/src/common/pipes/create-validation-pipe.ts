import { ValidationPipe } from '@nestjs/common';

/**
 * ValidationPipe global:
 * - `whitelist` + `forbidNonWhitelisted`: rechaza propiedades no declaradas en el DTO
 *   (evita asignación masiva de campos como `tenantId` o `role`).
 * - `transform`: convierte la entrada a instancias del DTO.
 */
export function createValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    forbidUnknownValues: true,
    transform: true,
    transformOptions: { enableImplicitConversion: false },
    validationError: { target: false, value: false },
  });
}
