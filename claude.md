# claude.md

This file documents the design system (colors/tokens), reusable UI components, data structures/domain model, and overall architecture of this repository, for use by Claude Code and other contributors.

> Note: There is a separate top-level `README.md` (git workflow notes only). This file is the source of truth for design tokens, components, and data model — keep it updated as the system evolves.

---

## 1. Tech Stack & Commands

- **React 18.3 + TypeScript 5.5**, bundled with **Vite 5.4** (`@vitejs/plugin-react-swc`; originated on Lovable, hence the `lovable-tagger` dev plugin).
- **react-router-dom 6.26** — `BrowserRouter` with nested layouts.
- **Redux Toolkit 2.8 + react-redux 9** (two parallel stores, see §4.3) — no RTK Query; fetching is `createAsyncThunk` + axios. **TanStack React Query 5.56** is used for newer feature pages.
- **react-hook-form 7.58 + zod 4** for newer forms; **Formik + Yup** still used in legacy forms.
- UI: **shadcn/ui** (Radix + `class-variance-authority` + `tailwind-merge`) mixed with **MUI 7** — two UI systems coexist.
- **Tailwind CSS 3.4**, `sonner` (toasts), `recharts`, FullCalendar, `dhtmlx-gantt`, TensorFlow.js (face detection).
- **Vitest 4** + `@testing-library/react` for tests.
- **Electron 39 + electron-builder 26** — same codebase ships as web SPA and desktop app ("FM Matrix", `com.fmmatrix.desktop`).

**Commands:**
```bash
npm run dev            # start Vite dev server
npm run build           # production build
npm run build:dev       # development-mode build
npm run lint             # eslint .
npm run lint:fix
npm run format           # prettier --write
npm run format:check
npm run test             # vitest
npm run test:ui          # vitest --ui
npm run electron:dev     # vite + electron concurrently
npm run electron:build[:mac|:win|:all]
```

---

## 2. UI Color System / Design Tokens

The brand palette is defined once as CSS custom properties in **`src/styles/theme.css`** (`:root`), then re-exposed to Tailwind via **`tailwind.config.ts`** as `brand*` utility classes (e.g. `bg-brand`, `text-brand-text-light`, `bg-brand-success-bg`). A **second, parallel** shadcn/Radix HSL-variable layer also exists in `src/index.css` (`--background`, `--primary`, etc., as `H S% L%` triplets) for components that use the plain shadcn tokens (`bg-primary`, `bg-border`, `bg-muted`...). Both layers point at the same brand colors but are maintained as two separate systems — check which layer a component consumes before changing a color.

### 2.1 Primary / Brand

| Token (theme.css) | Value | Tailwind class |
|---|---|---|
| `--color-primary` | `#da7756` (terracotta) | `bg-brand`, `text-brand` |
| `--color-primary-hover` | `rgba(218,119,86,0.85)` | `bg-brand-hover` |
| `--color-primary-light` | `rgba(218,119,86,0.15)` | `bg-brand-light` |
| `--color-primary-selected` | `rgba(218,119,86,0.08)` | `bg-brand-selected` |
| `--color-bg` | `#f6f4ee` (cream) | `bg-brand-bg` |
| `--color-text` | `#2c2c2c` | `text-brand-text` |
| `--color-text-light` | `#888780` | `text-brand-text-light` |

### 2.2 Secondary accents

| Token | Value | Meaning |
|---|---|---|
| `--color-secondary-green` | `#798c5e` (olive) | `brand-green` — also doubles as the "success solid" color |
| `--color-secondary-purple` | `#cecbf6` (lavender) | `brand-purple` — also used for tag chips |
| `--color-secondary-teal` | `#9ec8ba` (mint) | `brand-teal` |

Each has `-light`/`-bg` variants at 15–30% opacity (`brand-green-bg`, etc.).

### 2.3 Status / Semantic colors

