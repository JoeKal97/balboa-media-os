# Balboa Media OS - Module 1: Issue Operations

A command center for managing newsletter publication deadlines and preventing missed sends.

## Features

- **Publication Dashboard**: Select publication and view next scheduled issue
- **Countdown Timer**: Giant countdown showing days/hours/minutes/seconds until send
- **Risk Score**: Real-time risk assessment based on missing articles, incomplete checklist, and time remaining
- **Article Slots Management**: Track article status (missing/draft/published) with title and URL
- **Completion Checklist**: Manual checkboxes for articles complete, SEO verified, internal links verified, and formatting
- **Issue Status Gating**: 
  - "Mark Ready" button only enabled when all checklist items are true and no missing slots
  - "Mark Sent" button only enabled when status is "ready"
- **Weekly Planning View**: Overview of all publications with risk badges and completion status
- **Issue History**: Last 8 issues for the publication with status and risk tracking

## Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: Supabase PostgreSQL (Free Plan)
- **Styling**: Tailwind CSS
- **Timezone**: America/Denver (hardcoded for send times)

## Setup

### Prerequisites

- Node.js 18+
- Supabase project (Free plan works)
- Vercel account (optional, for deployment)

### 1. Clone & Install

```bash
git clone https://github.com/JoeKal97/balboa-media-os.git
cd balboa-media-os
npm install
```

### 2. Database Setup

First, verify your Supabase schema and run migrations if needed:

**SQL Migration** (run in Supabase SQL Editor):

```sql
-- Create enums
CREATE TYPE issue_status AS ENUM ('draft', 'in_progress', 'ready', 'sent');
CREATE TYPE slot_status AS ENUM ('missing', 'draft', 'published');

-- Create publications table
CREATE TABLE publications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  send_day_of_week INT NOT NULL, -- 0-6 (Sunday-Saturday)
  send_time_local TIME NOT NULL, -- HH:MM
  articles_required_per_issue INT NOT NULL DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create issues table
CREATE TABLE issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  publication_id UUID NOT NULL REFERENCES publications(id) ON DELETE CASCADE,
  issue_date DATE NOT NULL,
  send_datetime_local TIMESTAMPTZ NOT NULL,
  status issue_status DEFAULT 'draft',
  risk_score INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(publication_id, issue_date)
);

-- Create issue_article_slots table
CREATE TABLE issue_article_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  slot_index INT NOT NULL,
  article_title TEXT,
  article_url TEXT,
  status slot_status DEFAULT 'missing',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create issue_checklists table
CREATE TABLE issue_checklists (
  issue_id UUID PRIMARY KEY REFERENCES issues(id) ON DELETE CASCADE,
  articles_complete BOOLEAN DEFAULT false,
  seo_verified BOOLEAN DEFAULT false,
  internal_links_verified BOOLEAN DEFAULT false,
  formatted BOOLEAN DEFAULT false,
  sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_issues_publication_id ON issues(publication_id);
CREATE INDEX idx_issues_send_datetime ON issues(send_datetime_local);
CREATE INDEX idx_article_slots_issue_id ON issue_article_slots(issue_id);
```

### 3. Seed Initial Data

```sql
-- Seed publications
INSERT INTO publications (name, send_day_of_week, send_time_local, articles_required_per_issue) VALUES
('Zootown Lowdown', 3, '16:00', 3),
('Missoula Eats & Treats', 5, '10:00', 2),
('SaveOurDoggy', 2, '10:00', 1),
('Missoula Business Hub', 4, '10:00', 1);
```

### 4. Environment Variables

