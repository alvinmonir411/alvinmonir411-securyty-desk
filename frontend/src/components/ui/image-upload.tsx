'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, X, Image as ImageIcon, Loader2, CheckCircle2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api/client';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  onRemove?: () => void;
  folder?: string;
  label?: string;
  helperText?: string;
  aspectRatio?: 'square' | 'video' | 'banner' | 'auto';
  disabled?: boolean;
  className?: string;
  placeholderText?: string;
}

export function ImageUpload({
  value,
  onChange,
  onRemove,
  folder = 'images',
  label,
  helperText,
  aspectRatio = 'auto',
  disabled = false,
  className,
  placeholderText = 'Drag & drop or click to upload photo to Cloudinary',
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { success, error: toastError } = useToast();

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toastError('Please select a valid image file (JPG, PNG, WebP, GIF)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toastError('Image file size must be less than 10MB');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    try {
      const res = await apiClient.post('/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = res.data?.data || res.data;
      const uploadedUrl = data?.url || data?.secure_url;

      if (uploadedUrl) {
        onChange(uploadedUrl);
        success('Photo uploaded to Cloudinary successfully!');
      } else {
        throw new Error('Upload succeeded but no image URL was returned');
      }
    } catch (err: any) {
      console.error('Image upload failed:', err);
      toastError(err.response?.data?.message || err.message || 'Failed to upload photo to Cloudinary');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled || isUploading) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    if (onRemove) onRemove();
  };

  const aspectClass = {
    square: 'aspect-square max-w-[200px]',
    video: 'aspect-video w-full',
    banner: 'aspect-[21/9] w-full',
    auto: 'min-h-[160px] w-full',
  }[aspectRatio];

  return (
    <div className={cn('space-y-2', className)}>
      {label && <label className="text-xs font-semibold text-foreground block">{label}</label>}

      {value ? (
        <div className={cn('relative rounded-xl border border-border/80 bg-card overflow-hidden group shadow-sm', aspectClass)}>
          <img
            src={value}
            alt="Uploaded preview"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />

          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-3">
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-white bg-white/20 hover:bg-white/30 backdrop-blur-md px-3 py-1.5 rounded-lg transition-colors"
            >
              <Eye className="h-3.5 w-3.5" /> View
            </a>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleClear}
              disabled={disabled}
              className="h-8 px-3 text-xs"
            >
              <X className="h-3.5 w-3.5 mr-1" /> Remove
            </Button>
          </div>

          <div className="absolute bottom-2 left-2 pointer-events-none">
            <Badge variant="default" className="bg-black/60 backdrop-blur-md text-[10px] text-emerald-400 border-emerald-500/30 flex items-center gap-1 font-mono">
              <CheckCircle2 className="h-3 w-3" /> Cloudinary Hosted
            </Badge>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
          className={cn(
            'flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer select-none',
            aspectClass,
            isDragOver ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-border/80 hover:border-primary/50 hover:bg-muted/40',
            disabled && 'opacity-60 cursor-not-allowed',
            isUploading && 'pointer-events-none bg-muted/20',
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
            onChange={handleFileChange}
            disabled={disabled || isUploading}
            className="hidden"
          />

          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="text-xs font-semibold text-foreground">Uploading to Cloudinary...</p>
              <p className="text-[11px] text-muted-foreground">Optimizing and storing image asset</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center shadow-inner">
                <UploadCloud className="h-6 w-6" />
              </div>
              <p className="text-xs font-medium text-foreground">{placeholderText}</p>
              <p className="text-[11px] text-muted-foreground">PNG, JPG, WebP or GIF up to 10MB</p>
            </div>
          )}
        </div>
      )}

      {helperText && <p className="text-[11px] text-muted-foreground">{helperText}</p>}
    </div>
  );
}
