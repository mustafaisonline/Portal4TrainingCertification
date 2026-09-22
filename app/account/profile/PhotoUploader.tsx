"use client";

import { useRouter } from "next/navigation";
import { useId, useRef, useState, useTransition } from "react";
import { removePhotoAction, uploadPhotoAction } from "@/modules/identity/profile.actions";
import { Button } from "@/shared/ui/Button";
import { FormStatus } from "@/shared/ui/forms";
import { initialsOf } from "@/shared/util/initials";

/*
 * Profile photo (Milestone 5a plan §2 item 2). The chosen image is resized
 * IN THE BROWSER with a <canvas> to at most 256×256 and re-encoded as JPEG
 * (quality 0.85) before the server action sees it, so the interim database
 * column holds a few KB, never a camera original. The server checks type and
 * size again (profile.actions / profile.repository). The preview and the
 * header avatar both read /api/me/photo — session-gated, never a public URL.
 */

const MAX_EDGE = 256;
const MAX_BYTES = 300 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp";

async function resizeToJpeg(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas unavailable");
    ctx.fillStyle = "#ffffff"; // JPEG has no transparency
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(bitmap, 0, 0, width, height);
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("encode failed"))), "image/jpeg", 0.85),
    );
    return new File([blob], "photo.jpg", { type: "image/jpeg" });
  } finally {
    bitmap.close();
  }
}

export function PhotoUploader({ name, hasPhoto, photoVersion }: { name: string; hasPhoto: boolean; photoVersion: number }) {
  const router = useRouter();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<{ tone: "error" | "success"; text: string } | null>(null);

  function onChange(file: File | undefined) {
    if (!file) return;
    setStatus(null);
    startTransition(async () => {
      let prepared: File;
      try {
        prepared = await resizeToJpeg(file);
      } catch {
        setStatus({ tone: "error", text: "We could not read that image. Use a JPEG, PNG or WebP file." });
        return;
      }
      if (prepared.size > MAX_BYTES) {
        setStatus({ tone: "error", text: "Even after resizing, the image is larger than 300 KB. Try a simpler picture." });
        return;
      }
      const formData = new FormData();
      formData.append("photo", prepared);
      const result = await uploadPhotoAction(formData);
      if (result.status === "error") {
        setStatus({ tone: "error", text: result.message });
        return;
      }
      if (inputRef.current) inputRef.current.value = "";
      setStatus({ tone: "success", text: "Your photo has been saved." });
      router.refresh();
    });
  }

  function onRemove() {
    setStatus(null);
    startTransition(async () => {
      const result = await removePhotoAction();
      if (result.status === "error") {
        setStatus({ tone: "error", text: result.message });
        return;
      }
      setStatus({ tone: "success", text: "Your photo has been removed." });
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
      <span
        aria-hidden="true"
        data-testid="photo-preview"
        className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-full bg-[var(--color-action)] text-h2 font-semibold text-[var(--color-action-ink)]"
      >
        {hasPhoto ? (
          // A plain <img>: the bytes are session-gated, not an optimisable asset.
          <img src={`/api/me/photo?v=${photoVersion}`} alt="" className="h-full w-full object-cover" />
        ) : (
          initialsOf(name)
        )}
      </span>
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <label
            htmlFor={inputId}
            className="inline-flex cursor-pointer items-center justify-center rounded-[var(--radius-plate)] border border-[var(--color-line-strong)] px-5 py-2.5 text-body-sm font-medium text-[var(--color-ink)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--color-primary)]"
          >
            {pending ? "Working…" : hasPhoto ? "Choose a different photo" : "Choose a photo"}
            <input
              ref={inputRef}
              id={inputId}
              type="file"
              name="photo"
              accept={ACCEPT}
              disabled={pending}
              data-testid="photo-input"
              className="sr-only"
              onChange={(e) => onChange(e.target.files?.[0])}
            />
          </label>
          {hasPhoto ? (
            <Button type="button" variant="text" disabled={pending} onClick={onRemove} data-testid="photo-remove">
              Remove photo
            </Button>
          ) : null}
        </div>
        <p className="text-body-sm text-[var(--color-ink-faint)]">JPEG, PNG or WebP. Up to 300 KB after resizing.</p>
        {status ? (
          <FormStatus tone={status.tone}>
            <span data-testid="photo-status">{status.text}</span>
          </FormStatus>
        ) : null}
      </div>
    </div>
  );
}
