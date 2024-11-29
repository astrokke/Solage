import { FC, useState } from "react";
import { Send } from "lucide-react";

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const MessageInput: FC<MessageInputProps> = ({
  onSendMessage,
  disabled,
  placeholder = "Type your message...",
}) => {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-[#383838]">
      <div className="flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={disabled ? "Enter recipient address first" : placeholder}
          disabled={disabled}
          className="flex-1 bg-[#1C1C1C] text-white rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#9945FF] disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!message.trim() || disabled}
          className="bg-[#9945FF] text-white p-2 rounded-xl disabled:opacity-50 hover:bg-[#7C37CC] transition-colors"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </form>
  );
};
