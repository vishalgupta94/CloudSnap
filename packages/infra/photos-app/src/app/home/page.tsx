'use client';

import { useState } from 'react';
import { getCredentials, getIdentityId, getPresignedSignedUrl } from './upload-helpers';

export default function UploadToS3() {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string>('');
  const [publicUrl, setPublicUrl] = useState<string>('');

  async function handleUpload() {
    if (!file) return;

    setStatus('Requesting URL…');
    console.log('f.name', file.name);
    const identityId = await getIdentityId();
    const credentials = await getCredentials(identityId);
    const presignedUrl = await getPresignedSignedUrl(file.name, credentials);
    console.log('presignedUrl', file.name, presignedUrl);

    const { url, key } = { key: file.name, url: presignedUrl };

    setStatus('Uploading…');
    // Use XHR so we can show upload progress
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url, true);
    if (file.type) xhr.setRequestHeader('Content-Type', file.type);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setProgress(Math.round((e.loaded * 100) / e.total));
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        setStatus('Upload complete ✅');
        // If your bucket (or CloudFront) serves the object publicly, set NEXT_PUBLIC_S3_PUBLIC_BASE_URL
        const base = process.env.NEXT_PUBLIC_S3_PUBLIC_BASE_URL || '';
        setPublicUrl(base ? `${base}${key}` : '');
      } else {
        setStatus(`Upload failed (${xhr.status})`);
      }
    };

    xhr.onerror = () => setStatus('Upload error');
    xhr.send(file);
  }

  return (
    <div className="max-w-sm space-y-3 p-4 rounded-2xl border">
      <input
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        className="block w-full"
      />
      <button
        onClick={handleUpload}
        disabled={!file}
        className="px-3 py-2 rounded-xl bg-black text-white disabled:opacity-50"
      >
        {file ? `Upload ${file.name}` : 'Choose a file'}
      </button>
      {status && <div>{status}</div>}
      {progress > 0 && progress < 100 && (
        <div className="w-full bg-gray-200 h-2 rounded">
          <div className="h-2 rounded bg-black" style={{ width: `${progress}%` }} />
        </div>
      )}
      {publicUrl && (
        <a href={publicUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline">
          Open uploaded file
        </a>
      )}
    </div>
  );
}
