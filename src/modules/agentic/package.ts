import { definitionPath, KIND_LABEL, type AgenticItem } from "@/content/agentic/types";
import { createZip, type ZipFile } from "./zip";

/*
 * What a buyer downloads (CR-2026-10-04-0112): a small ZIP with the agent/skill file in the folder where Claude Code looks for
 * it (unzip it at the root of your project and it is installed), a MANUAL, an INSTALL guide and the licence. Everything is
 * built from the catalogue content on request — nothing is stored.
 */

export const LICENSE_TEXT = `DataAI Nexus — Agentic AI licence (summary)

You may use this agent or skill for yourself and inside your own organisation, on as many projects as you like, and adapt it
to your needs.
You may not sell it, resell it, publish it, or share the download with people outside your organisation.
It is provided as is, without warranty: review what an agent or skill does before you rely on it, and keep your own backups.
We may improve the catalogue over time. An item you bought, or claimed with a credit, stays yours, and later versions of it
are available to you in My Agentic AI. Items you could download only through an Agentic AI plan stay available while the plan is active.

Full terms: the Agentic AI terms on the portal (/agentic-ai/terms).
`;

const list = (items: readonly string[]) => items.map((i) => `- ${i}`).join("\n");

export function composeManual(item: AgenticItem): string {
  return `# ${item.title} — user manual

${KIND_LABEL[item.kind]} for Claude Code · DataAI Nexus Agentic AI

## What it does

${item.summary}

## Best for

${list(item.bestFor)}

## What you give it

${list(item.youGive)}

## What you get back

${list(item.youGet)}

## How it works

${item.howItWorks.map((s, i) => `${i + 1}. ${s}`).join("\n")}

## Example

**You:** ${item.example.request}

**Result:** ${item.example.result}

## Limits — please read

${list(item.limits)}
- "Read-only" and "never edits" describe what the written instructions tell it to do. They are instructions, not technical locks: the permissions you give Claude Code are what actually enforce them.

## Make it yours

${list(item.customise)}

## Installing it

See INSTALL.md in this download. The file is already in the right folder inside the ZIP: \`${definitionPath(item)}\`.
`;
}

export function composeInstall(item: AgenticItem): string {
  const where = definitionPath(item);
  const how =
    item.kind === "agent"
      ? `This is an **agent** (a sub-agent for Claude Code). Claude can hand it work. Ask: "Use the ${item.slug} agent to ..." — Claude Code also picks it automatically when your request matches its description.`
      : `This is a **skill**. Claude loads it when your request matches its description, or you can call it by name: type \`/${item.slug}\` followed by what you want.`;
  return `# Install — ${item.title}

${how}

## Install it in one project (recommended)

1. Unzip this download **at the root of your project** (the folder that contains your code). It creates \`${where}\`.
2. Open Claude Code in that project. It finds the file by itself.
3. Try it with the example in MANUAL.md.

## Install it for every project on your computer

1. Copy the \`.claude/${item.kind === "agent" ? "agents" : "skills"}\` content into \`~/.claude/${item.kind === "agent" ? "agents" : "skills"}/\` in your home folder.
2. Restart Claude Code.

## Check it worked

${item.kind === "agent" ? "Type `/agents` in Claude Code — you should see " + item.slug + " in the list." : "Type `/` in Claude Code — you should see " + item.slug + " in the list."}

## Editing it

The file is plain text (Markdown). Open it in any editor, change the wording or the rules, and save. Keep the first lines between the \`---\` marks: Claude reads them to know when to use it.

## Trouble?

- It does not appear: check the folder name and that the file ends in \`.md\` (agents) or is named \`SKILL.md\` (skills), then restart Claude Code.
- It behaves oddly: read the Limits section of MANUAL.md, and check your own rules file does not contradict it.
`;
}

export function buildItemPackage(item: AgenticItem): { filename: string; bytes: Buffer } {
  const enc = (t: string) => new TextEncoder().encode(t);
  const files: ZipFile[] = [
    { path: definitionPath(item), data: enc(item.definition) },
    { path: "MANUAL.md", data: enc(composeManual(item)) },
    { path: "INSTALL.md", data: enc(composeInstall(item)) },
    { path: "LICENSE.txt", data: enc(LICENSE_TEXT) },
  ];
  return { filename: `${item.slug}.zip`, bytes: createZip(files) };
}
