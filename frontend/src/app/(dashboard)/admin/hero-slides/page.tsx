'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  Plus,
  Trash2,
  Edit2,
  Image as ImageIcon,
  Loader2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { ImageUpload } from '@/components/ui/image-upload';

export default function AdminHeroSlidesPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<any>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [buttonText, setButtonText] = useState('Explore Academics');
  const [buttonLink, setButtonLink] = useState('/academics');

  // Query Slides
  const { data: slides, isLoading } = useQuery({
    queryKey: ['admin-hero-slides'],
    queryFn: async () => {
      const res = await apiClient.get('/cms/hero-slides');
      return res.data.data || res.data || [];
    },
  });

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (editingSlide) {
        const res = await apiClient.patch(`/cms/hero-slides/${editingSlide.id}`, payload);
        return res.data;
      } else {
        const res = await apiClient.post('/cms/hero-slides', payload);
        return res.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-hero-slides'] });
      queryClient.invalidateQueries({ queryKey: ['public-hero-slides'] });
      setStatusMsg({
        type: 'success',
        text: editingSlide ? 'Hero slide updated successfully!' : 'Hero slide published successfully!',
      });
      setModalOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      setStatusMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to save hero slide.',
      });
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.delete(`/cms/hero-slides/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-hero-slides'] });
      queryClient.invalidateQueries({ queryKey: ['public-hero-slides'] });
      setStatusMsg({ type: 'success', text: 'Hero slide deleted successfully!' });
    },
    onError: (err: any) => {
      setStatusMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to delete hero slide.',
      });
    },
  });

  const resetForm = () => {
    setEditingSlide(null);
    setTitle('');
    setSubtitle('');
    setImageUrl('');
    setButtonText('Explore Academics');
    setButtonLink('/academics');
  };

  const handleOpenCreate = () => {
    resetForm();
    setModalOpen(true);
  };

  const handleOpenEdit = (slide: any) => {
    setEditingSlide(slide);
    setTitle(slide.title || '');
    setSubtitle(slide.subtitle || '');
    setImageUrl(slide.imageUrl || '');
    setButtonText(slide.buttonText || 'Explore Academics');
    setButtonLink(slide.buttonLink || '/academics');
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !imageUrl) {
      setStatusMsg({ type: 'error', text: 'Headline Title and Image URL are required.' });
      return;
    }
    createMutation.mutate({
      title,
      subtitle,
      imageUrl,
      buttonText,
      buttonLink,
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ImageIcon className="h-6 w-6 text-primary" />
            Homepage Hero Banner Management
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Add, edit, or remove headline slider banners appearing at the top of the public homepage.
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="font-semibold gap-2 shadow-sm">
          <Plus className="h-4 w-4" /> Add New Hero Slide
        </Button>
      </div>

      {/* Status Alert */}
      {statusMsg && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center justify-between gap-2 ${
            statusMsg.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMsg.type === 'success' ? (
              <CheckCircle className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            <span>{statusMsg.text}</span>
          </div>
          <button onClick={() => setStatusMsg(null)} className="font-bold opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Slides Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          Loading hero slider items...
        </div>
      ) : (!slides || slides.length === 0) ? (
        <div className="p-12 text-center border-2 border-dashed rounded-2xl space-y-3">
          <ImageIcon className="h-10 w-10 text-muted-foreground/40 mx-auto" />
          <h3 className="text-sm font-bold text-foreground">No Custom Hero Slides Published</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            The homepage is currently displaying default campus fallback slides. Click above to add your custom headline text and background image.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {slides.map((slide: any) => (
            <Card key={slide.id} className="overflow-hidden shadow-sm border border-border">
              <div className="h-48 relative overflow-hidden bg-slate-900">
                <img
                  src={slide.imageUrl}
                  alt={slide.title}
                  className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent p-4 flex flex-col justify-end">
                  <Badge className="w-max bg-primary text-primary-foreground text-[10px] uppercase tracking-wider mb-1">
                    ACTIVE SLIDE
                  </Badge>
                  <h3 className="text-base font-extrabold text-white line-clamp-2 uppercase font-serif whitespace-pre-line">
                    {slide.title}
                  </h3>
                </div>
              </div>
              <CardContent className="p-4 space-y-3">
                <p className="text-xs text-muted-foreground font-light leading-relaxed line-clamp-2">
                  {slide.subtitle || 'No subtitle provided.'}
                </p>
                <div className="flex items-center justify-between text-[11px] pt-2 border-t text-muted-foreground">
                  <span>Button: <strong>{slide.buttonText || 'Learn More'}</strong> ({slide.buttonLink || '/'})</span>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenEdit(slide)}
                      className="h-8 px-2.5 text-xs font-semibold gap-1"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteMutation.mutate(slide.id)}
                      className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 h-8 px-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit Slide Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-lg rounded-2xl border border-border p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                {editingSlide ? 'Edit Hero Banner Slide' : 'Add New Hero Slide'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-foreground block mb-1">
                  Headline Title (Use \n for line break) *
                </label>
                <input
                  type="text"
                  placeholder="e.g. INSPIRING MINDS.\nBUILDING FUTURES."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary font-serif font-bold"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-foreground block mb-1">Subtitle / Description</label>
                <textarea
                  rows={2}
                  placeholder="e.g. A disciplined, modern and student-centered learning environment..."
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <ImageUpload
                  label="Slide Background Banner Image (Cloudinary) *"
                  value={imageUrl}
                  onChange={(url) => setImageUrl(url)}
                  onRemove={() => setImageUrl('')}
                  folder="hero-slides"
                  aspectRatio="banner"
                  placeholderText="Upload high-res banner photo to Cloudinary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-foreground block mb-1">Button Label</label>
                  <input
                    type="text"
                    placeholder="Explore Academics"
                    value={buttonText}
                    onChange={(e) => setButtonText(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="font-bold text-foreground block mb-1">Button Redirect Link</label>
                  <input
                    type="text"
                    placeholder="/academics"
                    value={buttonLink}
                    onChange={(e) => setButtonLink(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending} className="font-semibold gap-2">
                  {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingSlide ? 'Update Slide' : 'Publish Slide'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
