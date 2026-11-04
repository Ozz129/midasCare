# @care/api-contracts

Contratos públicos de la API REST de MIDAS CARE, compartidos por el backend, la web y las
futuras apps móviles.

- Solo tipos y constantes públicas (`API_PREFIX`, `TENANT_HEADER`, `TenantType`...).
- **Nunca** exporta entidades TypeORM ni campos sensibles.
- Sin dependencias de NestJS ni de React.
- Cada archivo indica si sus endpoints están implementados o solo previstos.