| State | Token | Value |
|---|---|---|
| Success | `--color-success-solid` | `#798c5e` (= secondary green) |
| Success bg | `--color-success-bg` | `rgba(121,140,94,0.15)` |
| Warning | `--color-warning` | `#edc488` |
| Warning bg | `--color-warning-light` | `rgba(237,196,136,...)` |
| Error/Danger | `--color-error` / `--color-danger` | `#e7848e` / `#e49191` |
| Error bg | `--color-error-bg` | `rgba(231,132,142,0.15)` |
| Info | `--color-info` | `#6b9bcc` |
| Disabled/Muted | `--color-disabled` / `--color-muted` | `#d3d1c7` |
| Growth (metrics) | `--color-growth-solid` | `#108c72` |
| Exception/neutral | `--color-exception` | `#aab9c5` |

**Hard rules (from historical design docs, still in force):**
- **Green = Active, Red = Inactive** for toggle switches (`STATUS_TOGGLE_COLORS_CONFIRMED.md`) — knob slides right when active.
- **Avoid blue tones unless explicitly brand-sanctioned** (`BLUE_COLOR_REMOVAL_HELPDESK_SETUP.md`) — blue was systematically removed from Helpdesk Setup UI in favor of cream/gray/brand-red. Treat `theme.css` as the current source of truth for exact hex values; some older docs reference a superseded palette (`#C72030`/`#EDEAE3`).
- `status-badge.tsx` fuzzy-maps arbitrary status strings into 3 buckets: **pending/yellow/in-progress → `#F2EBC9`**, **rejected/red/closed/inactive/breakdown → `#F2C8C4`**, **accepted/green/open/active/in-use → `#C7EDDA`** (all `text-black`, square corners). Use this component instead of inventing new status colors.

### 2.4 Surfaces, borders, sidebar

| Token | Value |
|---|---|
| `--color-card-white` | `#ffffff` |
| `--color-card-bg` | `#f6f4ee` |
| `--color-card-border` | `#c4b89d` |
| `--color-border-subtle` | `#d5dbdb` |
| `--color-divider` | `#e5e5e5` |
| `--color-sidebar` | `#c4b89d` |
| `--color-sidebar-hover` | `rgba(196,184,157,0.5)` |

### 2.5 Charts (`src/styles/chartPalette.ts`)

`ANALYTICS_PALETTE` (ordered categorical): `#DA7756` (primary) → `#798C5E` → `#CECBF6` → `#9EC8BA` → `#C4B89D` → `#EDC488` → `#E7848E` → `#6B9BCC`. Also exports `ITEM_STATUS_COLORS`, `LINE_CHART_COLORS`, `GRADIENT_PRIMARY`, `CATEGORY_BAR_COLOR`, `CHART_COLORS`, `PIE_CHART_COLORS`, `BAR_GRADIENT`. Use this palette (not ad-hoc hex codes) for any new chart/graph.

### 2.6 Typography, spacing, radius, shadow scales

- **Font:** Poppins (default sans), Work Sans available, Fira Code for monospace.
- **Type scale** (desktop → shrinks on tablet/mobile breakpoints): h1 `26px`, h2 `24px`, body-1 `20px`, body-2 `18px`, body-3 `16px`, body-4 `14px`, body-5 `12px`, caption `10px`. Tailwind: `text-brand-h1`, `text-brand-body-3`, etc.
- **Spacing scale:** xs `4px`, sm `8px`, md `16px`, lg `24px`, xl `32px`, 2xl `48px`, 3xl `64px` → Tailwind `p-system-md`, `gap-system-lg`, etc.
- **Radius scale:** none `0`, sm `4px`, md `8px`, lg `12px`, xl `16px`, full `9999px`.
- **Shadows:** `--shadow-sm/md/lg/xl` + `--shadow-card` → Tailwind `shadow-system-md`, `shadow-brand-card`.
- **Breakpoints (Tailwind `screens`):** `xs:400px sm:640px md:768px lg:1024px xl:1280px 2xl:1400px`.

