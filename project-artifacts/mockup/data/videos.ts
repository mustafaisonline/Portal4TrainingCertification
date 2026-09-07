/**
 * ⊘ SUPERSEDED 2026-09-07, later the same day. `CommunityVideos.tsx` no
 * longer imports this file — it fetches live from the YouTube Data API v3
 * now (founder direction: "the moment new video comes, it should become
 * the first... don't preload"), reading `lib/youtube.ts`. Kept, not
 * deleted, as the historical record of this section's first two
 * iterations (10 videos, then 112) — recoverable from git either way, but
 * left in place per this project's own convention (see e.g. `/trainers`'
 * retired per-profile route in docs/SITE_PAGES.md). Do not re-import this
 * for rendering; it will drift from the real channel immediately.
 *
 * "Let's Talk About Data!" — the founder's real YouTube show.
 *
 * Added 2026-09-07, founder direction, to replace `/trainers`' "In the
 * room" section with a "Community" section proving the Academy is active
 * on YouTube. EXPANDED the same day, later, after founder feedback that
 * pagination should not stop at 4 pages: this is now the (near-)complete
 * catalogue rather than the first page load's 10.
 *
 * REAL — sourced by hand from the founder's own published page,
 * https://yourpartnertechnologies.com/services/ltad.html, by reading its
 * live DOM (each "All Videos" card's `data-video-id` attribute and title)
 * after repeatedly triggering its own "Load More Videos" button until it
 * stopped adding new items, plus the separately-featured "Latest Video"
 * (episode #100). 112 unique videos resulted — matching the real YouTube
 * channel's own "133 videos" stat closely enough (some of the difference is
 * Shorts, which this page's grid excludes) that this is genuinely close to
 * the founder's whole catalogue, not an arbitrary sample. The first entry
 * (episode #100) was independently verified by opening
 * https://www.youtube.com/watch?v=_yTisgeIZkE, which resolved to the exact
 * same title on the founder's real channel ("Let's Talk About Data!",
 * @letstalkaboutdata — see `practitioners[0].podcast.youtube` in
 * data/practitioners.ts, the same URL, not re-typed here).
 *
 * Ordered exactly as the source page returned it (latest-first overall).
 * Episode numbers are NOT strictly monotonic in a few places — the source
 * page itself returns them that way (e.g. a run of #40/#72/#71… mid-list)
 * — and that irregularity is preserved rather than "corrected", since
 * silently reordering would misrepresent what the founder actually
 * published where. Titles are reproduced verbatim except for stripping the
 * repeated trailing "@letstalkaboutdata" self-mention and stray zero-width
 * characters, which is why there is no separate `episode` field: several
 * older titles don't cleanly separate the number from the rest ("Episode#84:
 * …", "Episode #53– …"), so the full real title is shown as-is rather than
 * parsed apart.
 *
 * NOT a live feed. This is a snapshot taken 2026-09-07 — a newer episode
 * published after that will not appear here until this file is updated by
 * hand, or a real YouTube Data API integration replaces it (out of scope
 * for a mockup with no backend; see docs/MOCK_DATA_REGISTER.md).
 */

export type CommunityVideo = {
  /** YouTube video ID (11 chars), e.g. from youtube.com/watch?v=<id>. */
  id: string;
  title: string;
};

