# Listing Leads

A comprehensive marketing platform for real estate professionals, featuring campaign management, content customization, and AI-powered template generation.

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
- **Authentication**: Supabase Auth + [Memberstack](https://memberstack.io/)
- **Image Storage**: [ImageKit](https://imagekit.io/)
- **AI**: Anthropic Claude API for template customization
- **PDF Generation**: Puppeteer + jsPDF
- **UI Components**: Radix UI primitives with custom styling

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm or yarn
- Supabase project
- ImageKit account
- Memberstack account (for subscription management)
- Anthropic API key (for AI features)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd listing-leads
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file with the required environment variables:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# ImageKit
IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
IMAGEKIT_URL_ENDPOINT=your_imagekit_url_endpoint

# Memberstack
NEXT_PUBLIC_MEMBERSTACK_PUBLIC_KEY=your_memberstack_public_key

# Anthropic (for AI features)
ANTHROPIC_API_KEY=your_anthropic_api_key
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint errors automatically |
| `npm run type-check` | Run TypeScript type checking |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check code formatting |

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (dashboard)/        # Authenticated user routes
│   │   ├── billing/        # Subscription management
│   │   ├── campaigns/      # Campaign categories & details
│   │   ├── favorites/      # User favorites
│   │   ├── kickoffs/       # Campaign kickoff sessions
│   │   ├── plan/           # Weekly marketing plan
│   │   ├── profile/        # User profile settings
│   │   ├── settings/       # App settings
│   │   └── social/         # Social content (ads, reels, videos)
│   ├── admin/              # Admin panel routes
│   │   ├── ads/            # Manage ads
│   │   ├── calendar/       # Content calendar
│   │   ├── campaigns/      # Campaign management
│   │   ├── kickoffs/       # Kickoff management
│   │   ├── short-videos/   # Instagram Reels management
│   │   ├── templates/      # Template management
│   │   └── youtube/        # YouTube video management
│   ├── api/                # API routes
│   ├── auth/               # Authentication pages
│   └── login/              # Login page
├── components/
│   ├── admin/              # Admin-specific components
│   ├── campaigns/          # Campaign-related components
│   ├── customization/      # Template customization components
│   └── ui/                 # Reusable UI primitives
├── lib/                    # Utility libraries
│   ├── supabase/           # Supabase client configuration
│   └── utils.ts            # Shared utilities
├── types/                  # TypeScript type definitions
└── scripts/                # Build and utility scripts
```

## Key Features

### Campaign Management
- Four campaign categories: Phone/Text Scripts, Email Campaigns, Social Shareables, Direct Mail
- Weekly marketing calendar with day-by-day campaign assignments
- Region-based content (US, Canada, Global)

### Template Customization
- AI-powered template personalization using Claude
- Real-time preview with zoom controls
- PDF and screenshot generation
- Custom field inputs (text, select, image upload)

### Content Library
- Best Ads gallery with masonry layout
- Instagram Reels collection with video playback
- YouTube Videos with duration and view tracking
- Favorites system for bookmarking content

### Admin Panel
- Content management for all campaign types
- User management
- System prompts configuration
- Content calendar scheduling

## API Routes Overview

| Route | Description |
|-------|-------------|
| `/api/campaigns` | List all campaigns |
| `/api/campaign/[category]/[slug]` | Get specific campaign |
| `/api/favorites` | User favorites CRUD |
| `/api/profile` | User profile management |
| `/api/search` | Global content search |
| `/api/templates` | Template management |
| `/api/customizations` | AI-powered customization |
| `/api/pdf` | PDF generation |
| `/api/screenshot` | Screenshot capture |
| `/api/ads` | Ads management |
| `/api/short-videos` | Instagram Reels management |
| `/api/youtube` | YouTube videos management |

## Database Schema (High-Level)

The application uses Supabase PostgreSQL with the following main tables:

- `profiles` - User profiles and preferences
- `email_campaigns` - Email campaign content
- `phone_text_scripts` - Phone/text script content
- `social_shareables` - Social media content
- `direct_mail_campaigns` - Direct mail content
- `ads` - Curated ads library
- `short_videos` - Instagram Reels
- `youtube_videos` - YouTube video library
- `campaign_favorites` - User favorites
- `templates` - Customizable templates
- `calendar_weeks` - Weekly content calendar
- `campaign_kickoffs` - Campaign kickoff sessions

## Deployment

The application is designed to deploy on Vercel:

```bash
vercel --prod
```

Ensure all environment variables are configured in your Vercel project settings.

## Code Quality

- ESLint for code linting
- Prettier for code formatting
- TypeScript for type safety
- Next.js Image optimization
- Tailwind CSS for consistent styling

## License

Private - All rights reserved.
