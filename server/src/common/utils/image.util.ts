import sharp from 'sharp';

export async function normalizeImage(
  buffer: Buffer,
  opts?: { forceJpeg?: boolean },
) {
  const forceJpeg = opts?.forceJpeg ?? true;
  let pipeline = sharp(buffer).rotate();
  if (forceJpeg) pipeline = pipeline.toFormat('jpeg', { mozjpeg: true });

  const out = await pipeline.toBuffer();
  const meta = await sharp(out)
    .metadata()
    .catch(() => ({
      width: undefined as number | undefined,
      height: undefined as number | undefined,
      format: undefined as string | undefined,
    }));

  const format = (meta.format || (forceJpeg ? 'jpeg' : 'jpeg')).toLowerCase();
  const ext = format === 'jpeg' ? 'jpg' : format;
  const mimeType = `image/${format === 'jpg' ? 'jpeg' : format}`;

  return {
    buffer: out,
    ext,
    width: meta.width,
    height: meta.height,
    mimeType,
  };
}