### 2.7 Dark mode

Two independent dark-mode overrides exist (`theme.css` `.dark`/`[data-theme="dark"]`, and `index.css` `.dark` HSL block). Both darken background/card/text but leave brand/status colors unchanged. If adding new dark-mode support, update **both** files or you'll get inconsistent theming depending on which token layer a component uses.

---

## 3. UI Component Library (`src/components/ui/`)

~55 primitives. Most are stock **shadcn/Radix** wrappers (accordion, alert, alert-dialog, aspect-ratio, avatar, badge, breadcrumb, card, carousel, checkbox, collapsible, command, context-menu, dialog, drawer, dropdown-menu, form, hover-card, input, input-otp, label, menubar, navigation-menu, pagination, popover, progress, radio-group, resizable, scroll-area, select, separator, sheet, sidebar, skeleton, slider, sonner, switch, table, tabs, textarea, toast, toaster, toggle, toggle-group, tooltip) — use these first for any standard UI need.

**Custom-built components** (prefer reusing over writing new variants):

| Component | Purpose |
|---|---|
| `button.tsx` | Extends shadcn button with extra `primary`/`icon` variants |
| `heading.tsx` | CVA-based heading (`level: h1-h6`, `variant: default\|primary\|secondary\|muted`) |
| `status-badge.tsx` | Fuzzy status→color pill mapping (see §2.3) — use for any active/inactive/pending state |
| `custom-text-field.tsx` | Themed MUI `TextField` wrapper; exports `DesktopTextField`/`TabletTextField`/`MobileTextField` presets |
| `enhanced-select.tsx` | Dual-mode select: `EnhancedSelect` (MUI) or `SearchableSelect` (Radix Popover+Command combobox) |
| `select-box.tsx` | react-select-based single select with custom styling |
| `property-select.tsx` | Like select-box but returns a `defaultValue` object, portals to `document.body` |
| `multi-selector.tsx` | react-select-based multi-select (`MultiSelectBox`) |
| `comprehensive-date-picker.tsx` | Full calendar UI (date-fns), min/max, Cancel/OK footer |
| `date-picker-trigger.tsx` | Button styled as a date-input trigger |
| `material-date-picker.tsx` | Popover+Calendar combo, returns `dd/MM/yyyy` string |
| `responsive-date-picker.tsx` | Composes trigger + comprehensive picker in a Popover — prefer this for new date fields |

Config: shadcn `components.json` at repo root (`style: default`, `tailwind.baseColor: slate`, `cssVariables: true`, aliases `@/components`, `@/components/ui`, `@/lib/utils`, `@/hooks`).

### 3.1 Tables — `EnhancedTable` (`src/components/enhanced-table/`)

The standard data-table for the whole app (`EnhancedTable.tsx`, ~1350 lines) — **use this instead of building a new table.** Companion files: `EnhancedTaskTable.tsx` (task-specific variant), `SortableColumnHeader.tsx`, `ColumnVisibilityMenu.tsx`. Column/sort/visibility/reorder state comes from the `useEnhancedTable` hook (`src/hooks/useEnhancedTable.tsx`); column drag-reorder uses `@dnd-kit`.

**`ColumnConfig`**: `{ key, label, sortable?, hideable?, draggable?, defaultVisible?, width?, group? }`

**Key props:**

| Prop | Notes |
|---|---|
| `data`, `columns` | required |
| `renderCell`, `renderRow`, `renderActions` | custom rendering |
| `onRowClick`, `onSort` | interaction / external sort |
| `storageKey` | persists column visibility/order/width to `localStorage` |
| `selectable`, `selectedItems`, `onSelectAll`, `onSelectItem`, `getItemId`, `showBulkActions`, `bulkActions` | row selection + bulk actions |
| `enableSearch` / `enableGlobalSearch`, `searchTerm`, `onSearchChange`, `onGlobalSearch`, `disableClientSearch` | client-filter or debounced (800ms) server search |
| `pagination`, `manualPagination`, `pageSize`, `currentPage`, `totalPages`, `onPageChange` | internal or externally-controlled pagination |
| `enableExport`, `exportFileName`, `onExport` | CSV export |
| `leftActions`, `rightActions` | toolbar slots |
| `canAddRow`, `onAddRow`, `renderEditableCell`, `readonlyColumns` | inline add-row editing |
| `collapsible`, `getChildrenKey`, `renderChildrenRows` | expandable parent/child rows |
| `loading`, `loadingMessage`, `emptyMessage`, `rowClassName`, `isRowDisabled` | UX states |

