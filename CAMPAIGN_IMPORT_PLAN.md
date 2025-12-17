# Campaign Import & New System Design Plan

## Current State Analysis

### Campaign Inventory (300 total campaigns)
| Category | Count | Description |
|----------|-------|-------------|
| Social Shareables | 98 | Static images (81) and Videos (17) for social media |
| Email Campaigns | 87 | Email templates with subject lines and body content |
| Text Scripts | 64 | Phone/text message scripts for outreach |
| Direct Mail Templates | 51 | Postcards and letters with Canva/Editor links |

### Current Problem
All campaigns share the **same database schema** with 52 columns, even though each category uses completely different fields:

- **Text Scripts** primarily use: `Name`, `Introduction`, `Target Audience`, `Example Images`
- **Email Campaigns** use: `Subject`, `Email Content`, `Tags`, `Target Audience`
- **Social Shareables** use: `Canva link`, `Video Flow PDF`, `Audio transcription`, `Video Hashtags`, `Is Video`
- **Direct Mail** use: `Canva link`, `Editor URL`, `Intro - Channel`, `Target Audience`

---

## New System Design

### 1. Separate Tables Per Category

#### `phone_text_scripts`
```sql
CREATE TABLE phone_text_scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Core Fields
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  introduction TEXT,                    -- Rich text intro/description
  thumbnail_url TEXT,

  -- Script Content
  script_type TEXT CHECK (script_type IN ('call', 'text', 'both')),
  target_audience TEXT,                 -- e.g., "Leads", "SOI", "Expired"

  -- Text Message Content (for text scripts)
  text_message_1 TEXT,                  -- First message
  text_message_2 TEXT,                  -- Follow-up message (optional)

  -- Call Script Content
  call_script_pdf_url TEXT,             -- Link to downloadable PDF
  call_script_content TEXT,             -- Rich text version

  -- Examples
  example_image_url TEXT,               -- Preview/example image
  full_script_image_url TEXT,           -- Full script visualization

  -- Execution
  execution_steps JSONB,                -- Structured steps

  -- Metadata
  region TEXT DEFAULT 'US',
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,

  -- Scheduling
  week_start_date DATE,
  day_of_week INTEGER,                  -- 0=Monday, 4=Friday

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### `email_campaigns`
```sql
CREATE TABLE email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Core Fields
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  introduction TEXT,                    -- Rich text intro/why this works
  thumbnail_url TEXT,

  -- Email Content
  subject_line TEXT NOT NULL,           -- Email subject
  email_body TEXT NOT NULL,             -- Rich HTML email content
  preview_text TEXT,                    -- Email preview/preheader

  -- Targeting
  target_audience TEXT,                 -- e.g., "Entire Database", "Past Clients"
  tags TEXT[],                          -- e.g., ["past-clients", "soi", "direct-response"]
  recommended_audience TEXT,            -- More specific targeting advice

  -- Examples
  example_image_url TEXT,               -- Preview of email
  full_email_image_url TEXT,            -- Full email visualization

  -- Execution
  execution_steps JSONB,                -- How to use in CRM

  -- Metadata
  region TEXT DEFAULT 'US',
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,

  -- Scheduling
  week_start_date DATE,
  day_of_week INTEGER,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### `direct_mail_templates`
