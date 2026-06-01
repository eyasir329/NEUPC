/**
 * @file Pure utility functions for the Daily Activity Todoist-style UI.
 *   All static seed data and localStorage helpers have been removed —
 *   data is now fetched from Supabase via API routes.
 * @module daily-activity/_todoist/utils
 */

export const Priority = {
  P1: 1, // Red
  P2: 2, // Orange
  P3: 3, // Blue
  P4: 4, // Gray/Default
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

export function getPlatformClass(_platform) {
  return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
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