export const communityVideos: CommunityVideo[] = [
  { id: "_yTisgeIZkE", title: "🎙 Episode #100: The Past, Present & Future of Enterprise Data" },
  { id: "GEV6Jgs1Kcg", title: "🎙 Episode #99: The Evolution of the Data Professional" },
  { id: "s2ESjSrN2gs", title: "🎙 Episode #97: The Importance of Meta-Architecture" },
  { id: "XDvmnqgoxdE", title: "🎙 Episode #96: Vibe Coding and the Future of Humanity" },
  { id: "E96i0WiPkxQ", title: "🎙 Episode #95: Modelling Business Concepts in Different Data Modelling Techniques" },
  { id: "VxzceNiVsis", title: "🎙 Episode #94: Catalog Federation and the Reemergence of MDM in the World of Context" },
  { id: "QSm0WzywVw4", title: "🎙 Episode #93: Real-Time and Enterprise-Grade Contextual Automation" },
  { id: "9Tpwrv_olBU", title: "🎙 Episode #92: AI Governance & Legal Accountability" },
  { id: "NMgkABtnzdo", title: "🎙 Episode #91: Separating Business Language from Technical Implementation" },
  { id: "GjSD1pahPRE", title: "🎙 Episode #90: Data Foundation and the Critical Role of Data Governance" },
  { id: "oMnUq0OcJgM", title: "🎙 Episode #89: Architecture vs Agility — Why Ignoring the Foundations Will Cost You" },
  { id: "bEvHw3RC0sY", title: "🎙 Episode #88: What Kind of Data is Fit for AI?" },
  { id: "npVkRUvXgSI", title: "🎙 Episode #87: How to Implement AI Transformation in Your Organization" },
  { id: "xCVW_AKszXw", title: "🎙 Episode #86: Data Governance as Behavioral Change in Modern Organizations" },
  { id: "ypG4FX6Feyw", title: "🎙 Episode #85: How AI Is Forcing a Rethink of Data Governance" },
  { id: "WynImb3v5G0", title: "Episode#84: Role of Enterprise Architecture in making AI Scalable in Large Organizations" },
  { id: "-VKiFOzikJw", title: "🎙 Episode #83: Trust and Knowledge Management" },
  { id: "mWFd2qGOLtY", title: "Episode#82: From Tools to Truth, Where Data Decisions Actually Break Down" },
  { id: "ezogQGDxZjI", title: "Episode#40 (Part 3) – Puppini Bridge with Francesco Puppini" },
  { id: "OqKValNmp54", title: "🎙 Episode #72 – Business-Driven Data Governance with Jose Almeida (Portugal)" },
  { id: "3HwtxIcTgyk", title: "Episode#71 - Why AI Is Unreliable? A Reality Check" },
  { id: "97KX3MNGLDg", title: "Episode#70: Revolutionizing Data - The Modular Data Fabric Explained" },
  { id: "ydiLAI-uxd8", title: "🎙 Episode#69: The Trough of Disillusionment for GenAI" },
  { id: "77kf5tzsEcg", title: "🎙 Episode #68 – How to Keep AI from Destroying Humanity" },
  { id: "E8UTLPMM3ic", title: "Episode#67 - AI With a Conscience: Guardian Agent & Responsible AI" },
  { id: "XjYG6fQ8cfg", title: "🎙 Episode #66 – Designing Practical Agentic AI for the Enterprise" },
  { id: "4XhNH9UYb8A", title: "🎙 Episode #64 – MLOps is about to get a lot easier." },
  { id: "6o4UyxHKdwg", title: "🎙 Episode #63 – Why Your AI Needs a Human Sidekick" },
  { id: "lxcr6cF3lnw", title: "🎙 Episode #81: Coherence — The Hidden Architecture Behind AI, Risk, and Enterprise Legitimacy" },
  { id: "Mtoh-37Zuc4", title: "🎙 Episode #80: What Challenges Is a CDO Facing in the Current Era" },
  { id: "hFq7NgwM86s", title: "🎙 Episode #79: Digital Twin of the CDO" },
  { id: "UfdmJLv1I3c", title: "🎙 Episode #78: Data Mesh in Multiple Environments" },
  { id: "YxoiIqRfPCU", title: "🎙 Episode #77: Agentic AI Modelling Tools — The Missing Bridge Between Strategy and Execution" },
  { id: "utJ7rvrn8ZI", title: "🎙 Episode #76: Why the Context Layer Will Decide the Future of AI in the Enterprise" },
  { id: "2t7PrVK3kcQ", title: "🎙 Episode #75: How Organisations Can Protect Themselves from the Rising Trend of AI Failures" },
  { id: "TKnKbkrLJKc", title: "🎙 Episode #74 – The Importance of Metadata" },
  { id: "DiJUXlbf66Y", title: "Episode#73: The CDO is Dead!" },
  { id: "mCrjZgpLYcw", title: "🎙 Episode #58 – The Next Evolution of Data: Object Graphs Explained" },
  { id: "nwXuFUTkzV8", title: "🎙 Episode #62 – Why There Is Hesitation To Get Into AI?" },
  { id: "ZPLe2Yr0Xn8", title: "🎙 Episode #60 – Data Talk on Random topics like Software Engineering, Modelling, Data Ecosystem etc" },
  { id: "n2zwHjzqeD4", title: "🎙 Episode #59 – Data & Advanced Analytics Coaching" },
  { id: "NHLmbB55Y1o", title: "🎙 Episode #57 – Distributed Data Fabric" },
  { id: "pF3mrv3wXJM", title: "🎙 Episode #55– Agentic AI & The Power of Strong Foundations" },
  { id: "HONeScJckkU", title: "Episode#54: Transparency with StratOps & Metadata" },
  { id: "xWXpAKHT9iM", title: "Episode #53– Data Mesh Brainstorming with Roberto Zagni 🇮🇹" },
  { id: "WWla0FGSDJE", title: "🎙 Episode#52– Roundtable on DIKW: Data, Information, Knowledge & Wisdom" },
  { id: "_Md8goZ8bAQ", title: "Episode#51: Role of CDO Role in Current Era" },
  { id: "_9qRyWKhVAc", title: "Episode#50– Conversation on Data Products, Agentic AI, and Role of the CDO with Veronika Durgin" },
  { id: "FWYDFNiwHuY", title: "🎙 Episode#49: Connection between DG and Data Mgt with AI" },
  { id: "oYHBZtY-4RM", title: "Episode#48 – Centralised to Decentralised or Federated Approach" },
  { id: "SDMFMMMxxxw", title: "Episode#47 (Part 3) – Role of CDO & CDAO: Why its the Most Fragile Roles" },
  { id: "8UIWNVXpXco", title: "Episode#47 (Part 2) – Role of CDO & CDAO: Why its the Most Fragile Roles" },
  { id: "6isKyTDgEKs", title: "Episode#47 (Part 1) – Role of CDO & CDAO: Why its the Most Fragile Roles" },
  { id: "t7tk-t7XdAI", title: "Episode#46 (Part 2) – Simplifying Data Management" },
  { id: "XhTrmsHTLyE", title: "Episode#46 (Part 3) – Simplifying Data Management" },
  { id: "60sG0dByITk", title: "Episode#46 (Part 1) – Simplifying Data Management" },
  { id: "tWvoBJkuJQU", title: "Episode#45 (Part 3) – AI & Data Literacy with Nathália Demetrio" },
  { id: "tVT1cFbUMZQ", title: "Episode#45 (Part 2) – AI & Data Literacy with Nathália Demetrio" },
  { id: "P0YetIxV1iA", title: "Episode#45 (Part 1) – AI & Data Literacy with Nathália Demetrio" },
  { id: "mX_oP6igzWE", title: "Episode#44 (Part 3) – Biz Transformation by AI Data Products with Jon Cooke" },
  { id: "VYGsv_-cj-s", title: "Episode#44 (Part 2) – Biz Transformation by AI Data Products with Jon Cooke" },
  { id: "aK0pBlcugI0", title: "Episode#44 (Part 1) – Biz Transformation by AI Data Products with Jon Cooke" },
  { id: "H1vKIKnKDuo", title: "Episode#43 (Part 3) – Data Strategy and Ecosystem with Dylan Anderson" },
  { id: "qq6rAr8OuDY", title: "Episode#43 (Part 2) – Data Strategy and Ecosystem with Dylan Anderson" },
  { id: "kzG75zfD6Ic", title: "Episode#43 (Part 1) – Data Strategy and Ecosystem with Dylan Anderson" },
  { id: "nkvEy5RTffA", title: "Episode#42 (Part 3) – dbt, an ELT Tool with Roberto Zagni" },
  { id: "x-l2nkpHGB0", title: "Episode#42 (Part 2) – dbt, an ELT Tool with Roberto Zagni" },
  { id: "Z7m9h9ICQDM", title: "Episode#42 (Part 1) – dbt, an ELT Tool with Roberto Zagni" },
  { id: "wdnVxXXu3Pw", title: "Episode #41 (Part 3) - Anchor Modeling with Lars Rönnbäck" },
  { id: "rCi0LSFtvXE", title: "Episode #41 (Part 2) – Anchor Modeling with Lars Rönnbäck" },
  { id: "0i7fZNB4e9s", title: "Episode #41 (Part 1) – Anchor Modeling with Lars Rönnbäck" },
  { id: "D5y3hJYMNow", title: "Episode#40 (Part 2) – Puppini Bridge with Francesco Puppini" },
  { id: "-vJnSmCrUMk", title: "Episode#40 (Part 1) – Puppini Bridge with Francesco Puppini" },
  { id: "FU487jPf_gM", title: "Episode#39: Importance of DIKW Pyramid with Benjamin Szilagyi" },
  { id: "nKnihtym8Go", title: "Episode#38: DeepSeek with Ahmed Fessi, CTIO at Medius" },
  { id: "ETcPE4imyhk", title: "Episode#37: FCO-IM Data Modelling with Marco Wobben" },
  { id: "_12MjtLCJnQ", title: "Episode#36: What's Data Product with Andrea Gioia" },
  { id: "C-kfhoA--ok", title: "Episode#35: From Centralised to Decentralised Approach with Gregor Zeiler" },
  { id: "AE7keZ1ngIg", title: "Episode#34: Data Storytelling with Andrew Mason" },
  { id: "o-OG0rp5ux4", title: "Episode#33: DQOps with Piotr Czarnas" },
  { id: "hHbdUQn2JdE", title: "Episode#32: What is EDGY with Wolfgang Goebl." },
  { id: "33ho4tDfFg4", title: "Episode#31: Data & AI Cognitive (DAC) Architecture" },
  { id: "Sk8ZOHLUzQw", title: "Episode#30: Focal Point Modelling with Patrik Lager" },
  { id: "tGEtb5vOnEA", title: "Episode#29: Information Product Canvas with Shane Gibson" },
  { id: "uUJG-3lmXyM", title: "Episode#28: Data Products, Data Contracts, AI agents & Good, Bad & Ugly LLM UCs with Shane Gibson" },
  { id: "dj_IR2FmRlk", title: "Episode#27: Table Formats [Iceberg, Delta, Snow & Hudi] and Apache XTable" },
  { id: "a1lIyG_y_rI", title: "Episode#26: How Centralised Team own Enterprise Graphs to drive Enterprise Data Products!" },
  { id: "TvMPgkYs1wY", title: "Episode#25: Recruitment via AI with Mirko Peters from Germany" },
  { id: "oA-YCYvUH1E", title: "Episode#24: Data Mesh with Ugo Ciracì" },
  { id: "nvXXYXVBFJ4", title: "Episode#23: Semantic Data Product" },
  { id: "tUD8tloZq9s", title: "Episode#22: MetaGraph" },
  { id: "C-vN8IE7o0c", title: "Episode#21: Philosophical Data Angle by Maarten van der Heijden" },
  { id: "BPTV11JdUZI", title: "Episode#20: Data Modelling in Modern BI" },
  { id: "k8pxKvkmyHU", title: "Episode#19: Data Vault Modelling" },
  { id: "y-Y9vQvfXOk", title: "Episode#18: Data Asset Management" },
  { id: "sMLY3DurNNw", title: "Episode#17: Textual ETL" },
  { id: "BgNIZk6yDic", title: "Episode#16: Data Product Ownership" },
  { id: "9xDKLavwqP4", title: "Episode#15: IOblend: An Integration Tool" },
  { id: "ZykoRtdw7as", title: "Episode#14: Data Modelling with Graph Theory" },
  { id: "m3pOJVxpXQw", title: "Episode#13: Data Platform Gravity" },
  { id: "I7usq2j_6zg", title: "Episode#12: Role of Data in Health Industry!" },
  { id: "P1a8GaSyE5E", title: "Episode#11: Hooks" },
  { id: "4DTfOdIZGdY", title: "Episode#10: Mgmt & Governance of Unstr Data based on Foundation of Biz Literacy" },
  { id: "EFMlybMYwhE", title: "Episode#9: Data Value Proposition" },
  { id: "M1qYkUJ3Slw", title: "Episode#8: RAG with Vector Database - Part I" },
  { id: "f2mCIvXB3Y0", title: "Episode#7: Crowdstrike" },
  { id: "1oG6SoFtXtk", title: "Episode#6: StratOps Approach" },
  { id: "KdXFV_xfCW4", title: "Episode#5: PVP Approach" },
  { id: "dYXqRjC0lsQ", title: "Episode#4: Media Campaigning: Use of GenAI and Data Analytics" },
  { id: "EHEzbnCbIiA", title: "Episode#3: Data Integration for AI Solution" },
  { id: "pZ76bgIMUjM", title: "Episode#2: GenAI - LLM Chat on Structured, Semi & Unstructured data" },
  { id: "ZEAh1pk0swM", title: "Episode#1: Taxonomy and Ontology [Full Video]" },
];

/** YouTube's own official thumbnail CDN for a given video — not stock or
 *  AI imagery, the genuine thumbnail of the founder's own real video. */
export function youtubeThumbnail(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

export function youtubeWatchUrl(id: string): string {
  return `https://www.youtube.com/watch?v=${id}`;
}
