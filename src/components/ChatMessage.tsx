import { FC } from "react";
import { formatDistanceToNow } from "date-fns";

interface ChatMessageProps {
  sender: string;
  content: string;
  timestamp: Date;
  isSelf: boolean;
}

export const ChatMessage: FC<ChatMessageProps> = ({
  sender,
  content,
  timestamp,
  isSelf,
}) => {
  return (
    <div className={`flex ${isSelf ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`max-w-[70%] rounded-lg p-3 ${
          isSelf
            ? "bg-[#9945FF] text-white"
            : "bg-[#2C2C2C] border border-[#383838] text-gray-200"
        }`}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs opacity-75">
            {sender.slice(0, 4)}...{sender.slice(-4)}
          </span>
          <span className="text-xs opacity-50">
            {formatDistanceToNow(timestamp, { addSuffix: true })}
          </span>
        </div>
        <p className="break-words">{content}</p>
      </div>
    </div>
  );
};
