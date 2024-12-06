import { FC } from "react";
import { shortenAddress } from "../utils/wallet";
import { formatDistanceToNow } from "date-fns";
import { Conversation, PendingMessage } from "../types/conversation";

interface ConversationListProps {
  conversations: Conversation[];
  pendingMessages: PendingMessage[];
  onSelectConversation: (address: string) => void;
}

export const ConversationList: FC<ConversationListProps> = ({
  conversations,
  pendingMessages,
  onSelectConversation,
}) => {
  return (
    <div className="flex flex-col h-full">
      {pendingMessages.length > 0 && (
        <div className="p-4 border-b border-[#383838]">
          <h2 className="text-white text-lg mb-2">Messages en attente</h2>
          {pendingMessages.map((message) => (
            <div
              key={message.id}
              onClick={() => onSelectConversation(message.sender)}
              className="bg-[#2C2C2C] p-3 rounded-lg mb-2 cursor-pointer hover:bg-[#383838]"
            >
              <div className="flex justify-between items-center">
                <span className="text-white">
                  {shortenAddress(message.sender)}
                </span>
                <span className="text-sm text-gray-400">
                  {formatDistanceToNow(message.timestamp, { addSuffix: true })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        <h2 className="text-white text-lg p-4">Conversations</h2>
        {conversations.map((conversation) => (
          <div
            key={conversation.id}
            onClick={() => onSelectConversation(conversation.participants[1])}
            className="p-4 border-b border-[#383838] cursor-pointer hover:bg-[#2C2C2C]"
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="text-white">
                  {shortenAddress(conversation.participants[1])}
                </p>
                <p className="text-sm text-gray-400">
                  {conversation.lastMessage.content}
                </p>
              </div>
              {conversation.unreadCount > 0 && (
                <span className="bg-[#9945FF] text-white text-xs px-2 py-1 rounded-full">
                  {conversation.unreadCount}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