**Typical usage:**
```tsx
<EnhancedTable
  data={sites} columns={columns} renderCell={renderCell}
  pagination={false} enableExport exportFileName="sites"
  storageKey="sites-table" enableGlobalSearch
  onGlobalSearch={handleGlobalSearch} leftActions={renderCustomActions()}
  loading={isSearching || loading}
/>
```
Seen in use across `SiteList.tsx`, `BroadcastDashboard.tsx`, `InventoryConsumptionViewPage.tsx`, `BillListPage.tsx`, `AmenitiesList.tsx`, and most other list pages.

### 3.2 `src/components/reusable/`

| File | Purpose |
|---|---|
| `ImageCropper.jsx` | Modal image cropper, multiple selectable aspect ratios — **legacy**, superseded by `ImageCropperr.jsx` |
| `ImageCropperr.jsx` | Cropper with a single fixed `selectedRatio` — used by newer upload components |
| `ImageUploadingButton.jsx` | Styled upload button/preview (`react-images-uploading`) |
| `Pagination.jsx` | Standalone Bootstrap-style pagination — distinct from `ui/pagination.tsx`, used outside `EnhancedTable` |
| `ProjectBannerUpload.jsx` | Multi-ratio banner uploader with cropping + preview grid |
| `ProjectImageVideoUpload.jsx` | Same, plus video upload support |
| `RoundedRadioButtonCard.jsx` | Two-option styled radio card (e.g. "Lifetime" vs "Rolling Year") |

---

## 4. Data Structures / Domain Model

There is no local database — all data is backed by a remote (Rails-style JSON) API. The closest things to a schema are `src/types/*.ts` (hand-written interfaces), `src/schemas/*.ts` (zod form validation), and the shape of `src/store/slices/*` (runtime state per entity).

### 4.1 `src/types/` — key interfaces

| File | Key types |
|---|---|
| `checkpointFilters.ts` | `CheckpointFilters` — patrol hierarchy ids/names: `siteId/Name, buildingId/Name, wingId/Name, areaId/Name, floorId/Name, roomId/Name` |
| `costApproval.ts` | `ApprovalLevel` (`level: L1-L5`, `approvers[]`), `CostApprovalRule`, `CostApprovalPayload/GetResponse`, `FMUserDropdown` |
| `emailRule.ts` | `EmailRule` — `triggerType: PPM\|AMC`, `triggerTo`, role, period |
| `escalationMatrix.ts` | `EscalationLevel` (E1-E5), `PriorityTiming` (P1-P5), `ResponseEscalationRule`, `ResolutionEscalationRule`, matching API payload/response types |
| `projects.ts` | `Project`, `TransformedProject`, `ProjectsListResponse`, `PaginationData`, `Create/UpdateProjectPayload` |
| `restaurant.ts` | Empty — restaurant types are defined inline in `src/store/slices/f&bSlice.ts` |
| `society.ts` | `Society` (large: address, amenities flags, billing/device-rental, IVR config), `SuperSociety`, `EstateBuilder`, `Headquarter`, `Region`, `Zone`, `SocietyFilters` |
| `survey.ts` | `Question`, `Section` |
| `tasks.ts` | `Task` (self-referential `sub_tasks_managements`), `TasksListResponse`, `Create/UpdateTaskPayload`, `ChangeTaskStatusPayload` |
| `visitorPass.ts` | `VisitorPassData` (guest/host info, pass dates, `visitor_identity`, `assets[]`, `additional_visitors[]`, QR/OTP) |

