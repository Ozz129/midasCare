/*
 * Preparación de imágenes en el navegador antes de subirlas:
 *  - valida tipo y tamaño de origen;
 *  - redimensiona (menos datos, subida más rápida);
 *  - re-codifica con <canvas>, lo que ELIMINA los metadatos (EXIF/GPS) del archivo original.
 * El servidor vuelve a validar el contenido real de la imagen.
 */

export const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;
export const ACCEPTED_IMAGE_INPUT = ACCEPTED_IMAGE_TYPES.join(',');
const MAX_SOURCE_BYTES = 15 * 1024 * 1024;

export class ImageValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImageValidationError';
  }
}

export function validateImageFile(file: File): void {
  if (!(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    throw new ImageValidationError('Formato no permitido. Usa una imagen PNG, JPG o WebP.');
  }
  if (file.size > MAX_SOURCE_BYTES) {
    throw new ImageValidationError('La imagen es demasiado grande (máximo 15 MB).');
  }
}

/** Calcula el recorte cuadrado centrado de una imagen (para fotos de perfil). */
export function centerSquareCrop(width: number, height: number) {
  const side = Math.min(width, height);
  return { sx: Math.round((width - side) / 2), sy: Math.round((height - side) / 2), side };
}

/** Escala (w, h) para que el lado mayor no supere `max`, sin agrandar. */
export function fitWithin(width: number, height: number, max: number) {
  const scale = Math.min(1, max / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

async function loadBitmap(file: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file);
  } catch {
    throw new ImageValidationError('No se pudo leer la imagen. Prueba con otro archivo.');
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new ImageValidationError('No se pudo procesar la imagen.')),
      type,
      quality,
    );
  });
}

/** Foto de perfil: recorte cuadrado centrado de hasta 512 px, en WebP. */
export async function prepareAvatar(file: File): Promise<Blob> {
  validateImageFile(file);
  const bitmap = await loadBitmap(file);
  const { sx, sy, side } = centerSquareCrop(bitmap.width, bitmap.height);
  const size = Math.min(512, side);

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  if (!context) throw new ImageValidationError('Tu navegador no permite procesar imágenes.');
  context.imageSmoothingQuality = 'high';
  context.drawImage(bitmap, sx, sy, side, side, 0, 0, size, size);
  bitmap.close();
  return canvasToBlob(canvas, 'image/webp', 0.9);
}

/** Firma: hasta 1200 px de ancho, en PNG para conservar la transparencia. */
export async function prepareSignature(file: File): Promise<Blob> {
  validateImageFile(file);
  const bitmap = await loadBitmap(file);
  const { width, height } = fitWithin(bitmap.width, bitmap.height, 1200);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new ImageValidationError('Tu navegador no permite procesar imágenes.');
  context.imageSmoothingQuality = 'high';
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  return canvasToBlob(canvas, 'image/png');
}
