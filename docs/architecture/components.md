# Component Library

All shared React components used across the NEUPC Platform, organized by category.

Components live under `app/_components/` (shared) and `app/account/_components/` (dashboard-specific).

---

## UI Components — `app/_components/ui/`

Reusable building blocks used across public pages and dashboards.

### Layout & Shell

| Component | File | Description |
|---|---|---|
| `PageShell` | `PageShell.js` | Consistent page wrapper with max-width and padding |
| `PageBackground` | `PageBackground.js` | Animated gradient background for public pages |
| `PageHero` | `PageHero.js` | Hero section with title, subtitle, and decorative elements |
| `SectionContainer` | `SectionContainer.js` | Padded section wrapper for consistent spacing |
| `SectionHeader` | `SectionHeader.js` | Section title + subtitle + optional accent line |
| `SectionBackground` | `SectionBackground.js` | Decorative section background with gradient |
| `ResponsiveGrid` | `ResponsiveGrid.js` | CSS Grid wrapper with responsive column config |
| `Navbar` | `Navbar.js` | Main navigation bar with mobile menu, auth state |
| `Wave` | `Wave.js` | SVG wave separator between sections |

### Interactive Elements

| Component | File | Description |
|---|---|---|
| `Button` | `Button.js` | Polymorphic button with variants (primary, secondary, ghost, danger) |
| `Modal` | `Modal.js` | Accessible modal dialog with backdrop |
| `FilterPanel` | `FilterPanel.js` | Multi-filter panel with dropdowns and search |
| `Pagination` | `Pagination.js` | Full page navigation with page numbers |
| `InlinePagination` | `InlinePagination.js` | Compact previous/next pagination |
| `ScrollToTop` | `ScrollToTop.js` | Floating scroll-to-top button |
| `JoinButton` | `JoinButton.js` | CTA button for joining the club |
| `SignInButton` | `SignInButton.js` | Google OAuth sign-in button |

### Content Display

| Component | File | Description |
|---|---|---|
| `Avatar` | `Avatar.js` | User avatar with fallback initials |
| `SafeImg` | `SafeImg.js` | Image with error fallback |
| `EventCard` | `EventCard.js` | Event card with status badge, date, category |
| `GlassCard` | `GlassCard.js` | Frosted glass card effect |
| `FeaturedSpotlight` | `FeaturedSpotlight.js` | Featured content spotlight section |
| `CTASection` | `CTASection.js` | Call-to-action section with gradient background |
| `EmptyState` | `EmptyState.js` | Empty state placeholder with icon and message |
| `Skeleton` | `Skeleton.js` | Loading skeleton placeholders (text, card, table) |
| `SocialIcons` | `SocialIcons.js` | Social media icon links |
| `Logo` | `Logo.js` | Club logo component |

### Rich Content

| Component | File | Description |
|---|---|---|
| `RichTextEditor` | `RichTextEditor.js` | TipTap v3 rich text editor with 12+ extensions |
| `CodePlayground` | `CodePlayground.js` | Interactive code editor with execution via Wandbox |
| `BlogComments` | `BlogComments.js` | Blog comment thread UI |
| `GiscusComments` | `GiscusComments.js` | GitHub Discussions-powered comments |

### SEO & Meta

| Component | File | Description |
|---|---|---|
| `JsonLd` | `JsonLd.js` | Structured data (Organization, Website, Article, Event) |
| `SVG` | `SVG.js` | Inline SVG icon collection |

### Providers

| Component | File | Description |
|---|---|---|
| `ToasterProvider` | `ToasterProvider.js` | `react-hot-toast` provider |
| `UserRoleProvider` | `UserRoleProvider.js` | React context for current user role |
| `TopProgressBar` | `TopProgressBar.js` | Page navigation progress bar |
| `ScrollReveal` | `ScrollReveal.js` | Intersection Observer reveal animation wrapper |

---

## Homepage Sections — `app/_components/sections/`

Server-rendered sections composing the homepage.

