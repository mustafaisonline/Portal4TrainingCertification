import type { Metadata } from "next";
import { ItemList } from "@/modules/agentic/components/ItemList";

export const metadata: Metadata = { title: "Skills", description: "Reusable skills for Claude Code — downloadable, with a full manual and install guide." };

export default function SkillsPage() {
  return <ItemList kind="skill" />;
}
