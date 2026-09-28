"use client";

import { useRouter } from "next/navigation";
import { useId, useRef, useState, useTransition } from "react";
import { removeTrainingPhotoAction, uploadTrainingPhotoAction } from "@/modules/catalogue/programmes/admin.actions";
import { Button } from "@/shared/ui/Button";
import { FormStatus } from "@/shared/ui/forms";

/*
 * Training photo (founder, 2026-09-28: "Training Photo on Training Cards").
 * Same pattern as the participant's avatar (app/account/profile/PhotoUploader.tsx,
 * ADR-008) — resized IN THE BROWSER with a <canvas> before the server sees
 * it — but landscape, not a square avatar: at most 1200px on the long edge,
 * re-encoded as JPEG (quality 0.85), capped at 600 KB after resizing. The
 * server checks type and size again (admin.repository.ts). Public, unlike
 * the avatar: served from /programs/images/<id>, no session gate.
 */

const MAX_EDGE = 1200;
const MAX_BYTES = 600 * 1024;
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

export function TrainingPhotoUploader({ id, hasPhoto, photoVersion }: { id: string; hasPhoto: boolean; photoVersion: number }) {
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
        setStatus({ tone: "error", text: "Even after resizing, the image is larger than 600 KB. Try a simpler picture." });
        return;
      }
      const formData = new FormData();
      formData.append("id", id);
      formData.append("photo", prepared);
      const result = await uploadTrainingPhotoAction(formData);
      if (result.status === "error") {
        setStatus({ tone: "error", text: result.message });
        return;
      }
      if (inputRef.current) inputRef.current.value = "";
      setStatus({ tone: "success", text: "The training photo has been saved." });
      router.refresh();
    });
  }

  function onRemove() {
    setStatus(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.append("id", id);
      const result = await removeTrainingPhotoAction(formData);
      if (result.status === "error") {
        setStatus({ tone: "error", text: result.message });
        return;
      }
      setStatus({ tone: "success", text: "The training photo has been removed." });
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="aspect-[16/9] w-full overflow-hidden rounded-[var(--radius-plate)] border border-[var(--color-line)] bg-[var(--color-ground-tint)]" data-testid="training-photo-preview">
        {hasPhoto ? (
          // A plain <img>: the bytes are served through the route, not an optimisable static asset.
          <img src={`/programs/images/${id}?v=${photoVersion}`} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full place-items-center text-body-sm text-[var(--color-ink-faint)]">No photo yet</div>
        )}
      </div>
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
            data-testid="training-photo-input"
            className="sr-only"
            onChange={(e) => onChange(e.target.files?.[0])}
          />
        </label>
        {hasPhoto ? (
          <Button type="button" variant="text" disabled={pending} onClick={onRemove} data-testid="training-photo-remove">
            Remove photo
          </Button>
        ) : null}
      </div>
      <p className="text-body-sm text-[var(--color-ink-faint)]">JPEG, PNG or WebP. Up to 600 KB after resizing. Shown on the training card and its own page.</p>
      {status ? (
        <FormStatus tone={status.tone}>
          <span data-testid="training-photo-status">{status.text}</span>
        </FormStatus>
      ) : null}
    </div>
  );
}
