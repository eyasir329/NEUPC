import re

file_path = '/home/eyasir329/Documents/GitHub/neupc/app/account/member/discussions/_components/MemberHelpDeskClient.js'

with open(file_path, 'r') as f:
    content = f.read()

# 1. Add cn function
cn_func = """function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

const CURRENT_USER_STATS"""
content = content.replace("const CURRENT_USER_STATS", cn_func)

# 2. Add TABS constant
tabs_const = """const TABS = [
  { id: 'All', label: 'All Posts', icon: MessageSquare },
  { id: 'Help', label: 'Help & Support', icon: Heart },
  { id: 'Discussion', label: 'Discussions', icon: MessageCircle },
  { id: 'Announcements', label: 'Announcements', icon: Flame },
  { id: 'Release Log', label: 'Release Log', icon: FileText },
  { id: 'Feature Requests', label: 'Feature Requests', icon: Star },
];

const OVERVIEW_STATS"""
content = content.replace("const OVERVIEW_STATS", tabs_const)

# 3. Replace indigo with violet globally (mostly safe for styling)
content = content.replace('indigo', 'violet')
# EXCEPT for any components that we might accidentally break, but in Tailwind it's just colors.

# 4. Replace the MemberHelpDeskClient return layout
old_return = """  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 pt-6 pb-16 sm:px-6 sm:pt-8 lg:px-8 xl:px-10 2xl:px-12 text-gray-300 font-sans text-sm">
      <main>
        <div>
            {isCreatingThread ? ("""

new_return = """  return (
    <div className="flex h-full min-h-screen text-gray-300 selection:bg-violet-500/30">
      {/* ── Secondary left nav ───────────────────────────────────────── */}
      <aside className="hidden w-[240px] shrink-0 border-r border-white/[0.06] bg-gray-950 xl:flex xl:flex-col">
        <nav className="flex-1 overflow-y-auto px-3 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="mb-6 px-3">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-violet-400" />
              Help Desk
            </h2>
          </div>
          <div className="space-y-0.5">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              
              let count = undefined;
              if (tab.id === 'All') count = threads.length;
              else if (tab.id === 'Help') count = threads.filter(t => t.tags.some(tag => tag.text === "Help")).length;
              else if (tab.id === 'Discussion') count = threads.filter(t => t.tags.some(tag => tag.text === "Discussion")).length;
              else if (tab.id === 'Announcements') count = threads.filter(t => t.tags.some(tag => tag.text === "Announce")).length;
              else if (tab.id === 'Feature Requests') count = threads.filter(t => t.tags.some(tag => tag.text === "Feature Request")).length;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setSelectedThreadId(null); setIsCreatingThread(false); }}
                  className={cn(
                    'group/nav relative flex min-h-9 w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-white/30',
                    active
                      ? 'bg-violet-500/12 font-semibold text-violet-400 shadow-violet-500/10'
                      : 'text-gray-400 hover:bg-white/[0.04] hover:text-gray-200'
                  )}
                >
                  {active && (
                    <div className="absolute top-1/2 left-0 h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-gradient-to-b from-violet-500 to-purple-600" />
                  )}
                  <div className="flex items-center gap-3">
                    <Icon className="h-[17px] w-[17px] shrink-0" />
                    <span className="truncate text-left">{tab.label}</span>
                  </div>
                  {count !== undefined && count > 0 && (
                    <span className={cn(
                      "px-1.5 py-0.5 rounded-full text-[10px] font-semibold",
                      active ? "bg-violet-500/20 text-violet-300" : "bg-white/[0.06] text-gray-500"
                    )}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile / tablet horizontal tab bar */}
        <div className="sticky top-14 z-20 border-b border-white/[0.06] bg-gray-950/90 backdrop-blur-xl xl:hidden">
          <div className="flex items-center justify-between gap-2 px-4 sm:px-6">
            <nav className="scrollbar-none -mb-px flex items-center gap-0.5 overflow-x-auto">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id); setSelectedThreadId(null); setIsCreatingThread(false); }}
                    className={cn(
                      'flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-[13px] font-medium transition-colors',
                      active
                        ? 'border-violet-500 text-white'
                        : 'border-transparent text-gray-500 hover:text-gray-300'
                    )}
                  >
                    <Icon className={cn('h-4 w-4', active ? 'text-violet-400' : '')} />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        <main className="flex-1 p-4 pb-10 sm:p-5 lg:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab + (selectedThreadId || '') + (isCreatingThread ? 'create' : '')}
              initial={{ opacity: 0, y: 15, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.98 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="mx-auto w-full max-w-7xl space-y-8"
            >
              {isCreatingThread ? ("""
content = content.replace(old_return, new_return)

# 5. Remove the old Tabs layout
old_tabs = """            </div>

            {/* Tabs */}
            <div className="flex items-center gap-8 border-b border-white/[0.06] mb-6 overflow-x-auto scrollbar-none">
              <TabItem label="All" count={threads.length} active={activeTab === "All"} onClick={() => setActiveTab("All")} />
              <TabItem label="Help" count={threads.filter(t => t.tags.some(tag => tag.text === "Help")).length} active={activeTab === "Help"} onClick={() => setActiveTab("Help")} />
              <TabItem label="Discussion" count={threads.filter(t => t.tags.some(tag => tag.text === "Discussion")).length} active={activeTab === "Discussion"} onClick={() => setActiveTab("Discussion")} />
              <TabItem label="Announcements" count={threads.filter(t => t.tags.some(tag => tag.text === "Announce")).length} active={activeTab === "Announcements"} onClick={() => setActiveTab("Announcements")} />
              <TabItem label="Release Log" active={activeTab === "Release Log"} onClick={() => setActiveTab("Release Log")} />
              <TabItem label="Feature Requests" count={threads.filter(t => t.tags.some(tag => tag.text === "Feature Request")).length} active={activeTab === "Feature Requests"} onClick={() => setActiveTab("Feature Requests")} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">"""

new_tabs = """            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">"""
content = content.replace(old_tabs, new_tabs)

# 6. Replace background colors to match problem solving
# Replace old bg colors with white/[0.04] white/[0.06] etc if applicable, or just leave as is since they match fairly closely.
content = content.replace('bg-[#161b22]/80', 'bg-white/[0.03]')
content = content.replace('border-slate-700/80', 'border-white/[0.08]')
content = content.replace('bg-[#161b22]/50', 'bg-white/[0.02]')
content = content.replace('bg-[#161b22]/60', 'bg-white/[0.03]')
content = content.replace('bg-[#161b22]', 'bg-white/[0.04]')
content = content.replace('border-slate-800', 'border-white/[0.08]')
content = content.replace('border-slate-700', 'border-white/[0.14]')
content = content.replace('bg-[#0d1117]/80', 'bg-white/[0.02]')
content = content.replace('bg-[#0d1117]/50', 'bg-white/[0.01]')
content = content.replace('bg-[#0d1117]', 'bg-gray-950')
content = content.replace('text-slate-100', 'text-white')
content = content.replace('text-slate-200', 'text-gray-200')
content = content.replace('text-slate-300', 'text-gray-300')
content = content.replace('text-slate-400', 'text-gray-400')
content = content.replace('text-slate-500', 'text-gray-500')

# 7. Add closing tags for the new wrappers
old_end = """              </>
            )}
          </div>
        </main>
    </div>
  );
}"""

new_end = """              </>
            )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}"""
content = content.replace(old_end, new_end)

with open(file_path, 'w') as f:
    f.write(content)
