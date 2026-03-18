'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';

interface ImageUploadZoneProps {
  value: string;
  onChange: (url: string) => void;
}

export default function ImageUploadZone({ value, onChange }: ImageUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const getToken = () => sessionStorage.getItem('admin_token') ?? '';

  const uploadFile = useCallback(async (file: File) => {
    setError(null);
    setIsUploading(true);

    // Instant local preview
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Upload failed');
      }

      const { url } = await res.json();
      onChange(url);
      setPreviewUrl(null);
      URL.revokeObjectURL(localUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setPreviewUrl(null);
      URL.revokeObjectURL(localUrl);
    } finally {
      setIsUploading(false);
    }
  }, [onChange]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith('image/')) uploadFile(file);
    else setError('Please drop an image file');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = '';
  };

  const displayUrl = previewUrl || value;
  const isRemoteImage = displayUrl?.startsWith('http');

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700 mb-1">Product Image</label>

      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors
          ${isDragging ? 'border-[#E8621A] bg-[#E8621A]/10' : 'border-gray-300 hover:border-gray-400'}
          ${isUploading ? 'pointer-events-none opacity-60' : ''}
        `}
      >
        {displayUrl && (isRemoteImage || previewUrl) ? (
          <div className="relative w-full h-32 rounded overflow-hidden">
            <Image
              src={displayUrl}
              alt="Preview"
              fill
              className="object-contain"
              unoptimized={!!previewUrl}
            />
          </div>
        ) : displayUrl && displayUrl.startsWith('/images/') && displayUrl !== '/images/' ? (
          <div className="relative w-full h-32 rounded overflow-hidden">
            <Image src={displayUrl} alt="Preview" fill className="object-contain" />
          </div>
        ) : (
          <div className="py-6">
            <svg className="w-10 h-10 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm text-gray-500">Drag &amp; drop or click to browse</p>
            <p className="text-xs text-gray-400 mt-1">JPEG, PNG, WebP, GIF up to 5 MB</p>
          </div>
        )}

        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 rounded-lg">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#1A1A1A]" />
          </div>
        )}
      </div>

      {/* Hidden file inputs */}
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileSelect} className="hidden" />

      {/* Camera button for mobile */}
      <button
        type="button"
        onClick={() => cameraInputRef.current?.click()}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#1A1A1A] transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Take Photo
      </button>

      {/* Error */}
      {error && <p className="text-red-500 text-sm">{error}</p>}

      {/* Manual URL input */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">Or enter image path / URL</label>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="/images/photo.png or https://..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E8621A]"
        />
      </div>
    </div>
  );
}
