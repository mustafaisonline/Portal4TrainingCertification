import { SAMPLE_IDS } from "./certificates";

/**
 * SAMPLE DATA for the trainer/admin wireframe — 2026-09-20, founder direction
 * ("create all kind of pages, dashboards … an admin side must have").
 *
 * ⚠ ALL INVENTED, ALL LABELLED. The same fictional people as the public
 * certificate registry ("… Sample" / "… Example"), plus fictional
 * organisations named "… Example Sdn Bhd". No real client, participant,
 * payment, enquiry or staff member. No dates beyond the three sample
 * offerings in data/demoParticipant.ts. Never lift any of this into a real
 * screen; the real admin side reads the database (see
 * docs/execution/ADMIN_REQUIREMENTS.md).
 */
export type SampleParticipant = {
  id: string;
  name: string;
  email: string;
  country: string;
  joined: string;
  offeringId?: string;
  payment?: "Paid" | "Invoice pending" | "Refunded";
  attendance?: string;
  completion?: "Completed" | "Not recorded" | "Did not complete";
  certificateId?: string;
  listed?: boolean;
};

export const participants: SampleParticipant[] = [
  { id: "demo", name: "Demo Participant", email: "demo.participant@example.com", country: "Malaysia", joined: "Sample", offeringId: "bootcamp", payment: "Paid", attendance: "— / 2", completion: "Not recorded" },
  { id: "alex", name: "Alex Sample", email: "alex@example.com", country: "Malaysia", joined: "Sample", offeringId: "bootcamp", payment: "Paid", attendance: "2 / 2", completion: "Completed", certificateId: SAMPLE_IDS[0], listed: true },
  { id: "priya", name: "Priya Example", email: "priya@example.com", country: "Pakistan", joined: "Sample", offeringId: "accelerator", payment: "Invoice pending", attendance: "— / 10", completion: "Not recorded", certificateId: SAMPLE_IDS[1], listed: true },
  { id: "chen", name: "Chen Sample", email: "chen@example.com", country: "Malaysia", joined: "Sample", offeringId: "bootcamp", payment: "Paid", attendance: "2 / 2", completion: "Completed", certificateId: SAMPLE_IDS[2], listed: false },
  { id: "sam", name: "Sam Example", email: "sam@example.com", country: "United Kingdom", joined: "Sample", offeringId: "mastery", payment: "Paid", attendance: "6 / 20", completion: "Not recorded", certificateId: SAMPLE_IDS[3], listed: true },
  { id: "noor", name: "Noor Example", email: "noor@example.com", country: "Malaysia", joined: "Sample" },
];

export function getParticipant(id: string) {
  return participants.find((p) => p.id === id);
}

export const orders = [
  { id: "SAMPLE-0104", who: "Sam Example", item: "Mastery", amount: "USD 2,811", method: "Card", state: "Paid", when: "Sample" },
  { id: "SAMPLE-0103", who: "Chen Sample", item: "Bootcamp", amount: "RM 4,999", method: "Online banking", state: "Paid", when: "Sample" },
  { id: "SAMPLE-0102", who: "Priya Example", item: "Accelerator", amount: "Rs. 102,839.86", method: "Invoice", state: "Invoice pending", when: "Sample" },
  { id: "SAMPLE-0101", who: "Alex Sample", item: "Bootcamp", amount: "RM 4,999", method: "Card", state: "Paid", when: "Sample" },
  { id: "SAMPLE-0100", who: "Alex Sample", item: "Certificate renewal", amount: "USD 10", method: "Card", state: "Paid", when: "Sample" },
  { id: "SAMPLE-0099", who: "Noor Example", item: "Bootcamp", amount: "RM 4,999", method: "Card", state: "Refunded", when: "Sample" },
];

export const enquiries = [
  { id: "E-07", from: "Noor Example", org: "—", type: "Individual", subject: "Is the Bootcamp suitable for a marketing manager?", state: "New" },
  { id: "E-06", from: "Farah Example", org: "Example Sdn Bhd", type: "Team (6)", subject: "Private Accelerator cohort, on-site KL", state: "Replied" },
  { id: "E-05", from: "Daniel Example", org: "Example Bank Bhd", type: "Team (12)", subject: "HRD Corp claimability?", state: "Waiting on us" },
  { id: "E-04", from: "Sam Example", org: "—", type: "Individual", subject: "Invoice for employer reimbursement", state: "Closed" },
];

export const organisations = [
  { id: "example-sdn-bhd", name: "Example Sdn Bhd", contact: "Farah Example", participants: 6, engagement: "Private Accelerator — proposed", invoice: "Not raised", hrd: "Not claimable (no registration)" },
  { id: "example-bank", name: "Example Bank Bhd", contact: "Daniel Example", participants: 12, engagement: "Enquiry", invoice: "—", hrd: "Asked — status explained" },
];

export const staff = [
  { name: "Mustafa Qizilbash", role: "Owner · Trainer · Administrator", email: "—", status: "Active" },
  { name: "Demo Admin", role: "Administrator (demo)", email: "demo.admin@example.com", status: "Demo" },
  { name: "(Assessor)", role: "Assessor — future role", email: "—", status: "Not created" },
];

export const auditLog = [
  { when: "Sample", who: "Demo Admin", action: "Viewed participant", target: "Alex Sample", detail: "—" },
  { when: "Sample", who: "Mustafa Qizilbash", action: "Recorded completion", target: "Chen Sample · Bootcamp", detail: "Certificate DAA-2026-SMP0-0003 issued" },
  { when: "Sample", who: "Mustafa Qizilbash", action: "Recorded attendance", target: "Bootcamp · Day 2", detail: "3 present, 0 absent" },
  { when: "Sample", who: "System", action: "Payment confirmed (webhook)", target: "SAMPLE-0104", detail: "USD 2,811 · Stripe" },
  { when: "Sample", who: "System", action: "Renewal reminder sent", target: "Chen Sample", detail: "30 days before expiry" },
  { when: "Sample", who: "Mustafa Qizilbash", action: "Changed renewal fee", target: "Settings", detail: "USD 10 → USD 10 (no change) · effective —" },
  { when: "Sample", who: "Demo Admin", action: "Refund issued", target: "SAMPLE-0099", detail: "RM 4,999 · reason: withdrew before start" },
];

export const sessionsByOffering: Record<string, { label: string; date: string; present: number; absent: number; total: number }[]> = {
  bootcamp: [
    { label: "Day 1", date: "Thu 12 Nov 2026", present: 3, absent: 0, total: 3 },
    { label: "Day 2", date: "Fri 13 Nov 2026", present: 3, absent: 0, total: 3 },
  ],
  accelerator: Array.from({ length: 10 }, (_, i) => ({ label: `Day ${i + 1}`, date: `Sample day ${i + 1}`, present: 0, absent: 0, total: 1 })),
  mastery: Array.from({ length: 20 }, (_, i) => ({ label: `Day ${i + 1}`, date: `Sample day ${i + 1}`, present: i < 6 ? 1 : 0, absent: 0, total: 1 })),
};