### 4.2 `src/schemas/` — zod form validation

| File | Validates |
|---|---|
| `buildingSchema.ts` | Building form: `name` (1-100 chars), `site_id`, `other_detail`, `has_wing/has_floor/has_area/has_room` (bool, default false), `active` (default true) → `BuildingFormData` |
| `wingSchema.ts` | Wing form: `name`, `building_id`, `active` → `WingFormData` |

### 4.3 Redux — two parallel stores

- **`src/store/store.ts`** — the main app store, ~90+ reducer keys (mostly one per async operation rather than per entity — e.g. `fetchEvents`, `createEvent` as separate keys). Covers AMC, roles, users, helpdesk, escalation matrices, facility bookings, assets, inventory, restaurants, org hierarchy (buildings/wings/floors/zones/rooms), events, broadcasts, work orders, procurement (material PR/purchase orders/service PR/GRN), invoices, wallet, banners, amenities, chat, and the full project-management suite (projects/milestones/tasks/teams/sprints/issues/MoM).
- **`src/redux/store.ts`** — separate, small store for auth/org/company/site switching only (`login`, `oaganizationsByEmail`, `fetchCompanyList`, `changeCompany`, `fetchSiteList`, `changeSite`), defined in `src/redux/login/loginSlice.ts`. Its thunks call `axios` directly against hardcoded hosts, bypassing both `src/api/client.ts` and the main store's conventions.
- **`src/store/api/apiSlice.ts`** and **`src/redux/createApiSlice.ts`** are near-duplicate generic factories: `createApiSlice<T>(name, fetchThunk)` produces a `{loading, success, error, data}` slice bound to one thunk. Most "simple" entity slices (buildings, wings, amc, helpdesk categories, events, wallet, work orders) are built this way.
- Some slices are **hand-rolled `createSlice`** instead, with richer state (`inventorySlice.ts`: `items, loading, error, totalCount, currentPage, totalPages, activeCount`; `hiSocietyUsersSlice.ts`: per-resource loading flags + `pagination`; `roleSlice.ts`: custom reducers like `updateRolePermissions`).
- **No RTK Query** anywhere in the codebase — all fetching is `createAsyncThunk` + axios/services.
- `src/api/` is a third, independent axios+zod layer used only for the helpdesk inbox feature (`client.ts` baseURL `helpdesk-api.lockated.com`, `inboxMessages.ts` with `InboxMessageSchema`) — not wired into either Redux store.

When adding a new entity: check whether an existing slice pattern fits (factory vs hand-rolled) before introducing a fourth pattern, and be aware a "simple" slice has **no built-in pagination** — you'll need to add that yourself if required.

### 4.4 Domain entities ("tables") overview

| Domain area | Entities |
|---|---|
| Org hierarchy | Society, SuperSociety, EstateBuilder, Headquarter, Region, Zone, Building, Wing, Floor, Area, Room, Site |
| Users & access | FM User, Occupant User, VI User, HiSociety User, Role/Permissions, User Group, Function/Department |
| Helpdesk/Ticketing | Helpdesk Category, Complaint/Ticket, Escalation Matrix (Response/Resolution), Cost Approval Rule, Email Rule, Inbox Message |
| Assets/Inventory | Asset, Water Asset, Inventory Item, Inventory Consumption, GRN, Purchase Order, Material PR, Service PR, WBS Code, Supplier |
| Facilities | Facility Setup, Facility Booking, Amenity |
| AMC/Service | AMC Contract, Service, Service Location |
| Visitor/Security | Visitor Pass, Additional Visitor, Checkpoint (patrol), Attendance |
| Events/Comms | Event, Broadcast, Banner, Testimonial, Channel/Conversation, Company Partner |
| Commerce | Restaurant, Menu, Category/Subcategory, Order, Wallet, Wallet Rule, Point Expiry, Customer, Invoice, Currency |
| Project Management | Project, Milestone, Task/Sub-task, Sprint, Issue, MoM, Project Team/Type/Tag/Status/Role/Template/Group |
| Work/Approval flows | Work Order, Purchase Order, Pending Approval, Deletion Request |
| Misc | Address Master, Eco-Friendly List, MSafe Circle, Currency, Admin View Emulation |

