import { DefaultNamingStrategy, type NamingStrategyInterface, type Table } from 'typeorm';

/** Convierte `camelCase` / `PascalCase` a `snake_case`. */
export function toSnakeCase(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1_$2')
    .toLowerCase();
}

const tableName = (tableOrName: Table | string): string => {
  const name = typeof tableOrName === 'string' ? tableOrName : tableOrName.name;
  return name.split('.').pop() ?? name;
};

/**
 * Convención de nombres de la base de datos:
 * - tablas y columnas en snake_case;
 * - restricciones e índices con nombres legibles y deterministas
 *   (pk_, uq_, fk_, ix_, ck_) en lugar de hashes generados.
 */
export class SnakeNamingStrategy extends DefaultNamingStrategy implements NamingStrategyInterface {
  override tableName(targetName: string, userSpecifiedName: string | undefined): string {
    return userSpecifiedName ?? toSnakeCase(targetName);
  }

  override columnName(
    propertyName: string,
    customName: string | undefined,
    embeddedPrefixes: string[],
  ): string {
    const prefix = embeddedPrefixes.map(toSnakeCase).join('_');
    const name = customName ?? toSnakeCase(propertyName);
    return prefix ? `${prefix}_${name}` : name;
  }

  override relationName(propertyName: string): string {
    return toSnakeCase(propertyName);
  }

  override joinColumnName(relationName: string, referencedColumnName: string): string {
    return toSnakeCase(`${relationName}_${referencedColumnName}`);
  }

  override joinTableName(
    firstTableName: string,
    secondTableName: string,
    firstPropertyName: string,
  ): string {
    return toSnakeCase(
      `${firstTableName}_${firstPropertyName.replace(/\./g, '_')}_${secondTableName}`,
    );
  }

  override joinTableColumnName(
    tableName: string,
    propertyName: string,
    columnName?: string,
  ): string {
    return toSnakeCase(`${tableName}_${columnName ?? propertyName}`);
  }

  override primaryKeyName(tableOrName: Table | string): string {
    return `pk_${tableName(tableOrName)}`;
  }

  override uniqueConstraintName(tableOrName: Table | string, columnNames: string[]): string {
    return `uq_${tableName(tableOrName)}_${columnNames.join('_')}`;
  }

  override foreignKeyName(tableOrName: Table | string, columnNames: string[]): string {
    return `fk_${tableName(tableOrName)}_${columnNames.join('_')}`;
  }

  override indexName(tableOrName: Table | string, columnNames: string[]): string {
    return `ix_${tableName(tableOrName)}_${columnNames.join('_')}`;
  }

  override relationConstraintName(tableOrName: Table | string, columnNames: string[]): string {
    return `uq_${tableName(tableOrName)}_${columnNames.join('_')}`;
  }
}
