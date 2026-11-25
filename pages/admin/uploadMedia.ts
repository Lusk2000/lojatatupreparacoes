import { SupabaseClient } from '@supabase/supabase-js';

const BUCKET = 'product-media';
const MB = 1024 * 1024;
const MAX_PHOTO_INPUT = 20 * MB;
const MAX_ANIMATION = 2 * MB;
const MAX_VIDEO = 5 * MB;
const MAX_SIDE = 800;
const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'video/mp4': 'mp4',
};

const isAnimated = async (file: File): Promise<boolean> => {
  if (file.type === 'image/gif') return true;
  if (file.type !== 'image/webp') return false;
  // WebP animado tem o bloco "ANIM" logo no começo do arquivo.
  return (await file.slice(0, 64).text()).includes('ANIM');
};

const toBlob = (canvas: HTMLCanvasElement, type: string): Promise<Blob | null> =>
  new Promise((resolve) => canvas.toBlob(resolve, type, 0.82));

// Capa parada e leve (primeiro quadro, no máximo 800 px).
const compress = async (file: File): Promise<Blob> => {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  let blob = await toBlob(canvas, 'image/webp');
  // Navegador sem suporte a gerar WebP devolve outro formato.
  if (blob?.type !== 'image/webp') blob = await toBlob(canvas, 'image/jpeg');
  if (!blob) throw new Error('Não foi possível ler a imagem.');
  return blob;
};

// Valida e prepara os arquivos antes do envio. Lança Error com a mensagem.
export const prepareImage = async (file: File): Promise<{ still: Blob; animation: File | null }> => {
  if (!file.type.startsWith('image/') || !EXTENSIONS[file.type]) {
    throw new Error('Formato não aceito. Use JPG, PNG, WEBP ou GIF.');
  }
  const animated = await isAnimated(file);
  if (animated && file.size > MAX_ANIMATION) {
    throw new Error('Animação maior que 2 MB deixa a loja lenta. Reduza antes de enviar.');
  }
  if (file.size > MAX_PHOTO_INPUT) throw new Error('Foto maior que 20 MB.');
  return { still: await compress(file), animation: animated ? file : null };
};

const send = async (client: SupabaseClient, folder: string, data: Blob): Promise<string> => {
  const path = `${folder}/${crypto.randomUUID()}.${EXTENSIONS[data.type]}`;
  const { error } = await client.storage
    .from(BUCKET)
    .upload(path, data, { contentType: data.type, cacheControl: '31536000' });
  if (error) {
    throw new Error(
      /bucket not found/i.test(error.message)
        ? 'O armazenamento ainda não existe. Rode o SQL de storage no Supabase.'
        : 'Não foi possível enviar o arquivo.'
    );
  }
  return client.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
};

export const uploadImage = async (client: SupabaseClient, folder: string, file: File) => {
  const { still, animation } = await prepareImage(file);
  return {
    imageUrl: await send(client, folder, still),
    animationUrl: animation ? await send(client, folder, animation) : '',
  };
};

export const uploadVideo = async (client: SupabaseClient, folder: string, file: File): Promise<string> => {
  if (file.type !== 'video/mp4') throw new Error('Use um vídeo MP4.');
  if (file.size > MAX_VIDEO) throw new Error('Vídeo maior que 5 MB. Reduza antes de enviar.');
  return send(client, folder, file);
};
