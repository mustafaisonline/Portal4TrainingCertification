import type { Metadata } from "next";
import { findAgenticItem } from "@/content/agentic/catalogue";
import { ItemDetail } from "@/modules/agentic/components/ItemDetail";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const item = findAgenticItem("skill", (await params).slug);
  return item ? { title: `${item.title} — skill`, description: item.summary } : { title: "Skill" };
}

export default async function SkillPage({ params }: { params: Promise<{ slug: string }> }) {
  return <ItemDetail kind="skill" slug={(await params).slug} />;
}
