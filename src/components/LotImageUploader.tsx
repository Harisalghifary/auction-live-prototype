"use client";

/**
 * LotImageUploader — drag-and-drop image uploader for lot photos.
 * Uploads to Supabase Storage 'lot-images' bucket.
 * Supports multiple images, live preview, and delete.
 */

import { useState, useRef, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const BUCKET = "lot-images";
const MAX_SIZE_MB = 5;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

interface LotImageUploaderProps {
  lotId: string;
  existingUrls?: string[];
  onUrlsChange: (urls: string[]) => void;
}

interface UploadState {
  file: File;
  preview: string;
  status: "uploading" | "done" | "error";
  url?: string;
  error?: string;
}

export function LotImageUploader({
  lotId,
  existingUrls = [],
  onUrlsChange,
}: LotImageUploaderProps) {
  const [uploads, setUploads] = useState<UploadState[]>([]);
  const [confirmedUrls, setConfirmedUrls] = useState<string[]>(existingUrls);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const notify = useCallback(
    (urls: string[]) => {
      setConfirmedUrls(urls);
      onUrlsChange(urls);
    },
    [onUrlsChange]
  );

  const uploadFile = useCallback(
    async (file: File) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return { error: "Only JPEG, PNG, WebP, or GIF allowed" };
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        return { error: `Max file size is ${MAX_SIZE_MB}MB` };
      }

      const ext = file.name.split(".").pop();
      const path = `${lotId}/${Date.now()}.${ext}`;

      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { upsert: false });

      if (error) return { error: error.message };

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      return { url: data.publicUrl };
    },
    [lotId]
  );

  const handleFiles = useCallback(
    async (files: FileList) => {
      const newUploads: UploadState[] = Array.from(files).map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        status: "uploading" as const,
      }));

      setUploads((prev) => [...prev, ...newUploads]);

      const results = await Promise.all(newUploads.map((u) => uploadFile(u.file)));

      const finalUrls = [...confirmedUrls];
      setUploads((prev) =>
        prev.map((u, i) => {
          const result = results[prev.length - newUploads.length + i];
          if (!result) return u;
          if (result.url) {
            finalUrls.push(result.url);
            return { ...u, status: "done", url: result.url };
          }
          return { ...u, status: "error", error: result.error };
        })
      );

      notify(finalUrls);
    },
    [confirmedUrls, uploadFile, notify]
  );

  const removeExisting = useCallback(
    async (url: string) => {
      // Extract path from public URL
      const path = url.split(`/${BUCKET}/`)[1];
      if (path) await supabase.storage.from(BUCKET).remove([path]);
      const updated = confirmedUrls.filter((u) => u !== url);
      notify(updated);
    },
    [confirmedUrls, notify]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 transition ${
          isDragging
            ? "border-gold-500 bg-gold-500/5"
            : "border-obsidian-600 hover:border-obsidian-500 hover:bg-obsidian-700/30"
        }`}
      >
        <svg className="h-8 w-8 text-platinum-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="font-body text-sm text-platinum-400">
          Drag & drop images or <span className="text-gold-400">click to browse</span>
        </p>
        <p className="font-body text-xs text-platinum-500">JPEG, PNG, WebP, GIF · Max 5MB each</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
      </div>

      {/* Image grid */}
      {(confirmedUrls.length > 0 || uploads.length > 0) && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {/* Existing confirmed uploads */}
          {confirmedUrls.map((url) => (
            <div key={url} className="group relative aspect-square overflow-hidden rounded-xl border border-obsidian-700 bg-obsidian-900">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="Lot" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removeExisting(url)}
                className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-obsidian-950/80 text-platinum-400 opacity-0 transition group-hover:opacity-100 hover:bg-auction-live hover:text-white"
              >
                ×
              </button>
            </div>
          ))}

          {/* In-progress uploads */}
          {uploads
            .filter((u) => !confirmedUrls.includes(u.url ?? ""))
            .map((u, i) => (
              <div
                key={i}
                className={`relative aspect-square overflow-hidden rounded-xl border bg-obsidian-900 ${
                  u.status === "error" ? "border-auction-live/50" : "border-obsidian-700"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={u.preview} alt="Preview" className="h-full w-full object-cover opacity-60" />
                <div className="absolute inset-0 flex items-center justify-center">
                  {u.status === "uploading" && (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-gold-400 border-t-transparent" />
                  )}
                  {u.status === "done" && (
                    <span className="text-lg text-green-400">✓</span>
                  )}
                  {u.status === "error" && (
                    <span className="px-1 text-center font-body text-[10px] text-auction-live">{u.error}</span>
                  )}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
