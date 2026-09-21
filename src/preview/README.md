# `src/preview/` — fixture and prototype data, fenced

**Nothing in production code may import from this directory.** That is enforced
by `tests/unit/boundaries.test.ts`, which fails the suite on any import of
`@/preview` (or a relative path into it) from `app/` or `src/` outside this
folder. A violation is a defect, not a style issue (ADR-001, AP-01; external
review finding A-2; ADR-045).

What belongs here: sample records used to demonstrate a screen before its real
data exists, and only while an accepted milestone plan lists them for deletion.
Anything rendered from here must carry a visible **PROTOTYPE** banner (AP-07).

What never belongs here: anything a real user could mistake for a real record,
credential, payment or identity.

As of Milestone 1 this directory is intentionally empty apart from this file.
