# Multi-Platform Video & Image Downloader

## Overview

This is a web-based multi-platform media downloader application that allows users to download content from various platforms including YouTube, TikTok, Instagram, Twitter, Facebook, Vimeo, Reddit, Twitch, Dailymotion, SoundCloud, Pinterest, Bilibili, Niconico, Bandcamp, Mixcloud, and 1000+ more sites supported by yt-dlp. The application provides format conversion capabilities, supporting multiple video formats (MP4, WebM, MKV), audio formats (MP3, M4A, WAV, OGG), and image formats (JPG, PNG, WebP) with configurable quality settings.

The application uses yt-dlp as the core download engine for video/audio, gallery-dl for Pinterest images, aria2c for fast parallel downloads (16 connections), and ffmpeg for format conversion. The modern, responsive user interface is built with React and shadcn/ui components.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### 2024-11-28: High-Performance Download System
- Added aria2c integration for parallel downloads (16 connections, 16 segments)
- Added yt-dlp concurrent fragments (8 fragments) for HLS streams
- Added Pinterest image download support via gallery-dl
- Added 6 new platforms: Pinterest, Bilibili, Niconico, Bandcamp, Mixcloud, Other
- Added image format support (JPG, PNG, WebP) with quality options
- Fixed Instagram downloading with better error handling and retry logic
- Updated frontend to show all new platforms with proper icons
- Changed detectPlatform to return "other" for unknown platforms (supports all yt-dlp sites)

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript using Vite as the build tool and development server.

**UI Component Library**: shadcn/ui (Radix UI primitives) with Tailwind CSS for styling. The design system follows Material Design principles with a focus on clear information hierarchy and visual feedback for download states.

**State Management**: React Query (@tanstack/react-query) for server state management and API data fetching. Local component state is managed with React hooks.

**Routing**: Wouter for lightweight client-side routing.

**Form Handling**: React Hook Form with Zod for validation using @hookform/resolvers.

**Design System**: Custom design tokens defined in CSS variables supporting light/dark themes. Typography uses Inter font via Google Fonts. Component spacing follows Tailwind's spacing scale (2, 4, 6, 8, 12, 16, 24 units).

**Key UI Components**:
- URL input with platform auto-detection
- Format selector for video/audio/image output types
- Quality selector with dynamic options based on output type
- Download progress tracking with real-time status updates (speed and ETA)
- Download history with re-download capability
- Platform support grid showcasing 16 supported platforms
- Batch download queue for multiple URLs

### Backend Architecture

**Runtime**: Node.js with Express.js framework.

**Language**: TypeScript with ES modules.

**API Design**: RESTful API with the following key endpoints:
- POST `/api/video/info` - Fetch media metadata
- POST `/api/download` - Initiate download process
- GET `/api/downloads/history` - Retrieve download history
- GET `/api/queue` - Get batch download queue
- POST `/api/queue/add` - Add URLs to batch queue
- POST `/api/queue/start` - Start processing queue

**Download Engine**: 
- yt-dlp for video/audio extraction with concurrent fragments
- aria2c for high-speed parallel segment downloads (16 connections)
- gallery-dl for Pinterest image extraction
- ffmpeg for format conversion and muxing

**Download Optimization**:
- aria2c uses 16 parallel connections with 1MB minimum split size
- yt-dlp uses 8 concurrent fragments for HLS/DASH streams
- Automatic fallback from aria2c to yt-dlp when needed
- 10 retry attempts with exponential backoff

**Request Validation**: Zod schemas for runtime type checking and validation of API requests.

**Error Handling**: Centralized error handling with detailed error messages propagated to the client.

**Build Process**: Custom build script using esbuild for server bundling and Vite for client bundling.

### Data Storage

**Current Implementation**: In-memory storage using a custom `MemStorage` class implementing the `IStorage` interface.

**Data Models**:
- `DownloadStatus` - Tracks active download state with progress, status, speed, ETA, and file information
- `DownloadHistoryItem` - Historical record of completed downloads
- `VideoInfo` - Metadata about media including title, thumbnail, duration, platform, media type, and available formats
- `QueueItem` - Batch download queue item with status tracking

**Storage Interface**: Abstracted storage layer allows future migration to persistent database (prepared for PostgreSQL with Drizzle ORM).

**Schema Definition**: Shared schema definitions in `shared/schema.ts` used across frontend and backend for type safety.

### External Dependencies

**System Tools (Nix Packages)**:
- yt-dlp: Video/audio download tool (1000+ site support)
- aria2c: High-speed parallel download tool
- ffmpeg: Media conversion and processing
- gallery-dl: Image gallery download tool (Pinterest support)

**Database Preparation**: 
- Drizzle ORM configured for PostgreSQL (@neondatabase/serverless)
- Schema defined in `shared/schema.ts` with migrations output to `./migrations`
- Environment variable `DATABASE_URL` expected for database connection
- Note: Database is configured but not currently active; application uses in-memory storage

**File System**: Downloads directory (`downloads/`) created at runtime for temporary file storage. Files are automatically cleaned up after 24 hours.

**Third-party Services**:
- Google Fonts for Inter typography
- Platform-specific download sources accessed via yt-dlp/gallery-dl

**NPM Dependencies**:
- UI: @radix-ui components, tailwindcss, class-variance-authority
- State: @tanstack/react-query
- Validation: zod, zod-validation-error, drizzle-zod
- Icons: lucide-react, react-icons
- Date handling: date-fns
- Utilities: clsx/twMerge (class merging)

**Development Tools**:
- TypeScript compiler
- Vite with HMR support
- Replit-specific plugins for development (cartographer, dev-banner, runtime-error-modal)
- PostCSS with Autoprefixer

**Platform Detection**: Client-side URL pattern matching to identify source platform before submission. Unknown platforms fall back to "other" which still works via yt-dlp's extensive site support.

**Session Management**: Prepared with connect-pg-simple for PostgreSQL session storage (configured but not active).

## Supported Platforms

Primary platforms with dedicated icons:
- YouTube, TikTok, Instagram, Twitter/X, Facebook
- Vimeo, Reddit, Twitch, Dailymotion, SoundCloud
- Pinterest (images), Bilibili, Niconico, Bandcamp, Mixcloud

All other platforms are supported via yt-dlp's 1000+ site extractors under the "Other" category.
