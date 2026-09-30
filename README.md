# 📦 StorageHub — Frontend Monorepo

StorageHub is a modern, full-featured Self-Storage Management System frontend built with **Turborepo**, **pnpm workspaces**, **Next.js (App Router)**, and **Expo (React Native)**.

---

## 🏛️ System Architecture

The project is structured as a monorepo containing web management portals, customer & staff mobile apps, and shared logic/types.

```text
self-storage-system-fe/
├── apps/
│   ├── web/                    # Next.js App Router (Web Portal)
│   └── mobile/                 # Expo React Native App (Customer & Staff)
├── packages/
│   └── shared/                 # Shared TypeScript models, schemas, constants & utilities
├── package.json                # Root package workspace scripts
├── pnpm-workspace.yaml         # Workspace configuration
└── turbo.json                  # Turborepo task pipeline configuration
```

---

## 👥 Roles & Target Platforms

| Role                     | Target Platform            | Primary Capabilities                                                                    |
| :----------------------- | :------------------------- | :-------------------------------------------------------------------------------------- |
| **Customer**             | **Mobile** (`apps/mobile`) | Search facilities, reserve units, online payments, digital contracts, view access codes |
| **Facility Staff**       | **Mobile** (`apps/mobile`) | QR code scanning, check-in/check-out, unit inspections, incident reports                |
| **Facility Manager**     | **Web** (`apps/web`)       | Facility unit grid, occupancy tracking, pricing configuration, contract approvals       |
| **Business Ops Manager** | **Web** (`apps/web`)       | Revenue analytics, cross-branch reporting, occupancy forecasting, marketing metrics     |
| **System Admin**         | **Web** (`apps/web`)       | User management, RBAC, branch setup, audit logs, system configurations                  |

---

## 📂 Folder Roles & Responsibilities

### `apps/web` (Web Portal)

- **Framework**: Next.js App Router (Turbopack, TypeScript, Tailwind CSS).
- **Architecture**: **Feature-based architecture** under `features/`:
  - `features/auth/`: Authentication views, login form, password reset, session hooks.
  - `features/landing/`: Public marketing landing page, service highlights, unit calculator.
  - `features/facility-manager/`: Unit grid management, occupancy status, contract handling.
  - `features/business-ops/`: Performance dashboard, financial KPIs, analytics charts.
  - `features/system-admin/`: User accounts, facility configuration, permission matrix.
- **Routing**: `app/[locale]/` handles internationalized routing (`vi` and `en`) with `next-intl`.
- **UI Components**: `components/ui/` with Shadcn UI and Base UI primitives, styled with custom brand tokens.
- **State & Data Fetching**: TanStack Query v5 (server-state caching) and Zustand (client-state).
- **Networking**: Axios instance with automatic HttpOnly token refresh interceptors.

### `apps/mobile` (Mobile Application)

- **Framework**: Expo (SDK 52+), React Native, TypeScript.
- **Styling**: NativeWind v4 (Tailwind CSS for React Native).
- **Features**: Customer unit reservation flow, payment gateway integration, camera scanner for staff QR verification (`expo-camera`), secure storage with `expo-secure-store`.

### `packages/shared` (`@self-storage-system-fe/shared`)

- **Role**: Shared library consumed by both `apps/web` and `apps/mobile`.
- **Contents**:
  - `src/constants/`: Role definitions (`USER_ROLE`), standard API base URLs, backend `MESSAGE_CODE` mappings.
  - `src/types/`: Standard API response formats (`ApiResponse<T>`, `ApiErrorResponse`).
  - `src/schemas/`: Zod validation schemas for forms and payloads.
  - `src/utils/`: Common helpers such as currency formatting (`formatCurrency` - VND) and date formatting (`formatDate`).

---

## 🛠️ Tech Stack

- **Monorepo Engine**: Turborepo & pnpm Workspaces
- **Web**: Next.js (App Router), React, Tailwind CSS, Lucide Icons, Shadcn UI / Base UI, Victory Charts
- **Mobile**: React Native, Expo, NativeWind v4, Victory Native
- **State Management**: TanStack Query v5 + Zustand
- **Internationalization**: `next-intl` (Web), `i18n-js` (Mobile)
- **Validation & Forms**: Zod + React Hook Form
- **Language**: TypeScript 5+

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: `>= 20.0.0`
- **pnpm**: `>= 9.0.0` (Recommended: `11.x`)
- **Git**

```bash
# Verify versions
node -v
pnpm -v
```

### Installation

Clone the repository and install all monorepo dependencies:

```bash
# Install dependencies across all workspaces
pnpm install
```

### Environment Configuration

Configure environment variables in `apps/web/.env.local`:

```bash
# apps/web/.env.local
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/
NEXT_PUBLIC_DEFAULT_LOCALE=vi
```

### Running in Development

```bash
# Run all applications simultaneously
pnpm dev

# Run only the Web portal
pnpm dev:web

# Run only the Mobile app
pnpm dev:mobile
```

The Web portal will be accessible at: `http://localhost:3000`

---

## 🧪 Build & Quality Assurance Scripts

All tasks are orchestrated via Turborepo caching:

| Command           | Action                                              |
| :---------------- | :-------------------------------------------------- |
| `pnpm build`      | Compiles and builds all apps and packages           |
| `pnpm type-check` | Runs TypeScript type checking across all workspaces |
| `pnpm lint`       | Runs ESLint analysis                                |
| `pnpm format`     | Formats codebase using Prettier                     |
| `pnpm clean`      | Cleans build caches (`.next`, `dist`, `.turbo`)     |

---

## 🎨 Design System Summary

StorageHub uses a brand palette optimized for clarity and professional storage operations:

- **Primary (Brand Teal)**: `#0B927E` (Dark: `#064E4B`, Light: `#DDF4ED`, Background: `#F0FAF7`)
- **CTA (Action Orange)**: `#FF702E` (Hover: `#E85D1B`, Dark: `#D34D0F`)
- **Page Background**: `#F8FAF9`
- **Typography**: `Plus Jakarta Sans` (Primary UI), `Kalam` (Handwriting / Accents)
