## Next.js + Chakra UI Rebuild Plan

- **Goals**:
  - Replace Tailwind-heavy UI with Chakra UI component system while keeping domain logic, server actions, and Prisma models intact.
  - Deliver polished marketing landing page plus streamlined auth & dashboard experiences.
  - Preserve multi-tenant + super admin flows, PayNow integration, and existing API surface.

- **Target Project Structure**:
  - `src/theme/` – Chakra theme extension (`index.ts`, `foundations.ts`, `components.ts`) holding brand colors, typography, component tokens.
  - `src/app/layout.tsx` – wraps pages with Chakra `Providers`, `ColorModeScript`, toaster replacement (Chakra `useToast`).
  - `src/app/(marketing)/page.tsx` – public landing page using Chakra responsive layout, hero, feature grid, testimonials CTA.
  - `src/app/(auth)/` – Chakra-based sign-in, sign-up, verification pages reusing Better Auth server actions.
  - `src/app/(dashboards)/dashboard/` – tenant dashboard shell: `layout.tsx` for sidebar/header, child routes for overview, vehicles, drivers, finances, maintenance, profile, settings.
  - `src/app/(dashboards)/admin/` – super admin portal reimagined with Chakra tables/stat cards.
  - `src/components/ui/` – Chakra composition primitives (AppShell, SidebarNav, StatCard, DataTable, FormField, EmptyState, ConfirmationDialog, Tag).
  - `src/features/` – domain-focused modules (vehicles, drivers, finances, remittances, admin) combining server queries + Chakra UI.
  - `src/server/queries/` – cohesive data fetchers that wrap Prisma calls and encapsulate tenant context, feeding React Server Components.

- **Data & Logic Preservation**:
  - Continue using existing `src/server/actions/*` and `src/lib/*` for mutations/auth; expose new helper hooks/components around Chakra forms.
  - Introduce `src/server/queries/dashboard.ts` etc. to collate data for Chakra dashboards, mirroring logic from current pages.
  - Reuse Prisma schemas, PayNow integration, email/SMS services, analytics tracker unchanged.

- **UI/UX Guidelines**:
  - Brand palette: Primary `#1e3a8a`, accent `#38bdf8`, neutrals aligned with Chakra gray scale; support light/dark via Chakra color mode.
  - Landing page sections: Hero with CTA (trial signup), Features (cards for Fleet Visibility, Automated Remittances, Driver Compliance), Metrics, Testimonials, Pricing teaser, Contact.
  - Auth screens: Split layout with illustration, Chakra `Card`, social login button, password form, 2FA stepper.
  - Dashboard layout: Persistent sidebar (role-aware nav), topbar with search/notifications/profile, responsive main content; integrate Chakra `Grid`, `Stat`, `Table`, `Tabs`.
  - Provide accessible focus states, consistent spacing, motion using Framer Motion where helpful.

- **Migration Steps**:
  1. Add Chakra dependencies (`@chakra-ui/react`, `@chakra-ui/next-js`, `@emotion/react`, `@emotion/styled`, `framer-motion`).
  2. Create theme + provider glue (`src/theme/index.ts`, update `src/app/providers.tsx` to `ChakraProviders`).
  3. Scaffold shared UI primitives and layout shell components.
  4. Build landing page and auth flows with Chakra forms powering existing server actions.
  5. Implement new tenant dashboard overview with Chakra components, wiring up server queries.
  6. Port key modules sequentially: Vehicles (list + forms), Drivers (table + assignment dialog), Finances (income/expense, remittances), Maintenance, Settings.
  7. Port super admin portal pages (analytics, tenants, payments, reconciliation) leveraging existing APIs.
  8. Replace Tailwind toasts with Chakra `useToast`; unify form validation messages.
  9. Remove unused Tailwind CSS once Chakra rewrite complete (optional final sweep).
  10. Document architecture, component usage guidelines, and migration notes.

- **Risks & Mitigations**:
  - **CSS Conflicts**: Maintain Tailwind styles during transition; scope new Chakra components with `ChakraProvider` and gradually retire old CSS.
  - **Server/Client Separation**: Chakra components run client-side; use React Server Components for data fetching, pass results as props to client components when necessary.
  - **Toast/Theme Switching**: Replace `next-themes` usage with Chakra `ColorModeProvider`; ensure analytics & background sync hooks work post-wrap.
  - **Form Validation**: Continue using `react-hook-form` + `zod` with Chakra `FormControl` wrappers to avoid regressions.

- **Deliverables**:
  - New Chakra-based landing, auth, tenant dashboard, and super admin layouts.
  - Shared component library and theme.
  - Updated documentation (`docs/` or README section) outlining new structure, theming, and migration instructions.
