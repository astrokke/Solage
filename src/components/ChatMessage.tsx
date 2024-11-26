import { FC } from 'react';

interface ChatMessageProps {
  sender: string;
  content: string;
  timestamp: Date;
  isSelf: boolean;
}

export const ChatMessage: FC<ChatMessageProps> = ({ sender, content, timestamp, isSelf }) => {
  return (
    <div className={`flex ${isSelf ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[70%] rounded-xl p-3 ${
          isSelf 
            ? 'bg-gradient-to-r from-[#9945FF] to-[#14F195] text-white' 
            : 'bg-[#383838] text-gray-100'
        }`}
      >
        <div className="text-sm font-medium mb-1 opacity-80">{sender.slice(0, 4)}...{sender.slice(-4)}</div>
        <p className="text-sm">{content}</p>
        <div className="text-xs mt-1 opacity-60">
          {timestamp.toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};