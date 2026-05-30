/**
 * @file Resource grid component
 * @module ResourceGrid
 */

import ResourceCard from '@/app/_components/resources/ResourceCard';
import { Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

export default function ResourceGrid({
  resources,
  showAdminActions = false,
  onEdit,
  onDelete,
  bookmarkedIds = [],
  onToggleBookmark,
  detailBasePath = '',
  onOpenResource,
}) {
  if (!resources?.length) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center rounded-[24px] border border-dashed border-white/[0.08] bg-white/[0.01] px-6 py-20 text-center backdrop-blur-md"
        role="status"
      >
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-[14px] bg-white/[0.03] shadow-inner">
          <Search className="h-6 w-6 text-white/30" />
        </div>
        <p className="text-[15px] font-semibold text-white/80">
          No resources found
        </p>
        <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-white/40">
          We couldn't find any resources matching your current filters. Try
          adjusting your search criteria.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
      role="list"
      aria-label={`${resources.length} resource${resources.length !== 1 ? 's' : ''}`}
    >
      <AnimatePresence mode="popLayout">
        {resources.map((resource) => (
          <ResourceCard
            key={resource.id}
            resource={resource}
            showAdminActions={showAdminActions}
            onEdit={onEdit}
            onDelete={onDelete}
            bookmarked={bookmarkedIds.includes(resource.id)}
            onToggleBookmark={onToggleBookmark}
            detailBasePath={detailBasePath}
            onOpen={onOpenResource}
          />
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
