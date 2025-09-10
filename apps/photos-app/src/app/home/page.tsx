// export default function Home() {
//   return <div>Home</div>;
// }

'use client';

import React, { useCallback, useMemo, useRef, useState } from 'react';
import { getCredentials, getIdentityId, getPresignedSignedUrl } from './upload-helpers';

type UploadedInfo = { key: string; url?: string };

interface PhotoUploaderProps {
  /** Called after a successful upload with the S3 key (and optional public URL) */
  onUploaded?: (info: UploadedInfo) => void;
  /** Max size in MB (default 10MB) */
  maxSizeMB?: number;
  /** Accept string for <input type="file"/> (default: image/*) */
  accept?: string;
  /** Optional label shown above the dropzone */
  label?: string;
}

export default function PhotoUploader({
  onUploaded,
  maxSizeMB = 10,
  accept = 'image/*',
  label = 'Upload a photo',
}: PhotoUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedInfo, setUploadedInfo] = useState<UploadedInfo | null>(null);

  // Keep ref to active XHR to allow cancellation
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const maxBytes = useMemo(() => Math.floor(maxSizeMB * 1024 * 1024), [maxSizeMB]);

  const reset = useCallback(() => {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setError(null);
    setProgress(0);
    setIsUploading(false);
    setUploadedInfo(null);
  }, [previewUrl]);

  const validate = (f: File): string | null => {
    if (!f.type.startsWith('image/')) return 'Only image files are allowed.';
    if (f.size > maxBytes) return `File is too large. Max ${maxSizeMB}MB.`;
    return null;
  };

  const onPick = (f: File) => {
    const err = validate(f);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  };

  const onInputChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const f = e.target.files?.[0];
    if (f) onPick(f);
  };

  const onDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) onPick(f);
  };

  const openFilePicker = () => inputRef.current?.click();

  const cancelUpload = () => {
    xhrRef.current?.abort();
    setIsUploading(false);
  };

  async function presignUpload(f: File): Promise<{ url: string; key: string }> {
    console.log('f.name', f.name);
    const identityId = await getIdentityId();
    const credentials = await getCredentials(identityId);
    const presignedUrl = await getPresignedSignedUrl(f.name, credentials);
    console.log('presignedUrl', f.name, presignedUrl);

    return { key: f.name, url: presignedUrl };
  }

  async function upload() {
    if (!file) return;
    setIsUploading(true);
    setProgress(0);

    try {
      const { key, url } = await presignUpload(file);

      // Use XHR for progress events
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhrRef.current = xhr;
        xhr.open('PUT', url, true);
        xhr.setRequestHeader('Content-Type', file.type);

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setProgress(Math.round((e.loaded / e.total) * 100));
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Upload failed (${xhr.status})`));
        };
        xhr.onerror = () => reject(new Error('Network error during upload'));
        xhr.onabort = () => reject(new Error('Upload aborted'));

        xhr.send(file);
      });

      const info = { key, url } as UploadedInfo;
      setUploadedInfo(info);
      onUploaded?.(info);
      setIsUploading(false);
    } catch (e: any) {
      setError(e?.message ?? 'Upload failed');
      setIsUploading(false);
    }
  }

  return (
    <div className="w-full max-w-xl mx-auto">
      {label && <label className="block mb-2 text-sm font-medium text-gray-700">{label}</label>}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={openFilePicker}
        className={
          'cursor-pointer rounded-2xl border-2 border-dashed p-6 transition ' +
          (isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400')
        }
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={onInputChange}
        />

        {!file && (
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">Drag & drop an image here, or click to browse</p>
            <p className="text-xs text-gray-400">Max size: {maxSizeMB}MB</p>
          </div>
        )}

        {file && (
          <div className="flex items-center gap-4">
            {previewUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="preview" className="h-24 w-24 rounded-lg object-cover" />
            )}
            <div className="min-w-0 flex-1">
              <div className="font-medium truncate">{file.name}</div>
              <div className="text-xs text-gray-500">{(file.size / 1024).toFixed(0)} KB</div>

              {isUploading ? (
                <div className="mt-3">
                  <div className="h-2 w-full rounded bg-gray-200 overflow-hidden">
                    <div
                      className="h-2 bg-blue-500 transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="mt-1 text-xs text-gray-600">{progress}%</div>
                  <button
                    type="button"
                    onClick={cancelUpload}
                    className="mt-2 inline-flex items-center rounded-xl border px-3 py-1 text-xs hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={upload}
                    className="inline-flex items-center rounded-xl bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Upload
                  </button>
                  <button
                    type="button"
                    onClick={reset}
                    className="inline-flex items-center rounded-xl border px-3 py-1.5 text-sm hover:bg-gray-50"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {uploadedInfo && (
        <div className="mt-4 rounded-xl border p-3 text-sm">
          <div className="font-medium">Uploaded</div>
          <div className="text-gray-700">
            Key: <code>{uploadedInfo.key}</code>
          </div>
          {uploadedInfo.url && (
            <div className="truncate text-gray-700">
              URL:{' '}
              <a
                className="text-blue-600 underline"
                href={uploadedInfo.url}
                target="_blank"
                rel="noreferrer"
              >
                {uploadedInfo.url}
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
