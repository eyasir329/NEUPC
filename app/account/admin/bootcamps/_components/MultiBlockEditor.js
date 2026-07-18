/**
 * @file Multi block editor component
 * @module MultiBlockEditor
 */

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  GripVertical,
  Type,
  Code,
  FileCode2,
  FileText,
  Play,
  BookOpen,
  Youtube,
  HardDrive,
  Upload,
  CheckCircle,
  Loader2,
  AlertCircle,
  Image as ImageIcon,
  Sparkles,
  Copy,
  CheckSquare,
  HelpCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import RichTextEditor from '@/app/_components/ui/RichTextEditor';
import CodeMirror from '@uiw/react-codemirror';
import { html } from '@codemirror/lang-html';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';
import {
  VIDEO_SOURCES,
  getVideoSourceConfig,
  formatDurationSeconds,
} from '@/app/account/_components/bootcamps/bootcampConfig';
import {
  validateDriveVideo,
  uploadLessonImageAction,
  generateExamQuestionsAction,
  generatePracticeProblemsAction,
} from '@/app/_lib/actions/bootcamp-actions';
import { extractDriveFileId, driveImageUrl } from '@/app/_lib/utils/utils';
import MarkdownPreview from '@/app/_components/markdown/MarkdownPreview';

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function parseContentBlocks(content) {
  if (!content) return [];
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) {
      // Ensure all blocks have an ID
      return parsed.map((block) => ({
        id: block.id || crypto.randomUUID(),
        ...block,
      }));
    }
  } catch (e) {
    // If parsing fails, it's likely legacy HTML/string content
  }
  return [{ id: crypto.randomUUID(), type: 'richText', content }];
}

const BLOCK_TYPES = [
  {
    id: 'richText',
    label: 'Rich Text',
    icon: Type,
    description: 'WYSIWYG editor for standard content',
  },
  {
    id: 'markdown',
    label: 'Markdown',
    icon: FileText,
    description: 'Write content using Markdown syntax',
  },
  {
    id: 'html',
    label: 'HTML',
    icon: FileCode2,
    description: 'Raw HTML and inline styling',
  },
  {
    id: 'video',
    label: 'Video',
    icon: Play,
    description: 'Embed a video from Google Drive or YouTube',
  },
  {
    id: 'image',
    label: 'Image',
    icon: ImageIcon,
    description: 'Embed an image using a URL',
  },
  {
    id: 'practice',
    label: 'Practice Problems',
    icon: CheckSquare,
    description: 'Embed a Practice Problems Cockpit',
  },
  {
    id: 'exam',
    label: 'Exam Module',
    icon: HelpCircle,
    description: 'Embed an Exam / Quiz panel',
  },
  {
    id: 'lessonPlan',
    label: 'Lesson Plan',
    icon: BookOpen,
    description: 'Structured nested layout',
  },
];

