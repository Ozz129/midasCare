import { describe, expect, it } from 'vitest';
import { centerSquareCrop, fitWithin, ImageValidationError, validateImageFile } from './image';

const file = (type: string, size = 1000) => new File([new Uint8Array(size)], 'x', { type });

describe('validateImageFile', () => {
  it('acepta PNG, JPG y WebP', () => {
    expect(() => validateImageFile(file('image/png'))).not.toThrow();
    expect(() => validateImageFile(file('image/jpeg'))).not.toThrow();
    expect(() => validateImageFile(file('image/webp'))).not.toThrow();
  });

  it.each(['image/svg+xml', 'image/gif', 'application/pdf', ''])('rechaza %p', (type) => {
    expect(() => validateImageFile(file(type))).toThrow(ImageValidationError);
  });

  it('rechaza archivos de origen mayores de 15 MB', () => {
    expect(() => validateImageFile(file('image/png', 16 * 1024 * 1024))).toThrow(/15 MB/);
  });
});

describe('geometría', () => {
  it('recorta un cuadrado centrado', () => {
    expect(centerSquareCrop(1000, 600)).toEqual({ sx: 200, sy: 0, side: 600 });
    expect(centerSquareCrop(400, 900)).toEqual({ sx: 0, sy: 250, side: 400 });
  });

  it('escala sin agrandar', () => {
    expect(fitWithin(2400, 600, 1200)).toEqual({ width: 1200, height: 300 });
    expect(fitWithin(300, 100, 1200)).toEqual({ width: 300, height: 100 });
  });
});