| Component | File | Description |
|---|---|---|
| `Header` | `Header.js` | Site header (wraps Navbar) |
| `Hero` | `Hero.js` | Homepage hero with animated text and CTA |
| `About` | `About.js` | Club introduction section |
| `Events` | `Events.js` | Featured events carousel |
| `FeaturedEventSlider` | `FeaturedEventSlider.js` | Auto-scrolling event slider |
| `Blogs` | `Blogs.js` | Trending blog posts grid |
| `FeaturedBlogSlider` | `FeaturedBlogSlider.js` | Auto-scrolling blog slider |
| `Achievements` | `Achievements.js` | Achievement highlights and stats |
| `Join` | `Join.js` | Join CTA section with benefits |
| `Footer` | `Footer.js` | Site footer with links, social, contact |
| `Navigation` | `Navigation.js` | Navigation configuration |

---

## Motion Components — `app/_components/motion/`

Framer Motion animation wrappers. All respect `prefers-reduced-motion`.

| Component | File | Description |
|---|---|---|
| `MotionSection` | `MotionSection.js` | Scroll-triggered section fade-in |
| `MotionContainer` | `MotionContainer.js` | Container with staggered child animations |
| `MotionStagger` | `MotionStagger.js` | Staggered item reveal (for lists/grids) |
| `MotionCard` | `MotionCard.js` | Card with hover lift and tap scale |
| `MotionFadeIn` | `MotionFadeIn.js` | Simple fade-in on scroll |
| `PageTransition` | `PageTransition.js` | Page-level route transition |
| `motion` | `motion.js` | Shared animation variants and presets |

---

## Chat Components — `app/_components/chat/`

Real-time chat system powered by Supabase Realtime.

| Component | File | Description |
|---|---|---|
| `ChatFAB` | `ChatFAB.js` | Floating action button (bottom-right) with unread badge |
| `ChatPanel` | `ChatPanel.js` | Main chat panel with conversation list and thread |
| `ChatPanelHeader` | `ChatPanelHeader.js` | Chat header with back button and user info |
| `ConversationList` | `ConversationList.js` | List of all conversations |
| `ConversationItem` | `ConversationItem.js` | Single conversation preview item |
| `MessageThread` | `MessageThread.js` | Scrollable message history |
| `MessageBubble` | `MessageBubble.js` | Individual message bubble with edit/delete |
| `MessageComposer` | `MessageComposer.js` | Text input with file attachment support |
| `NewChatPicker` | `NewChatPicker.js` | User search to start new conversations |
| `EmptyState` | `EmptyState.js` | No conversations empty state |

---

## Account Components — `app/account/_components/`

Dashboard-specific components used across all role dashboards.

| Component | File | Description |
|---|---|---|
| `AccountLayoutClient` | `AccountLayoutClient.js` | Dashboard layout with sidebar + content area |
| `AccountSidebar` | `AccountSidebar.js` | Collapsible sidebar with role-specific navigation |
| `AccountHeader` | `AccountHeader.js` | Dashboard top bar |
| `RoleContext` | `RoleContext.js` | React context for active role management |
| `RoleCard` | `RoleCard.js` | Role selection card (for multi-role users) |
| `RoleSync` | `RoleSync.js` | Syncs role between session and UI |
| `AvailableRoles` | `AvailableRoles.js` | Grid of available role cards |
| `UserAvatar` | `UserAvatar.js` | Avatar with upload and edit capability |
| `AccountPageClient` | `AccountPageClient.js` | Account hub page client component |
| `AccountStatusMessages` | `AccountStatusMessages.js` | Status banners (pending, suspended, banned) |
| `PendingRoleAssignment` | `PendingRoleAssignment.js` | Pending state UI for users without roles |
| `UpgradeBanner` | `UpgradeBanner.js` | CTA to apply for membership upgrade |
| `ComingSoon` | `ComingSoon.js` | Placeholder for unimplemented features |
| `AccountLoading` | `AccountLoading.js` | Dashboard loading skeleton |
| `AccountError` | `AccountError.js` | Dashboard error boundary UI |
| `AccountNotFoundState` | `AccountNotFoundState.js` | 404 state for dashboard pages |

---

## Creating New Components

1. Place shared components in `app/_components/ui/`
2. Place page-specific components next to their page file
3. Use `"use client"` only when browser APIs or React state are needed
4. Follow naming: `PascalCase.js`
5. Import via `@/app/_components/...`
