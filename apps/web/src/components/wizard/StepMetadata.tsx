'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import type { WizardData } from './WizardShell';

interface Props {
  data: WizardData;
  onChange: (partial: Partial<WizardData>) => void;
}

function resizeAndEncode(file: File, maxSize = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      const canvas = document.createElement('canvas');
      let { width, height } = img;
      if (width > maxSize || height > maxSize) {
        const scale = maxSize / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas not supported'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      const jpeg = canvas.toDataURL('image/jpeg', 0.8);
      const png = canvas.toDataURL('image/png');
      resolve(jpeg.length < png.length ? jpeg : png);
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load image'));
    };
    img.src = URL.createObjectURL(file);
  });
}

function encodeDataUri(metadata: Record<string, string>): string {
  const json = JSON.stringify(metadata);
  const bytes = new TextEncoder().encode(json);
  const base64 = btoa(String.fromCharCode(...bytes));
  return `data:application/json;base64,${base64}`;
}

export function StepMetadata({ data, onChange }: Props) {
  const t = useTranslations('Wizard');
  const fileRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<'create' | 'url'>(() =>
    data.metadataUri.startsWith('data:') ? 'create' : 'url',
  );
  const [nftName, setNftName] = useState('');
  const [nftDescription, setNftDescription] = useState('');
  const [imageDataUrl, setImageDataUrl] = useState('');
  const [sizeError, setSizeError] = useState('');

  // Restore builder state from existing data URI on mount
  useEffect(() => {
    if (!data.metadataUri.startsWith('data:application/json;base64,')) return;
    try {
      const b64 = data.metadataUri.split(',')[1];
      const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      const json = JSON.parse(new TextDecoder().decode(bytes));
      if (json.name) setNftName(json.name);
      if (json.description) setNftDescription(json.description);
      if (json.image) setImageDataUrl(json.image);
    } catch {
      // Ignore decode errors
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Generate data URI when builder fields change
  useEffect(() => {
    if (mode !== 'create') return;
    if (!nftName.trim()) {
      onChange({ metadataUri: '' });
      return;
    }
    const metadata: Record<string, string> = { name: nftName.trim() };
    if (nftDescription.trim()) metadata.description = nftDescription.trim();
    if (imageDataUrl) metadata.image = imageDataUrl;

    const dataUri = encodeDataUri(metadata);
    if (dataUri.length > 100_000) {
      setSizeError(t('imageTooLarge'));
      onChange({ metadataUri: '' });
      return;
    }
    setSizeError('');
    onChange({ metadataUri: dataUri });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, nftName, nftDescription, imageDataUrl]);

  const handleModeSwitch = useCallback(
    (newMode: 'create' | 'url') => {
      setMode(newMode);
      onChange({ metadataUri: '' });
    },
    [onChange],
  );

  const handleImageChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const encoded = await resizeAndEncode(file);
        setImageDataUrl(encoded);
      } catch {
        setSizeError(t('imageTooLarge'));
      }
    },
    [t],
  );

  const sizeKb =
    mode === 'create' && data.metadataUri
      ? Math.round(data.metadataUri.length / 1024)
      : 0;

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="flex overflow-hidden rounded-lg border border-gray-300">
        <button
          type="button"
          onClick={() => handleModeSwitch('create')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            mode === 'create'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          {t('metadataModeCreate')}
        </button>
        <button
          type="button"
          onClick={() => handleModeSwitch('url')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            mode === 'url'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          {t('metadataModeUrl')}
        </button>
      </div>

      {mode === 'url' && (
        <div>
          <label className="mb-1 block text-sm font-medium">
            {t('metadataUriLabel')}
          </label>
          <input
            type="url"
            value={data.metadataUri}
            onChange={(e) => onChange({ metadataUri: e.target.value })}
            placeholder={t('metadataUriPlaceholder')}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">{t('metadataUriHelp')}</p>
        </div>
      )}

      {mode === 'create' && (
        <div className="space-y-4">
          {/* NFT Name */}
          <div>
            <label className="mb-1 block text-sm font-medium">
              {t('nftNameLabel')}
            </label>
            <input
              type="text"
              value={nftName}
              onChange={(e) => setNftName(e.target.value)}
              placeholder={t('nftNamePlaceholder')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* NFT Description */}
          <div>
            <label className="mb-1 block text-sm font-medium">
              {t('nftDescriptionLabel')}
            </label>
            <textarea
              value={nftDescription}
              onChange={(e) => setNftDescription(e.target.value)}
              placeholder={t('nftDescriptionPlaceholder')}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="mb-1 block text-sm font-medium">
              {t('imageUploadLabel')}
            </label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />

            {imageDataUrl ? (
              <div className="flex items-start gap-3">
                <img
                  src={imageDataUrl}
                  alt="NFT preview"
                  className="h-24 w-24 rounded-lg border object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImageDataUrl('');
                    if (fileRef.current) fileRef.current.value = '';
                  }}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                >
                  {t('imageRemoveButton')}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="rounded-lg border border-dashed border-gray-300 px-4 py-3 text-sm text-gray-500 hover:border-gray-400 hover:bg-gray-50"
              >
                {t('imageUploadButton')}
              </button>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {t('metadataCreateHelp')}
            </p>
          </div>

          {/* Size estimate */}
          {sizeKb > 0 && (
            <p className="text-xs text-gray-500">
              {t('metadataSizeEstimate', { size: sizeKb })}
            </p>
          )}

          {/* Error */}
          {sizeError && (
            <p className="text-xs text-red-500">{sizeError}</p>
          )}
        </div>
      )}
    </div>
  );
}
