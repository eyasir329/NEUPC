'use client';

import { MessageSquare, Send } from 'lucide-react';
import { GlassCard, SectionHeader, Avatar } from './_ui';

const MOCK_CHATS = [
  {
    id: 'c1',
    name: 'Aisha Rahman',
    lastMessage: 'Thank you for the session notes! Will try the cleanup pattern tonight.',
    time: '12 min ago',
    unread: 2,
  },
  {
    id: 'c2',
    name: 'Rahul Sharma',
    lastMessage: 'Got it — I\'ll review the async/await article before tomorrow\'s session.',
    time: '1 hr ago',
    unread: 0,
  },
  {
    id: 'c3',
    name: 'Sara Ahmed',
    lastMessage: 'Just solved the Div 2 D problem you assigned 🎉',
    time: '3 hrs ago',
    unread: 1,
  },
  {
    id: 'c4',
    name: 'John Doe',
    lastMessage: 'Pushed the Docker compose file to the repo. Can you take a look?',
    time: 'Yesterday',
    unread: 0,
  },
];

export default function RecentChats({ chats = MOCK_CHATS }) {
  return (
    <GlassCard padding="p-5">
      <SectionHeader
        icon={MessageSquare}
        title="Recent Chats"
        subtitle="Mentee messages"
        accent="blue"
      />

      <div className="flex flex-col gap-2">
        {chats.map((chat) => (
          <div
            key={chat.id}
            className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/6 bg-white/2 p-3 transition-all hover:border-white/10 hover:bg-white/4"
          >
            <div className="relative shrink-0">
              <Avatar name={chat.name} size="sm" />
              {chat.unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white">
                  {chat.unread}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className={`truncate text-sm ${chat.unread > 0 ? 'font-semibold text-white' : 'font-medium text-gray-300'}`}>
                  {chat.name}
                </p>
                <span className="shrink-0 text-[11px] text-gray-500">{chat.time}</span>
              </div>
              <p className={`mt-0.5 truncate text-xs ${chat.unread > 0 ? 'text-gray-300' : 'text-gray-500'}`}>
                {chat.lastMessage}
              </p>
            </div>
          </div>
        ))}
      </div>

      <button className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-blue-500/30 bg-blue-500/10 py-2 text-sm font-medium text-blue-400 transition-colors hover:bg-blue-500/20">
        <Send className="h-3.5 w-3.5" /> Open Messages
      </button>
    </GlassCard>
  );
}