```sql
CREATE TABLE direct_mail_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Core Fields
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  introduction TEXT,
  thumbnail_url TEXT,

  -- Template Content
  mail_type TEXT CHECK (mail_type IN ('postcard', 'letter', 'flyer')),
  canva_template_url TEXT,              -- Canva design link
  editor_url TEXT,                      -- In-app editor URL (if available)

  -- Targeting
  target_audience TEXT,                 -- e.g., "Farm", "Expired", "FSBO"
  channel TEXT DEFAULT 'Direct Mail',

  -- Examples
  example_image_url TEXT,
  example_images TEXT[],                -- Multiple examples if available

  -- Execution
  execution_steps JSONB,

  -- Metadata
  region TEXT DEFAULT 'US',
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,

  -- Scheduling
  week_start_date DATE,
  day_of_week INTEGER,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### `social_shareables`
```sql
CREATE TABLE social_shareables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Core Fields
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  introduction TEXT,
  thumbnail_url TEXT,

  -- Content Type
  is_video BOOLEAN DEFAULT false,
  content_type TEXT CHECK (content_type IN ('static_image', 'reel', 'carousel', 'video')),

  -- Design Resources
  canva_template_url TEXT,              -- Canva design link

  -- Video-Specific Fields (only when is_video = true)
  video_flow_pdf_title TEXT,
  video_flow_pdf_url TEXT,              -- Shot-by-shot guide
  audio_transcription_url TEXT,         -- Audio file for voiceover
  video_script TEXT,                    -- Written script

  -- Social Media Content
  video_title TEXT,                     -- For YouTube/TikTok
  video_description TEXT,               -- Caption/description
  hashtags TEXT[],                      -- Array of hashtags

  -- Examples
  example_image_url TEXT,
  example_images TEXT[],                -- Multiple examples

  -- Execution
  execution_steps JSONB,

  -- Metadata
  region TEXT DEFAULT 'US',
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,

  -- Scheduling
  week_start_date DATE,
  day_of_week INTEGER,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Import Strategy

### Phase 1: Data Preparation

1. **Parse CSV** using Python with proper CSV handling (HTML content with commas)
2. **Categorize** each row based on `Category` field
3. **Extract** relevant fields per category
4. **Clean HTML** - strip unnecessary formatting, fix broken tags
5. **Validate URLs** - ensure all image/resource URLs are accessible

### Phase 2: Field Mapping

#### Text Scripts Mapping
| Old Field | New Field |
|-----------|-----------|
| `Name` | `name` |
| `Slug` | `slug` |
| `Introduction` | `introduction` |
| `Thumbnail` | `thumbnail_url` |
| `Target Audience` | `target_audience` |
| `Step-1: Input 1` | `text_message_1` |
| `Step-1: Input 2` | `text_message_2` |
| `Example Images` | `full_script_image_url` |
| `Example 1` | `example_image_url` |
| `Filter by country` | `region` |
| `Featured (Best campaigns to start)` | `is_featured` |
| `Date` | `week_start_date` |

#### Email Campaigns Mapping
| Old Field | New Field |
|-----------|-----------|
| `Name` | `name` |
| `Slug` | `slug` |
| `Introduction` | `introduction` |
| `Thumbnail` | `thumbnail_url` |
| `Step-1: Input 1` (Subject) | `subject_line` |
| `Step-1: Input 2` (Email Content) | `email_body` |
| `Target Audience` | `target_audience` |
| `Tags` | `tags` (split by `;`) |
| `Recommended audience` | `recommended_audience` |
| `Example Images` | `full_email_image_url` |
| `Example 1` | `example_image_url` |
| `Filter by country` | `region` |
| `Date` | `week_start_date` |

#### Direct Mail Mapping
| Old Field | New Field |
|-----------|-----------|
| `Name` | `name` |
| `Slug` | `slug` |
| `Introduction` | `introduction` |
| `Thumbnail` | `thumbnail_url` |
| `Step-1: Canva link` | `canva_template_url` |
| `Editor URL` | `editor_url` |
| `Target Audience` | `target_audience` |
| `Intro - Channel` | `channel` |
| `Example Images` | Array of examples |
| `Filter by country` | `region` |
| `Date` | `week_start_date` |

