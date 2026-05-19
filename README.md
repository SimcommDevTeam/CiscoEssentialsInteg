# Webex Calling Integration

A static Next.js dashboard for Webex Calling workflows. It includes a screen popup form for incoming calls and a searchable recording management grid with playback and download actions.

## Stack

- Next.js App Router with TypeScript
- Tailwind CSS
- Lucide React icons
- React hooks for state
- Static mock data only, no backend required

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:3001`.

## Production Build

```bash
npm run build
```

The project is configured with `output: "export"` in `next.config.ts`, so it can be deployed as a static frontend.

## Project Structure

```text
src/
  app/                 Next.js app entry and global styles
  components/
    layout/            Dashboard shell and navigation
    ui/                Reusable inputs, data grid, modal, states
  features/
    screen-popup/      Incoming call form
    search-play/       Recording search and playback page
  lib/                 Mock data and helpers
  types/               Shared TypeScript models
```

## Notes for Future API Integration

- Replace `src/lib/mockData.ts` with API calls or server actions.
- The recording grid expects typed `CallRecording` records.
- The screen popup form uses controlled inputs and validation, so API submission can be added inside `handleSubmit`.
