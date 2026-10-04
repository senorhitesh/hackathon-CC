# loopx — Real-Time Collaborative Creative Review & Ad Proofing Canvas

> **Built for the CometChat "Zero to Chat" Hackathon (Sept 24 – Oct 7, 2026)**  
> *Transforming ad creative approvals with interactive visual canvases, threaded discussions, live voice huddles, audio voice memos, AI ad compliance audits, A/B visual split testing, and real-time multiplayer presence.*

[![CometChat MCP Connected](https://img.shields.io/badge/CometChat-MCP%20Connected-4f46e5?style=for-the-badge&logo=cometchat&logoColor=white)](https://mcp.cometchat.com/mcp?ref=z2c)
[![Next.js 16](https://img.shields.io/badge/Next.js-16%20Turbopack-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Turborepo](https://img.shields.io/badge/Turborepo-Monorepo-ef4444?style=for-the-badge&logo=turborepo&logoColor=white)](https://turbo.build/)

---

## 🔌 CometChat Connector in Editor & Agent (Hackathon Requirement)

As required by the **CometChat Zero to Chat Hackathon** rules, the **CometChat Connector** was actively integrated and used by our AI coding agent to construct `loopx`.

### 1. Active Connector Configuration

The workspace includes the official CometChat MCP (Model Context Protocol) and skills configuration files:

- **`.cursor/mcp.json`**:
  ```json
  {
    "mcpServers": {
      "cometchat": {
        "url": "https://mcp.cometchat.com/mcp?ref=z2c",
        "transport": "http"
      }
    }
  }
  ```

- **`mcp_config.json`** (Root Agent / Claude Code config):
  ```json
  {
    "mcpServers": {
      "cometchat": {
        "command": "npx",
        "args": ["-y", "@cometchat/skills", "serve"],
        "url": "https://mcp.cometchat.com/mcp?ref=z2c",
        "transport": "http"
      }
    }
  }
  ```

- **`.vscode/settings.json`** (VS Code / Copilot Agent):
  ```json
  {
    "cometchat.connector.enabled": true,
    "cometchat.connector.url": "https://mcp.cometchat.com/mcp?ref=z2c",
    "mcp.servers": {
      "cometchat": {
        "url": "https://mcp.cometchat.com/mcp?ref=z2c"
      }
    }
  }
  ```

### 2. How the Agent Utilized the Connector

```
┌─────────────────────────────────────────────────────────────┐
│                       AI CODING AGENT                       │
│    (Cursor / Claude Code / Antigravity / Windsurf / Kiro)   │
└──────────────────────────────┬──────────────────────────────┘
                               │
               Reads verified implementation bundles
               and live SDK documentation via MCP
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 OFFICIAL COMETCHAT CONNECTOR                │
│             https://mcp.cometchat.com/mcp?ref=z2c           │
└──────────────────────────────┬──────────────────────────────┘
                               │
       Generates and wires real-time CometChat features
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                         loopx APP                           │
│  ├── 💬 Real-Time Chat & Threaded Reviews (@repo/cometchat) │
│  ├── 📁 Cloud S3 Media Attachments & Direct Downloads       │
│  ├── 🎙️ Live Voice-Only Huddle & Audio Spectrum Meters     │
│  ├── 🗣️ Async Voice Memos with Live Waveform Visualizer     │
│  ├── ⚖️ A/B Interactive Split Slider & Team Polling         │
│  ├── 🤖 Instant AI Creative Compliance & Hook Scoring       │
│  ├── 📌 Pin-Point Visual Feedback & Resolution Flow         │
│  ├── 👥 Real-Time Presence, User Listeners & Multiplayer    │
│  └── 🏷️ Dynamic Name Convention & Custom User Renaming      │
└─────────────────────────────────────────────────────────────┘
```

The agent leveraged the CometChat MCP connector and skills pack (`@cometchat/skills`) throughout development to:
1. **Fetch verified implementation bundles** for Next.js App Router and TypeScript.
2. **Implement real-time messaging** with CometChat Chat SDK v4 (`TextMessage`, `MediaMessage`, real-time listener hooks).
3. **Configure cloud media uploads** directly to CometChat's secure AWS S3 storage infrastructure with instant preview and download capabilities.
4. **Implement voice huddles** integrating CometChat Calls SDK alongside a WebRTC audio bridge for collaboration with visualizer wavebars.
5. **Architect a fallback-safe mock/hybrid mode** to ensure seamless operation both with live CometChat API credentials and offline preview environments.

### 3. Demonstrating Connector Visibility in Demo Video

When recording the submission demo video (under 90 seconds):
1. **Show the Connector**: Display the active CometChat MCP connector in your editor's MCP server panel (`cometchat` connected to `https://mcp.cometchat.com/mcp?ref=z2c`) or the terminal showing `npx @cometchat/skills`.
2. **Show the Working Build**: Open `http://localhost:3000/app` and showcase real-time creative collaboration, chat, media upload, A/B testing, AI audit, voice memos, and voice huddle.

---

## 🎨 What is loopx?

`loopx` is an **all-in-one real-time visual collaboration board** designed specifically for marketing teams, art directors, copywriters, and clients. Traditional ad review workflows are fragmented across Slack, Google Drive, email threads, and Figma. `loopx` unifies visual creative review, real-time threaded chat, live voice reviews, asynchronous voice notes, AI audits, and ad format previews on a single infinite canvas.

### Key Features

- **🎯 Interactive Infinite Artboard**: Pan, zoom, drag posts, and connect ad variations with dynamic SVG Bezier wires.
- **💬 Creative Thread Chat**: Each ad post has its own unique CometChat conversation thread for feedback on headlines, copy, visual hierarchy, and approvals.
- **🗣️ Async Voice Memos & Waveforms**: Record up to 30-second audio design critiques with real-time audio waveform visualizers, built directly into the CometChat thread for rapid verbal feedback.
- **⚖️ A/B Creative Compare & Live Polling**:
  - Compare two ad variations side-by-side or using an interactive before/after split slider.
  - Live team voting with percentage bars and 1-click broadcast of winning variants to CometChat.
- **🤖 AI Creative Compliance & Hook Audit**:
  - Deterministic ad copy analyzer evaluating hook quality, CTA punch, and character constraints (e.g., Instagram 2,200 limit).
  - Generates high-converting alternate headline suggestions and shares audit summaries directly to the chat thread with a single click.
- **📌 Precision Pin-Point Annotations**:
  - Click anywhere on a creative asset to drop exact visual feedback pins (normalized coordinate tracking).
  - Mark feedback as Open or Resolved with live author badges.
- **📁 CometChat Cloud Media Storage**: Upload images and videos directly to CometChat cloud storage with full preview chips, download buttons, and cross-session persistence.
- **🎙️ Live Voice-Only Huddles**: Hop into instant voice huddles with your team right from the canvas. Features speaking wavebars, mute controls, and multi-peer audio streaming.
- **👥 Excalidraw-Style Multiplayer Cursors & Presence**: See collaborators' cursors moving in real-time across the canvas with custom color badges and name tags, synchronized with CometChat User Presence listeners.
- **🏷️ Dynamic Name Convention & Custom Renaming**:
  - Set your own custom display name and role (e.g. `Sarah Connor · Art Director`, `Alex · Copywriter`).
  - **Give custom names/aliases to particular collaborators** (e.g. rename `User #7A2B` to `Client Reviewer`). Changes instantly reflect across cursors, chat, and presence!
- **📱 Platform Aspect Ratio Simulator**: Switch between Instagram 1:1 Square, 9:16 Reels/Stories, 16:9 X Banners, and LinkedIn Feed formats with live canvas element scaling.

---

## 🧱 Project Architecture & Monorepo Structure

```
loopx/
├── .cursor/
│   └── mcp.json                  # CometChat MCP connector configuration
├── mcp_config.json               # Root agent MCP connector configuration
├── .vscode/
│   └── settings.json             # VS Code CometChat connector settings
├── apps/
│   └── web/                      # Next.js 16 Web Application (Turbopack)
│       ├── app/
│       │   ├── app/              # Main collaborative canvas workspace
│       │   ├── components/       # Rich UI & collaboration components
│       │   │   ├── ABCompareModal.tsx       # A/B visual split slider & team voting
│       │   │   ├── AIAuditPanel.tsx         # Creative compliance & hook scoring
│       │   │   ├── CanvasWorkspace.tsx      # Pan/zoom infinite artboard & Bezier wires
│       │   │   ├── CreatePostModal.tsx      # Ad creative builder & format presets
│       │   │   ├── LeftSidebar.tsx          # Creative library & session controls
│       │   │   ├── PinAnnotationOverlay.tsx # Precise visual pin markers & resolution
│       │   │   ├── PostChatPanel.tsx        # CometChat thread panel & media preview
│       │   │   ├── PresenceBar.tsx          # Real-time online team avatars & call triggers
│       │   │   ├── TopBar.tsx               # Workspace title, rename modal & format toggle
│       │   │   └── VoiceMemoRecorder.tsx    # Audio memo recorder with live waveform
│       │   ├── context/          # AppContext (collaborative state, sync, naming conventions)
│       │   ├── hooks/            # useCometChat, useCall, useCanvasGestures
│       │   └── providers/        # CometChatProvider, CometChatCallsProvider
│       └── public/               # Static assets & brand logos
└── packages/
    ├── cometchat-client/         # CometChat Chat & Calls SDK integration library
    │   └── src/
    │       ├── chat.ts           # CometChat Chat SDK v4 initialization & cloud media upload
    │       ├── calls.ts          # CometChat Calls SDK initialization & huddle controller
    │       └── config.ts         # Environment credentials and region setup
    ├── types/                    # Shared TypeScript interfaces (AdProofSession, BoardPost, ActiveUser)
    └── ui/                       # Shared Tailwind/CSS design system
```

---

## 🚀 Getting Started

### 1. Prerequisites

- [Node.js](https://nodejs.org/) (v18+) or [Bun](https://bun.sh/)
- A free [CometChat Account](https://app.cometchat.com/) (for live App ID & Auth Key)

### 2. Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/senorhitesh/hackathon-CC.git
cd hackathon-CC/loopx
bun install
```

### 3. Environment Setup

Create an `.env.local` file inside `apps/web/`:

```env
NEXT_PUBLIC_COMETCHAT_APP_ID=your_cometchat_app_id
NEXT_PUBLIC_COMETCHAT_AUTH_KEY=your_cometchat_auth_key
NEXT_PUBLIC_COMETCHAT_REGION=us
```

*(Note: If environment variables are omitted, `loopx` automatically activates its verified offline local engine so all UI features, canvas sync, audio huddle, voice memos, and chat threads remain fully interactive!)*

### 4. Run Development Server

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. Open multiple tabs or windows to experience real-time multiplayer collaboration, cursor tracking, chat threads, and voice huddle!

### 5. Production Build

To build the monorepo for production:

```bash
bun run build
```

---

## 🏆 Hackathon Submission Checklist

| Criterion | Status | Details |
|---|---|---|
| **Project Runs** | ✅ Valid | Working interactive collaborative canvas with chat, media, calls, voice memos, A/B voting, AI audit, and presence |
| **Connector Visible in Editor/Agent** | ✅ Valid | `.cursor/mcp.json`, `mcp_config.json`, `.vscode/settings.json` pointing to `https://mcp.cometchat.com/mcp?ref=z2c` |
| **Demo Video Under 90s** | ✅ Prepared | Demo walkthrough showing connector in editor and live app in action |
| **CometChat Chat Integration** | ✅ Complete | CometChat Chat SDK v4 for real-time messaging, audio voice memos, and cloud media upload |
| **CometChat Calls Integration** | ✅ Complete | CometChat Calls SDK for voice-only huddles with live audio meters |

---

## 📄 License

MIT © 2026 loopx team. Built with ❤️ for the CometChat Zero to Chat Developer Challenge.
