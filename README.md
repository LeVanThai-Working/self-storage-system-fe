# StorageHub - Frontend Monorepo

StorageHub is a modern Self-Storage Management System frontend built with Turborepo, pnpm workspaces, Next.js (App Router), and Expo (React Native).

---

## System Architecture

The project is structured as a monorepo containing web management portals, customer and staff mobile apps, and shared logic/types.

```text
self-storage-system-fe/
├── apps/
│   ├── web/                    # Next.js App Router (Web Portal)
│   └── mobile/                 # Expo React Native App (Customer & Staff)
├── packages/
│   └── shared/                 # Shared TypeScript models, schemas, constants & utilities
├── package.json                # Root package workspace scripts
├── pnpm-workspace.yaml         # Workspace configuration
├── turbo.json                  # Turborepo task pipeline configuration
├── lint-staged.config.js       # Staged files linting & formatting rules
├── .prettierrc                 # Prettier configuration
├── .prettierignore             # Prettier ignore patterns
└── .husky/                     # Git hooks configuration
    └── pre-commit              # Pre-commit hook script
```

---

## Roles and Target Platforms

| Role                     | Target Platform        | Primary Capabilities                                                                    |
| :----------------------- | :--------------------- | :-------------------------------------------------------------------------------------- |
| **Customer**             | Mobile (`apps/mobile`) | Search facilities, reserve units, online payments, digital contracts, view access codes |
| **Facility Staff**       | Mobile (`apps/mobile`) | QR code scanning, check-in/check-out, unit inspections, incident reports                |
| **Facility Manager**     | Web (`apps/web`)       | Facility unit grid, occupancy tracking, pricing configuration, contract approvals       |
| **Business Ops Manager** | Web (`apps/web`)       | Revenue analytics, cross-branch reporting, occupancy forecasting, marketing metrics     |
| **System Admin**         | Web (`apps/web`)       | User management, RBAC, branch setup, audit logs, system configurations                  |

---

## Folder Roles and Responsibilities

### `apps/web` (Web Portal)

- **Framework**: Next.js App Router (Turbopack, TypeScript, Tailwind CSS).
- **Architecture**: Feature-based architecture under `features/`:
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

## Tech Stack

- **Monorepo Engine**: Turborepo & pnpm Workspaces
- **Web**: Next.js (App Router), React, Tailwind CSS, Lucide Icons, Shadcn UI / Base UI, Victory Charts
- **Mobile**: React Native, Expo, NativeWind v4, Victory Native
- **State Management**: TanStack Query v5 + Zustand
- **Internationalization**: `next-intl` (Web), `i18n-js` (Mobile)
- **Validation & Forms**: Zod + React Hook Form
- **Language**: TypeScript 5+
- **Code Quality**: ESLint 9 (Flat Config), Prettier 3, Husky 9, lint-staged

---

## Getting Started

### Prerequisites

- **Node.js**: `>= 20.0.0` (Recommended: `22.x`)
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

> Note: Running `pnpm install` triggers the `prepare` script automatically, setting up local Git hooks via Husky.

### Environment Configuration

Configure environment variables in `apps/web/.env.local` and `apps/mobile/.env`:

```bash
# apps/web/.env.local
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/
NEXT_PUBLIC_DEFAULT_LOCALE=vi

# apps/mobile/.env
EXPO_PUBLIC_API_BASE_URL=http://localhost:5000/
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

## Build and Quality Assurance Scripts

All tasks are orchestrated via Turborepo caching:

| Command             | Action                                                |
| :------------------ | :---------------------------------------------------- |
| `pnpm build`        | Compiles and builds all apps and packages             |
| `pnpm type-check`   | Runs TypeScript type checking across all workspaces   |
| `pnpm lint`         | Runs ESLint analysis across Web and Mobile workspaces |
| `pnpm format`       | Formats codebase using Prettier                       |
| `pnpm format:check` | Verifies code formatting style with Prettier          |
| `pnpm clean`        | Cleans build caches (`.next`, `dist`, `.turbo`)       |

---

## Git Hooks and Quality Gates

### Husky and lint-staged

The repository enforces automated pre-commit validation to ensure that no broken or unformatted code is committed:

1. **Pre-commit Hook (`.husky/pre-commit`)**: Triggered automatically on every `git commit`.
2. **Automated Actions (`lint-staged.config.js`)**:
   - `apps/web/**/*.{js,jsx,ts,tsx}`: Runs `eslint --fix` within the web workspace context.
   - `apps/mobile/**/*.{js,jsx,ts,tsx}`: Runs `eslint --fix` within the mobile workspace context.
   - `**/*.{js,jsx,ts,tsx,json,css,scss,md,yaml,yml}`: Runs `prettier --write` on staged files (excluding `AGENTS.md`).
3. **Commit Blocking**: If an unfixable lint error or compile issue exists, the commit is aborted.

---

## Continuous Integration (GitHub Actions)

Located in `.github/workflows/ci.yml`:

- **Triggers**: On every `push` and `pull_request` targeting `main` and `dev` branches.
- **Pipeline Steps**:
  1. **Checkout**: Retrieves source code.
  2. **Setup**: Configures Node.js 22 and pnpm.
  3. **Cache**: Restores Turborepo and pnpm cache to accelerate build times.
  4. **Install**: Installs dependencies via `pnpm install --frozen-lockfile`.
  5. **Prettier Check**: Executes `pnpm format:check` to verify code style.
  6. **ESLint**: Executes `pnpm lint` across both Web and Mobile apps.
  7. **TypeScript Check**: Executes `pnpm type-check` across all packages.
  8. **Build Validation**: Executes `pnpm build` to verify compilation integrity.

---

## Member Contribution Workflow

Follow these steps to contribute code to the repository:

### Step 1: Clone Repository and Install Dependencies

```bash
git clone <repository-url>
cd self-storage-system-fe
pnpm install
```

`pnpm install` will install all workspace dependencies and configure Husky pre-commit hooks automatically.

### Step 2: Create a Feature Branch

Always create a new branch from `dev`:

```bash
git checkout dev
git pull origin dev
git checkout -b feature/your-feature-name
```

Naming convention for branches:

- `feature/<name>`: New features or enhancements.
- `fix/<name>`: Bug fixes.
- `hotfix/<name>`: Critical bug fixes.
- `refactor/<name>`: Code refactoring without changing functionality.
- `chore/<name>`: Maintenance tasks, dependency updates, or configuration changes.

### Step 3: Implement Code and Test Locally

Start the development server for your target application:

```bash
# Work on Web
pnpm dev:web

# Work on Mobile
pnpm dev:mobile
```

### Step 4: Run Local Quality Checks

Before staging and committing, verify that your code passes all checks:

```bash
# Check code formatting
pnpm format:check

# If there are formatting issues, auto-format with:
pnpm format

# Run linting
pnpm lint

# Run TypeScript type check
pnpm type-check

# Verify build
pnpm build
```

### Step 5: Stage and Commit Changes

When you run `git commit`:

- Husky triggers `lint-staged`.
- ESLint checks and fixes issues in staged files.
- Prettier formats staged files.
- If errors are found, the commit will be rejected. Review the terminal output, resolve the errors, re-stage, and commit again.

### Step 6: Push Branch and Create Pull Request

Push your branch to the remote repository:

```bash
git push -u origin feature/your-feature-name
```

Create a Pull Request on GitHub:

- **Base branch**: `dev` (or `main` depending on project release flow).
- **Compare branch**: `feature/your-feature-name`.
- GitHub Actions CI will automatically run all validation checks.
- Ensure all CI checks pass and request reviews from team members before merging.

---

## Design System Summary

StorageHub uses a brand palette optimized for clarity and professional storage operations:

- **Primary (Brand Teal)**: `#0B927E` (Dark: `#064E4B`, Light: `#DDF4ED`, Background: `#F0FAF7`)
- **CTA (Action Orange)**: `#FF702E` (Hover: `#E85D1B`, Dark: `#D34D0F`)
- **Page Background**: `#F8FAF9`
- **Typography**: `Plus Jakarta Sans` (Primary UI), `Kalam` (Handwriting / Accents)
