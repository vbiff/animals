# Pet Features Design — 2026-05-25

## Overview

Seven new features for the Animals pet health tracker app. All changes are scoped to the per-pet page (`PetPage`) and its child components. Implementation is a single delivery wave: database migrations first, then UI.

---

## 1. Database Migrations

### `symptoms` table
- Add `end_date date nullable` — end date of the symptom episode

### `medications` table
- Add `symptom_id uuid nullable references symptoms(id) on delete set null` — links a medication to the symptom it treated
- Add `photo_url text nullable` — photo of the medication packaging

### New table `treat_notes`
```sql
create table treat_notes (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references pets(id) on delete cascade,
  name text not null,
  photo_url text,
  liked boolean not null,
  where_bought text,
  date date not null,
  added_by jsonb not null,
  created_at timestamptz not null default now()
);
```

### Sorting change
- `symptoms` query: change `order('created_at', { ascending: false })` → `order('date', { ascending: false })`

---

## 2. Symptoms ↔ Medications Link

**UX:**
- In the medication add/edit form: optional dropdown "Симптом" listing all current pet's symptoms by name + date
- In the symptom card: a sub-list "Лекарства при этом симптоме" showing linked medications (name + dosage)
- In the medication card: meta text "Лечит: [symptom title]" when a symptom is linked

**Data flow:**
- `medications.symptom_id` stores the reference
- When loading records, medications are grouped by `symptom_id` client-side (no extra DB query needed — all medications already loaded)
- Deleting a symptom sets `symptom_id` to null on linked medications (via `on delete set null`)

---

## 3. Edit Symptoms and Medications

**UX:**
- "Изменить" button added next to "Удалить" in each symptom and medication card
- Clicking opens the existing add-form pre-filled with current values
- Submit button reads "Сохранить изменения" instead of "Добавить"

**Implementation:**
- Add `updateSymptom(id, input)` and `updateMedication(id, input)` to `records.ts` using `supabase.from(...).update(...).eq('id', id)`
- Component state: `editingId: string | null` — when set, form shows in edit mode

---

## 4. Medication Photo

**UX:**
- Optional file input in medication add/edit form labeled "Фото упаковки (необязательно)"
- Accepts image files only
- In the medication card: small thumbnail (48×48px) to the left of the medication name when photo exists

**Implementation:**
- Uses existing `uploadFile(petId, 'medications', file)` from `files.ts`
- URL stored in `medications.photo_url`

---

## 5. Symptom End Date and Chronological Order

**UX:**
- Add optional date field "Дата выздоровления (необязательно)" in symptom add/edit form
- Card display: "12 мая — 18 мая" if end date set, or "с 12 мая" if ongoing
- List sorted by `date` descending (most recent first)

**Type change:**
```ts
interface Symptom {
  // existing: date: string  (start date)
  end_date: string | null   // new
  // ...
}
```

---

## 6. Symptoms Calendar

**UX:**
- New tab "Календарь" added to `PetPage` tab list
- Displays current month as a 7-column CSS grid
- Days with at least one symptom starting on that date are highlighted (accent color dot or background tint)
- Clicking a highlighted day shows a popover/inline panel listing symptom titles and descriptions for that day
- Month navigation: "←" / "→" buttons

**Implementation:**
- No new data fetching — uses already-loaded `records.symptoms`
- Calendar built with plain JS Date arithmetic, no external library
- Component: `CalendarTab.tsx`

---

## 7. Treat Notes Tab

**UX:**
- New tab "Заметки" added to `PetPage` tab list
- Add form fields: название (required), фото (optional), 👍/👎 toggle (required), где купила (optional), дата (required)
- Cards display: photo thumbnail left, name + liked indicator (👍 or 👎) + where_bought + date right
- Edit and delete per same pattern as symptoms/medications

**Implementation:**
- New service file `src/services/treatNotes.ts` with `getTreatNotes`, `addTreatNote`, `updateTreatNote`, `deleteTreatNote`
- New component `src/components/pet/TreatNotesTab.tsx`
- Photo upload via `uploadFile(petId, 'treats', file)`
- New type `TreatNote` added to `src/types/index.ts`

---

## Architecture Notes

- All new DB calls follow the existing pattern: service function → supabase call → typed return
- No new npm dependencies
- i18n: all new strings added to `ru.json`, `en.json`, `pt.json`
- `useRecords` hook extended to also fetch `treat_notes`
- Tab list in `PetPage` extended: `'vaccines' | 'symptoms' | 'medications' | 'documents' | 'calendar' | 'notes'`

---

## Out of Scope

- Push notifications for medication reminders
- Symptom severity rating
- Sharing treat notes with other owners
