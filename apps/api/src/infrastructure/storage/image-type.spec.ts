import { detectImageType } from './image-type';

const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00]);
const webp = Buffer.concat([
  Buffer.from('RIFF'),
  Buffer.from([0x10, 0x00, 0x00, 0x00]),
  Buffer.from('WEBPVP8 '),
]);

describe('detectImageType', () => {
  it('reconoce PNG, JPEG y WebP por su contenido', () => {
    expect(detectImageType(png)).toBe('image/png');
    expect(detectImageType(jpeg)).toBe('image/jpeg');
    expect(detectImageType(webp)).toBe('image/webp');
  });

  it.each([
    ['SVG (puede contener scripts)', Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>')],
    ['HTML disfrazado', Buffer.from('<html><script>alert(1)</script></html>')],
    ['PDF', Buffer.from('%PDF-1.7')],
    ['GIF', Buffer.from('GIF89a')],
    ['vacío', Buffer.alloc(0)],
  ])('rechaza %s', (_name, buffer) => {
    expect(detectImageType(buffer)).toBeNull();
  });
});
