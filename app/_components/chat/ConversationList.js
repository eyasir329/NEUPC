/**
 * @file ConversationList – Scrollable conversation list wrapper.
 * @module ConversationList
 */

'use client';

import ConversationItem from './ConversationItem';

export default function ConversationList({
  conversations,
  currentUserId,
  onSelect,
  isSupport = false,
}) {
  return (
    <div className="h-full overflow-y-auto">
      {conversations.map((conv) => (
        <ConversationItem
          key={conv.id}
          conversation={conv}
          currentUserId={currentUserId}
          onClick={() => onSelect(conv)}
          isSupport={isSupport}
        />
      ))}
    </div>
  );
}
