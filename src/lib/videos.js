import { api, ApiClientError } from './api';
import { VideoUploader } from './native';

/** Matches the server: "under 100 MB" in the units phones show (1 MB = 1,000,000 bytes). */
export const MAX_VIDEO_BYTES = 100_000_000;
const BROWSER_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

export function formatMegabytes(bytes) {
  return `${(bytes / 1_000_000).toFixed(bytes < 10_000_000 ? 1 : 0)} MB`;
}

export function titleFromFileName(name = '') {
  return name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120);
}

async function startUpload({ title, description, published, contentType, sizeBytes }) {
  return api('/api/admin/videos', {
    method: 'POST',
    body: JSON.stringify({ title, description, published, contentType, sizeBytes }),
  });
}

/** Browser upload: the file is sent in the server's part size, straight from disk. */
async function uploadFileParts(file, upload, onProgress) {
  const parts = [];
  for (let partNumber = 1; partNumber <= upload.partCount; partNumber += 1) {
    const start = (partNumber - 1) * upload.partSize;
    const response = await fetch(`/api/uploads/videos/${upload.video.id}/parts/${partNumber}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${upload.uploadToken}`, 'Content-Type': 'application/octet-stream' },
      body: file.slice(start, start + upload.partSize),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new ApiClientError(payload.error?.message || 'Upload failed.', payload.error?.code, response.status);
    }
    parts.push({ partNumber, etag: payload.etag });
    onProgress('uploading', Math.round((partNumber / upload.partCount) * 100));
  }
  return parts;
}

/**
 * Uploads one video. In ABI Doctor, `picked` comes from the native picker and is compressed
 * under 100 MB first when needed; in a browser, `file` must already be under the limit.
 */
export async function uploadVideo({ picked, file, title, description, published, onProgress }) {
  let upload = null;
  let source = null;
  let listener = null;
  try {
    let parts;
    if (picked) {
      listener = await VideoUploader.addListener('progress', ({ stage, percent }) => onProgress(stage, percent));
      onProgress('compressing', 0);
      const prepared = await VideoUploader.prepare({ uri: picked.uri, maxBytes: MAX_VIDEO_BYTES });
      source = prepared.source;
      upload = await startUpload({ title, description, published, contentType: 'video/mp4', sizeBytes: prepared.sizeBytes });
      onProgress('uploading', 0);
      ({ parts } = await VideoUploader.upload({
        source,
        url: `${window.location.origin}/api/uploads/videos/${upload.video.id}/parts`,
        token: upload.uploadToken,
        partSize: upload.partSize,
        sizeBytes: prepared.sizeBytes,
      }));
    } else {
      if (file.size > MAX_VIDEO_BYTES) {
        throw new Error(`This video is ${formatMegabytes(file.size)}. Upload it from the ABI Doctor app, which compresses videos over 100 MB automatically.`);
      }
      if (!BROWSER_TYPES.includes(file.type)) throw new Error('Choose an MP4, WebM or MOV video.');
      upload = await startUpload({ title, description, published, contentType: file.type, sizeBytes: file.size });
      onProgress('uploading', 0);
      parts = await uploadFileParts(file, upload, onProgress);
    }
    const result = await api(`/api/admin/videos/${upload.video.id}/complete`, {
      method: 'POST',
      body: JSON.stringify({ parts }),
    });
    upload = null;
    return result.videos;
  } finally {
    listener?.remove();
    // A failed upload leaves no half-finished video behind, and the compressed copy is not kept.
    if (upload) await api(`/api/admin/videos/${upload.video.id}`, { method: 'DELETE' }).catch(() => {});
    if (source) VideoUploader.discard({ source }).catch(() => {});
  }
}
