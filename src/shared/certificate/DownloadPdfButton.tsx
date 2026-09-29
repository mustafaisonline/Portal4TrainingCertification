import { Button } from "@/shared/ui/Button";

/*
 * "Download PDF" beside "Print" (Milestone 15, Requirement 6). A plain
 * download link to an authorised route handler — the file is generated on
 * request, never a public URL. `download` and no prefetch: the browser saves
 * the response instead of navigating, and nothing renders a PDF ahead of a
 * click.
 */
export function DownloadPdfButton({ href }: { href: string }) {
  return (
    <Button variant="secondary" href={href} download prefetch={false} data-testid="download-certificate-pdf">
      Download PDF
    </Button>
  );
}
