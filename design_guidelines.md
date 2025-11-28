# Design Guidelines: Multi-Platform Video Downloader

## Design Approach: Material Design System
**Rationale**: Utility-focused application requiring clear information hierarchy, strong visual feedback for download states, and established patterns for forms and status indicators. Material Design excels at content-rich, functional applications with clear user flows.

## Core Design Elements

### Typography
- **Primary Font**: Inter (via Google Fonts)
- **Headings**: 
  - H1: 2.5rem (40px), font-weight 700, tracking tight
  - H2: 1.875rem (30px), font-weight 600
  - H3: 1.5rem (24px), font-weight 600
- **Body Text**: 1rem (16px), font-weight 400, line-height 1.6
- **Labels/Captions**: 0.875rem (14px), font-weight 500
- **Platform Tags**: 0.75rem (12px), font-weight 600, uppercase tracking

### Layout System
**Spacing Primitives**: Use Tailwind units of 2, 4, 6, 8, 12, 16, 24
- Component padding: p-6 or p-8
- Section spacing: space-y-8 or space-y-12
- Input field margins: mb-6
- Grid gaps: gap-6 or gap-8

**Container Structure**:
- Max-width: max-w-4xl for main content area
- Card containers: max-w-2xl centered
- Full-width for download history section

### Component Library

**Primary Input Section** (Hero Area):
- Large URL input field with rounded-lg border, min-h-14
- Platform auto-detection badge appears inline
- "Download" CTA button (h-14, rounded-lg, full-width on mobile, auto-width on desktop)
- Supporting text below input: "Paste any video URL from YouTube, TikTok, Instagram..."

**Format Selection Panel**:
- Radio button group for output type (Video/Audio)
- Dropdown select for quality (1080p, 720p, 480p, Audio 320kbps, Audio 128kbps)
- Format selector chips (MP4, WebM, MP3, M4A) using rounded-full badges

**Platform Support Grid**:
- 3-column grid (md:grid-cols-3) showcasing supported platforms
- Each cell: platform icon + name + checkmark indicator
- Icons at 48x48px size
- Platforms: YouTube, TikTok, Instagram, Twitter, Facebook, Vimeo

**Download Progress Card**:
- Linear progress bar with percentage (h-2, rounded-full)
- Status text (Fetching... / Converting... / Ready)
- File info display (name, size, format)
- Download action button appears when complete

**Download History Section**:
- Table/list view with recent downloads
- Each row: thumbnail preview (64x64), filename, platform badge, timestamp, re-download button
- Limit to 10 recent items, scrollable container

**Feature Cards** (3-column grid):
- "Multi-Platform Support" - Download from 6+ platforms
- "Audio Extraction" - Convert YouTube to MP3
- "Quality Options" - Choose your preferred resolution
Icons at 32x32, centered above text, gap-4 spacing

### Navigation
- Top bar: Logo/brand name left, simple "How to Use" link right
- Sticky position optional for quick access to new downloads

### Animations
**Minimal Use Only**:
- Progress bar fill animation (linear transition)
- Success checkmark fade-in when download ready
- Subtle fade for status text changes
- No scroll animations or decorative effects

### Accessibility
- All form inputs have visible labels
- Clear focus states on interactive elements (ring-2 ring-offset-2)
- Download status announced via aria-live regions
- Keyboard navigation for all controls
- Minimum touch target size 44x44px

### Images
**No hero image required** - This is a utility application where functionality takes precedence. The main visual elements are:
- Platform logos/icons (use CDN icons from Simple Icons or similar)
- Thumbnail previews in download history (64x64 generated from actual downloads)
- Feature card icons (from Heroicons or Material Icons)

### Key Interaction Patterns
- Auto-detect platform from pasted URL
- Disable quality options not supported by detected platform
- Show/hide audio-only options based on output selection
- Clear validation messages for invalid URLs
- Download button states: Default → Loading → Success/Error

### Responsive Behavior
- Mobile: Single column layout, full-width input, stacked options
- Tablet: 2-column format selection, maintained history table
- Desktop: Centered max-w-4xl container, 3-column feature grid, side-by-side controls