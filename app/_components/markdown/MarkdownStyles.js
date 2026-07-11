/**
 * @file Canonical MD_STYLES constant (shared)
 * @module markdown/MarkdownStyles
 *
 * Single source of truth for the .md-* and .hljs-* rules consumed by
 * createMarkdownRenderer(). The corresponding CSS lives in app/_styles/global.css
 * (scoped under .blog-content, .lesson-viewer, .event-viewer, .resource-viewer,
 * .roadmap-viewer, .admin-preview, .mentor-viewer). This constant is kept as
 * a fallback for environments where global.css has not yet loaded (e.g. SSR
 * edge cases). Prefer the global stylesheet.
 *
 * Previously duplicated in:
 *   - app/account/member/bootcamps/[bootcampId]/[lessonId]/_components/LessonContentRenderer.js (229-277)
 *   - app/account/_components/events/EventContentRenderer.js (166-213)
 *   - app/account/member/bootcamps/[bootcampId]/_components/BootcampLearningClient.js
 *   - app/account/mentor/tasks/_components/MentorTasksClient.js
 */

export const MD_STYLES = `
.md-viewer{display:grid;grid-template-columns:1fr;gap:.75rem;line-height:1.65rem;color:#908fa0;font-family:'Inter',system-ui,sans-serif;letter-spacing:normal;text-align:left;}
.md-h{font-weight:700;color:#d4e4fa;margin-top:.75rem;margin-bottom:-.25rem;min-width:0;font-family:'Inter',system-ui,sans-serif;letter-spacing:normal;}
.md-h1{font-size:1.375rem}.md-h2{font-size:1.125rem}.md-h3{font-size:1rem}.md-h4{font-size:.9rem}
.md-p{line-height:1.7;word-break:break-word;white-space:normal;min-width:0;font-family:'Inter',system-ui,sans-serif;letter-spacing:normal;text-align:left;}
.md-strong{color:#d4e4fa;font-weight:600;}
.md-em{font-style:italic;}
.md-a{color:#8083ff;text-decoration:none;}.md-a:hover{text-decoration:underline;}
.md-img{max-width:100%;height:auto;border-radius:.75rem;border:1px solid rgba(255,255,255,.08);display:block;margin:.5rem 0;}
.md-bq{margin-left:.5rem;border-left:4px solid rgba(255,255,255,.12);padding:.5rem 1rem;border-radius:0 .5rem .5rem 0;background:rgba(255,255,255,.02);font-family:'Inter',system-ui,sans-serif;}
.md-hr{border:none;border-top:.5px solid #273647;margin:.75rem .375rem;}
.md-ul,.md-ol{padding-left:1.5rem;line-height:1.7;display:flex;flex-direction:column;gap:.2rem;font-family:'Inter',system-ui,sans-serif;}
.md-ul .md-li{list-style-type:disc;}.md-ol .md-li{list-style-type:decimal;}
.md-li{padding-left:.25rem;min-width:0;}
.md-task input{margin-right:.4rem;accent-color:#8083ff;}
.md-inline-code{background:rgba(128,131,255,.1);color:#8083ff;padding:.1em .4em;border-radius:.35rem;font-size:.875em;font-family:'JetBrains Mono','Fira Code',monospace;letter-spacing:normal;line-height:inherit;text-align:left;}
.md-table-wrap{overflow-x:auto;width:100%;margin:.5rem 0;}
.md-table{min-width:100%;border-collapse:collapse;font-size:.875rem;line-height:1.7;text-align:left;font-family:'Inter',system-ui,sans-serif;}
.md-th{color:#d4e4fa;border-bottom:.5px solid rgba(68,69,84,.8);padding:.5rem 1rem .5rem 0;vertical-align:top;font-weight:700;}
.md-td{border-bottom:.5px solid rgba(39,54,71,.5);padding:.5rem 1rem .5rem 0;vertical-align:top;color:#908fa0;}
.md-code-block{border-radius:.625rem;overflow:hidden;border:.5px solid #273647;margin:.25rem 0;}
.md-code-header{display:flex;align-items:center;justify-content:space-between;background:#0d1117;padding:.625rem 1rem;border-bottom:.5px solid #273647;font-family:'Inter',system-ui,sans-serif;font-size:.8125rem;letter-spacing:normal;text-align:left;}
.md-code-lang{font-size:.75rem;color:#464554;font-weight:600;text-transform:uppercase;letter-spacing:.04em;}
.md-copy-btn{font-size:.6875rem;color:#8083ff;background:rgba(128,131,255,.08);border:1px solid rgba(128,131,255,.2);border-radius:.375rem;padding:.25rem .875rem;cursor:pointer;font-weight:600;transition:all .2s;font-family:inherit;letter-spacing:normal;text-align:left;}
.md-copy-btn:hover{background:rgba(128,131,255,.15);}
.md-copy-btn.copied{color:#34d399;border-color:rgba(52,211,153,.3);background:rgba(52,211,153,.08);}
.md-code-scroll{overflow-x:auto;}
.md-pre{margin:0;padding:1.125rem 1.25rem;background:#010f1f;overflow-x:auto;}
.md-pre code{font-family:'JetBrains Mono','Fira Code',monospace;font-size:.8125rem;line-height:1.7;white-space:pre;color:#d4e4fa;background:transparent;letter-spacing:normal;text-align:left;}
/* highlight.js token colors (One Dark Pro palette) */
.hljs-comment,.hljs-quote{color:#818898;font-style:italic;}
.hljs-keyword,.hljs-selector-tag,.hljs-subst{color:#f47b85;font-weight:600;}
.hljs-number,.hljs-literal,.hljs-variable,.hljs-template-variable,.hljs-tag .hljs-attr{color:#5eedec;}
.hljs-string,.hljs-doctag{color:#9be963;}
.hljs-title,.hljs-section,.hljs-selector-id{color:#70b8ff;font-weight:600;}
.hljs-type,.hljs-class .hljs-title{color:#5eedec;}
.hljs-tag,.hljs-name,.hljs-attribute{color:#f47b85;}
.hljs-regexp,.hljs-link{color:#9be963;}
.hljs-symbol,.hljs-bullet{color:#cc7bf4;}
.hljs-built_in,.hljs-builtin-name{color:#70b8ff;}
.hljs-meta{color:#818898;}
.hljs-deletion{color:#f47b85;}
.hljs-addition{color:#9be963;}
.hljs-emphasis{font-style:italic;}
.hljs-strong{font-weight:700;}
.hljs-params{color:#d4e4fa;}
.hljs-variable,.hljs-template-variable{color:#fbad60;}
.hljs-operator,.hljs-punctuation{color:#d3d7de;}
`;
