/**
 * @file ChatPanel - WhatsApp-style main chat panel
 * @module ChatPanel
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { cn } from '@/app/_lib/utils';
import {
  getConversationsAction,
  getSupportInboxAction,
} from '@/app/_lib/chat-actions';
import ChatPanelHeader from './ChatPanelHeader';
import ConversationList from './ConversationList';
import MessageThread from './MessageThread';
import NewChatPicker from './NewChatPicker';
import SupportEntryForm from './SupportEntryForm';
import EmptyState from './EmptyState';

/**
 * Views: list | thread | new-chat | support-form
 */
export default function ChatPanel({
  session,
  onClose,
  onUnreadUpdate,
  isFullscreen,
  onToggleFullscreen,
}) {
  const role = session?.user?.role || 'guest';
  const [view, setView] = useState(role === 'guest' ? 'support-form' : 'list');
  const [conversations, setConversations] = useState([]);
  const [supportConversations, setSupportConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('direct');
  const panelRef = useRef(null);

  const isExecutive = role === 'executive' || role === 'admin';

  const loadConversations = useCallback(async () => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  }, [isExecutive, onUnreadUpdate]);

  useEffect(() => {
    if (role === 'guest') {
      const checkExisting = async () => {
        const result = await getConversationsAction();
        if (!result.error && result.conversations?.length) {
          setConversations(result.conversations);
          setActiveConversation(result.conversations[0]);
          setView('thread');
        }
        setLoading(false);
      };
      checkExisting();
    } else {
      loadConversations();
    }
  }, [role, loadConversations]);

  useEffect(() => {
    if (view !== 'list') return;
    const interval = setInterval(loadConversations, 5000);
    return () => clearInterval(interval);
  }, [view, loadConversations]);

  const handleOpenThread = useCallback((conversation) => {
    setActiveConversation(conversation);
    setView('thread');
  }, []);

  const handleBack = useCallback(() => {
    setActiveConversation(null);
    setView('list');
    loadConversations();
  }, [loadConversations]);

  const handleNewChat = useCallback(() => {
    setView('new-chat');
  }, []);

  const handleConversationCreated = useCallback(
    (conversation) => {
      setActiveConversation(conversation);
      setView('thread');
      loadConversations();
    },
    [loadConversations]
  );

  let headerTitle = 'NEUPC Chat';
  if (view === 'thread' && activeConversation?.otherUser) {
    headerTitle = activeConversation.otherUser.full_name || 'Chat';
  } else if (view === 'thread' && activeConversation?.guestUser) {
    headerTitle = activeConversation.guestUser.full_name || 'Support';
  } else if (view === 'new-chat') {
    headerTitle = 'New chat';
  } else if (view === 'support-form') {
    headerTitle = 'Support';
  }

  const displayConversations =
    isExecutive && activeTab === 'support'
      ? supportConversations
      : conversations.filter((c) =>
          isExecutive && activeTab === 'direct' ? c.type === 'direct' : true
        );

  return (
    <div
      ref={panelRef}
      className={cn(
        'fixed z-50 flex flex-col overflow-hidden',
        'border border-[#2a3942]/60 bg-[#111b21] shadow-2xl shadow-black/60',
        'animate-in fade-in duration-200',
        isFullscreen
          ? 'inset-0 rounded-none'
          : [
              'rounded-xl',
              'slide-in-from-bottom-4',
              'inset-x-0 bottom-20 mx-2 h-[80vh] sm:inset-auto',
              'sm:right-8 sm:bottom-24 sm:mx-0 sm:h-136 sm:w-105',
            ]
      )}
    >
      {/* Header */}
      <ChatPanelHeader
        title={headerTitle}
        showBack={view === 'thread' || view === 'new-chat'}
        showNewChat={view === 'list' && role !== 'guest'}
        onBack={handleBack}
        onNewChat={handleNewChat}
        onClose={onClose}
        activeConversation={activeConversation}
        session={session}
        isFullscreen={isFullscreen}
        onToggleFullscreen={onToggleFullscreen}
      />

      {/* Executive tabs */}
      {isExecutive && view === 'list' && (
        <div className="flex bg-[#202c33]">
          <button
            onClick={() => setActiveTab('direct')}
            className={cn(
              'flex-1 py-3 text-sm font-medium tracking-wide uppercase transition-colors',
              activeTab === 'direct'
                ? 'border-b-[3px] border-[#00a884] text-[#00a884]'
                : 'border-b-[3px] border-transparent text-[#8696a0] hover:text-[#e9edef]'
            )}
          >
            Chats
          </button>
          <button
            onClick={() => setActiveTab('support')}
            className={cn(
              'flex-1 py-3 text-sm font-medium tracking-wide uppercase transition-colors',
              activeTab === 'support'
                ? 'border-b-[3px] border-[#00a884] text-[#00a884]'
                : 'border-b-[3px] border-transparent text-[#8696a0] hover:text-[#e9edef]'
            )}
          >
            Support
            {supportConversations.length > 0 && (
              <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#00a884] px-1.5 text-xs font-bold text-[#111b21]">
                {supportConversations.length}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-hidden bg-[#111b21]">
        {view === 'list' && (
          <>
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-[#00a884] border-t-transparent" />
              </div>
            ) : displayConversations.length === 0 ? (
              <EmptyState
                type={
                  isExecutive && activeTab === 'support' ? 'support' : 'chat'
                }
              />
            ) : (
              <ConversationList
                conversations={displayConversations}
                currentUserId={session.user.id}
                onSelect={handleOpenThread}
                isSupport={isExecutive && activeTab === 'support'}
              />
            )}
          </>
        )}

        {view === 'thread' && activeConversation && (
          <MessageThread
            conversation={activeConversation}
            session={session}
            onBack={handleBack}
          />
        )}

        {view === 'new-chat' && (
          <NewChatPicker
            session={session}
            onConversationCreated={handleConversationCreated}
            onCancel={handleBack}
          />
        )}

        {view === 'support-form' && (
          <SupportEntryForm onConversationCreated={handleConversationCreated} />
        )}
      </div>
    </div>
  );
}
