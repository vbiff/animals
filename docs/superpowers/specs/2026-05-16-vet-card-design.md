# Vet Card — Design Spec
**Date:** 2026-05-16  
**Project:** Animals (Portugal)  
**Status:** Approved

---

## Overview

A web application for pet owners in Portugal to maintain a digital veterinary card for their animals. Both owners and veterinarians can view and update the card. Vets access it via a time-limited QR code — no registration required.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite + TypeScript |
| Backend / DB | Supabase (PostgreSQL + Auth + Storage + Edge Functions) |
| Auth | Google OAuth via Supabase |
| i18n | i18next — Portuguese, English, Russian |
| QR generation | qrcode.react |

---

## Data Model

### `users`
| Field | Type | Notes |
|---|---|---|
| id | uuid | Supabase Auth user id |
| email | text | |
| name | text | |
| avatar_url | text | |
| created_at | timestamptz | |

### `pets`
| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| name | text | |
| species | text | e.g. dog, cat, rabbit |
| breed | text | |
| birth_date | date | |
| photo_url | text | Signed URL from Storage |
| created_at | timestamptz | |

### `pet_owners`
| Field | Type | Notes |
|---|---|---|
| pet_id | uuid | FK → pets |
| user_id | uuid | FK → users |
| invited_by | uuid | FK → users, nullable |
| created_at | timestamptz | |

Many-to-many. All co-owners have full access: add records, invite others, generate vet sessions.

### `vaccines`
| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| pet_id | uuid | FK → pets |
| name | text | |
| date | date | |
| next_date | date | nullable |
| document_url | text | nullable, signed URL |
| added_by | jsonb | `{ type: "owner"\|"vet", name, user_id?, vet_license? }` |
| created_at | timestamptz | |

### `symptoms`
| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| pet_id | uuid | FK → pets |
| date | date | |
| title | text | |
| description | text | |
| added_by | jsonb | |
| created_at | timestamptz | |

### `medications`
| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| pet_id | uuid | FK → pets |
| name | text | |
| dosage | text | |
| frequency | text | |
| start_date | date | |
| end_date | date | nullable |
| added_by | jsonb | |
| created_at | timestamptz | |

### `documents`
| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| pet_id | uuid | FK → pets |
| name | text | |
| file_url | text | signed URL |
| type | text | e.g. analysis, xray, prescription |
| added_by | jsonb | |
| created_at | timestamptz | |

### `vet_sessions`
| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| pet_id | uuid | FK → pets |
| token | uuid | URL-safe random token |
| expires_at | timestamptz | 4 hours from creation |
| created_by | uuid | FK → users (owner who generated) |
| vet_name | text | filled when vet first opens the link |
| vet_license | text | NMV number (Portugal), filled on first open |

---

## Architecture

### Frontend structure
```
src/
  pages/
    AuthPage          — Google OAuth login
    DashboardPage     — owner's pet list
    PetPage           — full pet card (owner/co-owner view)
    VetPage           — pet card via QR token (vet view)
    InvitePage        — accept co-owner invitation
  components/
    pet/              — card sections, pet profile
    vet/              — vet entry form, visit record form
    shared/           — UI kit components
  services/
    supabase.ts       — Supabase client
    pets.ts           — pet CRUD
    vetSessions.ts    — token generation and validation
  i18n/
    pt.json
    en.json
    ru.json
  types/
    index.ts
```

### Vet access via Edge Functions

Vets are unauthenticated — Supabase RLS cannot grant them access directly. All vet-facing reads and writes go through **Supabase Edge Functions** that:
1. Accept the vet session token
2. Validate it (exists + `expires_at > now()`)
3. Perform reads/writes using the service role key
4. Return data to the vet frontend

Owner/co-owner access uses the standard Supabase client with RLS enforced via `pet_owners`.

### RLS policies (summary)
- `pets`, `vaccines`, `symptoms`, `medications`, `documents`: select/insert/update for authenticated users present in `pet_owners` for that pet
- `vet_sessions`: insert by authenticated users in `pet_owners`; select by owner only
- Vet reads/writes bypass RLS via Edge Functions (service role)

---

## User Flows

### Owner flow
```
/                   → AuthPage (Google login)
/dashboard          → list of pets + "Add pet" button
/pet/:id            → pet card
                      tabs: Vaccines | Symptoms | Medications | Documents
                      "Open for vet" → generates QR + link (4h token)
                      "Invite co-owner" → generates invite link → owner copies and shares manually (WhatsApp, email, etc.)
/pet/:id/edit       → edit pet profile (name, breed, photo, etc.)
/invite/:token      → accept co-owner invitation (requires Google login)
```

### Vet flow
```
/vet/:token
  → invalid/expired token  → error message + instruction to ask owner for new QR
  → first open             → form: vet name + NMV license number
  → valid session          → read-only card view
                             "Add visit record" → form:
                               type: vaccine | symptom | medication | document
                               fields depend on type
                             all records show vet name + license
```

---

## File Storage

```
Supabase Storage bucket: pet-files (private)

/{pet_id}/photo.{ext}              — pet profile photo
/{pet_id}/documents/{record_id}    — PDFs, lab results, prescriptions
/{pet_id}/vaccines/{record_id}     — vaccine certificate scans
```

- Owners access files via Supabase Storage RLS (authenticated)
- Vets receive signed URLs from Edge Function (time-limited, per-session)

---

## Internationalisation

- Languages: Portuguese (pt), English (en), Russian (ru)
- Auto-detected from `navigator.language` on first load
- User can switch manually; preference stored in `localStorage`
- All three language bundles loaded lazily

---

## Error Handling

| Scenario | Behaviour |
|---|---|
| Expired vet token | Clear message in browser language + instruction to request new QR |
| File upload failure | Inline error with retry option, form state preserved |
| Network loss | Toast notification; no data loss (form stays) |
| Invalid invite link | Explanation + link to homepage |
| Unauthorized pet access | Redirect to dashboard |

---

## Critical Tests

- Vet session: expired token → write rejected
- Vet session: vet name + NMV required before any write
- Co-owner: can add records and generate vet QR
- Co-owner: cannot see pets they are not invited to
- RLS: user cannot read/write another user's pets
- File access: vet cannot access files after session expires
