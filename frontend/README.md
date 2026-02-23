# Frontend (React + TypeScript + Vite)

## Tech Stack

- **React 18** with TypeScript
- **Vite** — build & dev server
- **Tailwind CSS** — utility-first styling
- **shadcn/ui** — UI component library
- **React Router** — client-side routing
- **React Query** — server state management
- **Lucide React** — icon library

## Getting Started

```bash
npm install
npm run dev
```

The app runs on `http://localhost:5173` by default.

### Environment

Create a `.env.local` file:

```env
VITE_API_BASE=http://localhost:8080
```

## Pages

### Public
| Route | Page |
|-------|------|
| `/` | Landing page |
| `/about` | About page |
| `/contact` | Contact form |
| `/register` | User registration |
| `/login` | Sign in |

### User (requires approved account)
| Route | Page |
|-------|------|
| `/dashboard` | User dashboard with activity overview |
| `/upload` | GPX file upload |
| `/activities` | Activities archive list |
| `/activity/:id` | Activity detail with map, charts & stats |
| `/statistics` | Global statistics & trends |
| `/profile` | Athlete profile settings |
| `/community` | Community feed — posts, reactions, comments |
| `/community/:id` | Single post view with comment thread |
| `/messages` | Direct messaging — 1-to-1 private conversations |

### Admin
| Route | Page |
|-------|------|
| `/admin` | Admin dashboard — user management & community moderation |

## Features

### Community Space
- Post feed with cursor-based infinite scroll
- Pinned posts (admin) displayed at top
- Multi-reactions per post (thumbs up, fire, muscle, trophy)
- Comment threads on each post
- Author & admin can delete posts/comments
- Ban check — banned users see a message instead of the feed

### Direct Messaging
- Two-panel responsive layout (conversation list + chat thread)
- Real-time polling every 5 seconds for new messages
- Unread message count badge in sidebar navigation
- User picker to start new conversations
- Chat bubbles with sender/receiver styling
- Mark-as-read on conversation open

### Admin Moderation
- Community Moderation section in Admin Dashboard
- Banned users table with unban action
- Quick link to community feed
- Pin/unpin posts from the feed

## Project Structure

```
src/
  components/     # Reusable UI components
  hooks/          # Custom React hooks (useAuth, etc.)
  layouts/        # AppShell layout with sidebar
  lib/            # Utility functions
  pages/          # Route page components
  services/       # API service layer
    api.ts            # Base fetch wrapper with auth
    adminService.ts   # Admin API calls
    communityService.ts # Community posts, comments, reactions, bans
    messagingService.ts # DM conversations & messages
  types/          # TypeScript interfaces
```