const AI_PROMPTS = {
  richText: `You are a senior technical content designer for a premium coding bootcamp platform.
Your task is to transform raw lesson data into polished Rich Text (HTML) that will be rendered inside a WYSIWYG editor output.

## Rendering Context
- Dark background (#080b11), light text (#d4e4fa)
- Content area max-width: ~1024px (standard) up to ~1152px (large screens)
- NO external CSS classes are applied — your content must be self-contained
- The output is injected via dangerouslySetInnerHTML

## Spacing & Layout (use these exact values)
- Sections: margin-bottom 32px between major sections
- Headings:
  - <h2>: margin-top 40px, margin-bottom 16px, padding-bottom 8px
  - <h3>: margin-top 28px, margin-bottom 12px
  - <h4>: margin-top 20px, margin-bottom 8px
- Paragraphs: margin-bottom 16px, line-height 1.75
- Lists: margin 16px 0, padding-left 24px, li margin-bottom 10px
- Tables: margin 24px 0
- Blockquotes/Callouts: margin 24px 0, padding 16px 20px
- Between heading and first paragraph: margin 0 (heading margin-bottom handles it)

## Code Block Styling
- DO NOT paste inline-styled HTML for code blocks — they will not render correctly.
- Instead, output code as a SEPARATE **markdown block** with triple-backtick fences:
  \`\`\`js
  // your code here
  \`\`\`
  The platform's unified markdown renderer applies consistent code-block chrome
  (header with language label + Copy button, hljs syntax highlighting, dark
  background, scroll on overflow).
- For inline code in the rich text, simply wrap with single backticks: \`code\`.

## Other Formatting Rules
1. **Headings**: Use <h2> for main sections, <h3> for sub-topics, <h4> for details. Keep headings short (under 60 chars).
2. **Paragraphs**: Use <p> tags. Keep paragraphs to 3-4 sentences max for readability.
3. **Lists**: Use <ul> or <ol> with clear, scannable bullet points. Each item should be a single idea.
4. **Tables**: Use <table> with clear headers. Limit to 5-6 columns max so it fits the wider viewport.
5. **Callouts**: Use <blockquote> for tips, warnings, and important notes. Prefix with emoji: 💡 Pro Tip, ⚠️ Warning, 📌 Important.
6. **Images**: If needed, use placeholder text like [IMAGE: description] — do not use broken URLs.

## Content Structure
- Start with a brief overview (2-3 sentences) of what the learner will gain
- Break content into logical sections with clear headings
- End each section with a key takeaway or action item
- Use bold for key terms on first mention
- Aim for scannable content — a learner should be able to skim headings and get the gist

## Tone
Professional, encouraging, and concise. Write for developers who value clarity over fluff.

---
Raw Data:
[PASTE YOUR DATA HERE]`,

  html: `You are a senior UI engineer and content designer for a premium coding bootcamp.
Your task is to transform raw lesson data into beautifully styled, self-contained HTML that will be rendered directly inside a dark-themed lesson viewer.

## Rendering Context
- Background: #080b11 (near-black), container max-width: ~1024px to ~1152px
- NO external CSS classes or stylesheets are available
- ALL styling must be inline using the style="" attribute
- The output is injected via dangerouslySetInnerHTML — it must be valid HTML

## Design System (use these exact values)
- Text primary: #d4e4fa | Secondary: #908fa0 | Muted: #464554
- Accent: #8083ff (violet) | Success: #34d399 | Warning: #fbbf24 | Error: #f87171
- Surface: #010f1f (cards) | Border: #273647 | Hover-surface: #122131
- Font: system-ui, -apple-system, sans-serif | Code font: 'JetBrains Mono', 'Fira Code', monospace

## Spacing & Layout (STRICT — use these exact pixel values)
- Page wrapper: padding 0 (already handled by container)
- Sections: margin-bottom 32px
- <h2>: font-size 22px, font-weight 800, color #d4e4fa, margin-top 40px, margin-bottom 16px, padding-bottom 8px, border-bottom 1px solid #273647
- <h3>: font-size 18px, font-weight 700, color #c0c1ff, margin-top 28px, margin-bottom 12px
- <h4>: font-size 15px, font-weight 600, color #d4e4fa, margin-top 20px, margin-bottom 8px
- <p>: font-size 15px, line-height 1.75, color #908fa0, margin-bottom 16px
- <ul>/<ol>: margin 16px 0, padding-left 24px
- <li>: margin-bottom 10px, line-height 1.6, color #908fa0, font-size 15px
- <table>: margin 24px 0, width 100%
- <th>: padding 12px 16px, text-align left
- <td>: padding 10px 16px
- <blockquote>: margin 24px 0, padding 16px 20px

## Code Blocks (IMPORTANT — DO NOT emit inline-style HTML)
The platform's unified markdown renderer renders all code blocks identically
(One Dark Pro hljs palette, header with language label + Copy button, dark
background, horizontal scroll). For code, output it as a SEPARATE **markdown
block** with triple-backtick fences:

\`\`\`js
// your code here
\`\`\`

The \`html\` block type is reserved for legitimate raw HTML (e.g. embedded
iframes, custom components) — not for code blocks. If you need to embed
inline code in rich text, use single backticks: \`code\`.

## Callout Boxes (use this pattern)
<div style="border-left:4px solid ACCENT_COLOR; background:#010f1f; padding:16px 20px; border-radius:0 12px 12px 0; margin:24px 0; display:flex; gap:12px; align-items:flex-start;">
  <span style="font-size:20px; line-height:1;">EMOJI</span>
  <div>
    <strong style="color:#d4e4fa; font-size:14px; display:block; margin-bottom:4px;">TITLE</strong>
    <p style="color:#908fa0; font-size:14px; line-height:1.6; margin:0;">CONTENT</p>
  </div>
</div>
Use: 💡 Tip (#34d399) | ⚠️ Warning (#fbbf24) | 📌 Important (#8083ff) | 🚨 Caution (#f87171)

## Table Styling
<table style="width:100%; border-collapse:collapse; margin:24px 0; border-radius:10px; overflow:hidden; border:1px solid #273647;">
  <thead>
    <tr style="background:#122131;">
      <th style="padding:12px 16px; text-align:left; font-size:13px; font-weight:700; color:#d4e4fa; border-bottom:2px solid #273647;">Header</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="padding:10px 16px; font-size:14px; color:#908fa0; border-bottom:1px solid #1a2535;">Data</td>
    </tr>
  </tbody>
</table>

## Responsive Rules
- All content must fit within ~1024px - ~1152px width
- Tables: max 6-8 columns (utilize the wider display)
- Code blocks: overflow-x auto, max ~100 chars per line preferred
- No fixed widths — use max-width and percentages
- Design for premium, spacious feel. Avoid crowded layouts.

## Content Structure
- Brief overview paragraph at the top
- Logical sections with clear headings and visual separation
- Key concepts highlighted in callout boxes
- Practical code examples with language labels
- Summary or key takeaways at the bottom

## Tone
Professional, encouraging, and clear. Write for developers who appreciate clean design and clarity.

---
Raw Data:
[PASTE YOUR DATA HERE]`,

  markdown: `You are a senior technical writer for a premium coding bootcamp platform.
Your task is to transform raw lesson data into clean, well-structured Markdown that will be converted to HTML and rendered in a dark-themed viewer.

## Rendering Context
- The Markdown is processed by remark/remark-html and rendered in a dark UI (#080b11 background)
- Container max-width: ~1024px to ~1152px
- No custom CSS classes are applied to the output
- Code blocks will automatically get a copy button via client-side JavaScript

## Spacing Rules (Markdown naturally creates these, but be intentional)
- Always leave a blank line between paragraphs
- Always leave a blank line before and after headings
- Always leave a blank line before and after code blocks
- Always leave a blank line before and after lists
- Always leave a blank line before and after blockquotes
- Always leave a blank line before and after tables
- Use --- (horizontal rule) between major sections for extra visual separation

## Formatting Rules
1. **Headings**: Use ## for main sections, ### for sub-topics, #### for minor details. Keep them short and descriptive.
2. **Paragraphs**: Write concise paragraphs (3-4 sentences max). Leave a blank line between paragraphs.
3. **Code**:
   - Inline: Use single backticks for \`variable names\`, \`functions()\`, \`commands\`
   - Blocks: Use triple backticks with language identifier (e.g. \`\`\`python). Keep under 20 lines.
   - ALWAYS specify the language after opening backticks for syntax context
   - Keep code lines under 100 characters to avoid horizontal scrolling
4. **Lists**: 
   - Use bullet lists (-) for unordered items
   - Use numbered lists (1.) for sequential steps
   - Keep items to 1-2 lines each
   - Indent sub-items with 2 spaces
5. **Tables**: Use standard Markdown tables with alignment. Max 6-7 columns.
6. **Emphasis**: Use **bold** for key terms, *italic* for emphasis.
7. **Callouts**: Use blockquotes with emoji prefixes:
   - > 💡 **Pro Tip:** helpful advice here
   - > ⚠️ **Warning:** things to watch out for
   - > 📌 **Important:** critical information
   - > 🚨 **Caution:** dangerous operations
8. **Horizontal rules**: Use --- to separate major sections with extra breathing room.

## Content Structure
- Start with a brief overview of the lesson topic (2-3 sentences)
- Organize into clear sections with descriptive headings
- Include practical code examples with language labels
- Add callout boxes for tips, warnings, and key concepts
- End with a summary section: "## Key Takeaways" with bullet points
- Keep the total content readable in 5-10 minutes

## Width & Readability
- Keep lines under 100 characters where possible
- Tables should have max 6-7 columns to fit the wider viewport
- Code blocks should not require horizontal scrolling (max ~100 chars per line)
- Use short, scannable headings
- Leverage the expanded width for clearer comparisons and better-spaced code.

## Tone
Professional, encouraging, and developer-friendly. No filler — every sentence should add value.

---
Raw Data:
[PASTE YOUR DATA HERE]`,
};

const AI_PROMPT_IDEA = (type) => AI_PROMPTS[type] || AI_PROMPTS.richText;

function PromptButton({ type }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(AI_PROMPT_IDEA(type));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex items-center gap-1.5 rounded border border-[#8083ff]/20 bg-[#8083ff]/10 px-2 py-1 text-[10px] font-medium text-[#c0c1ff] transition-colors hover:bg-[#8083ff]/20"
      title="Copy AI Prompt Idea"
    >
      {copied ? (
        <CheckCircle className="h-3 w-3 text-emerald-400" />
      ) : (
        <Sparkles className="h-3 w-3" />
      )}
      {copied ? 'Copied Idea!' : 'AI Prompt Idea'}
    </button>
  );
}

