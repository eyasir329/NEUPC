/**
 * @file Member panel _ui — re-exports the shared dashboard primitives
 *   from app/account/_components/ui/dashboard.js. The primitives were
 *   promoted to the shared location so other panels (advisor, executive)
 *   can use the same visual language.
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
} from '../../../_components/ui/dashboard';
