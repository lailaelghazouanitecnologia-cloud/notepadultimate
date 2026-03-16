# Notepad Ultimate (Zarnetti) - Repository Analysis

## Overview

**Zarnetti** is a personal knowledge management + social agent simulator, built as a SPA with **React 19 + TypeScript + Vite**. It is 100% client-side with no backend, using `localStorage` for persistence.

## Architecture

```
src/
├── App.tsx              (527 lines - main orchestrator, 20+ state hooks)
├── store.ts             (localStorage persistence + seed data)
├── types.ts             (TypeScript interfaces)
├── components/
│   ├── Sidebar.tsx      (420 lines - navigation, projects, folders)
│   ├── Editor.tsx       (132 lines - markdown editor with preview)
│   ├── HomeScreen.tsx   (436 lines - chat/command interface)
│   ├── FeedView.tsx     (194 lines - activity timeline)
│   ├── GraphView.tsx    (257 lines - note graph visualization)
│   ├── AgentsView.tsx   (403 lines - agent management)
│   └── ProfileView.tsx  (201 lines - agent profile display)
├── hooks/
│   ├── useNotes.ts      (Note CRUD operations)
│   └── useTheme.ts      (dark/light theme toggle)
└── lib/
    ├── icons.tsx         (inline SVG icons)
    ├── markdown.ts       (custom markdown parser)
    └── markdown.css      (markdown rendering styles)
```

**Data flow**: App.tsx acts as a "mega-component" with 20+ `useState` hooks. No Context API, Redux, or Zustand is used. Child components receive callbacks to mutate state.

## Features

| Feature | Status | Description |
|---------|--------|-------------|
| Markdown Editor | Working | Textarea with preview, split mode, wiki-links `[[...]]`, word count |
| Note System | Working | CRUD, nested folders, search, multiple tabs |
| Feed/Timeline | Working | Published notes + system events, trending topics |
| Knowledge Graph | Working | Node visualization, drag & zoom, links between notes |
| AI Agents | Working | 6 preset agents (Rick Sanchez, Sherlock, Ada Lovelace...), create custom |
| Chat/Commands | Partial | Commands `/new`, `/search`, `/list`, `/help` — no real LLM |
| Projects | Working | Multi-project with switch and system events |
| Publishing | Working | Tweet-style publish modal with author |
| Dark Theme | Partial | Hook exists but toggle not connected to UI |

## Data Model

- **Note**: id, title, content, timestamps, published, author, folderId
- **Agent**: id, name, handle, avatar (emoji), bio, personality, interests[], followers
- **Folder**: id, name, parentId (nested support)
- **Project**: id, name, emoji
- **Contract**: agent + project, status active/paused
- **ChatSession**: user/assistant messages
- **Alert**: agent interest notifications

## Dependencies: Installed vs Used

| Dependency | Installed | Used in Code |
|------------|-----------|--------------|
| React 19 | Yes | **Yes** |
| CodeMirror (6 packages) | Yes | **No** - dead code |
| highlight.js | Yes | **No** |
| KaTeX + rehype-katex | Yes | **No** |
| remark-math/breaks/directive | Yes | **No** |
| rehype-raw | Yes | **No** |

The markdown parser is **custom** (`lib/markdown.ts`), so the 10+ markdown/CodeMirror dependencies are unused.

## Critical Issues

### 1. Monolithic App.tsx (527 lines)
20+ `useState` hooks in a single component. Should be refactored with `useReducer` + Context API or a library like Zustand.

### 2. Dead Dependencies
~10 npm packages installed but never imported. They bloat `node_modules` and confuse developers.

### 3. Security - Potential XSS
`dangerouslySetInnerHTML` is used to render markdown. While there is basic HTML entity escaping, there is no sanitization with DOMPurify.

### 4. Incomplete UI Features
- "Add people" button → does nothing
- Settings/Appearance → no functionality
- Model selector (Sonnet/Opus/Haiku) → purely visual
- Header search → non-functional
- Agent contracts → cannot be paused/activated

### 5. Performance
- No pagination or list virtualization
- Alert matching: O(agents × notes × interests) on every render
- Graph positions recalculated on every note change
- No `React.memo` on child components

### 6. No Router
All navigation is via internal state. No URLs, no deep-linking, browser back button doesn't work.

### 7. Not Responsive
Desktop-only design (fixed 260px sidebar, no media queries).

## Design System

- **Palette**: Near-black background `#141414`, red accent `#b91c2c`, cyan links `#5cc8d4`
- **Typography**: Inter + JetBrains Mono
- **Style**: Minimalist dark mode inspired by Vercel/Notion
- **Pure CSS**: No Tailwind or CSS-in-JS, `zw-*` and `zn-*` class prefixes
- **Animations**: Fast transitions (0.12s)

## Strengths

- Ambitious and cohesive feature set for a personal project
- Polished UI with professional dark theme
- Smart seed data (10 interconnected notes on physics, math, CS...)
- No external UI dependencies (inline SVG icons)
- Custom markdown parser with directive and callout support

## Recommendations

1. **Refactor App.tsx** → separate into contexts (NotesContext, AgentsContext, ProjectContext)
2. **Remove unused dependencies** (CodeMirror, KaTeX, remark, highlight.js)
3. **Add DOMPurify** to sanitize rendered HTML
4. **Implement React Router** for URL-based navigation
5. **Add React.memo + useCallback** on child components
6. **Connect theme toggle** to the UI
7. **Make responsive** with media queries
8. **Add error boundaries** for graceful error handling
