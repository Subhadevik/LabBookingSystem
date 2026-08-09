# Lab & Club Management — Local Notes

This document describes the Lab Incharge and Club management pages added to the project.

Pages
- Club Members: /club-members — add/remove club members (requires club incharge role)
- Club Bookings: /club-bookings — view and approve/reject pending club bookings
- Lab Incharge Dashboard: /lab-incharge — lists labs assigned to the logged-in `lab_incharge` and lets them view/approve bookings
- Admin Lab Management: /admin/labs — assign `labIncharge` when creating/updating labs

How it works (quick)
- Labs now include `labInchargeId` (see `shared/types.ts`).
- Admins can assign a `lab_incharge` to a lab in `client/pages/admin/LabManagement.tsx`.
- Club incharges use `/club-members` to add users (by email) to their club; this calls `POST /api/clubs/:id/members`.
- Approvals are two-stage: club approval then lab approval. Relevant endpoints:
  - `GET /api/bookings/club-pending/:clubInchargeId`
  - `GET /api/bookings/lab-pending/:labInchargeId`
  - `PUT /api/bookings/:id/status` (body: `{ action: 'approve'|'reject', approvedBy, rejectionReason? }`)

Run locally (dev)
1. Ensure local MongoDB is running (the server falls back to `mongodb://localhost:27017`).
2. Start dev server (runs Vite + backend):

```powershell
cd D:\Documents\labbooking_Clone\LabBookingSystem
npm run dev
```

3. Open the app (Vite prints the port; commonly http://localhost:8081/). Log in with seeded users (or create test users using existing seed scripts).

Quick test flow
- As `admin`: go to `Admin -> Labs`, assign a `lab_incharge` to a lab.
- As the assigned `lab_incharge`: open `/lab-incharge`, click "View Bookings", approve or reject.
- As `club_incharge`: open `/club-bookings` to approve at club level, and `/club-members` to add members.

Notes / Next steps
- Would you like me to tidy and commit the seed/debug scripts (`server/create-test-users.cjs`, `server/force-seed.ts`, `server/list-users.ts`)? I can either delete, move to `scripts/`, or keep as-is and add README entries — tell me your preference.

Files touched
- `client/pages/ClubMembers.tsx`
- `client/pages/ClubBookings.tsx`
- `client/pages/admin/LabManagement.tsx`
- `client/pages/LabInchargeDashboard.tsx`
- `shared/types.ts`

