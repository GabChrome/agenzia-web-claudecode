export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'Errore imprevisto';
}

interface ApiOptions {
  method?: string;
  body?: unknown;
}

export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const hasBody = options.body !== undefined;
  const res = await fetch(path, {
    method: options.method ?? (hasBody ? 'POST' : 'GET'),
    headers: hasBody ? { 'Content-Type': 'application/json' } : undefined,
    body: hasBody ? JSON.stringify(options.body) : undefined,
    credentials: 'same-origin',
  });
  if (!res.ok) {
    let message = 'Errore imprevisto, riprova';
    try {
      const data = (await res.json()) as { error?: string };
      if (data.error) message = data.error;
    } catch {
      // risposta non JSON: teniamo il messaggio generico
    }
    throw new ApiError(message, res.status);
  }
  return (await res.json()) as T;
}

// Upload binario con avanzamento: fetch non espone il progresso di invio,
// quindi qui serve XMLHttpRequest.
export function uploadFile(
  url: string,
  file: Blob,
  contentType: string,
  onProgress?: (pct: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    xhr.setRequestHeader('Content-Type', contentType);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status < 300) {
        resolve();
      } else {
        let message = 'Caricamento non riuscito';
        try {
          const data = JSON.parse(xhr.responseText) as { error?: string };
          if (data.error) message = data.error;
        } catch {
          // ignora
        }
        reject(new ApiError(message, xhr.status));
      }
    };
    xhr.onerror = () => reject(new ApiError('Errore di rete durante il caricamento', 0));
    xhr.send(file);
  });
}
