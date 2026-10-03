import type { Metadata } from "next";
import { ItemList } from "@/modules/agentic/components/ItemList";

export const metadata: Metadata = { title: "Agents", description: "Specialist agents for Claude Code — downloadable, with a full manual and install guide." };

export default function AgentsPage() {
  return <ItemList kind="agent" />;
}
