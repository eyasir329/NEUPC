/**
 * @file Low-level field editors for admin settings: toggles, nested/JSON editors.
 * @module settings-editors
 */

'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, ArrowDown, ArrowUp, Bell, BookOpen, CalendarDays, Check, CheckCircle2, ChevronDown, Database, Eye, Facebook, FileText, Github, Globe, GraduationCap, Instagram, Layout, Linkedin, Loader2, Lock, Plus, Power, RotateCcw, Save, Search, Settings, Settings2, ShieldCheck, Sliders, Sparkles, ToggleLeft, Trash2, Twitter, Type, UserPlus, Users, Wrench, X, Youtube } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

function parseFieldGroups(fields) {
  const groups = [];
  let current = { label: null, fields: [] };
  for (const f of fields) {
    if (f.type === 'divider') {
      if (current.fields.length > 0 || current.label !== null)
        groups.push(current);
      current = { label: f.label, fields: [] };
    } else {
      current.fields.push(f);
    }
  }
  if (current.fields.length > 0) groups.push(current);
  return groups;
}

/** Count real (non-divider) fields */
function countFields(section) {
  return section.fields.filter((f) => f.type !== 'divider').length;
}

// ─── Dynamic Icon Renderer ───────────────────────────────────────────────────

function DynamicIcon({ name, className = 'h-4 w-4' }) {
  const icons = {
    Settings,
    Layout,
    ToggleLeft,
    Users,
    GraduationCap,
    CalendarDays,
    BookOpen,
    Bell,
    ShieldCheck,
    Wrench,
    Save,
    CheckCircle2,
    AlertCircle,
    Loader2,
    ChevronDown,
    Instagram,
    Facebook,
    Twitter,
    Github,
    Linkedin,
    Youtube,
    Database,
    Type,
    Search,
    X,
    Sparkles,
    RotateCcw,
    Check,
    Plus,
    Trash2,
    ArrowUp,
    ArrowDown,
    Eye,
    Settings2,
    Sliders,
    Globe,
    FileText,
    Lock,
    UserPlus,
    Power,
  };
  const IconComp = icons[name] || Sparkles;
  return <IconComp className={className} />;
}

// ─── Toggle Switch ────────────────────────────────────────────────────────────

