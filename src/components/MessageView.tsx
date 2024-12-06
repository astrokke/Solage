import { FC, useEffect } from "react";
import { Message } from "../types/message";
import { formatDistanceToNow } from "date-fns";
import { MessageInput } from "./MessageInput";
import { shortenAddress } from "../utils/wallet";

interface MessageViewProps {
  messages: Message[];
  recipientAddress: string;
  onSendMessage: (content: string) => void;
  onMarkAsRead: (messageId: string) => void;
}

export const MessageView: FC<MessageViewProps> = ({
  messages,
  recipientAddress,
  onSendMessage,
  onMarkAsRead,
}) => {
  useEffect(() => {
    messages
      .filter((msg) => msg.status === "pending")
      .forEach((msg) => onMarkAsRead(msg.id));
  }, [messages, onMarkAsRead]);

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="p-4 border-b border-[#383838]">
        <h2 className="text-lg font-semibold text-white">
          {shortenAddress(recipientAddress)}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.sender === recipientAddress
                ? "justify-start"
                : "justify-end"
            }`}
          >
            <div
              className={`max-w-[70%] rounded-lg p-3 ${
                message.sender === recipientAddress
                  ? "bg-[#2C2C2C] text-white"
                  : "bg-[#9945FF] text-white"
              }`}
            >
              <p className="mb-1">{message.content}</p>
              <p className="text-xs opacity-75">
                {formatDistanceToNow(message.timestamp, { addSuffix: true })}
                {message.status === "pending" && " • Pending"}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-[#383838]">
        <MessageInput onSendMessage={onSendMessage} />
      </div>
    </div>
  );
};
