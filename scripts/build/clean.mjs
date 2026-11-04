#!/usr/bin/env node
// Elimina artefactos de compilación (dist, coverage, *.tsbuildinfo) de apps y paquetes.
// No toca node_modules, archivos .env ni el almacenamiento local.
import { readdirSync, rmSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..', '..');
const workspaceRoots = ['apps', 'packages'];
const removable = ['dist', 'coverage'];

for (const group of workspaceRoots) {
  const groupDir = join(root, group);
  if (!existsSync(groupDir)) continue;

  for (const entry of readdirSync(groupDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const workspaceDir = join(groupDir, entry.name);

    for (const name of readdirSync(workspaceDir)) {
      if (removable.includes(name) || name.endsWith('.tsbuildinfo')) {
        const target = join(workspaceDir, name);
        rmSync(target, { recursive: true, force: true });
        console.log(`[clean] eliminado ${target.replace(root, '.')}`);
      }
    }
  }
}
