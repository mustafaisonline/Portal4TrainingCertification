import { DEMO_EMAIL } from "@/lib/demoCredentials";
import { getCourse } from "./courses";

/**
 * SAMPLE DATA for the signed-in wireframe — added 2026-09-20.
 *
 * ⚠ ILLUSTRATIVE, AND LABELLED "SAMPLE" WHEREVER IT APPEARS. Founder
 * choice, 2026-09-20: when asked, he chose "labelled illustrative dates"
 * over honest "date to be announced" states, knowingly overriding the
 * DR-02 §4.1 default (no invented dates — no real scheduled offerings
 * exist yet). The override is confined to this file and to screens that
 * render its `SampleTag`; it is not a claim that any cohort has run or any
 * session is scheduled. Do not lift any value here into a real page.
 *
 * WHAT IS REAL: the programme titles, levels, durations, formats, the
 * certificate wording and the prices — all read from data/courses.ts — and
 * the trainer's name (the founder is the Academy's one real trainer).
 *
 * WHAT IS INVENTED: the participant (clearly "Demo Participant"), every
 * date and time, every order number and payment state, the attendance
 * record, and the diagnostic attempt. No other person, expert, company or
 * location is invented (DR-02 §7): the format is "Live online" and no
 * venue is named.
 */

export const demoParticipant = {
  name: "Demo Participant",
  initials: "DP",
  email: DEMO_EMAIL,
  country: "Malaysia",
};

export const SAMPLE_TRAINER = "Mustafa Qizilbash";

export type SampleSession = { label: string; date: string; time: string };

export type Registration = {
  id: string;
  courseSlug: string;
  status: "upcoming" | "completed";
  format: "Live online";
  registeredOn: string;
  orderId: string;
  sessions: SampleSession[];
  /** Supporting materials — DR-02 §5: they prepare for, extend, reinforce
   *  or document the live programme; never substitute for it. */
  materials: { title: string; kind: string; availability: string }[];
};

export const registrations: Registration[] = [
  {
    id: "data-blueprint",
    courseSlug: "data-blueprint",
    status: "upcoming",
    format: "Live online",
    registeredOn: "15 Sep 2026",
    orderId: "SAMPLE-0002",
    sessions: [
      { label: "Day 1", date: "Thu 12 Nov 2026", time: "09:30–17:00 MYT" },
      { label: "Day 2", date: "Fri 13 Nov 2026", time: "09:30–17:00 MYT" },
    ],
    materials: [
      {
        title: "Session preparation note",
        kind: "Reading",
        availability: "Shared before Day 1",
      },
      {
        title: "Session slides",
        kind: "Presentation",
        availability: "Shared after each session",
      },
      {
        title: "Practice exercises",
        kind: "Exercises",
        availability: "Shared after Day 2",
      },
    ],
  },
  {
    id: "data-ai-essentials",
    courseSlug: "data-ai-essentials",
    status: "completed",
    format: "Live online",
    registeredOn: "20 Aug 2026",
    orderId: "SAMPLE-0001",
    sessions: [{ label: "Session", date: "Wed 2 Sep 2026", time: "09:30–13:00 MYT" }],
    materials: [
      { title: "Session slides", kind: "Presentation", availability: "Available" },
      { title: "Reference templates", kind: "Templates", availability: "Available" },
    ],
  },
];

export type Order = {
  id: string;
  registrationId: string;
  date: string;
  status: "Paid";
  method: string;
};

export const orders: Order[] = [
  {
    id: "SAMPLE-0002",
    registrationId: "data-blueprint",
    date: "15 Sep 2026",
    status: "Paid",
    method: "Card via Stripe (sample)",
  },
  {
    id: "SAMPLE-0001",
    registrationId: "data-ai-essentials",
    date: "20 Aug 2026",
    status: "Paid",
    method: "Card via Stripe (sample)",
  },
];

/** Registration joined with its real course record and real Malaysia
 *  launch price. `course` is undefined only if a slug were removed from
 *  data/courses.ts — callers render nothing rather than guess. */
export function withCourse(reg: Registration) {
  const course = getCourse(reg.courseSlug);
  return { reg, course, price: course?.pricing?.malaysia };
}

export function getRegistration(id: string) {
  return registrations.find((r) => r.id === id);
}