#### Social Shareables Mapping
| Old Field | New Field |
|-----------|-----------|
| `Name` | `name` |
| `Slug` | `slug` |
| `Introduction` | `introduction` |
| `Thumbnail` | `thumbnail_url` |
| `Is Social Shareable Video` | `is_video` |
| `Step-1: Canva link` | `canva_template_url` |
| `Video Flow PDF title` | `video_flow_pdf_title` |
| `Video Flow PDF link` | `video_flow_pdf_url` |
| `Audio transcription` | `audio_transcription_url` |
| `Video description` | `video_description` |
| `Video Hashtags` | `hashtags` (split to array) |
| `Example Images` | `example_images` |
| `Filter by country` | `region` |
| `Date` | `week_start_date` |

### Phase 3: Import Execution

```
1. Create new tables with migrations
2. Run import script for each category
3. Validate imported data counts match
4. Test API endpoints for each category
5. Update UI components for category-specific views
```

---

## New Admin/Creation Interfaces

### Phone & Text Scripts Editor
- Script type selector (Call / Text / Both)
- Target audience dropdown
- Text message composer (with character count)
- Call script rich text editor
- PDF upload for call scripts
- Example image upload

### Email Campaigns Editor
- Subject line input with preview
- Rich HTML email body editor
- Preview text (preheader) input
- Target audience multi-select
- Tags input (comma-separated)
- Email preview component

### Direct Mail Templates Editor
- Mail type selector (Postcard / Letter / Flyer)
- Canva template URL input
- In-app editor URL (optional)
- Target audience selector
- Multiple example image uploads
- Print specs/guidelines

### Social Shareables Editor
- Content type selector (Static / Reel / Carousel / Video)
- Canva template URL
- **If Video:**
  - Video flow PDF upload
  - Audio transcription upload
  - Script text editor
  - Video title & description
  - Hashtags input
- Example image/video uploads

---

## API Structure

```
/api/campaigns/
├── phone-text-scripts/
│   ├── GET /                    # List all
│   ├── GET /:id                 # Get single
│   ├── POST /                   # Create (admin)
│   ├── PUT /:id                 # Update (admin)
│   └── DELETE /:id              # Delete (admin)
├── email-campaigns/
│   ├── GET /
│   ├── GET /:id
│   ├── POST /
│   ├── PUT /:id
│   └── DELETE /:id
├── direct-mail/
│   ├── GET /
│   ├── GET /:id
│   ├── POST /
│   ├── PUT /:id
│   └── DELETE /:id
├── social-shareables/
│   ├── GET /
│   ├── GET /:id
│   ├── POST /
│   ├── PUT /:id
│   └── DELETE /:id
└── weekly/                      # Combined weekly view
    └── GET /?region=US&weeks=4  # Aggregates all categories
```

---

## Implementation Order

### Step 1: Database Migration
- [ ] Create `phone_text_scripts` table
- [ ] Create `email_campaigns` table
- [ ] Create `direct_mail_templates` table
- [ ] Create `social_shareables` table
- [ ] Create `user_favorites` table with category-aware foreign keys
- [ ] Set up RLS policies

### Step 2: Import Script
- [ ] Write Python/Node import script
- [ ] Parse CSV with proper handling
- [ ] Transform data per category
- [ ] Insert into new tables
- [ ] Generate import report

### Step 3: API Routes
- [ ] Phone & Text Scripts CRUD
- [ ] Email Campaigns CRUD
- [ ] Direct Mail CRUD
- [ ] Social Shareables CRUD
- [ ] Weekly aggregation endpoint

### Step 4: UI Components
- [ ] Category-specific card designs
- [ ] Category-specific preview modals
- [ ] Admin creation forms per category

### Step 5: Testing & Cleanup
- [ ] Verify all data imported correctly
- [ ] Test favorites across categories
- [ ] Remove old unified table
- [ ] Update TypeScript types

---

## Notes

- **Region Handling**: `Filter by country` values are "US", "Canada", "United Kingdom", "Australia", or "Both"
- **HTML Content**: Introduction and email body contain HTML that needs preserving
- **URLs**: Some URLs are ImageKit (`ik.imagekit.io`), some are Webflow CDN, some are Dropbox
- **Dates**: Original dates are stored as full datetime strings, convert to DATE for `week_start_date`
