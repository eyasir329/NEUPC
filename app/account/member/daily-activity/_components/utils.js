/**
 * @file Pure helpers shared across the Daily Activity views: date math,
 *   natural-language task parsing, the recurrence engine, the karma/rank
 *   ladder, and feed-item presentation metadata. No component state or
 *   data fetching lives here.
 * @module daily-activity/utils
 */

export const Priority = {
  P1: 1, // Critical (rose)
  P2: 2, // Medium (amber)
  P3: 3, // General (sky/violet)
  P4: 4, // Trivial / default (slate)
};

// Format YYYY-MM-DD
export function getTodayDateString() {
  return formatDateString(new Date());
}

export function formatDateString(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function addDays(date, days) {
  const res = new Date(date);
  res.setDate(res.getDate() + days);
  return res;
}

export function getDayOfWeekName(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long' });
}

export function getFriendlyDate(dateStr) {
  if (!dateStr) {
    return { text: 'No date', colorClass: 'text-gray-400 dark:text-gray-500', isOverdue: false };
  }

  const todayStr = getTodayDateString();
  const tomorrowStr = formatDateString(addDays(new Date(), 1));

  if (dateStr === todayStr) {
    return { text: 'Today', colorClass: 'text-emerald-600 dark:text-emerald-500 font-medium', isOverdue: false };
  }

  if (dateStr === tomorrowStr) {
    return { text: 'Tomorrow', colorClass: 'text-amber-600 dark:text-amber-500 font-medium', isOverdue: false };
  }

  const todayVal = new Date(todayStr).getTime();
  const taskVal = new Date(dateStr).getTime();

  if (taskVal < todayVal) {
    const diffTime = Math.abs(todayVal - taskVal);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    let label = '';
    if (diffDays === 1) label = 'Yesterday';
    else label = `${diffDays} days ago`;
    return { text: `Overdue - ${label}`, colorClass: 'text-red-500 dark:text-red-400 font-medium', isOverdue: true };
  }

  const d = new Date(dateStr + 'T12:00:00');
  const options = { month: 'short', day: 'numeric' };

  const currentYear = new Date().getFullYear();
  if (d.getFullYear() !== currentYear) {
    options.year = 'numeric';
  }

  const diffDaysFuture = Math.ceil((taskVal - todayVal) / (1000 * 60 * 60 * 24));
  let formatted = d.toLocaleDateString('en-US', options);
  if (diffDaysFuture < 7) {
    formatted = `${d.toLocaleDateString('en-US', { weekday: 'short' })}, ${formatted}`;
  }

  return { text: formatted, colorClass: 'text-slate-600 dark:text-slate-400', isOverdue: false };
}

export function parsePriority(word) {
  const w = word.toLowerCase();
  if (w === 'p1') return Priority.P1;
  if (w === 'p2') return Priority.P2;
  if (w === 'p3') return Priority.P3;
  if (w === 'p4') return Priority.P4;
  return null;
}

/**
 * Parse a quick-add string into structured task fields. Recognizes inline
 * tokens anywhere in the text: `p1`–`p4` (priority), `@label`, `#project`
 * (matched against existing projects), and the words `today` / `tomorrow` /
 * weekday names (next occurrence). Everything else becomes the title.
 *
 * @param {string} input
 * @param {{id:string,name:string}[]} existingProjects
 * @param {{name:string}[]} existingLabels
 * @returns {{cleanTitle:string,dueDate?:string,priority:number,projectId?:string,labels:string[]}}
 */
export function parseNaturalLanguage(input, existingProjects, existingLabels) {
  let titleWords = input.split(' ');
  const labels = [];
  let priority = Priority.P4;
  let dueDate = undefined;
  let projectId = undefined;

  const resultWords = [];

  for (let i = 0; i < titleWords.length; i++) {
    const word = titleWords[i];
    if (!word) continue;

    const priVal = parsePriority(word);
    if (priVal !== null) {
      priority = priVal;
      continue;
    }

    if (word.startsWith('@') && word.length > 1) {
      const labelName = word.slice(1);
      const matched = existingLabels.find((l) => l.name.toLowerCase() === labelName.toLowerCase());
      if (matched) {
        labels.push(matched.name);
      } else {
        labels.push(labelName);
      }
      continue;
    }

    if (word.startsWith('#') && word.length > 1) {
      const projName = word.slice(1).replace(/_/g, ' ');
      const matched = existingProjects.find((p) => p.name.toLowerCase() === projName.toLowerCase());
      if (matched) {
        projectId = matched.id;
        continue;
      }
    }

    const lowerWord = word.toLowerCase();
    if (lowerWord === 'today') {
      dueDate = getTodayDateString();
      continue;
    }
    if (lowerWord === 'tomorrow') {
      dueDate = formatDateString(addDays(new Date(), 1));
      continue;
    }

    const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const shortWeekdays = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

    let matchedDayIndex = weekdays.indexOf(lowerWord);
    if (matchedDayIndex === -1) {
      matchedDayIndex = shortWeekdays.indexOf(lowerWord);
    }

    if (matchedDayIndex !== -1) {
      const today = new Date();
      const currentDay = today.getDay();
      let daysToAdd = matchedDayIndex - currentDay;
      if (daysToAdd <= 0) {
        daysToAdd += 7;
      }
      dueDate = formatDateString(addDays(today, daysToAdd));
      continue;
    }

    resultWords.push(word);
  }

  return {
    cleanTitle: resultWords.join(' ').trim() || 'Untitled Task',
    dueDate,
    priority,
    projectId,
    labels: [...new Set(labels)],
  };
}

export function generateId() {
  return 'td_' + Math.random().toString(36).substr(2, 9);
}

export function getFeedItemUrl(task) {
  if (!task) return '';
  if (task.contestUrl) return task.contestUrl;
  if (task.feedCategory === 'event') {
    return `/account/member/events?event=${(task.id || '').replace(/^event-/, '')}`;
  }
  if (task.feedCategory === 'task') {
    return `/account/member/bootcamps?tab=tasks#${task.id}`;
  }
  if (task.feedCategory === 'session') {
    return `/account/member/bootcamps?tab=sessions#${task.id}`;
  }
  return '';
}

/**
 * Whether a task occurs on a given calendar day. Non-recurring tasks match
 * only their exact `dueDate`. Recurring tasks (`task.recurrence` object with
 * a `freq`) are expanded on the fly:
 *   - `custom_dates`: explicit list in `recurrence.dates`.
 *   - `daily` / `weekly` / `monthly`: stepped by `recurrence.interval` from
 *     each start date, honoring `byWeekday`, an `until` end key, or a `count`.
 *
 * @param {object} task     A task with `dueDate` and optional `recurrence`.
 * @param {string} dateStr  Target day as `YYYY-MM-DD`.
 * @returns {boolean}
 */
export function isTaskOnDate(task, dateStr) {
  // Personal events store their date in `start` (ISO string), not `dueDate`.
  const effectiveDueDate = task.dueDate || (task.feedCategory === 'personal' && task.start ? task.start.split('T')[0] : null);
  if (!effectiveDueDate) return false;

  // Personal events with a RRULE recurrence string (e.g. "FREQ=DAILY"):
  // expand simple daily/weekly/monthly rules inline; leave complex RRULEs as single-occurrence.
  if (task.feedCategory === 'personal' && typeof task.recurrence === 'string' && task.recurrence) {
    const rr = task.recurrence.toUpperCase();
    const startDate = effectiveDueDate;
    if (dateStr < startDate) return false;
    const endDateStr = task.endDate || null;
    if (endDateStr && dateStr > endDateStr) return false;

    if (rr.includes('FREQ=DAILY')) return true;
    if (rr.includes('FREQ=WEEKLY')) {
      const start = new Date(startDate + 'T00:00:00');
      const target = new Date(dateStr + 'T00:00:00');
      const diff = Math.round((target - start) / 86400000);
      return diff % 7 === 0;
    }
    if (rr.includes('FREQ=MONTHLY')) {
      const start = new Date(startDate + 'T00:00:00');
      const target = new Date(dateStr + 'T00:00:00');
      return start.getDate() === target.getDate();
    }
    if (rr.includes('FREQ=YEARLY')) {
      const start = new Date(startDate + 'T00:00:00');
      const target = new Date(dateStr + 'T00:00:00');
      return start.getMonth() === target.getMonth() && start.getDate() === target.getDate();
    }
    // Unknown RRULE — treat as single occurrence.
    return dateStr === startDate;
  }

  if (!task.dueDate) return effectiveDueDate === dateStr;

  const rec = task.recurrence;
  if (!rec || rec === 'none' || !rec.freq) {
    // Bootcamp tasks span from availableFrom (created_at / start_time) to dueDate (deadline).
    if (task.feedCategory === 'task' && task.availableFrom) {
      return dateStr >= task.availableFrom && dateStr <= task.dueDate;
    }
    // Multi-day personal events span from dueDate to endDate.
    if (task.feedCategory === 'personal' && task.endDate && task.endDate > task.dueDate) {
      return dateStr >= task.dueDate && dateStr <= task.endDate;
    }
    return task.dueDate === dateStr;
  }

  const startDates = (rec.freq !== 'custom_dates' && Array.isArray(rec.dates) && rec.dates.length > 0)
    ? rec.dates
    : [task.dueDate];

  if (rec.freq === 'custom_dates') {
    return Array.isArray(rec.dates) && rec.dates.includes(dateStr);
  }

  // Check until date if present
  if (rec.end?.type === 'until' && rec.end.untilKey && dateStr > rec.end.untilKey) {
    return false;
  }

  const target = new Date(dateStr + 'T00:00:00');
  const interval = Math.max(1, rec.interval || 1);

  // Check if target recurs from any of the start dates
  for (const sDate of startDates) {
    const start = new Date(sDate + 'T00:00:00');
    if (target < start) continue;

    const diffTime = target.getTime() - start.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (rec.freq === 'daily') {
      if (rec.end?.type === 'count' && rec.end.count) {
        const occurrenceIndex = Math.floor(diffDays / interval);
        if (occurrenceIndex >= rec.end.count) continue;
      }
      if (diffDays % interval === 0) return true;
    }

    if (rec.freq === 'weekly') {
      const weekDiff = Math.floor(diffDays / 7);
      if (weekDiff % interval !== 0) continue;

      const targetDay = target.getDay();
      if (rec.byWeekday && rec.byWeekday.length > 0) {
        if (rec.byWeekday.includes(targetDay)) return true;
      } else {
        if (targetDay === start.getDay()) return true;
      }
    }

    if (rec.freq === 'monthly') {
      const monthsDiff = (target.getFullYear() - start.getFullYear()) * 12 + (target.getMonth() - start.getMonth());
      if (monthsDiff % interval !== 0) continue;
      
      if (rec.end?.type === 'count' && rec.end.count) {
        const occurrenceIndex = Math.floor(monthsDiff / interval);
        if (occurrenceIndex >= rec.end.count) continue;
      }
      if (target.getDate() === start.getDate()) return true;
    }
  }

  return false;
}

/**
 * Whether a task occurs on any day within `[startStr, endStr]` (inclusive).
 * Walks the range day by day via {@link isTaskOnDate}, capped at 100 days.
 *
 * @param {object} task
 * @param {string} startStr  `YYYY-MM-DD`
 * @param {string} endStr    `YYYY-MM-DD`
 * @returns {boolean}
 */
export function isTaskInDateRange(task, startStr, endStr) {
  let cur = new Date(startStr + 'T00:00:00');
  const end = new Date(endStr + 'T00:00:00');
  let safety = 0;
  while (cur <= end && safety < 100) {
    const dStr = formatDateString(cur);
    if (isTaskOnDate(task, dStr)) return true;
    cur.setDate(cur.getDate() + 1);
    safety++;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Karma / rank ladder — single source of truth for the XP → level mapping.
// Score is computed client-side as 100 + 10 per completed todo. The same
// thresholds drive the header pill, Insights standing card, and the
// productivity modal.
// ---------------------------------------------------------------------------

const KARMA_TIERS = [
  { level: 'Novice', max: 500 },
  { level: 'Amateur', max: 1000 },
  { level: 'Intermediate', max: 1500 },
  { level: 'Professional', max: 2500 },
  { level: 'Expert', max: 4000 },
  { level: 'Master', max: 6000 },
  { level: 'Grandmaster', max: 15000 },
];

/**
 * Map a karma score to its rank tier and progress within that tier.
 *
 * @param {number} score
 * @returns {{level:string,minXP:number,maxXP:number,nextLevel:string,
 *   progress:number,nextGoal:number}} `progress` is 0–100 within the tier;
 *   `nextGoal` is XP remaining to the next tier.
 */
export function getKarmaLevel(score) {
  let minXP = 0;
  for (let i = 0; i < KARMA_TIERS.length; i++) {
    const tier = KARMA_TIERS[i];
    if (score < tier.max || i === KARMA_TIERS.length - 1) {
      const next = KARMA_TIERS[i + 1];
      const progress = Math.max(0, Math.min(100, ((score - minXP) / (tier.max - minXP)) * 100));
      return {
        level: tier.level,
        minXP,
        maxXP: tier.max,
        nextLevel: next ? next.level : 'Ascended',
        progress,
        nextGoal: Math.max(0, tier.max - score),
      };
    }
    minXP = tier.max;
  }
  // Unreachable, but keeps the return type total.
  const last = KARMA_TIERS[KARMA_TIERS.length - 1];
  return { level: last.level, minXP, maxXP: last.max, nextLevel: 'Ascended', progress: 100, nextGoal: 0 };
}

// ---------------------------------------------------------------------------
// Feed-item presentation — read-only activity items (contests, events,
// bootcamp deadlines, sessions, Google Calendar) share one set of category
// styles so the list rows and calendar chips stay visually consistent.
// ---------------------------------------------------------------------------

/**
 * @typedef {object} FeedMeta
 * @property {string} kind     One of 'contest' | 'event' | 'task' | 'session' | 'gcal'.
 * @property {string} emoji    Leading glyph for the category.
 * @property {string} label    Short uppercase category label.
 * @property {string} accent   Tailwind border/bg/text classes for the chip.
 * @property {string} title    Tailwind text color for the title.
 * @property {string} dot      Tailwind background for the status dot.
 */

const FEED_META = {
  contest: {
    kind: 'contest', emoji: '🏆', label: 'Contest',
    accent: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
    title: 'text-amber-300', dot: 'bg-amber-400',
  },
  event: {
    kind: 'event', emoji: '📣', label: 'Event',
    accent: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
    title: 'text-emerald-300', dot: 'bg-emerald-400',
  },
  task: {
    kind: 'task', emoji: '📅', label: 'Deadline',
    accent: 'border-violet-500/30 bg-violet-500/10 text-violet-400',
    title: 'text-violet-300', dot: 'bg-violet-400',
  },
  session: {
    kind: 'session', emoji: '🎓', label: 'Session',
    accent: 'border-sky-500/30 bg-sky-500/10 text-sky-400',
    title: 'text-sky-300', dot: 'bg-sky-400',
  },
  personal: {
    kind: 'personal', emoji: '📌', label: 'Personal Event',
    accent: 'border-rose-500/30 bg-rose-500/10 text-rose-400',
    title: 'text-rose-300', dot: 'bg-rose-400',
  },
};

/**
 * Classify a task as a read-only feed item and return its presentation
 * metadata, or `null` for an ordinary editable todo.
 *
 * @param {object} task
 * @returns {FeedMeta|null}
 */
export function getFeedMeta(task) {
  if (!task) return null;
  if (task.isContest) return FEED_META.contest;
  if (task.feedCategory && FEED_META[task.feedCategory]) return FEED_META[task.feedCategory];
  return null;
}

/**
 * Whether a task is a read-only feed item (contest/event/deadline/session)
 * that the user may view but not edit, complete, or delete.
 *
 * @param {object} task
 * @returns {boolean}
 */
export function isFeedItem(task) {
  // 'personal' is intentionally excluded — personal events are editable via their own pane.
  return !!task && (task.readOnly || task.isContest || ['event', 'task', 'session'].includes(task.feedCategory));
}