Create `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 5. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deploy to Vercel

### Option 1: GitHub + Vercel (Recommended)

1. Push to GitHub
2. Import to Vercel: https://vercel.com/new
3. Add environment variables in Vercel dashboard
4. Deploy

### Option 2: Manual Deploy

```bash
npm install -g vercel
vercel
```

Follow prompts, add env vars when asked.

## File Structure

```
balboa-media-os/
├── app/
│   ├── layout.tsx           # Root layout with header/nav/footer
│   ├── globals.css          # Tailwind CSS
│   ├── page.tsx             # Home (Command Center)
│   ├── planning/
│   │   └── page.tsx         # Weekly Planning view
│   └── components/
│       ├── CommandCenter.tsx    # Main UI with state
│       ├── IssueCard.tsx        # Next issue display + slots + checklist
│       ├── CountdownTimer.tsx   # Live countdown
│       ├── RiskBadge.tsx        # Risk indicator
│       ├── IssueHistory.tsx     # Last 8 issues table
│       └── PlanningView.tsx     # Weekly overview
├── lib/
│   ├── supabaseClient.ts    # Supabase JS client init
│   ├── schema.ts            # TypeScript types
│   └── actions.ts           # Server actions (CRUD + risk logic)
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
├── next.config.js
├── .env.example
└── README.md
```

## API & Server Actions

All data mutations use Next.js Server Actions in `lib/actions.ts`:

- `listPublications()` - Get all active publications
- `getOrCreateNextIssue(publicationId)` - Get/create next issue
- `updateSlot(slotId, fields)` - Update article slot
- `updateChecklist(issueId, fields)` - Update completion checklist
- `setIssueStatus(issueId, status)` - Set issue status (draft/ready/sent)
- `recomputeRisk(issueId)` - Recalculate risk score
- `getIssueWithDetails(issueId)` - Fetch full issue with slots/checklist
- `getIssueHistory(publicationId, limit)` - Get past issues

## Risk Score Logic

Risk is recomputed on every change:

```
risk = 0
+2 for each missing slot
+1 for each draft slot
+2 if <24h until send AND (missing slots OR checklist false)
+1 if <48h until send AND formatted=false

Mapping:
0-1   → GREEN
2-3   → YELLOW
4+    → RED
```

## UI/UX Features

### Command Center (/)

1. **Publication Selector** - Dropdown to switch between publications
2. **Next Issue Card** - Shows:
   - Issue date
   - GIANT countdown (days/hours/mins/secs)
   - Status badge (DRAFT/IN_PROGRESS/READY/SENT)
   - Risk badge (GREEN/YELLOW/RED)
3. **Articles Panel** - N slots with:
   - Status dropdown (missing/draft/published)
   - Article title input
   - Article URL input
4. **Checklist Panel** - Manual checkboxes:
   - Articles complete
   - SEO verified
   - Internal links verified
   - Formatted
5. **Action Buttons**:
   - "Mark Ready" (disabled unless all checks true AND no missing slots)
   - "Mark Sent" (only enabled if status=ready)
6. **Issue History** - Table of last 8 issues

### Weekly Planning (/planning)

Table showing all publications with:
- Publication name
- Next send datetime
- Countdown
- Missing slots count
- Status badge
- Risk badge

## Manual Testing Checklist

- [ ] Load home page and verify publication selector works
- [ ] Select different publication and verify issue changes
- [ ] Verify countdown updates every second
- [ ] Add article title and URL to a slot
- [ ] Change slot status and verify risk updates
- [ ] Toggle checklist items and verify risk updates
- [ ] Verify "Mark Ready" button disabled unless all checks true
- [ ] Mark issue ready and verify status changes
- [ ] Verify "Mark Sent" button only works when status=ready
- [ ] Mark sent and verify status changes
- [ ] Verify issue moves to history
- [ ] Switch to /planning view and verify all publications shown
- [ ] Verify risk badges display correctly in planning view

## Notes

- Timezone is hardcoded to America/Denver for all computations
- This is MVP only - no notifications/alerts, no external API integrations
- All data is in Supabase; localStorage not used for task data
- No authentication required (assumes internal tool)

## Future Enhancements (Phase 2+)

- Browser/email notifications 24h before send
- Global Control Center (GCC) integration for Facebook ad spend
- Article compliance dashboard with auto-checks
- Email API integration for subscriber counts
- Kanban integration for task tracking
- Sponsor opportunity dashboard
- Content calendar with SEO tracking

## License

MIT
