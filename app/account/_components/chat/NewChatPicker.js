/**
 * @file NewChatPicker - WhatsApp-style contact picker
 * @module NewChatPicker
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/app/_lib/utils';
import { getInitials } from '@/app/_lib/utils';
import {
  getChatableUsersAction,
  createDirectConversationAction,
} from '@/app/_lib/chat-actions';
import { Search, Loader2, MessageSquarePlus } from 'lucide-react';

const ROLE_COLORS = {
  guest: 'text-[#53bdeb]',
  member: 'text-[#a78bfa]',
  executive: 'text-[#f59e0b]',
  admin: 'text-[#ea4335]',
  mentor: 'text-[#00a884]',
  advisor: 'text-[#2dd4bf]',
};

export default function NewChatPicker({
  session,
  onConversationCreated,
  onCancel,
}) {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(null);
  const [error, setError] = useState('');

  const fetchUsers = useCallback(async (query) => {
    setLoading(true);
    setError('');
    const result = await getChatableUsersAction(query || '');
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setUsers(result.users || []);
  }, []);

  useEffect(() => {
    fetchUsers('');
  }, [fetchUsers]);

  useEffect(() => {
    const timer = setTimeout(() => fetchUsers(search), 300);
    return () => clearTimeout(timer);
  }, [search, fetchUsers]);

  const handleSelect = async (user) => {
    setCreating(user.user_id);
    setError('');
    const result = await createDirectConversationAction(user.user_id);
    setCreating(null);
    if (result.error) {
      setError(result.error);
      return;
    }
    onConversationCreated?.(result.conversation);
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-[#111b21]">
      {/* Search bar */}
      <div className="bg-[#111b21] px-3 py-2">
        <div className="relative">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#8696a0]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search contacts"
            className={cn(
              'w-full rounded-lg border-none bg-[#202c33] py-2 pr-3 pl-9',
              'text-sm text-[#d1d7db] placeholder-[#8696a0]',
              'outline-none'
            )}
            autoFocus
          />
        </div>
      </div>

      {error && <p className="px-3 pt-1 text-xs text-[#ea4335]">{error}</p>}

      {/* Contacts list */}
      <div className="flex-1 overflow-y-auto">
        {loading && users.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-[#00a884]" />
          </div>
        ) : users.length === 0 ? (
          <div className="px-4 py-16 text-center">
            <MessageSquarePlus className="mx-auto mb-3 h-10 w-10 text-[#3b4a54]" />
            <p className="text-sm text-[#8696a0]">
              {search ? 'No contacts found' : 'No contacts available'}
            </p>
          </div>
        ) : (
          users.map((user) => (
            <button
              key={user.user_id}
              onClick={() => handleSelect(user)}
              disabled={creating === user.user_id}
              className={cn(
                'flex w-full items-center gap-3 px-3 py-2.5 text-left',
                'transition-colors duration-100 hover:bg-[#2a3942]',
                'disabled:opacity-60'
              )}
            >
              {/* Avatar */}
              {user.avatar_url && !user.avatar_url.match(/^[A-Z?]{1,2}$/) ? (
                <img
                  src={user.avatar_url}
                  alt={user.full_name}
                  className="h-12.25 w-12.25 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex h-12.25 w-12.25 items-center justify-center rounded-full bg-[#6b7b8d] text-lg font-medium text-white">
                  {getInitials(user.full_name || 'U')}
                </div>
              )}

              {/* Info */}
              <div className="min-w-0 flex-1 border-b border-[#222d34] py-1">
                <p className="truncate text-[17px] text-[#e9edef]">
                  {user.full_name || 'Unknown'}
                </p>
                <p
                  className={cn(
                    'text-[13px] capitalize',
                    ROLE_COLORS[user.role] || 'text-[#8696a0]'
                  )}
                >
                  {user.role}
                </p>
              </div>

              {creating === user.user_id && (
                <Loader2 className="h-5 w-5 animate-spin text-[#00a884]" />
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
