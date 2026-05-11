# Watchover AI

Watchover AI is a polished AI agent transparency dashboard for reviewing live agent activity, inspecting decision replays, and managing operational guardrails in a clean 3-column control-room layout.

## Tech Stack

- React
- TypeScript
- Zustand
- Socket.io
- Node.js
- Tailwind CSS
- Vite

## Features

- Live agent activity timeline with decision replay
- Action inspector with controls, rules, and history
- Notification center with quick actions
- Rule creation and agent governance flows
- Dark and light theme support

## Getting Started

### Install

```bash
npm install
cd server
npm install
```

### Run Locally

Start the frontend:

```bash
npm run dev
```

Start the backend in a second terminal:

```bash
npm run dev:server
```

### Build

```bash
npm run build
npm run build:server
```

## Architecture

- `src/` contains the React application, shared components, hooks, store, and mock data.
- `server/src/` contains the Express and Socket.io backend used for live simulation and event wiring.
- Zustand is the single source of truth for dashboard state, notifications, and analytics counters.

## Notes

- The project is designed to run in demo mode without a live backend.
- Local development prefers mock socket data for a fast startup experience.