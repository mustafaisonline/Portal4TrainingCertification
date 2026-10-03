/*
 * The one closing for every plain-text email the portal sends (CR-2026-10-03-1227). It names the organisation the
 * way the site does and tells the truth about replies: the sender address is the team's monitored mailbox and is
 * also the Reply-To (smtp.ts), so a person may simply reply. No address is printed here — the portal never shows one.
 */
export const EMAIL_SIGN_OFF = "\n\n— DataAI Nexus\nYou can reply to this email and our team will get it.";
