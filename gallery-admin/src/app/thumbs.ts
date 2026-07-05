// Generazione client-side delle miniature: evita di dover trasformare le
// immagini sul server e rende la griglia veloce anche con foto pesanti.

const THUMB_MAX = 640;
const JPEG_QUALITY = 0.82;

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY));
}

function drawScaled(
  source: CanvasImageSource,
  width: number,
  height: number
): HTMLCanvasElement | null {
  const scale = Math.min(1, THUMB_MAX / Math.max(width, height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

export async function makeImageThumb(file: File): Promise<Blob | null> {
  try {
    const bitmap = await createImageBitmap(file);
    const canvas = drawScaled(bitmap, bitmap.width, bitmap.height);
    bitmap.close();
    return canvas ? await canvasToBlob(canvas) : null;
  } catch {
    return null;
  }
}

// Estrae un fotogramma dal video da usare come anteprima. Se il formato non è
// riproducibile dal browser si rinuncia senza bloccare l'upload.
export function makeVideoPoster(file: File): Promise<Blob | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    let done = false;

    const finish = (blob: Blob | null) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      URL.revokeObjectURL(url);
      video.removeAttribute('src');
      video.load();
      resolve(blob);
    };
    const timer = setTimeout(() => finish(null), 10_000);

    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.onerror = () => finish(null);
    video.onloadeddata = () => {
      const target = Math.min(0.5, (video.duration || 1) / 2);
      if (Math.abs(video.currentTime - target) < 0.01) {
        capture();
      } else {
        video.currentTime = target;
      }
    };
    video.onseeked = capture;
    video.src = url;

    async function capture() {
      if (done) return;
      try {
        const canvas = drawScaled(video, video.videoWidth, video.videoHeight);
        finish(canvas ? await canvasToBlob(canvas) : null);
      } catch {
        finish(null);
      }
    }
  });
}
