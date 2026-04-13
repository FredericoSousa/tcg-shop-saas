"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, X, Loader2, ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface ImageUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
  folder?: string;
  accept?: string;
  maxSizeMB?: number;
  className?: string;
  label?: string;
  compact?: boolean;
}

export function ImageUpload({
  value,
  onChange,
  folder = "general",
  accept = "image/jpeg,image/png,image/webp,image/svg+xml,image/x-icon,image/gif",
  maxSizeMB = 2,
  className = "",
  label,
  compact = false,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(
    async (file: File) => {
      const maxBytes = maxSizeMB * 1024 * 1024;
      if (file.size > maxBytes) {
        toast.error(`Arquivo muito grande. Máximo: ${maxSizeMB}MB.`);
        return;
      }

      const allowedTypes = accept.split(",").map((t) => t.trim());
      if (!allowedTypes.includes(file.type)) {
        toast.error("Tipo de arquivo não permitido.");
        return;
      }

      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", folder);

        const res = await fetch("/api/admin/upload", {
          method: "POST",
          body: formData,
        });

        const result = await res.json();

        if (!res.ok || !result.success) {
          throw new Error(result.message || "Falha no upload");
        }

        onChange(result.data.url);
        toast.success("Imagem enviada com sucesso!");
      } catch (error) {
        console.error("Upload error:", error);
        toast.error("Erro ao enviar imagem.");
      } finally {
        setUploading(false);
      }
    },
    [accept, folder, maxSizeMB, onChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) uploadFile(file);
    },
    [uploadFile]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) uploadFile(file);
      e.target.value = "";
    },
    [uploadFile]
  );

  const handleRemove = useCallback(() => {
    onChange(null);
  }, [onChange]);

  if (value) {
    return (
      <div className={`relative group ${className}`}>
        {label && (
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1 block mb-2">
            {label}
          </span>
        )}
        <div
          className={`relative rounded-xl border-2 border-border bg-muted/30 overflow-hidden ${
            compact ? "w-20 h-20" : "w-full aspect-video max-h-48"
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Preview"
            className="w-full h-full object-contain"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1.5 rounded-lg bg-destructive text-destructive-foreground 
                       opacity-0 group-hover:opacity-100 transition-all duration-200 
                       hover:scale-110 shadow-lg cursor-pointer"
            title="Remover imagem"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {label && (
        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1 block mb-2">
          {label}
        </span>
      )}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`
          relative rounded-xl border-2 border-dashed cursor-pointer
          transition-all duration-200 flex flex-col items-center justify-center
          ${compact ? "w-20 h-20 p-2" : "py-8 px-4"}
          ${
            dragOver
              ? "border-primary bg-primary/5 scale-[1.01]"
              : "border-border hover:border-primary/50 hover:bg-muted/30"
          }
          ${uploading ? "pointer-events-none opacity-60" : ""}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
        />

        {uploading ? (
          <>
            <Loader2
              className={`animate-spin text-primary ${
                compact ? "h-5 w-5" : "h-8 w-8 mb-2"
              }`}
            />
            {!compact && (
              <span className="text-xs text-muted-foreground font-medium">
                Enviando...
              </span>
            )}
          </>
        ) : (
          <>
            {compact ? (
              <ImageIcon className="h-5 w-5 text-muted-foreground" />
            ) : (
              <>
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <span className="text-sm font-semibold text-foreground">
                  Clique ou arraste uma imagem
                </span>
                <span className="text-[10px] text-muted-foreground mt-1">
                  JPEG, PNG, WebP, SVG • Máx. {maxSizeMB}MB
                </span>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