// Video Source Icons mapping
const VIDEO_ICONS = {
  none: FileText,
  drive: HardDrive,
  youtube: Youtube,
  upload: Upload,
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function MultiBlockEditor({
  value,
  onChange,
  uploadImageAction: uploadImageActionProp,
  lessonSerial,
  lessonTitle,
}) {
  const uploadImageAction = uploadImageActionProp || uploadLessonImageAction;
  const [blocks, setBlocks] = useState(() => parseContentBlocks(value));
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragHandleActive, setDragHandleActive] = useState(null);
  const [aiModalConfig, setAiModalConfig] = useState(null); // { type: 'practice' | 'exam', blockId, input: string, generating: boolean }

  // Track the last value received from outside to detect external changes.
  const lastReceivedRef = useRef(value);

  // Sync value changes from outside (e.g. when switching selected lesson).
  // Only re-parse when the incoming value actually differs from what we last received.
  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    lastReceivedRef.current = value;
    setBlocks(parseContentBlocks(value));
  }

  // Sync local blocks back to the parent (onChange).
  // Skip emit when the serialized content matches what we last received from outside
  // (prevents the receive→emit→receive loop).
  useEffect(() => {
    const serialized = JSON.stringify(blocks);
    if (serialized !== lastReceivedRef.current) {
      lastReceivedRef.current = serialized;
      onChange(serialized);
    }
  }, [blocks, onChange]);

  const updateBlocks = useCallback((newBlocks) => {
    setBlocks(newBlocks);
  }, []);

  const updateBlock = useCallback((id, updates) => {
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b;
        const resolvedUpdates =
          typeof updates === 'function' ? updates(b) : updates;
        const nb = { ...b, ...resolvedUpdates };
        // Deep merge data if provided
        if (resolvedUpdates.data) {
          nb.data = { ...(b.data || {}), ...resolvedUpdates.data };
        }
        return nb;
      })
    );
  }, []);

  const addBlock = (type) => {
    const newBlock = { id: crypto.randomUUID(), type, content: '' };
    setBlocks((prev) => [...prev, newBlock]);
    setShowAddMenu(false);
  };

  const updateBlockContent = (id, content) => {
    updateBlock(id, { content });
  };

  const updateBlockData = (id, data) => {
    updateBlock(id, { data });
  };

  // validateDrive has been moved to the video block render logic

  const removeBlock = (id) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  };

  const moveBlock = (index, direction) => {
    if (
      (direction === -1 && index === 0) ||
      (direction === 1 && index === blocks.length - 1)
    )
      return;

    setBlocks((prev) => {
      const newBlocks = [...prev];
      const temp = newBlocks[index];
      newBlocks[index] = newBlocks[index + direction];
      newBlocks[index + direction] = temp;
      return newBlocks;
    });
  };

  const handleAiBlockImport = async () => {
    if (!aiModalConfig || !aiModalConfig.input.trim()) return;
    setAiModalConfig((prev) => ({ ...prev, generating: true }));
    try {
      if (aiModalConfig.type === 'practice') {
        const res = await generatePracticeProblemsAction(
          aiModalConfig.input,
          aiModalConfig.guidelines || '',
          aiModalConfig.difficulty || 'medium'
        );
        if (res.success && Array.isArray(res.problems)) {
          const block = blocks.find((b) => b.id === aiModalConfig.blockId);
          const currentProbs = block?.data?.practice_problems || [];
          const mergedProblems = [
            ...currentProbs,
            ...res.problems.map((p) => ({
              id: p.id || crypto.randomUUID(),
              name: p.name || '',
              source: p.source || '',
              url: p.url || '',
              video_url: p.video_url || '',
              editorial: p.editorial || '',
              solution_code: p.solution_code || '',
              points: p.points || 5,
            })),
          ];
          updateBlock(aiModalConfig.blockId, {
            data: { practice_problems: mergedProblems },
          });
          setAiModalConfig(null);
        } else {
          toast.error(
            res.error || 'Failed to parse practice problems with AI.'
          );
        }
      } else if (aiModalConfig.type === 'exam') {
        const res = await generateExamQuestionsAction(
          aiModalConfig.input,
          aiModalConfig.guidelines || '',
          aiModalConfig.difficulty || 'medium'
        );
        if (res.success && Array.isArray(res.questions)) {
          const block = blocks.find((b) => b.id === aiModalConfig.blockId);
          const currentQuests = block?.data?.exam_questions || [];
          const mergedQuestions = [
            ...currentQuests,
            ...res.questions.map((q) => ({
              id: q.id || crypto.randomUUID(),
              question: q.question || '',
              options: Array.isArray(q.options) ? q.options : ['', '', '', ''],
              correct_option: Number.isInteger(q.correct_option)
                ? q.correct_option
                : 0,
              points: q.points || 5,
            })),
          ];
          updateBlock(aiModalConfig.blockId, {
            data: { exam_questions: mergedQuestions },
          });
          setAiModalConfig(null);
        } else {
          toast.error(res.error || 'Failed to parse exam questions with AI.');
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('An error occurred during AI parsing.');
    } finally {
      setAiModalConfig((prev) =>
        prev ? { ...prev, generating: false } : null
      );
    }
  };

  const renderEditor = (block) => {
    if (block.type === 'richText') {
      return (
        <div className="bg-[#051424]">
          <RichTextEditor
            value={block.content}
            onChange={(val) => updateBlockContent(block.id, val)}
            uploadImageAction={uploadImageAction}
            placeholder="Write your content here..."
            minHeight="200px"
          />
        </div>
      );
    }

    if (block.type === 'markdown') {
      return (
        <div className="group/editor relative">
          <div className="absolute top-2 right-2 z-10 opacity-0 transition-opacity group-hover/editor:opacity-100">
            <PromptButton type="markdown" />
          </div>
          <CodeMirror
            value={block.content}
            height="auto"
            minHeight="200px"
            theme={oneDark}
            extensions={[markdown({ base: markdownLanguage })]}
            onChange={(val) => updateBlockContent(block.id, val)}
            className="overflow-hidden text-sm"
          />
        </div>
      );
    }

    if (block.type === 'html') {
      return (
        <div className="group/editor relative">
          <div className="absolute top-2 right-2 z-10 opacity-0 transition-opacity group-hover/editor:opacity-100">
            <PromptButton type="html" />
          </div>
          <CodeMirror
            value={block.content}
            height="auto"
            minHeight="200px"
            theme={oneDark}
            extensions={[html()]}
            onChange={(val) => updateBlockContent(block.id, val)}
            className="overflow-hidden text-sm"
          />
        </div>
      );
    }

    if (block.type === 'video') {
      const data = block.data || {};
      let videos = data.videos;

      if (!videos || !Array.isArray(videos)) {
        if (data.video_id) {
          videos = [
            {
              id: crypto.randomUUID(),
              video_source: data.video_source || 'drive',
              video_id: data.video_id,
              validationResult: data.validationResult,
              duration: data.duration,
              validating: data.validating,
            },
          ];
        } else {
          videos = [
            { id: crypto.randomUUID(), video_source: 'drive', video_id: '' },
          ];
        }
      }

      const updateVideo = (vidId, updates) => {
        updateBlock(block.id, (b) => {
          const bData = b.data || {};
          let bVideos = bData.videos || [];
          const newVideos = bVideos.map((vid) =>
            vid.id === vidId ? { ...vid, ...updates } : vid
          );
          return { data: { videos: newVideos } };
        });
      };

      const addVideo = () => {
        updateBlock(block.id, (b) => {
          const bData = b.data || {};
          const bVideos = bData.videos || [];
          const vidNum = bVideos.length > 0 ? `.${bVideos.length + 1}` : '';
          const base = lessonSerial
            ? `Class ${lessonSerial}${vidNum}${lessonTitle ? `: ${lessonTitle}` : ''}`
            : `Video ${bVideos.length + 1}`;
          return {
            data: {
              videos: [
                ...bVideos,
                {
                  id: crypto.randomUUID(),
                  video_source: 'drive',
                  video_id: '',
                  label: base,
                },
              ],
            },
          };
        });
      };

      const removeVideo = (vidId) => {
        updateBlock(block.id, (b) => {
          const bData = b.data || {};
          const bVideos = bData.videos || [];
          return { data: { videos: bVideos.filter((v) => v.id !== vidId) } };
        });
      };

      const validateDriveMulti = async (vid) => {
        const videoId = vid.video_id;
        if (!videoId) return;

        updateVideo(vid.id, { validating: true, validationResult: null });
        try {
          const result = await validateDriveVideo(videoId);
          updateVideo(vid.id, {
            validationResult: result,
            video_id: result.valid && result.fileId ? result.fileId : videoId,
            duration:
              result.valid && result.duration
                ? result.duration
                : vid.duration || 0,
          });
        } catch (err) {
          updateVideo(vid.id, {
            validationResult: { valid: false, error: err.message },
          });
        } finally {
          updateVideo(vid.id, { validating: false });
        }
      };

      return (
        <div className="flex flex-col gap-6 bg-[#051424] p-4">
          {videos.map((vid, vIndex) => {
            const source = vid.video_source || 'drive';
            const videoId = vid.video_id || '';
            const validation = vid.validationResult;

            return (
              <div
                key={vid.id}
                className="relative flex flex-col gap-4 rounded-xl border border-[#464554] bg-[#010f1f] p-4"
              >
                <div className="flex items-center justify-between">
                  <h5 className="text-sm font-semibold text-[#d4e4fa]">
                    Video {vIndex + 1}
                  </h5>
                  {videos.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeVideo(vid.id)}
                      className="rounded bg-red-500/10 p-1 text-red-400 transition-colors hover:bg-red-500/20"
                      title="Remove video"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Video Title */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#908fa0]">
                    Video Title{' '}
                    <span className="text-[#464554]">(shown in playlist)</span>
                  </label>
                  <input
                    type="text"
                    value={vid.label || ''}
                    onChange={(e) =>
                      updateVideo(vid.id, { label: e.target.value })
                    }
                    placeholder={`e.g. Introduction, Part ${vIndex + 1}…`}
                    className="w-full rounded-lg border border-[#464554] bg-[#051424] px-3 py-2 text-sm text-[#d4e4fa] outline-none placeholder:text-[#464554] focus:border-[#c0c1ff]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {VIDEO_SOURCES.filter((s) => s !== 'none').map((src) => {
                    const config = getVideoSourceConfig(src);
                    const Icon = VIDEO_ICONS[src] || FileText;
                    const active = source === src;
                    return (
                      <button
                        key={src}
                        type="button"
                        onClick={() =>
                          updateVideo(vid.id, { video_source: src })
                        }
                        className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-medium transition-all ${
                          active
                            ? 'border-[#c0c1ff]/50 bg-[#c0c1ff]/10 text-[#c0c1ff]'
                            : 'border-[#464554] bg-[#051424] text-[#908fa0] hover:border-[#908fa0]'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {config.label}
                      </button>
                    );
                  })}
                </div>

                {source === 'drive' && (
                  <div className="space-y-3 rounded-xl border border-[#464554] bg-[#051424] p-3">
                    <label className="block text-xs font-medium text-[#908fa0]">
                      Google Drive File ID or URL
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={videoId}
                        onChange={(e) =>
                          updateVideo(vid.id, {
                            video_id: e.target.value,
                            validationResult: null,
                          })
                        }
                        placeholder="File ID or share URL"
                        className="flex-1 rounded-lg border border-[#464554] bg-[#010f1f] px-3 py-2 text-sm text-[#d4e4fa] outline-none focus:border-[#c0c1ff]"
                      />
                      <button
                        type="button"
                        onClick={() => validateDriveMulti(vid)}
                        disabled={vid.validating || !videoId}
                        className="flex shrink-0 items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
                      >
                        {vid.validating ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <CheckCircle className="h-3.5 w-3.5" />
                        )}
                        Validate
                      </button>
                    </div>
                    {validation && (
                      <div
                        className={`flex items-start gap-2 rounded-lg p-2 text-xs ${validation.valid ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}
                      >
                        {validation.valid ? (
                          <>
                            <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            <div>
                              <p className="font-medium">Video accessible</p>
                              {validation.name && (
                                <p className="opacity-70">{validation.name}</p>
                              )}
                              {validation.duration && (
                                <p className="opacity-70">
                                  Duration:{' '}
                                  {formatDurationSeconds(validation.duration)}
                                </p>
                              )}
                            </div>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            <div>
                              <p className="font-medium">Cannot access video</p>
                              <p className="opacity-70">{validation.error}</p>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {source === 'youtube' && (
                  <div className="space-y-2 rounded-xl border border-[#464554] bg-[#051424] p-3">
                    <label className="block text-xs font-medium text-[#908fa0]">
                      YouTube Video URL or ID
                    </label>
                    <input
                      type="text"
                      value={videoId}
                      onChange={(e) =>
                        updateVideo(vid.id, { video_id: e.target.value })
                      }
                      placeholder="e.g., dQw4w9WgXcQ or full URL"
                      className="w-full rounded-lg border border-[#464554] bg-[#010f1f] px-3 py-2 text-sm text-[#d4e4fa] outline-none focus:border-[#c0c1ff]"
                    />
                  </div>
                )}

                {source === 'upload' && (
                  <div className="rounded-xl border-2 border-dashed border-[#464554] bg-[#051424] p-6 text-center">
                    <Upload className="mx-auto h-8 w-8 text-[#464554]" />
                    <p className="mt-2 text-sm text-[#908fa0]">
                      Upload coming soon — use Drive or YouTube
                    </p>
                  </div>
                )}
              </div>
            );
          })}

          <button
            type="button"
            onClick={addVideo}
            className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-[#464554] bg-[#010f1f] py-3 text-[#908fa0] transition-all hover:border-[#c0c1ff] hover:text-[#c0c1ff]"
          >
            <Plus className="h-4 w-4" />
            <span className="text-sm font-semibold">Add Another Video</span>
          </button>
        </div>
      );
    }

    if (block.type === 'lessonPlan') {
      return (
        <div className="border-l-4 border-[#8083ff] bg-[#051424] p-4">
          <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#c0c1ff]">
            <BookOpen className="h-4 w-4" /> Lesson Plan Structure
          </h4>
          <MultiBlockEditor
            value={block.content}
            onChange={(val) => updateBlockContent(block.id, val)}
            uploadImageAction={uploadImageAction}
          />
        </div>
      );
    }

    if (block.type === 'image') {
      const data = block.data || {};
      let images = data.images;

      // Professional: If images array is missing or empty, ensure at least one slot
      if (!images || !Array.isArray(images) || images.length === 0) {
        if (block.content) {
          images = [
            {
              id: crypto.randomUUID(),
              url: block.content,
              alt: data.alt || '',
            },
          ];
        } else {
          images = [{ id: crypto.randomUUID(), url: '', alt: '' }];
        }
      }

      const updateImage = (imgId, updates) => {
        // Professional: If user pastes a Google Drive link, automatically convert to proxy
        let finalUrl = updates.url;
        if (finalUrl && finalUrl.includes('drive.google.com')) {
          const fileId = extractDriveFileId(finalUrl);
          if (fileId) {
            finalUrl = `/api/image/${fileId}`;
          }
        }

        const resolvedUpdates = {
          ...updates,
          ...(finalUrl !== undefined && { url: finalUrl }),
        };

        updateBlock(block.id, (b) => {
          const bData = b.data || {};
          let bImages = bData.images;
          if (!bImages || !Array.isArray(bImages) || bImages.length === 0) {
            bImages = b.content
              ? [
                  {
                    id: crypto.randomUUID(),
                    url: b.content,
                    alt: bData.alt || '',
                  },
                ]
              : [{ id: crypto.randomUUID(), url: '', alt: '' }];
          }
          const newImages = bImages.map((img) =>
            img.id === imgId ? { ...img, ...resolvedUpdates } : img
          );
          return {
            data: { images: newImages },
            content: '',
          };
        });
      };

      const addImage = () => {
        updateBlockData(block.id, {
          images: [...images, { id: crypto.randomUUID(), url: '', alt: '' }],
        });
      };

      const removeImage = (imgId) => {
        updateBlockData(block.id, {
          images: images.filter((img) => img.id !== imgId),
        });
      };

      const handleImageUpload = async (imgId, file) => {
        if (!file) return;
        updateImage(imgId, { uploading: true, uploadError: null });

        try {
          const formData = new FormData();
          formData.append('file', file);

          const result = await uploadImageAction(formData);
          if (result.error) {
            updateImage(imgId, { uploadError: result.error, uploading: false });
          } else {
            updateImage(imgId, {
              url: result.url,
              uploading: false,
              uploadError: null,
            });
          }
        } catch (err) {
          updateImage(imgId, { uploadError: err.message, uploading: false });
        }
      };

      return (
        <div className="flex flex-col gap-6 bg-[#051424] p-4">
          {images.map((img, imgIndex) => (
            <div
              key={img.id}
              className="relative flex flex-col gap-4 rounded-xl border border-[#464554] bg-[#010f1f] p-4"
            >
              <div className="flex items-center justify-between">
                <h5 className="text-sm font-semibold text-[#d4e4fa]">
                  Image {imgIndex + 1}
                </h5>
                {images.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeImage(img.id)}
                    className="rounded bg-red-500/10 p-1 text-red-400 transition-colors hover:bg-red-500/20"
                    title="Remove image"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#908fa0]">
                    Image URL or Direct Upload
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={img.url || ''}
                      onChange={(e) =>
                        updateImage(img.id, { url: e.target.value })
                      }
                      placeholder="https://example.com/image.jpg"
                      className="flex-1 rounded-lg border border-[#464554] bg-[#051424] px-3 py-2 text-sm text-[#d4e4fa] outline-none focus:border-[#c0c1ff]"
                    />
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) =>
                          handleImageUpload(img.id, e.target.files[0])
                        }
                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
                        disabled={img.uploading}
                      />
                      <button
                        type="button"
                        disabled={img.uploading}
                        className="flex h-full shrink-0 items-center gap-1.5 rounded-lg bg-[#273647] px-3 py-2 text-xs font-medium text-[#d4e4fa] transition-colors hover:bg-[#34465c] disabled:opacity-50"
                      >
                        {img.uploading ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Upload className="h-3.5 w-3.5" />
                        )}
                        Upload
                      </button>
                    </div>
                  </div>
                  {img.uploadError && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-red-400">
                      <AlertCircle className="h-3 w-3" /> {img.uploadError}
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#908fa0]">
                    Alt Text (Optional)
                  </label>
                  <input
                    type="text"
                    value={img.alt || ''}
                    onChange={(e) =>
                      updateImage(img.id, { alt: e.target.value })
                    }
                    placeholder="Description of the image"
                    className="w-full rounded-lg border border-[#464554] bg-[#051424] px-3 py-2 text-sm text-[#d4e4fa] outline-none focus:border-[#c0c1ff]"
                  />
                </div>
              </div>

              {img.url && (
                <div className="flex justify-center overflow-hidden rounded-xl border border-[#464554] bg-[#010f1f] p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={driveImageUrl(img.url)}
                    alt={img.alt || 'Image preview'}
                    className="max-h-[300px] rounded-lg object-contain"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                    onLoad={(e) => {
                      e.target.style.display = 'block';
                      e.target.nextSibling.style.display = 'none';
                    }}
                  />
                  <div className="hidden py-8 text-sm text-[#908fa0]">
                    Invalid image URL
                  </div>
                </div>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={addImage}
            className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-[#464554] bg-[#010f1f] py-3 text-[#908fa0] transition-all hover:border-[#c0c1ff] hover:text-[#c0c1ff]"
          >
            <Plus className="h-4 w-4" />
            <span className="text-sm font-semibold">Add Another Image</span>
          </button>
        </div>
      );
    }

    if (block.type === 'practice') {
      const data = block.data || {};
      const problems = data.practice_problems || [];

      const setProblems = (newProbs) => {
        updateBlock(block.id, {
          data: {
            practice_problems: newProbs,
          },
        });
      };

      return (
        <div className="flex flex-col gap-6 bg-[#051424] p-4 text-left">
          <div className="flex items-center justify-between border-b border-[#464554] pb-3">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-violet-400" />
              <h4 className="text-sm font-semibold text-[#d4e4fa]">
                Practice Problems ({problems.length})
              </h4>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setAiModalConfig({
                    type: 'practice',
                    blockId: block.id,
                    input: '',
                    generating: false,
                    difficulty: 'medium',
                    guidelines: '',
                  });
                }}
                className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 px-2.5 py-1.5 text-xs font-semibold text-violet-300 transition-colors hover:bg-violet-500/20"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Import with AI
              </button>
              <button
                type="button"
                onClick={() => {
                  const newProbs = [
                    ...problems,
                    {
                      id:
                        typeof crypto !== 'undefined' && crypto.randomUUID
                          ? crypto.randomUUID()
                          : Math.random().toString(36).substring(2),
                      name: '',
                      source: '',
                      url: '',
                      video_url: '',
                      editorial: '',
                      solution_code: '',
                      points: 5,
                    },
                  ];
                  setProblems(newProbs);
                }}
                className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-violet-600 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-violet-500"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Problem
              </button>
            </div>
          </div>

          {problems.length === 0 && (
            <div className="py-6 text-center text-xs text-[#908fa0] italic">
              No practice problems added yet. Click &quot;Add Problem&quot; to
              start.
            </div>
          )}

          <div className="space-y-6">
            {problems.map((p, pIdx) => (
              <div
                key={
                  p.id
                    ? `practice-block-p-${p.id}-${pIdx}`
                    : `practice-block-p-idx-${pIdx}`
                }
                className="group relative flex flex-col gap-4 rounded-lg border border-[#464554] bg-[#010f1f] p-4 text-left"
              >
                <div className="absolute top-4 right-4 flex items-center gap-2">
                  <button
                    type="button"
                    disabled={pIdx === 0}
                    onClick={() => {
                      const newProbs = [...problems];
                      const temp = newProbs[pIdx];
                      newProbs[pIdx] = newProbs[pIdx - 1];
                      newProbs[pIdx - 1] = temp;
                      setProblems(newProbs);
                    }}
                    className="cursor-pointer p-1 text-gray-500 transition-colors hover:text-white disabled:opacity-30 disabled:hover:text-gray-500"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    disabled={pIdx === problems.length - 1}
                    onClick={() => {
                      const newProbs = [...problems];
                      const temp = newProbs[pIdx];
                      newProbs[pIdx] = newProbs[pIdx + 1];
                      newProbs[pIdx + 1] = temp;
                      setProblems(newProbs);
                    }}
                    className="cursor-pointer p-1 text-gray-500 transition-colors hover:text-white disabled:opacity-30 disabled:hover:text-gray-500"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const newProbs = problems.filter(
                        (_, idx) => idx !== pIdx
                      );
                      setProblems(newProbs);
                    }}
                    className="ml-2 cursor-pointer p-1 text-gray-500 transition-colors hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full border border-violet-500/20 bg-violet-500/10 text-[10px] font-bold text-violet-400">
                    {pIdx + 1}
                  </span>
                  <span className="text-xs font-semibold tracking-wider text-[#908fa0] uppercase">
                    Problem {pIdx + 1}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-semibold tracking-wider text-[#908fa0] uppercase">
                    Problem Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={p.name || ''}
                    onChange={(e) => {
                      const newProbs = [...problems];
                      newProbs[pIdx] = {
                        ...newProbs[pIdx],
                        name: e.target.value,
                      };
                      setProblems(newProbs);
                    }}
                    placeholder="e.g. Watermelon, Two Sum, etc."
                    className="w-full rounded-lg border border-[#464554] bg-[#0d1c2d] px-3 py-1.5 text-xs text-[#d4e4fa] outline-none focus:border-[#c0c1ff]"
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-semibold tracking-wider text-[#908fa0] uppercase">
                      Platform
                    </label>
                    <input
                      type="text"
                      value={p.source || ''}
                      onChange={(e) => {
                        const newProbs = [...problems];
                        newProbs[pIdx] = {
                          ...newProbs[pIdx],
                          source: e.target.value,
                        };
                        setProblems(newProbs);
                      }}
                      placeholder="e.g. Codeforces, LeetCode"
                      className="w-full rounded-lg border border-[#464554] bg-[#0d1c2d] px-3 py-1.5 text-xs text-[#d4e4fa] outline-none focus:border-[#c0c1ff]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-semibold tracking-wider text-[#908fa0] uppercase">
                      Problem URL
                    </label>
                    <input
                      type="url"
                      value={p.url || ''}
                      onChange={(e) => {
                        const newProbs = [...problems];
                        newProbs[pIdx] = {
                          ...newProbs[pIdx],
                          url: e.target.value,
                        };
                        setProblems(newProbs);
                      }}
                      placeholder="https://..."
                      className="w-full rounded-lg border border-[#464554] bg-[#0d1c2d] px-3 py-1.5 text-xs text-[#d4e4fa] outline-none focus:border-[#c0c1ff]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-semibold tracking-wider text-[#908fa0] uppercase">
                      Video Solution URL
                    </label>
                    <input
                      type="url"
                      value={p.video_url || ''}
                      onChange={(e) => {
                        const newProbs = [...problems];
                        newProbs[pIdx] = {
                          ...newProbs[pIdx],
                          video_url: e.target.value,
                        };
                        setProblems(newProbs);
                      }}
                      placeholder="https://youtube.com/..."
                      className="w-full rounded-lg border border-[#464554] bg-[#0d1c2d] px-3 py-1.5 text-xs text-[#d4e4fa] outline-none focus:border-[#c0c1ff]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-semibold tracking-wider text-[#908fa0] uppercase">
                      Points
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={p.points ?? 5}
                      onChange={(e) => {
                        const newProbs = [...problems];
                        newProbs[pIdx] = {
                          ...newProbs[pIdx],
                          points: parseInt(e.target.value) || 0,
                        };
                        setProblems(newProbs);
                      }}
                      className="w-full rounded-lg border border-[#464554] bg-[#0d1c2d] px-3 py-1.5 text-xs text-[#d4e4fa] outline-none focus:border-[#c0c1ff]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-semibold tracking-wider text-[#908fa0] uppercase">
                    Editorial / Explanation
                  </label>
                  <textarea
                    value={p.editorial || ''}
                    onChange={(e) => {
                      const newProbs = [...problems];
                      newProbs[pIdx] = {
                        ...newProbs[pIdx],
                        editorial: e.target.value,
                      };
                      setProblems(newProbs);
                    }}
                    rows={3}
                    placeholder="Editorial text... (Markdown supported)"
                    className="w-full resize-y rounded-lg border border-[#464554] bg-[#0d1c2d] px-3 py-1.5 text-xs text-[#d4e4fa] outline-none focus:border-[#c0c1ff]"
                  />
                  {p.editorial && (
                    <div className="mt-1 rounded-lg border border-violet-500/10 bg-[#05111d] p-2.5">
                      <div className="mb-1 flex items-center gap-1 text-[9px] font-extrabold tracking-widest text-violet-400 uppercase">
                        <Sparkles className="h-3 w-3" /> Live Markdown & Formula
                        Preview
                      </div>
                      <div className="max-w-full overflow-x-auto text-[11px] leading-relaxed text-[#908fa0]">
                        <MarkdownPreview text={p.editorial} />
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-semibold tracking-wider text-[#908fa0] uppercase">
                    Solution Code
                  </label>
                  <textarea
                    value={p.solution_code || ''}
                    onChange={(e) => {
                      const newProbs = [...problems];
                      newProbs[pIdx] = {
                        ...newProbs[pIdx],
                        solution_code: e.target.value,
                      };
                      setProblems(newProbs);
                    }}
                    rows={4}
                    placeholder="// Solution code here..."
                    className="w-full resize-y rounded-lg border border-[#464554] bg-[#0d1c2d] px-3 py-1.5 font-mono text-xs text-emerald-300 outline-none focus:border-[#c0c1ff]"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (block.type === 'exam') {
      const data = block.data || {};
      const questions = data.exam_questions || [];

      const setQuestions = (newQuests) => {
        updateBlock(block.id, {
          data: {
            exam_questions: newQuests,
          },
        });
      };

      return (
        <div className="flex flex-col gap-6 bg-[#051424] p-4 text-left">
          <div className="flex items-center justify-between border-b border-[#464554] pb-3">
            <div className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-violet-400" />
              <h4 className="text-sm font-semibold text-[#d4e4fa]">
                Exam Questions ({questions.length})
              </h4>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setAiModalConfig({
                    type: 'exam',
                    blockId: block.id,
                    input: '',
                    generating: false,
                    difficulty: 'medium',
                    guidelines: '',
                  });
                }}
                className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 px-2.5 py-1.5 text-xs font-semibold text-violet-300 transition-colors hover:bg-violet-500/20"
              >
                <Sparkles className="h-3.5 w-3.5" />
                AI MCQ Generator
              </button>
              <button
                type="button"
                onClick={() => {
                  const newQuests = [
                    ...questions,
                    {
                      id:
                        typeof crypto !== 'undefined' && crypto.randomUUID
                          ? crypto.randomUUID()
                          : Math.random().toString(36).substring(2),
                      question: '',
                      options: ['', '', '', ''],
                      correct_option: 0,
                      points: 5,
                    },
                  ];
                  setQuestions(newQuests);
                }}
                className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-violet-500/30 bg-[#0e2742] px-2.5 py-1.5 text-xs font-semibold text-violet-300 transition-colors hover:bg-violet-500/10"
              >
                <Plus className="h-3.5 w-3.5" />
                Add MCQ
              </button>
              <button
                type="button"
                onClick={() => {
                  const newQuests = [
                    ...questions,
                    {
                      id:
                        typeof crypto !== 'undefined' && crypto.randomUUID
                          ? crypto.randomUUID()
                          : Math.random().toString(36).substring(2),
                      question: '',
                      options: [],
                      correct_option: 0,
                      points: 10,
                    },
                  ];
                  setQuestions(newQuests);
                }}
                className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-violet-600 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-violet-500"
              >
                <Plus className="h-3.5 w-3.5" />
                Add CQ
              </button>
            </div>
          </div>

          {questions.length === 0 && (
            <div className="py-6 text-center text-xs text-[#908fa0] italic">
              No questions added yet. Click &quot;Add Question&quot; to start.
            </div>
          )}

          <div className="space-y-6">
            {questions.map((q, qIdx) => {
              const isCQ = !Array.isArray(q.options) || q.options.length === 0;
              return (
                <div
                  key={
                    q.id
                      ? `exam-block-q-${q.id}-${qIdx}`
                      : `exam-block-q-idx-${qIdx}`
                  }
                  className="group relative flex flex-col gap-4 rounded-lg border border-[#464554] bg-[#010f1f] p-4 text-left"
                >
                  <button
                    type="button"
                    onClick={() => {
                      const newQuests = questions.filter(
                        (_, idx) => idx !== qIdx
                      );
                      setQuestions(newQuests);
                    }}
                    className="absolute top-4 right-4 cursor-pointer p-1 text-gray-500 transition-colors hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>

                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full border border-violet-500/20 bg-violet-500/10 text-[10px] font-bold text-violet-400">
                      {qIdx + 1}
                    </span>
                    <span className="text-xs font-semibold tracking-wider text-[#908fa0] uppercase">
                      {isCQ ? 'CQ Question' : 'MCQ Question'} {qIdx + 1}
                    </span>
                    {isCQ && (
                      <span className="rounded border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold tracking-wider text-amber-400 uppercase">
                        Subjective (CQ)
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-semibold tracking-wider text-[#908fa0] uppercase">
                      Question Text
                    </label>
                    <textarea
                      value={q.question || ''}
                      onChange={(e) => {
                        const newQuests = [...questions];
                        newQuests[qIdx] = {
                          ...newQuests[qIdx],
                          question: e.target.value,
                        };
                        setQuestions(newQuests);
                      }}
                      rows={6}
                      placeholder={
                        isCQ
                          ? 'Enter the subjective/creative question prompt... (Markdown and formula supported)'
                          : 'Enter the question prompt... (Markdown supported, code blocks and scenarios)'
                      }
                      className="min-h-[120px] w-full resize-y rounded-lg border border-[#464554] bg-[#0d1c2d] px-3 py-1.5 text-xs text-[#d4e4fa] outline-none focus:border-[#c0c1ff]"
                    />
                    {q.question && (
                      <div className="mt-1 rounded-lg border border-violet-500/10 bg-[#05111d] p-2.5">
                        <div className="mb-1 flex items-center gap-1 text-[9px] font-extrabold tracking-widest text-violet-400 uppercase">
                          <Sparkles className="h-3 w-3" /> Live Markdown Preview
                        </div>
                        <div className="max-w-full overflow-x-auto text-[11px] leading-relaxed text-[#908fa0]">
                          <MarkdownPreview text={q.question} />
                        </div>
                      </div>
                    )}
                  </div>

                  {isCQ ? (
                    <div className="rounded-lg border border-[#464554]/50 bg-[#05111d] p-3 text-xs text-[#908fa0] italic">
                      This subjective question will be answered via
                      text/attachment by the student and graded manually by a
                      mentor.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {['A', 'B', 'C', 'D'].map((optLabel, optIdx) => (
                        <div key={optIdx} className="flex flex-col gap-1">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-semibold tracking-wider text-[#908fa0] uppercase">
                              Option {optLabel}
                            </label>
                            <label className="flex cursor-pointer items-center gap-1 text-[10px] text-gray-500 select-none">
                              <input
                                type="radio"
                                name={`correct-${block.id}-${q.id || qIdx}`}
                                checked={q.correct_option === optIdx}
                                onChange={() => {
                                  const newQuests = [...questions];
                                  newQuests[qIdx] = {
                                    ...newQuests[qIdx],
                                    correct_option: optIdx,
                                  };
                                  setQuestions(newQuests);
                                }}
                                className="border-zinc-700 bg-zinc-900 text-violet-600 focus:ring-violet-500"
                              />
                              Correct
                            </label>
                          </div>
                          <input
                            type="text"
                            value={q.options?.[optIdx] || ''}
                            onChange={(e) => {
                              const newQuests = [...questions];
                              const newOpts = [
                                ...(newQuests[qIdx].options || [
                                  '',
                                  '',
                                  '',
                                  '',
                                ]),
                              ];
                              newOpts[optIdx] = e.target.value;
                              newQuests[qIdx] = {
                                ...newQuests[qIdx],
                                options: newOpts,
                              };
                              setQuestions(newQuests);
                            }}
                            placeholder={`Option ${optLabel}...`}
                            className="w-full rounded-lg border border-[#464554] bg-[#0d1c2d] px-3 py-1.5 text-xs text-[#d4e4fa] outline-none focus:border-[#c0c1ff]"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="w-24">
                    <label className="mb-1 block text-[10px] font-semibold tracking-wider text-[#908fa0] uppercase">
                      Points
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={q.points ?? (isCQ ? 10 : 5)}
                      onChange={(e) => {
                        const newQuests = [...questions];
                        newQuests[qIdx] = {
                          ...newQuests[qIdx],
                          points: parseInt(e.target.value) || 0,
                        };
                        setQuestions(newQuests);
                      }}
                      className="w-full rounded-lg border border-[#464554] bg-[#0d1c2d] px-3 py-1.5 text-xs text-[#d4e4fa] outline-none focus:border-[#c0c1ff]"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    return <p className="p-4 text-red-400">Unknown block type</p>;
  };

  return (
    <div className="space-y-4">
      {blocks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#464554] bg-[#051424] py-8 text-center">
          <p className="mb-4 text-sm text-[#908fa0]">No content blocks yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {blocks.map((block, index) => {
            const BlockIcon =
              BLOCK_TYPES.find((t) => t.id === block.type)?.icon || Code;
            const blockLabel =
              BLOCK_TYPES.find((t) => t.id === block.type)?.label || 'Block';

            return (
              <div
                key={block.id}
                draggable={dragHandleActive === block.id}
                onDragStart={(e) => {
                  setDraggedIndex(index);
                  e.dataTransfer.effectAllowed = 'move';
                  e.dataTransfer.setData('text/plain', index);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (draggedIndex === null || draggedIndex === index) return;

                  const newBlocks = [...blocks];
                  const draggedItem = newBlocks[draggedIndex];
                  newBlocks.splice(draggedIndex, 1);
                  newBlocks.splice(index, 0, draggedItem);

                  updateBlocks(newBlocks);
                  setDraggedIndex(null);
                  setDragHandleActive(null);
                }}
                onDragEnd={() => {
                  setDraggedIndex(null);
                  setDragHandleActive(null);
                }}
                className={`group relative overflow-hidden rounded-xl border border-[#464554] bg-[#010f1f] transition-all focus-within:border-[#c0c1ff] ${draggedIndex === index ? 'scale-[0.98] opacity-50' : ''}`}
              >
                {/* Block Header */}
                <div className="flex items-center justify-between border-b border-[#464554] bg-[#051424] px-3 py-2">
                  <div
                    className="flex cursor-grab items-center gap-2 active:cursor-grabbing"
                    onMouseEnter={() => setDragHandleActive(block.id)}
                    onMouseLeave={() => setDragHandleActive(null)}
                  >
                    <GripVertical className="pointer-events-none h-4 w-4 text-[#464554] transition-colors group-hover:text-[#908fa0]" />
                    <span className="pointer-events-none flex items-center gap-1.5 rounded-md bg-[#122131] px-2 py-1 text-xs font-semibold text-[#d4e4fa]">
                      <BlockIcon className="h-3.5 w-3.5" />
                      {blockLabel}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => moveBlock(index, -1)}
                      disabled={index === 0}
                      className="rounded-md p-1.5 text-[#908fa0] hover:bg-[#122131] hover:text-[#d4e4fa] disabled:opacity-30 disabled:hover:bg-transparent"
                      title="Move up"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveBlock(index, 1)}
                      disabled={index === blocks.length - 1}
                      className="rounded-md p-1.5 text-[#908fa0] hover:bg-[#122131] hover:text-[#d4e4fa] disabled:opacity-30 disabled:hover:bg-transparent"
                      title="Move down"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    <div className="mx-1 h-4 w-px bg-[#464554]" />
                    <button
                      type="button"
                      onClick={() => removeBlock(block.id)}
                      className="rounded-md p-1.5 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                      title="Remove block"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Block Editor */}
                <div>{renderEditor(block)}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Block Menu */}
      <div className="relative">
        {!showAddMenu ? (
          <button
            type="button"
            onClick={() => setShowAddMenu(true)}
            className="group flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-[#464554] bg-[#051424]/50 py-6 text-[#908fa0] transition-all hover:border-[#c0c1ff] hover:bg-[#c0c1ff]/5 hover:text-[#c0c1ff]"
          >
            <div className="rounded-full bg-[#122131] p-3 transition-colors group-hover:bg-[#8083ff]/20">
              <Plus className="h-5 w-5" />
            </div>
            <span className="text-sm font-semibold">Add Content Block</span>
          </button>
        ) : (
          <div className="rounded-xl border border-[#464554] bg-[#051424] p-4">
            <h4 className="mb-3 text-xs font-semibold tracking-wider text-[#908fa0] uppercase">
              Select Block Type
            </h4>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {BLOCK_TYPES.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => addBlock(type.id)}
                  className="flex flex-col items-start rounded-lg border border-[#464554] bg-[#010f1f] p-3 text-left transition-all hover:border-[#c0c1ff] hover:bg-[#122131]"
                >
                  <div className="mb-2 flex items-center gap-2 text-[#d4e4fa]">
                    <type.icon className="h-4 w-4 text-[#8083ff]" />
                    <span className="text-sm font-semibold">{type.label}</span>
                  </div>
                  <p className="text-[10px] leading-relaxed text-[#908fa0]">
                    {type.description}
                  </p>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowAddMenu(false)}
              className="mt-4 w-full py-2 text-xs font-medium text-[#908fa0] transition-colors hover:text-[#d4e4fa]"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* AI Importer glassmorphic modal */}
      {aiModalConfig && (
        <div className="animate-in fade-in fixed inset-0 z-[999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md duration-200">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#051424] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 bg-[#0d1c2d] px-6 py-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-violet-400" />
                <h3 className="font-bold text-[#d4e4fa]">
                  {aiModalConfig.type === 'practice'
                    ? 'Import Practice Problems with AI'
                    : 'Generate MCQ Questions with AI'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAiModalConfig(null)}
                className="cursor-pointer text-sm font-semibold text-gray-500 transition-colors hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="custom-scrollbar flex flex-col gap-4 overflow-y-auto p-6 text-left">
              <p className="text-xs leading-relaxed text-[#908fa0]">
                {aiModalConfig.type === 'practice'
                  ? 'Paste raw text containing a list of practice problems, contests, or links. The AI will extract Name, Platform, Problem Link, Video Solution Link, Editorial/Explanation, and Solution Code.'
                  : 'Paste unstructured questions or a topic description. The AI will formulate multiple-choice questions with options, correct answer, and points.'}
              </p>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Difficulty */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                    Difficulty Level
                  </label>
                  <select
                    value={aiModalConfig.difficulty || 'medium'}
                    onChange={(e) =>
                      setAiModalConfig((prev) => ({
                        ...prev,
                        difficulty: e.target.value,
                      }))
                    }
                    className="w-full cursor-pointer rounded-xl border border-white/10 bg-[#0d1c2d] px-3 py-2 text-xs text-white transition-all outline-none focus:border-violet-500"
                  >
                    <option value="easy">Easy (Conceptual & Basic)</option>
                    <option value="medium">
                      Medium (Analytical & Implementation)
                    </option>
                    <option value="hard">
                      Hard (Advanced Problem Solving & Deep Logic)
                    </option>
                  </select>
                </div>

                {/* Custom Guidelines */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                    Custom Instructions / Guidelines
                  </label>
                  <input
                    type="text"
                    value={aiModalConfig.guidelines || ''}
                    onChange={(e) =>
                      setAiModalConfig((prev) => ({
                        ...prev,
                        guidelines: e.target.value,
                      }))
                    }
                    placeholder="e.g. Include specific code examples, LaTeX math, etc."
                    className="w-full rounded-xl border border-white/10 bg-[#0d1c2d] px-3 py-2 text-xs text-white placeholder-gray-600 transition-all outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <textarea
                value={aiModalConfig.input}
                onChange={(e) =>
                  setAiModalConfig((prev) => ({
                    ...prev,
                    input: e.target.value,
                  }))
                }
                rows={8}
                placeholder={
                  aiModalConfig.type === 'practice'
                    ? "Example:\nProblem 1: Watermelon\nPlatform: Codeforces\nLink: https://codeforces.com/problemset/problem/4/A\nEditorial: Check if weight is even and > 2.\nCode: print('YES' if w % 2 == 0 and w > 2 else 'NO')"
                    : 'Example:\nCreate 3 questions about React hooks, useEffect dependencies, and useState asynchronous state updates.'
                }
                className="min-h-[120px] w-full resize-none rounded-xl border border-white/10 bg-[#0d1c2d] px-4 py-3 font-mono text-xs text-[#d4e4fa] outline-none focus:border-[#c0c1ff]"
              />
            </div>

            <div className="flex justify-end gap-3 border-t border-white/10 bg-[#0d1c2d] px-6 py-4 text-right">
              <button
                type="button"
                onClick={() => setAiModalConfig(null)}
                className="cursor-pointer rounded-xl px-4 py-2 text-xs font-semibold text-gray-400 transition-colors hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={
                  aiModalConfig.generating || !aiModalConfig.input.trim()
                }
                onClick={handleAiBlockImport}
                className="flex cursor-pointer items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-violet-500 disabled:opacity-50"
              >
                {aiModalConfig.generating ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Analyzing Data...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    Generate with AI
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
