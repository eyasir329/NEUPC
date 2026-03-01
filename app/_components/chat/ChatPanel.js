/**
 * @file ChatPanel – Main chat panel with conversation list, thread, and picker.
 *
 * Views: list → thread → new-chat
 * Features:
 * - Search conversations
 * - Executive tabs (Direct / Support)
 * - Smooth view transitions
 * - Responsive & fullscreen modes
 *
 * @module ChatPanel
 */

'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { cn } from '@/app/_lib/utils';
import { Search } from 'lucide-react';
import {
  getConversationsAction,
  getSupportInboxAction,
  syncGroupMembershipsAction,
} from '@/app/_lib/chat-actions';
import ChatPanelHeader from './ChatPanelHeader';
import ConversationList from './ConversationList';
import MessageThread from './MessageThread';
import NewChatPicker from './NewChatPicker';
import EmptyState from './EmptyState';

const POLL_MS = 5_000;

export default function ChatPanel({
  session,
  onClose,
  onUnreadUpdate,
  isFullscreen,
  onToggleFullscreen,
  closing = false,
}) {
  const role = session?.user?.role || 'member';
  const [view, setView] = useState('list');
  const [conversations, setConversations] = useState([]);
  const [supportConversations, setSupportConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('direct');
  const [searchQuery, setSearchQuery] = useState('');
  const panelRef = useRef(null);

  const isExecutive = role === 'executive' || role === 'admin';

  /* ── Data fetching ───────────────────────────────────── */
  const loadConversations = useCallback(async () => {
    try {
      const result = await getConversationsAction();
      if (!result.error) {
        setConversations(result.conversations || []);
        onUnreadUpdate?.(result.totalUnread || 0);
      }
      if (isExecutive) {
        const supportResult = await getSupportInboxAction();
        if (!supportResult.error) {
          setSupportConversations(supportResult.conversations || []);
        }
      }
    } catch {
      /* silent */
    }
  }, [isExecutive, onUnreadUpdate]);

  useEffect(() => {
    syncGroupMembershipsAction()
      .then(() => loadConversations())
      .finally(() => setLoading(false));
  }, [loadConversations]);

  useEffect(() => {
    if (view !== 'list') return;
    const id = setInterval(loadConversations, POLL_MS);
    return () => clearInterval(id);
  }, [view, loadConversations]);

  /* ── View handlers ───────────────────────────────────── */
  const openThread = useCallback((conv) => {
    setActiveConversation(conv);
    setView('thread');
  }, []);

  const goBack = useCallback(() => {
    setActiveConversation(null);
    setView('list');
    loadConversations();
  }, [loadConversations]);

  const openNewChat = useCallback(() => setView('new-chat'), []);

  const handleCreated = useCallback(
    (conv) => {
      setActiveConversation(conv);
      setView('thread');
      loadConversations();
    },
    [loadConversations]
  );

  /* ── Header title ────────────────────────────────────── */
  let headerTitle = 'Chat';
  let headerSubtitle = '';
  if (view === 'thread') {
    if (activeConversation?.type === 'group') {
      headerTitle = activeConversation.groupInfo?.name || 'Group';
      headerSubtitle = `${activeConversation.groupInfo?.memberCount || 0} members`;
    } else {
      const other =
        activeConversation?.otherUser || activeConversation?.guestUser;
      headerTitle = other?.full_name || 'Chat';
      headerSubtitle = other?.role || '';
    }
  } else if (view === 'new-chat') {
    headerTitle = 'New chat';
  }

  /* ── Tab config ──────────────────────────────────────── */
  const tabs = useMemo(
    () => [
      { key: 'direct', label: 'Chats' },
      { key: 'groups', label: 'Groups' },
      ...(isExecutive ? [{ key: 'support', label: 'Support' }] : []),
    ],
    [isExecutive]
  );

  /* ── Filtered conversations ──────────────────────────── */
  let activeConvos;
  if (activeTab === 'support') {
    activeConvos = supportConversations;
  } else if (activeTab === 'groups') {
    activeConvos = conversations.filter((c) => c.type === 'group');
  } else {
    activeConvos = conversations.filter((c) => c.type === 'direct');
  }

  const filteredConvos = searchQuery.trim()
    ? activeConvos.filter((c) => {
        if (c.type === 'group') {
          return c.groupInfo?.name
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase());
        }
        const other = c.otherUser || c.guestUser;
        const name = other?.full_name || '';
        return name.toLowerCase().includes(searchQuery.toLowerCase());
      })
    : activeConvos;

  return (
    <div
      ref={panelRef}
      className={cn(
        'fixed z-50 flex flex-col overflow-hidden',
        'border border-[#2a3942]/50 bg-[#111b21]',
        'shadow-2xl shadow-black/50',
        'transition-all duration-200 ease-out',
        closing
          ? 'translate-y-3 scale-[0.97] opacity-0'
          : 'translate-y-0 scale-100 opacity-100',
        isFullscreen
          ? 'inset-0 rounded-none'
          : [
              'rounded-2xl',
              'inset-x-0 bottom-22 mx-2 h-[80dvh]',
              'sm:inset-auto sm:right-7 sm:bottom-22 sm:mx-0',
              'sm:h-152 sm:w-100',
            ]
      )}
    >
      {/* ── Header ─────────────────────────────────────── */}
      <ChatPanelHeader
        title={headerTitle}
        subtitle={headerSubtitle}
        showBack={view === 'thread' || view === 'new-chat'}
        showNewChat={view === 'list'}
        onBack={goBack}
        onNewChat={openNewChat}
        onClose={onClose}
        activeConversation={activeConversation}
        session={session}
        isFullscreen={isFullscreen}
        onToggleFullscreen={onToggleFullscreen}
      />

      {/* ── Tabs ──────────────────────────────────────── */}
      {view === 'list' && (
        <div className="flex border-b border-[#222d34] bg-[#202c33]">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                setSearchQuery('');
              }}
              className={cn(
                'relative flex-1 py-2.5 text-[13px] font-semibold tracking-wider uppercase transition-colors',
                activeTab === tab.key
                  ? 'text-[#00a884]'
                  : 'text-[#8696a0] hover:text-[#d1d7db]'
              )}
            >
              {tab.label}
              {tab.key === 'support' && supportConversations.length > 0 && (
                <span className="ml-1.5 inline-flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-[#00a884] px-1 text-[10px] font-bold text-[#111b21]">
                  {supportConversations.length}
                </span>
              )}
              {activeTab === tab.key && (
                <span className="absolute right-0 bottom-0 left-0 h-0.75 rounded-t-full bg-[#00a884]" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* ── Content ────────────────────────────────────── */}
      <div className="relative flex-1 overflow-hidden">
        {/* List view */}
        {view === 'list' && (
          <div className="flex h-full flex-col">
            {/* Search bar */}
            {!loading && activeConvos.length > 0 && (
              <div className="px-3 pt-2 pb-1">
                <div className="relative">
                  <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#8696a0]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search or start new chat"
                    className={cn(
                      'w-full rounded-lg bg-[#202c33] py-1.75 pr-3 pl-9',
                      'text-[13px] text-[#d1d7db] placeholder-[#8696a0]',
                      'border-none outline-none',
                      'transition-colors focus:bg-[#2a3942]'
                    )}
                  />
                </div>
              </div>
            )}

            {/* List content */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex h-full items-center justify-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-[#00a884]/30 border-t-[#00a884]" />
                    <p className="text-xs text-[#8696a0]">
                      Loading conversations...
                    </p>
                  </div>
                </div>
              ) : filteredConvos.length === 0 ? (
                searchQuery.trim() ? (
                  <div className="flex flex-col items-center justify-center px-6 py-16">
                    <p className="text-sm text-[#8696a0]">
                      No results for &ldquo;{searchQuery}&rdquo;
                    </p>
                  </div>
                ) : (
                  <EmptyState
                    type={
                      activeTab === 'support'
                        ? 'support'
                        : activeTab === 'groups'
                          ? 'groups'
                          : 'chat'
                    }
                  />
                )
              ) : (
                <ConversationList
                  conversations={filteredConvos}
                  currentUserId={session.user.id}
                  onSelect={openThread}
                  isSupport={activeTab === 'support'}
                />
              )}
            </div>
          </div>
        )}

        {/* Thread view */}
        {view === 'thread' && activeConversation && (
          <MessageThread
            conversation={activeConversation}
            session={session}
            onBack={goBack}
          />
        )}

        {/* New chat picker */}
        {view === 'new-chat' && (
          <NewChatPicker
            session={session}
            onConversationCreated={handleCreated}
            onCancel={goBack}
          />
        )}
      </div>
    </div>
  );
}
