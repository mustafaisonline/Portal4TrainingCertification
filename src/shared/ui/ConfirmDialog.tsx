"use client";

import { useEffect, useRef } from "react";
import { Button } from "./Button";

/*
 * ConfirmDialog — the portal's own confirmation box (founder, 2026-09-28:
 * "all the pop-up dialog boxes should be custom boxes, not the system
 * generated"). Built on the native <dialog> element: `showModal()` provides
 * the focus trap, the ::backdrop and Escape-to-cancel for free, and the box
 * itself is entirely token-styled. One component behind every destructive
 * confirmation, so wording and behaviour cannot drift between screens.
 */

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      data-testid="confirm-dialog"
      aria-labelledby="confirm-dialog-title"
      onCancel={(e) => {
        // Escape (and any other native cancel) routes through the same path
        // as the Cancel button; the parent owns the open state.
        e.preventDefault();
        onCancel();
      }}
      className="m-auto w-[min(92vw,420px)] rounded-[var(--radius-plate)] border border-[var(--color-line-strong)] bg-[var(--color-ground)] p-0 text-[var(--color-ink)] shadow-xl backdrop:bg-black/50"
    >
      <div className="flex flex-col gap-4 p-6">
        <h2 id="confirm-dialog-title" className="text-h2">
          {title}
        </h2>
        <p className="text-body-sm text-[var(--color-ink-quiet)]">{body}</p>
        <div className="flex flex-wrap justify-end gap-3 pt-1">
          <Button type="button" variant="secondary" onClick={onCancel} data-testid="confirm-dialog-cancel">
            {cancelLabel}
          </Button>
          <Button type="button" onClick={onConfirm} data-testid="confirm-dialog-confirm">
            {confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
