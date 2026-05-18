/**
 * @file Shared dashboard UI primitives barrel.
 *
 * The dark-glass primitives (PageShell, GlassCard, StatCard, etc.) live
 * in ./dashboard.js and are used by the member, advisor, and executive
 * panels. The Card/Button/Badge files predate them — kept as direct
 * imports because nothing currently routes through this barrel for them.
 *
 * @module account/ui
 */

export {
  PageShell,
  PageHeader,
  GlassCard,
  SectionHeader,
  IconChip,
  StatCard,
  Pill,
  GradientBar,
  TabBar,
  EmptyState,
  ActionButton,
  Avatar,
  Sparkline,
  StaggerList,
} from './dashboard';