---

## 5. Architecture

### 5.1 Routing / layout

- `src/App.tsx` (~7,300 lines) is the single root: `NotificationProvider > QueryClientProvider > EnhancedSelectProvider > LayoutProvider > PermissionsProvider > ActionLayoutProvider > Suspense > Routes`. Most page components are `lazy()`-loaded for code splitting.
- Two top-level route groups, each behind `<ProtectedRoute>`:
  - `"/"` → `<Layout />` (member/tenant shell) — routes pulled from `src/routes/setupMemberRoutes.tsx`, `bmsRoutes.tsx`, `performanceRoutes.tsx`.
  - `/ops-console` → `<AdminLayout />` (admin/back-office shell) — routes defined inline in `App.tsx`.
- Route-level gating is **authentication-only** (`ProtectedRoute`); feature/module-level gating happens **inside pages** via `usePermissions()` (`PermissionsContext`: `isModuleEnabled`, `isFunctionEnabled`, `hasPermissionForPath`), backed by `roleSlice.ts` / `roleWithModulesSlice.ts` and `RoleDashboard` (`src/pages/settings/RoleDashboard.tsx`).

### 5.2 Providers/Contexts (`src/contexts/`, `src/providers/`)

`PermissionsContext`, `UserRoleContext`, `LayoutContext`, `ActionLayoutContext`, `NotificationContext`, `SpeechContext`; `EnhancedSelectProvider`/`GlobalSelectEnhancer` globally patch MUI selects to add search/filter behavior (reflecting the MUI/shadcn mix).

### 5.3 `src/features/` vs `src/pages/` + `src/components/`

- `src/features/{auth,customers,embedded,inbox,settings,superadmin,tickets}` is a **newer, self-contained feature-folder architecture** — appears to be a modernization effort (a separate ticketing/helpdesk app) layered on top of, not yet replacing, the legacy structure.
- `src/pages/` is a **flat legacy structure** with 900+ files (some domains like `Accounting/`, `BMS/`, `ClubManagement/`, `settings/`, `master/`, `setup/`, `admin/`, `mobile/`, `products/` do have subfolders). Numerous `.bak`/`.backup`/`_OLD` files indicate iterative, non-refactored history — check for these before assuming a file is the live version.
- When adding new pages: prefer following the `src/features/` pattern for genuinely new bounded features; extend the existing flat structure only when modifying an existing legacy module, to avoid a third half-migrated pattern.

### 5.4 `src/pages/` module map

Accounting (GL/AP/AR, invoices, GST), AdminCompass (internal team KPIs/meetings), BMS (building helpdesk tickets), BusinessCompass (internal ops reporting), ClubManagement (amenities/bookings + overlapping accounting reports), CompanyHub (company jobs), admin (admin users/business overview/SOPs), communication (events/notices/polls), maintenance (cost approvals, escalation matrices, scheduled tasks), master (master data setup), mobile (mobile-optimized variants), ops-console (admin console), products (product picker/marketplace), pulse (safety/SOS, ride-sharing monitoring), settings (roles, approval matrices), setup (onboarding dashboards).

### 5.5 Electron desktop packaging

`electron/main.cjs` creates a `BrowserWindow` (`contextIsolation: true`, `nodeIntegration: false`, `preload.cjs`), overriding CSP to allow `gophygital.work`/`lockated.com` API calls. Dev loads `http://localhost:5173`; production loads bundled `dist/index.html` from `app.asar`. Same codebase serves both web SPA and desktop shell ("FM Matrix", `com.fmmatrix.desktop`).
