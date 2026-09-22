"use client";

import { Button } from "@/shared/ui/Button";

/*
 * "Print / save as PDF" (M6 plan §3 E11): the browser's print engine over
 * the `.print-area` rules in app/globals.css — no PDF library. Rendered ONLY
 * beside an unlocked CertificateDocument (E9), never on the gate card.
 */
export function PrintButton() {
  return (
    <Button type="button" onClick={() => window.print()} data-testid="print-certificate">
      Print / save as PDF
    </Button>
  );
}
