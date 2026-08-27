'use client';

import React, { useState, useRef } from 'react';
import { FileUp, X, FileText, Loader2, CheckCircle2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api/client';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

interface DocumentUploadProps {
  value?: string;
  onChange: (url: string) => void;
  onRemove?: () => void;
  folder?: string;
  label?: string;
  helperText?: string;
  disabled?: boolean;
  className?: string;
  placeholderText?: string;
  accept?: string;
}

export function DocumentUpload({
  value,
  onChange,
  onRemove,
  folder = 'documents',
  label,
  helperText,
  disabled = false,
  className,
  placeholderText = 'Drag & drop or click to upload document to Cloudinary',
  accept = '.pdf,.doc,.docx,.xlsx,.txt,image/*',
}: DocumentUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { success, error: toastError } = useToast();

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      toastError('Document file size must be less than 20MB');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    try {
      const res = await apiClient.post('/upload/document', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = res.data?.data || res.data;
      const uploadedUrl = data?.url || data?.secure_url;

      if (uploadedUrl) {
        onChange(uploadedUrl);
        success('Document uploaded to Cloudinary successfully!');
      } else {
        throw new Error('Upload succeeded but no document URL was returned');
      }
    } catch (err: any) {
      console.error('Document upload failed:', err);
      toastError(err.response?.data?.message || err.message || 'Failed to upload document to Cloudinary');
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

  return (
    <div className={cn('space-y-2', className)}>
      {label && <label className="text-xs font-semibold text-foreground block">{label}</label>}

      {value ? (
        <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Badge variant="default" className="text-[9px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                  <CheckCircle2 className="h-2.5 w-2.5 mr-1" /> Cloudinary Hosted
                </Badge>
              </div>
              <a
                href={value}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-primary hover:underline truncate block max-w-xs mt-0.5"
              >
                {value.split('/').pop()}
              </a>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center h-8 px-2.5 text-xs rounded-lg border border-border bg-muted/30 hover:bg-muted text-foreground transition-colors"
            >
              <Download className="h-3.5 w-3.5 mr-1" /> View
            </a>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              disabled={disabled}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </Button>
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
            'flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer select-none',
            isDragOver ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-border/80 hover:border-primary/50 hover:bg-muted/40',
            disabled && 'opacity-60 cursor-not-allowed',
            isUploading && 'pointer-events-none bg-muted/20',
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileChange}
            disabled={disabled || isUploading}
            className="hidden"
          />

          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-7 w-7 text-primary animate-spin" />
              <p className="text-xs font-semibold text-foreground">Uploading document to Cloudinary...</p>
              <p className="text-[11px] text-muted-foreground">Uploading secure file asset</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5">
              <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shadow-inner">
                <FileUp className="h-5 w-5" />
              </div>
              <p className="text-xs font-medium text-foreground">{placeholderText}</p>
              <p className="text-[10px] text-muted-foreground">PDF, Word, Excel or image up to 20MB</p>
            </div>
          )}
        </div>
      )}

      {helperText && <p className="text-[11px] text-muted-foreground">{helperText}</p>}
    </div>
  );
}
