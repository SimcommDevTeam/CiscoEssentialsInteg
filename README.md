# Webex Calling Integration

A static Next.js dashboard for Webex Calling workflows. It includes a screen popup form for incoming calls and a searchable recording management grid with playback and download actions.

## Stack

- Node.js 24
- Next.js App Router with TypeScript
- Tailwind CSS
- Lucide React icons
- React hooks for state
- Next.js API routes for screen popup persistence

## Getting Started

Use Node.js 24 before installing dependencies.

```bash
nvm use
npm install
npm run dev
```

Open `http://localhost:3001`.

## Production Build

```bash
npm run build
```

The project uses Next.js server routes for the Screen Popup APIs, so deploy it as a Node.js 24 App Service rather than a static export.

## Screen Popup Backend

The Screen Popup page uses API routes for Salesforce lookup and MS SQL persistence.
The Salesforce token is configured in `src/app/api/screen-popup/route.ts`.
The MS SQL connection is configured in `src/lib/server/screenPopupRepository.ts`.

Run the schema and stored procedures from `database/screenpopup.sql` against the SQL database before using the page.

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
