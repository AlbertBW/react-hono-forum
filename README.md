# React Hono Forum

A modern, full-stack Reddit-inspired forum application built with React, Hono, and Bun.

## Overview

React Hono Forum is a full-stack community platform where users can create and join discussion groups, share posts, and engage with content through comments and votes. The application features:

- **Communities**: Create public or private communities with customisable icons and banners
- **Content Management**: Create, view, and delete threads and comments
- **Interaction**: Upvote/downvote system for both threads and comments
- **Moderation Tools**: Community creators can assign moderators with special privileges
- **User Profiles**: View stats, activity history, and managed communities
- **Feed Customization**: Browse all posts or filter by followed communities
- **Search Functionality**: Find communities based on keywords
- **Privacy Controls**: Private communities require following to view content
- **User Authentication**: Social login options using Better Auth
- **Responsive Design**: Works on mobile and desktop devices

## Technology Stack

### Frontend

- [React 19](https://react.dev/) with TypeScript
- [TanStack Router](https://tanstack.com/router) for type-safe routing
- [TanStack Query](https://tanstack.com/query) for data fetching and state management
- [TanStack Form](https://tanstack.com/form) for form handling
- [Shadcn UI](https://ui.shadcn.com/) components
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Vite](https://vitejs.dev/) for building and development

### Backend

- [Hono](https://hono.dev/) - lightweight, fast web framework
- [Bun](https://bun.sh/) - modern JavaScript/TypeScript runtime
- [Drizzle ORM](https://orm.drizzle.team/) for database interactions
- [Neon PostgreSQL](https://neon.tech/) for database storage
- [Better Auth](https://github.com/betterstack-community/better-auth) for authentication
- [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) for image storage

## Getting Started

### Prerequisites

- Bun installed
- PostgreSQL database (or Neon)
- Vercel account (for Blob storage)

### Environment Setup

Rename the `.env.example` in the root directory to `.env` and fill in the values.

### Installation

#### Backend Setup

In the root directory (in one terminal window):

```bash
# Install dependencies
bun install

# Start development server
bun dev
```

#### Frontend Setup

In a second terminal window:

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
bun install

# Start development server
bun dev
```

The frontend will be available at http://localhost:5173 and the backend at http://localhost:3000.

### Building for Production

```bash
# Build the frontend
bun run build

# Run the production server
bun start
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.
