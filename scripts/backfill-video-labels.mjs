/**
 * Backfill missing video labels in lesson content blocks.
 * Each video label is set to "Class <lessonSerial>" (or "Class <serial>.<n>" for multi-video blocks).
 * Lesson serial = 1-based position across all lessons in the bootcamp, sorted by order_index.
 *
 * Run: node scripts/backfill-video-labels.mjs [--dry-run]
 */

import { createClient } from '@supabase/supabase-js';

const DRY_RUN = process.argv.includes('--dry-run');

const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
);

async function main() {
  // Fetch all bootcamps
  const { data: bootcamps, error: bErr } = await supabase
    .from('bootcamps')
    .select('id, title');
  if (bErr) throw bErr;

  let totalUpdated = 0;

  for (const bootcamp of bootcamps) {
    // Fetch full course/module/lesson hierarchy ordered correctly
    const { data: courses, error: cErr } = await supabase
      .from('courses')
      .select(`
        id, order_index,
        modules (
          id, order_index,
          lessons (
            id, title, content, order_index
          )
        )
      `)
      .eq('bootcamp_id', bootcamp.id)
      .order('order_index');
    if (cErr) throw cErr;

    // Flatten lessons in order
    const allLessons = courses
      .sort((a, b) => a.order_index - b.order_index)
      .flatMap(c =>
        (c.modules || [])
          .sort((a, b) => a.order_index - b.order_index)
          .flatMap(m =>
            (m.lessons || []).sort((a, b) => a.order_index - b.order_index)
          )
      );

    // Pre-parse all content and build video-only serial index
    const parsedLessons = allLessons.map(l => {
      let blocks = null;
      try { blocks = l.content ? JSON.parse(l.content) : null; } catch {}
      const hasVideo = Array.isArray(blocks) && blocks.some(b => b.type === 'video');
      return { ...l, blocks, hasVideo };
    });
    const videoLessons = parsedLessons.filter(l => l.hasVideo);
    const serialMap = new Map(videoLessons.map((l, i) => [l.id, i + 1]));

    for (const lesson of parsedLessons) {
      const serial = serialMap.get(lesson.id);
      if (!serial) continue;

      const blocks = lesson.blocks;
      if (!Array.isArray(blocks)) continue;

      let modified = false;

      for (const block of blocks) {
        if (block.type !== 'video') continue;
        const videos = block.data?.videos;
        if (!Array.isArray(videos)) continue;

        videos.forEach((vid, idx) => {
          const vidNum = idx > 0 ? `.${idx + 1}` : '';
          const title = lesson.title ? `: ${lesson.title}` : '';
          const expected = `Class ${serial}${vidNum}${title}`;
          if (vid.label !== expected) {
            vid.label = expected;
            modified = true;
          }
        });
      }

      if (!modified) continue;

      console.log(`[${DRY_RUN ? 'DRY' : 'UPDATE'}] Bootcamp "${bootcamp.title}" — Lesson ${serial}: "${lesson.title}"`);

      if (!DRY_RUN) {
        const { error: uErr } = await supabase
          .from('lessons')
          .update({ content: JSON.stringify(blocks) })
          .eq('id', lesson.id);
        if (uErr) throw uErr;
      }

      totalUpdated++;
    }
  }

  console.log(`\nDone. ${totalUpdated} lesson(s) ${DRY_RUN ? 'would be' : 'were'} updated.`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
