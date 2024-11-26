import { FC } from 'react';
import { Clock, Check, X } from 'lucide-react';

interface PendingMessageProps {
  sender: string;
  content: string;
  timestamp: Date;
  status: 'pending' | 'accepted' | 'rejected';
  onAccept?: () => void;
  onReject?: () => void;
  isSender: boolean;
}

export const PendingMessage: FC<PendingMessageProps> = ({
  sender,
  content,
  timestamp,
  status,
  onAccept,
  onReject,
  isSender
}) => {
  const statusColors = {
    pending: 'border-[#9945FF] bg-[#9945FF]/10',
    accepted: 'border-[#14F195] bg-[#14F195]/10',
    rejected: 'border-red-500 bg-red-500/10'
  };

  return (
    <div className={`flex ${isSender ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[70%] rounded-xl p-4 border ${statusColors[status]} text-white`}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-medium opacity-80">{sender.slice(0, 4)}...{sender.slice(-4)}</span>
          {status === 'pending' && <Clock className="w-4 h-4 text-[#9945FF]" />}
          {status === 'accepted' && <Check className="w-4 h-4 text-[#14F195]" />}
          {status === 'rejected' && <X className="w-4 h-4 text-red-500" />}
        </div>
        
        <p className="text-sm mb-2">{content}</p>
        
        <div className="text-xs text-gray-400 mb-2">
          {timestamp.toLocaleString()}
        </div>

        {!isSender && status === 'pending' && (
          <div className="flex gap-2 mt-2">
            <button
              onClick={onAccept}
              className="px-3 py-1 bg-[#14F195] text-black rounded-lg text-sm hover:bg-[#14F195]/80 transition-colors flex items-center gap-1"
            >
              <Check className="w-3 h-3" /> Accept
            </button>
            <button
              onClick={onReject}
              className="px-3 py-1 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Reject
            </button>
          </div>
        )}
      </div>
    </div>
  );
};