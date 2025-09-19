## Frontend PRD — Smart Tourism (Single App Page, UI-only)

Scope: One-page app with a vertical stepper guiding the full flow. UI-only (no backend/AI/OCR/agent logic). All data is mocked, with minimal localStorage persistence for a realistic demo.

Stack: Next.js + React + TypeScript, Tailwind CSS, shadcn/ui (Radix under the hood). Icons via lucide-react.

Out of scope: Real policy parsing, classification, OCR, actual browser agent, true uploads/storage, emails, real PDFs filling.

Routes: `/dashboard` (overview), `/app` (single-page wizard).

---

### Objectives

- Show the end-to-end journey on one page: select trip details → personalized checklist → upload & mapping → launch agent (mocked).
- Validate IA, component set, visual design, and step-to-step transitions for future integration.

---

### Page Layout

- Vertical stepper (accordion-style). Only one step expanded at a time. Steps can be revisited.
- Sticky footer with Prev/Next/Launch buttons and progress indicator.
- Optional right-rail summary (collapsible on mobile) with key selections and completion %.

---

### Dashboard

- Purpose: Overview of visa applications and entry point to create a new one.
- Route: `/dashboard` (default landing).
- Content:
  - Header with title and primary action: “New Application”.
  - Applications list (cards or table) with columns: Destination, Visa Type, Purpose, Dates, Progress.
  - Row actions: View/Resume (navigates to `/app`), Duplicate, Delete.
  - Empty state: illustration + prominent “New Application” button.
- New Application flow:
  - Clicking “New Application” creates a new draft application (local id) and navigates to `/app` with that id set as current.
  - Optional: Prefill Trip Setup with defaults (Nationality: Hong Kong SAR) to reduce friction.

---

### Steps (Wizard)

1. Trip Setup

- Fields (required):
  - Nationality (default: Hong Kong SAR)
  - Destination (US, Schengen, UK)
  - Purpose (Tourist, Business)
  - Travel Dates (date range)
- Derived UI: shows mocked Visa Type label (e.g., “US B1/B2”, “Schengen C Short-Stay”, “UK Standard Visitor”).
- Validation: required fields; date range ordering; basic select validation. Disable Next until valid.
- Feedback: inline helper text and errors; simulated loading shimmer when “calculating” rules (500–800ms).

2. Checklist

- Personalized items (mocked by destination/visa type). Each item shows:
  - Title, short description, due date (relative to departure)
  - Category badge: Required / Recommended
  - Status: To do / Done (checkbox toggle)
- Interactions:
  - Toggle complete/undo (updates progress and readiness)
  - Filter by status (All, Required, Recommended, Done)
  - Sort by deadline (soonest first)
  - Details drawer: longer description, links, notes
- Progress summary: X/Y items complete and Required completion count

3. Upload & Fill

- Drag-and-drop zone + file picker. Allowed: PDF, JPG, PNG. Max size: 10 MB.
- Uploaded item row: icon/thumbnail, filename, size, remove button, mock status (Uploaded, Previewed).
- Extraction preview (mock only):
  - Passport MRZ, Name, DOB, Passport No., Nationality, Expiry
  - Address; Bank balance sample (for proof of funds)
  - PII masking toggle (masks values in-place visually)
- Mapping table (table-only for MVP):
  - Left: Extracted field key/value
  - Right: Target form field name/value (editable input). Confidence badge (Low/Med/High, mocked)
  - Actions: “Copy Mapping JSON” (to clipboard), “Simulate Fill” (toast + row highlight)
- Optional note: PDF canvas placeholder not implemented in MVP (keeps bundle small)

4. Launch Agent

- Readiness checks (UI-only enforcement):
  - All Required checklist items must be marked Done
  - At least one identity document (passport) uploaded
  - No blocking validation errors
- Agent Runner placeholder:
  - A reserved, empty box where the browser agent would run.
  - Suggested size: full width, min-height 420px, bordered container with label “Agent Runner — placeholder”.
  - Visible once readiness is met or when simulating; no functionality.
- CTA: “Launch Agent”
  - Disabled until ready; tooltip explains missing prerequisites
  - On click: modal with mock progress sequence (e.g., “Opening form…”, “Filling section A…”, “Reviewing…”, “Complete”) and success state

---

### Components (shadcn/ui)

- Layout & Navigation: Stepper/Accordion, Sticky footer nav, Breadcrumb-like progress
- Dashboard: ApplicationCard or Table, EmptyState, NewApplicationDialog
- Controls: Button, Input, Textarea, Select, Checkbox, Switch/Toggle, Popover, Calendar (DateRange via react-day-picker), Tooltip
- Data display: Table (mapping), Badge (confidence, required), Alert (inline), Toast (global), Skeletons, Separator
- Overlays: Dialog (Launch modal), Drawer (Checklist item details)
- File UI: Dropzone (custom) + Upload item rows

---

### Mock Data

- Supported visa types (mock):

  - US: B1/B2 (Tourist/Business)
  - Schengen: C Short-Stay (Tourist/Business)
  - UK: Standard Visitor

- Visa rules (display only, sample shape):

