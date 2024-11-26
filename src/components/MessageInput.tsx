import { FC, FormEvent, useState } from 'react';
import { Send } from 'lucide-react';

interface MessageInputProps {
  onSendMessage: (message: string) => Promise<void>;
  disabled?: boolean;
}

export const MessageInput: FC<MessageInputProps> = ({ onSendMessage, disabled }) => {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim() || disabled || isLoading) return;

    setIsLoading(true);
    try {
      await onSendMessage(message);
      setMessage('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-[#2C2C2C] border-t border-[#383838]">
      <div className="flex space-x-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          disabled={disabled || isLoading}
          className="flex-1 p-3 rounded-xl border border-[#383838] focus:ring-2 focus:ring-[#9945FF] outline-none bg-[#1C1C1C] text-white placeholder-gray-500 disabled:bg-[#242424] disabled:cursor-not-allowed"
        />
        <button
          type="submit"
          disabled={!message.trim() || disabled || isLoading}
          className="bg-[#9945FF] text-white px-6 py-3 rounded-xl hover:bg-[#7C37CC] transition-colors flex items-center space-x-2 disabled:bg-[#7C37CC]/50 disabled:cursor-not-allowed"
        >
          <Send className={`w-4 h-4 ${isLoading ? 'animate-pulse' : ''}`} />
          <span>{isLoading ? 'Sending...' : 'Send'}</span>
        </button>
      </div>
    </form>
  );
};