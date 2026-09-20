import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminFrame } from "@/components/admin/AdminFrame";
import { PublicShell } from "@/components/PublicShell";

/** Trainer / admin wireframe — see components/admin/AdminFrame.tsx. */
export const metadata: Metadata = {
  title: "Admin — Data & AI Academy",
  description: "Trainer and administrator wireframe (sample data).",
  robots: { index: false, follow: false },
};
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <PublicShell>
      <AdminFrame>{children}</AdminFrame>
    </PublicShell>
  );
}