```json
{
  "visaType": "US_B1_B2",
  "requirements": [
    {
      "id": "ds160",
      "title": "Complete DS-160",
      "category": "Required",
      "leadDays": 30
    },
    {
      "id": "photo",
      "title": "US visa photo (2x2)",
      "category": "Required",
      "leadDays": 25
    },
    {
      "id": "proof_funds",
      "title": "Proof of funds",
      "category": "Recommended",
      "leadDays": 20
    }
  ]
}
```

- Checklist items (generated from rules + travel dates), sample shape:

```json
[
  {
    "id": "ds160",
    "title": "Complete DS-160",
    "description": "Fill the DS-160 online application form.",
    "category": "Required",
    "dueDate": "2025-10-12",
    "done": false
  }
]
```

- Extraction result (mock), sample shape:

```json
{
  "mrz": "P<HKGLEE<<JIAHUI<<<<<<<<<<<<<<<<<<<<<<<<<<<\nH1234567<8HKG8501012F3001012<<<<<<<<<<<<<<06",
  "fullName": "LEE JIA HUI",
  "dateOfBirth": "1985-01-01",
  "passportNumber": "H1234567",
  "nationality": "HKG",
  "expiry": "2030-01-01",
  "address": "12F, Example Tower, Central, Hong Kong",
  "bankBalanceHKD": 180000
}
```

- Mapping template (per visa type), sample shape:

```json
{
  "visaType": "US_B1_B2",
  "mappings": [
    {
      "extractedKey": "fullName",
      "formField": "applicant_name",
      "value": "LEE JIA HUI",
      "confidence": "high"
    },
    {
      "extractedKey": "dateOfBirth",
      "formField": "dob",
      "value": "1985-01-01",
      "confidence": "high"
    },
    {
      "extractedKey": "passportNumber",
      "formField": "passport_no",
      "value": "H1234567",
      "confidence": "medium"
    }
  ]
}
```

---

### State & Persistence

- Single in-page store (React state + Context if helpful). Keep it simple.
- Persist the following to localStorage:
  - `trip.selections` (nationality, destination, purpose, dates)
  - `checklist.state` (done flags per item id)
  - `uploads.meta` (filename, type, mock id; no file contents)
  - `mapping.overrides` (edited right-hand values)
- On load, hydrate from localStorage if present; otherwise seed from mocks.

---

### Accessibility & Responsiveness

- WCAG AA: labels for inputs, aria-describedby for errors, keyboardable stepper/accordion.
- Dropzone: role and instructions for screen readers; focus ring visible.
- Mobile-first: accordion collapses sections; sticky footer converts to top/bottom nav as needed.

---

### Quality & Performance

- Skeletons for list and preview sections.
- Defer heavy UI (e.g., image previews) until section open.
- Keep bundle lean: no PDF viewer in MVP; use placeholders.

---

---

### Definition of Done (Acceptance Criteria)

Dashboard

- Landing on `/dashboard` shows existing applications from localStorage or an empty state when none exist.
- Clicking “New Application” creates a draft application and navigates to `/app`.
- Applications list supports View/Resume, Duplicate, and Delete (UI updates and localStorage reflect changes).

Trip Setup

- Required fields validated; Next remains disabled until valid.
- After submit, a mocked visa type label is displayed.
- Selections are saved to localStorage and restored on refresh.

Checklist

- Items render with category badges and due dates relative to departure.
- Can toggle complete/undo; progress updates; filter/sort function.
- Details drawer shows extended info.

Upload & Fill

- Drag-and-drop and file picker both work; wrong type/oversize show inline error.
- Uploaded rows appear with remove actions.
- Extraction preview shows mocked fields; PII toggle masks values in-place.
- Mapping table renders, allows editing right-hand values.
- “Copy Mapping JSON” copies the current mapping to clipboard.
- “Simulate Fill” shows a toast and briefly highlights mapped rows.

Launch Agent

- CTA disabled until readiness checks pass; tooltip lists unmet requirements.
- Clicking CTA opens a modal and shows a mocked progress sequence ending in success.
- Agent Runner placeholder box is rendered with the specified dimensions and label; remains non-interactive.

---

### Implementation Notes (shadcn/ui)

- Use shadcn components: `Button`, `Input`, `Select`, `Checkbox`, `Switch`, `Dialog`, `Drawer`, `Table`, `Badge`, `Alert`, `Toast`, `Tooltip`, `Separator`, `Accordion`, `Popover`, `Calendar` (date range via `react-day-picker`).
- Date Range Picker: `Popover` + `Calendar` with `mode="range"`.
- Dropzone: custom component (native drag events) styled to match shadcn tokens.
- Toasts: global provider at page root.
- Keep types explicit for component props to maintain clarity.

---

### Open Items (can default if not specified)

- Right-rail summary: optional; default off for MVP.
- Exact checklist counts per visa type: default 8–12 with 3–5 Required.
- Specific copy tone: neutral and concise; English only for MVP.

---

### Future (post-MVP hooks only)

- Replace mocks with real services (policy parsing, OCR, classifier, browser agent).
- PDF canvas split-view for mapping visualization.
