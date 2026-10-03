import type { Metadata } from "next";
import { findAgenticItem } from "@/content/agentic/catalogue";
import { ItemDetail } from "@/modules/agentic/components/ItemDetail";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const item = findAgenticItem("agent", (await params).slug);
  return item ? { title: `${item.title} — agent`, description: item.summary } : { title: "Agent" };
}

export default async function AgentPage({ params }: { params: Promise<{ slug: string }> }) {
  return <ItemDetail kind="agent" slug={(await params).slug} />;
}
