
# Skill Hub — Course Registration System

Course registration site for St. Berchmans College. Public visitors browse courses and apply (no signup). Applicants automatically receive a confirmation email with their Application ID. An admin manages courses and applications.

## Stack

Built on the Lovable stack (equivalent to your MERN spec, no external hosting needed):
- Frontend: React + Tailwind (TanStack Start)
- Backend: Lovable Cloud server functions (replaces Express)
- Database: Lovable Cloud Postgres (replaces MongoDB) — same collections, modeled as tables
- File uploads: Lovable Cloud Storage (replaces Multer) for course images + student photos
- Email: Lovable Emails, sent automatically on application submit

## Pages

**Public**
- `/` Home — hero, About Skill Hub, Why Choose Us, featured courses, Contact section
- `/courses` — grid of all active courses with search
- `/courses/$id` — detail + Apply Now
- `/apply/$courseId` — application form (course auto-filled)
- `/apply/success` — success screen showing Application ID

**Admin** (behind login)
- `/auth` — admin login
- `/admin` — dashboard (Total Courses, Total Applications, Applications Today)
- `/admin/courses` — list + Add / Edit / Delete / Enable-Disable / image upload / fee / seats
- `/admin/applications` — table with search (name / admission no / course), filters (department, course), view details, delete, export CSV
- `/admin/settings`, logout in sidebar

## Design

- Primary `#0F4C81`, Secondary `#1976D2`, Accent `#FFC107` — set as design tokens in `src/styles.css`
- Clean modern college look: rounded cards, soft shadows, generous spacing, smooth hover/entrance animations
- Fully responsive; sidebar collapses on mobile in admin

## Automated Confirmation Email

When a student submits the form:
1. Server validates + inserts application, generates Application ID (e.g. `SH-2026-000123`).
2. Server immediately sends a branded confirmation email to the student's address via Lovable Emails.
3. Email includes: student name, course, Application ID, start date, trainer, next steps.
4. Success page shows the same Application ID.

Not tied to admin action — fully automatic on submit.

## Data Model (Postgres)

- `courses`: name, description, duration, fee, trainer, seats, start_date, image_url, status (active/inactive)
- `applications`: application_id, full_name, admission_no, roll_no, department, semester, email, phone, gender, address, course_id, parent_name, parent_phone, photo_url, created_at
- `user_roles` + `has_role()` for admin gating (secure pattern — role stored separately from users)
- Storage buckets: `course-images` (public), `student-photos` (private)

## Assumptions I'm making (skipped questions)

- **Admin**: I'll add an "Admin Setup" one-time screen on first visit to `/auth` where you set the admin email + password. After that, only that account can access `/admin/*`. You can tell me an email later and I'll swap it.
- **Sender**: Confirmation emails will send from Lovable's default sender for now (works immediately, no DNS). Reply-to set to `skillhubsb@gmail.com` so student replies reach you. You can connect a real domain (e.g. `sbcollege.ac.in`) later for branded sender.

## Build order

1. Enable Lovable Cloud
2. Migration: `courses`, `applications`, `user_roles`, `has_role()`, RLS + grants, storage buckets, seed the 10 example courses
3. Scaffold email templates + `application-confirmation` template
4. Server functions: `listCourses`, `getCourse`, `submitApplication` (insert + send email), admin CRUD, `listApplications`, `deleteApplication`, `exportApplicationsCsv`
5. Public pages + apply flow
6. Admin auth gate + dashboard + course/application management + CSV export
7. Verify: submit a test application, confirm email sent, admin sees it