function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-all duration-300 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 disabled:cursor-not-allowed disabled:opacity-40 ${
        checked
          ? 'bg-linear-to-r from-blue-500 to-cyan-500 shadow-[0_0_12px_rgba(59,130,246,0.35)]'
          : 'bg-white/10 hover:bg-white/15'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-4.5 w-4.5 rounded-full shadow-md transition-all duration-300 ease-in-out ${
          checked ? 'translate-x-5.5 bg-white' : 'translate-x-0.75 bg-gray-400'
        }`}
      />
    </button>
  );
}

// ─── Visual JSON List / Object Builder ────────────────────────────────────────

const JSON_TEMPLATES = {
  about_mission: () => '',
  about_vision: () => '',
  about_mentorship_areas: () => '',
  contact_subjects: () => '',
  faqs: () => ({ question: '', answer: '' }),
  about_what_we_do: () => ({ icon: 'Code', title: '', description: '' }),
  join_benefits: () => ({ icon: 'Check', title: '', description: '' }),
  join_features: () => ({ icon: 'Eye', title: '', description: '' }),
  about_stats: () => ({ value: '10+', label: 'New Stat', icon: 'Star' }),
  hero_roadmap_nodes: () => ({ id: '', label: '', description: '', link: '' }),
  about_core_values: () => ({ label: '', icon: 'Check' }),
  about_skills: () => ({ label: '', icon: 'Check' }),
  about_org_structure: () => ({
    title: '',
    description: '',
    icon: 'Users',
    color: 'primary',
  }),
  developers_core: () => ({
    name: '',
    role: '',
    bio: '',
    stack: '',
    github: '',
    linkedin: '',
    portfolio: '',
    photo: '',
  }),
  developers_contributors: () => ({
    name: '',
    role: '',
    contribution: '',
    github: '',
  }),
  developers_timeline: () => ({
    year: new Date().getFullYear().toString(),
    title: '',
    description: '',
    status: 'completed',
  }),
  tech_stack: () => ({ category: '', items: [] }),
  github_stats: () => ({ commits: 0, contributors: 0, stars: 0, forks: 0 }),
};

// Keys whose values are long-form text and deserve a textarea instead of input.
const LARGE_TEXT_KEYS = ['bio', 'description', 'answer', 'contribution', 'notes'];

// Produce an empty-but-shaped clone of a sample value, used when adding a new
// entry to a nested list so the new row exposes the same fields as its siblings.
function emptyClone(sample) {
  if (Array.isArray(sample)) return [];
  if (sample && typeof sample === 'object') {
    return Object.fromEntries(
      Object.entries(sample).map(([k, v]) => [
        k,
        typeof v === 'number'
          ? 0
          : Array.isArray(v)
            ? []
            : v && typeof v === 'object'
              ? {}
              : '',
      ])
    );
  }
  return typeof sample === 'number' ? 0 : '';
}

// ─── Leaf / nested value inputs (used by the visual JSON builders) ────────────

// A single primitive field (string/number) with key-aware widgets.
function NestedLeafInput({ id, fieldKey, value, onChange, disabled }) {
  const isLarge = LARGE_TEXT_KEYS.includes(fieldKey);
  return (
    <div className={`flex flex-col gap-1 ${isLarge ? 'col-span-full' : ''}`}>
      <label
        htmlFor={id}
        className="text-[10px] font-semibold text-gray-500 uppercase"
      >
        {fieldKey.replace(/_/g, ' ')}
      </label>
      {isLarge ? (
        <textarea
          id={id}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          rows={2}
          className="w-full rounded-lg border border-white/8 bg-white/3 px-3 py-1.5 text-xs text-gray-200 focus:border-blue-500/30 focus:outline-none"
        />
      ) : (
        <div className="relative">
          <input
            type="text"
            id={id}
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className={`w-full rounded-lg border border-white/8 bg-white/3 px-3 py-1.5 text-xs text-gray-200 focus:border-blue-500/30 focus:outline-none ${
              fieldKey === 'icon' ? 'pl-8' : ''
            }`}
          />
          {fieldKey === 'icon' && (
            <div className="absolute top-1/2 left-2.5 -translate-y-1/2">
              <DynamicIcon name={value} className="h-3.5 w-3.5 text-gray-500" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Renders one key/value of an object — recursing for nested arrays/objects so
// shapes like tech_stack ({ category, items: [...] }) edit properly instead of
// collapsing a nested array into a broken text input.
function NestedValueField({ id, fieldKey, value, onChange, disabled }) {
  if (Array.isArray(value)) {
    return (
      <NestedListEditor
        id={id}
        label={fieldKey.replace(/_/g, ' ')}
        value={value}
        onChange={onChange}
        disabled={disabled}
      />
    );
  }
  if (value && typeof value === 'object') {
    return (
      <NestedObjectEditor
        id={id}
        label={fieldKey.replace(/_/g, ' ')}
        value={value}
        onChange={onChange}
        disabled={disabled}
      />
    );
  }
  return (
    <NestedLeafInput
      id={id}
      fieldKey={fieldKey}
      value={value}
      onChange={onChange}
      disabled={disabled}
    />
  );
}

// Editor for a nested plain object value.
function NestedObjectEditor({ id, label, value, onChange, disabled }) {
  const obj = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  return (
    <div className="col-span-full flex flex-col gap-2 rounded-lg border border-white/6 bg-black/10 p-3">
      <span className="text-[10px] font-bold tracking-wide text-gray-400 uppercase">
        {label}
      </span>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {Object.entries(obj).map(([k, v]) => (
          <NestedValueField
            key={k}
            id={`${id}-${k}`}
            fieldKey={k}
            value={v}
            onChange={(nv) => onChange({ ...obj, [k]: nv })}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );
}

// Editor for a nested array value (array of objects or of strings).
function NestedListEditor({ id, label, value, onChange, disabled }) {
  const list = Array.isArray(value) ? value : [];
  const update = (i, nv) => {
    const next = [...list];
    next[i] = nv;
    onChange(next);
  };
  const remove = (i) => onChange(list.filter((_, x) => x !== i));
  const add = () => {
    const sample = list[0];
    const item =
      sample !== undefined
        ? emptyClone(sample)
        : { name: '', description: '', icon: '' };
    onChange([...list, item]);
  };

  return (
    <div className="col-span-full flex flex-col gap-2 rounded-lg border border-white/6 bg-black/10 p-3">
      <span className="text-[10px] font-bold tracking-wide text-gray-400 uppercase">
        {label} ({list.length})
      </span>
      <div className="space-y-2">
        {list.map((el, i) => (
          <div
            key={i}
            className="rounded-lg border border-white/6 bg-white/[0.02] p-3"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] font-semibold text-gray-500">
                #{i + 1}
              </span>
              <button
                type="button"
                onClick={() => remove(i)}
                disabled={disabled}
                className="rounded-md p-1 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            {el && typeof el === 'object' ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {Object.entries(el).map(([k, v]) => (
                  <NestedValueField
                    key={k}
                    id={`${id}-${i}-${k}`}
                    fieldKey={k}
                    value={v}
                    onChange={(nv) => update(i, { ...el, [k]: nv })}
                    disabled={disabled}
                  />
                ))}
              </div>
            ) : (
              <input
                type="text"
                value={el ?? ''}
                onChange={(e) => update(i, e.target.value)}
                disabled={disabled}
                className="w-full rounded-lg border border-white/8 bg-white/3 px-3 py-1.5 text-xs text-gray-200 focus:border-blue-500/30 focus:outline-none"
              />
            )}
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={add}
        disabled={disabled}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-white/8 py-2 text-[11px] font-semibold text-gray-400 transition-all hover:border-white/15 hover:text-white"
      >
        <Plus className="h-3.5 w-3.5" /> Add to {label}
      </button>
    </div>
  );
}

// Editor for a top-level object keyed by category whose values are lists or
// objects (e.g. tech_stack: { frontend: [...], backend: [...] }). Renders each
// key with an editable name plus a nested editor for its value.
function ObjectMapEditor({ id, value, onChange, disabled }) {
  const obj =
    value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const entries = Object.entries(obj);

  const renameKey = (oldKey, rawNewKey) => {
    const newKey = rawNewKey.trim();
    if (!newKey || newKey === oldKey || obj[newKey] !== undefined) return;
    onChange(
      Object.fromEntries(entries.map(([k, v]) => [k === oldKey ? newKey : k, v]))
    );
  };
  const setValueFor = (key, nv) => onChange({ ...obj, [key]: nv });
  const removeKey = (key) => {
    const next = { ...obj };
    delete next[key];
    onChange(next);
  };
  const addKey = () => {
    let key = 'new_category';
    let i = 1;
    while (obj[key] !== undefined) key = `new_category_${i++}`;
    onChange({ ...obj, [key]: [] });
  };

  return (
    <div className="space-y-3">
      {entries.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/6 py-6 text-center">
          <span className="text-xs text-gray-600">
            No categories yet. Add the first one to get started.
          </span>
        </div>
      )}
      {entries.map(([key, val]) => (
        <div
          key={key}
          className="rounded-xl border border-white/6 bg-white/[0.02] p-4 transition-all duration-200 hover:border-white/12"
        >
          <div className="mb-3 flex items-center gap-2 border-b border-white/4 pb-2">
            <input
              type="text"
              defaultValue={key}
              onBlur={(e) => renameKey(key, e.target.value)}
              disabled={disabled}
              className="flex-1 rounded-lg border border-white/8 bg-white/3 px-3 py-1.5 text-xs font-bold text-gray-200 focus:border-blue-500/30 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => removeKey(key)}
              disabled={disabled}
              className="rounded-md p-1 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          {Array.isArray(val) ? (
            <NestedListEditor
              id={`${id}-${key}`}
              label="Items"
              value={val}
              onChange={(nv) => setValueFor(key, nv)}
              disabled={disabled}
            />
          ) : val && typeof val === 'object' ? (
            <NestedObjectEditor
              id={`${id}-${key}`}
              label="Fields"
              value={val}
              onChange={(nv) => setValueFor(key, nv)}
              disabled={disabled}
            />
          ) : (
            <NestedLeafInput
              id={`${id}-${key}`}
              fieldKey="value"
              value={val}
              onChange={(nv) => setValueFor(key, nv)}
              disabled={disabled}
            />
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={addKey}
        disabled={disabled}
        className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/8 bg-white/[0.01] py-3 text-xs font-semibold text-gray-400 transition-all duration-150 hover:border-white/15 hover:bg-white/3 hover:text-white active:scale-[0.99]"
      >
        <Plus className="h-4 w-4" />
        Add Category
      </button>
    </div>
  );
}

function VisualJsonEditor({ field, value, onChange, disabled }) {
  const [activeTab, setActiveTab] = useState('visual'); // 'visual' | 'raw'
  const [jsonText, setJsonText] = useState('');
  const [isValidJson, setIsValidJson] = useState(true);

  const isSingleObject = field.key === 'github_stats';

  // Coerce the value into a plain object and overlay the template so every
  // expected key always renders (the stored value may be empty, a string, or
  // an array default). Only used for single-object fields like github_stats.
  const singleObject = useMemo(() => {
    let v = value;
    if (typeof v === 'string') {
      try {
        v = JSON.parse(v);
      } catch {
        v = {};
      }
    }
    if (!v || Array.isArray(v) || typeof v !== 'object') v = {};
    const tpl = JSON_TEMPLATES[field.key];
    return tpl ? { ...tpl(), ...v } : v;
  }, [value, field.key]);

  // Sync the value to the raw JSON textarea string. Single-object fields show
  // the coerced/merged object so the Raw view matches the Visual view.
  useEffect(() => {
    const base = isSingleObject ? singleObject : value;
    const serialized =
      typeof base === 'string'
        ? base
        : JSON.stringify(base ?? (isSingleObject ? {} : []), null, 2);
    setJsonText(serialized);
    try {
      JSON.parse(serialized);
      setIsValidJson(true);
    } catch {
      setIsValidJson(false);
    }
  }, [value, isSingleObject, singleObject]);

  const items = useMemo(() => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return [];
      }
    }
    return Array.isArray(value) ? value : [];
  }, [value]);

  const isSimpleStringList = useMemo(() => {
    return [
      'about_mission',
      'about_vision',
      'about_mentorship_areas',
      'contact_subjects',
    ].includes(field.key);
  }, [field.key]);

  // A value stored as a plain object keyed by category (e.g. tech_stack:
  // { frontend: [...], backend: [...] }) needs the object-map editor instead of
  // the array-of-items builder, which would otherwise show nothing.
  const isObjectMap =
    !isSingleObject &&
    !isSimpleStringList &&
    !!value &&
    typeof value === 'object' &&
    !Array.isArray(value);

  const handleRawChange = (text) => {
    setJsonText(text);
    try {
      const parsed = JSON.parse(text);
      setIsValidJson(true);
      onChange(parsed);
    } catch {
      setIsValidJson(false);
    }
  };

  const handleUpdateItem = (index, key, val) => {
    const updated = [...items];
    if (isSimpleStringList) {
      updated[index] = val;
    } else {
      updated[index] = { ...updated[index], [key]: val };
    }
    onChange(updated);
  };

  const handleAddItem = () => {
    const templateFn = JSON_TEMPLATES[field.key];
    const newItem = templateFn ? templateFn() : {};
    onChange([...items, newItem]);
  };

  const handleDeleteItem = (index) => {
    const updated = items.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleMoveItem = (index, direction) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === items.length - 1) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...items];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    onChange(updated);
  };

  // String lists Tag Builder
  const [newTagText, setNewTagText] = useState('');
  const handleAddTag = (e) => {
    if (e.key === 'Enter' || e.type === 'click') {
      e.preventDefault();
      if (newTagText.trim()) {
        onChange([...items, newTagText.trim()]);
        setNewTagText('');
      }
    }
  };

  return (
    <div className="col-span-full rounded-2xl border border-white/6 bg-white/[0.01] p-4.5 backdrop-blur-md">
      <div className="mb-4 flex items-center justify-between border-b border-white/6 pb-3">
        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-gray-200 uppercase">
            <Sliders className="h-3.5 w-3.5 text-blue-400" />
            {field.label}
          </label>
          {field.desc && (
            <p className="mt-0.5 text-[11px] text-gray-500">{field.desc}</p>
          )}
        </div>

        {/* Toggle between Visual and Raw modes */}
        <div className="flex rounded-lg border border-white/6 bg-white/3 p-0.5">
          <button
            type="button"
            onClick={() => setActiveTab('visual')}
            className={`rounded-md px-2.5 py-1 text-[10px] font-semibold transition-all ${
              activeTab === 'visual'
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Visual Builder
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('raw')}
            className={`rounded-md px-2.5 py-1 text-[10px] font-semibold transition-all ${
              activeTab === 'raw'
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Raw Code
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'visual' && !isSingleObject && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="space-y-3"
          >
            {/* Tag / simple string array list builder */}
            {isSimpleStringList && (
              <div className="space-y-3.5">
                <div className="flex min-h-16 flex-wrap gap-2 rounded-xl border border-white/4 bg-black/10 p-3">
                  {items.length === 0 ? (
                    <span className="m-auto text-xs text-gray-600">
                      No items configured. Add one below.
                    </span>
                  ) : (
                    items.map((tag, idx) => (
                      <span
                        key={idx}
                        className="flex items-center gap-1.5 rounded-full border border-blue-500/25 bg-blue-500/10 px-3 py-1 text-xs text-blue-300"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(idx)}
                          className="rounded-full p-0.5 transition-colors hover:bg-blue-500/20 hover:text-white"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTagText}
                    onChange={(e) => setNewTagText(e.target.value)}
                    onKeyDown={handleAddTag}
                    disabled={disabled}
                    placeholder="Type list item and press Enter..."
                    className="flex-1 rounded-lg border border-white/8 bg-white/3 px-3.5 py-2 text-xs text-gray-200 focus:border-blue-500/30 focus:bg-white/5 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    disabled={disabled}
                    className="flex items-center gap-1 rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-xs font-semibold text-blue-300 hover:bg-blue-500/20"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add
                  </button>
                </div>
              </div>
            )}

            {/* Object map builder (category → list, e.g. tech_stack) */}
            {isObjectMap && (
              <ObjectMapEditor
                id={`object-map-${field.key}`}
                value={value}
                onChange={onChange}
                disabled={disabled}
              />
            )}

            {/* Object items builder */}
            {!isSimpleStringList && !isObjectMap && (
              <div className="space-y-3">
                {items.map((item, idx) => {
                  const itemTitle =
                    item.title ||
                    item.label ||
                    item.name ||
                    item.question ||
                    `Item #${idx + 1}`;
                  // Overlay the template so every expected field always renders,
                  // even if this stored item is missing some keys.
                  const templateFn = JSON_TEMPLATES[field.key];
                  const mergedItem =
                    templateFn && item && typeof item === 'object' && !Array.isArray(item)
                      ? { ...templateFn(), ...item }
                      : item;
                  return (
                    <div
                      key={idx}
                      className="rounded-xl border border-white/6 bg-white/[0.02] p-4 transition-all duration-200 hover:border-white/12"
                    >
                      <div className="mb-3 flex items-center justify-between border-b border-white/4 pb-2">
                        <span className="flex items-center gap-2 text-xs font-bold text-gray-200">
                          {item.icon && (
                            <DynamicIcon
                              name={item.icon}
                              className="h-3.5 w-3.5 text-blue-400"
                            />
                          )}
                          {itemTitle}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleMoveItem(idx, 'up')}
                            disabled={idx === 0 || disabled}
                            className="rounded-md p-1 text-gray-500 hover:bg-white/5 hover:text-gray-300 disabled:opacity-30"
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveItem(idx, 'down')}
                            disabled={idx === items.length - 1 || disabled}
                            className="rounded-md p-1 text-gray-500 hover:bg-white/5 hover:text-gray-300 disabled:opacity-30"
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(idx)}
                            disabled={disabled}
                            className="rounded-md p-1 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Fields input grid inside the item */}
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {Object.entries(mergedItem).map(([k, v]) => {
                          const inputId = `json-item-${field.key}-${idx}-${k}`;
                          const formattedLabel = k.replace(/_/g, ' ');

                          // Nested array/object values (e.g. tech_stack.items)
                          // get a dedicated recursive editor.
                          if (Array.isArray(v) || (v && typeof v === 'object')) {
                            return (
                              <NestedValueField
                                key={k}
                                id={inputId}
                                fieldKey={k}
                                value={v}
                                onChange={(nv) => handleUpdateItem(idx, k, nv)}
                                disabled={disabled}
                              />
                            );
                          }

                          if (k === 'color') {
                            return (
                              <div key={k} className="flex flex-col gap-1">
                                <label
                                  htmlFor={inputId}
                                  className="text-[10px] font-semibold text-gray-500 uppercase"
                                >
                                  {formattedLabel}
                                </label>
                                <select
                                  id={inputId}
                                  value={v || 'primary'}
                                  onChange={(e) =>
                                    handleUpdateItem(idx, k, e.target.value)
                                  }
                                  disabled={disabled}
                                  className="w-full rounded-lg border border-white/8 bg-white/3 px-3 py-1.5 text-xs text-gray-200 focus:border-blue-500/30 focus:outline-none [&>option]:bg-gray-900"
                                >
                                  <option value="primary">Primary</option>
                                  <option value="secondary">Secondary</option>
                                </select>
                              </div>
                            );
                          }

                          if (k === 'status') {
                            return (
                              <div key={k} className="flex flex-col gap-1">
                                <label
                                  htmlFor={inputId}
                                  className="text-[10px] font-semibold text-gray-500 uppercase"
                                >
                                  {formattedLabel}
                                </label>
                                <select
                                  id={inputId}
                                  value={v || 'completed'}
                                  onChange={(e) =>
                                    handleUpdateItem(idx, k, e.target.value)
                                  }
                                  disabled={disabled}
                                  className="w-full rounded-lg border border-white/8 bg-white/3 px-3 py-1.5 text-xs text-gray-200 focus:border-blue-500/30 focus:outline-none [&>option]:bg-gray-900"
                                >
                                  <option value="completed">Completed</option>
                                  <option value="in-progress">
                                    In Progress
                                  </option>
                                  <option value="planned">Planned</option>
                                </select>
                              </div>
                            );
                          }

                          const isLarge = [
                            'bio',
                            'description',
                            'answer',
                            'contribution',
                          ].includes(k);
                          return (
                            <div
                              key={k}
                              className={`flex flex-col gap-1 ${isLarge ? 'col-span-full' : ''}`}
                            >
                              <label
                                htmlFor={inputId}
                                className="text-[10px] font-semibold text-gray-500 uppercase"
                              >
                                {formattedLabel}
                              </label>
                              {isLarge ? (
                                <textarea
                                  id={inputId}
                                  value={v || ''}
                                  onChange={(e) =>
                                    handleUpdateItem(idx, k, e.target.value)
                                  }
                                  disabled={disabled}
                                  rows={2}
                                  className="w-full rounded-lg border border-white/8 bg-white/3 px-3 py-1.5 text-xs text-gray-200 focus:border-blue-500/30 focus:outline-none"
                                />
                              ) : (
                                <div className="relative">
                                  <input
                                    type="text"
                                    id={inputId}
                                    value={v || ''}
                                    onChange={(e) =>
                                      handleUpdateItem(idx, k, e.target.value)
                                    }
                                    disabled={disabled}
                                    className={`w-full rounded-lg border border-white/8 bg-white/3 px-3 py-1.5 text-xs text-gray-200 focus:border-blue-500/30 focus:outline-none ${
                                      k === 'icon' ? 'pl-8' : ''
                                    }`}
                                  />
                                  {k === 'icon' && (
                                    <div className="absolute top-1/2 left-2.5 -translate-y-1/2">
                                      <DynamicIcon
                                        name={v}
                                        className="h-3.5 w-3.5 text-gray-500"
                                      />
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {items.length === 0 && (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/6 py-6 text-center">
                    <span className="text-xs text-gray-600">
                      No items available. Add the first item to get started.
                    </span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleAddItem}
                  disabled={disabled}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/8 bg-white/[0.01] py-3 text-xs font-semibold text-gray-400 transition-all duration-150 hover:border-white/15 hover:bg-white/3 hover:text-white active:scale-[0.99]"
                >
                  <Plus className="h-4 w-4" />
                  Add New Item
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* Flat Object Editor (Single Object schema - like github_stats) */}
        {activeTab === 'visual' && isSingleObject && (
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
            {Object.entries(singleObject).map(([k, v]) => {
              const inputId = `flat-json-${field.key}-${k}`;
              return (
                <div key={k} className="flex flex-col gap-1">
                  <label
                    htmlFor={inputId}
                    className="text-[10px] font-semibold text-gray-500 uppercase"
                  >
                    {k}
                  </label>
                  <input
                    type="number"
                    id={inputId}
                    value={v ?? 0}
                    onChange={(e) => {
                      const updated = {
                        ...singleObject,
                        [k]: Number(e.target.value),
                      };
                      onChange(updated);
                    }}
                    disabled={disabled}
                    className="w-full rounded-lg border border-white/8 bg-white/3 px-3 py-2 text-xs text-gray-200 focus:border-blue-500/30 focus:outline-none"
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* Raw Code Editor (JSON text block) */}
        {activeTab === 'raw' && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="relative"
          >
            <textarea
              value={jsonText}
              onChange={(e) => handleRawChange(e.target.value)}
              disabled={disabled}
              rows={8}
              placeholder="[]"
              className={`w-full rounded-xl border border-white/8 bg-black/20 p-3.5 font-mono text-xs leading-relaxed text-gray-300 focus:ring-2 focus:ring-blue-500/15 focus:outline-none disabled:opacity-40 ${
                !isValidJson
                  ? 'border-rose-500/30 focus:border-rose-500/50'
                  : 'focus:border-blue-500/30'
              }`}
            />
            <div className="absolute right-3.5 bottom-3 flex items-center gap-1.5">
              {!isValidJson ? (
                <span className="flex items-center gap-1 rounded-md border border-rose-500/20 bg-rose-500/10 px-2 py-0.5 text-[9px] font-bold tracking-wide text-rose-400 uppercase">
                  <AlertCircle className="h-3 w-3" />
                  Invalid JSON
                </span>
              ) : (
                <span className="flex items-center gap-1 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold tracking-wide text-emerald-400 uppercase">
                  <Check className="h-3 w-3" />
                  Valid Format
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Glowing Quick Toggles Header Widget ─────────────────────────────────────


export { parseFieldGroups, countFields, DynamicIcon, Toggle, VisualJsonEditor };
