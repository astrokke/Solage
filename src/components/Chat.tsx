import { FC, useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { MessageInput } from "./MessageInput";
import { ChatMessage } from "./ChatMessage";
import { useChat } from "../hooks/useChat";
import { sendSolanaMessage } from "../utils/solana";

interface ChatProps {
  recipientAddress: string;
}

export const Chat: FC<ChatProps> = ({ recipientAddress }) => {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const [error, setError] = useState<string | null>(null);
  const {
    messages,
    sendMessage,
    isConnected,
    error: wsError,
  } = useChat(publicKey, recipientAddress);

  const handleSendMessage = async (content: string) => {
    if (!publicKey || !content || !recipientAddress) {
      setError("Missing required fields");
      return;
    }

    try {
      setError(null);

      // First send the Solana transaction
      const signature = await sendSolanaMessage(
        useWallet(),
        connection,
        recipientAddress
      );

      console.log("Transaction successful:", signature);

      // Then send the message through WebSocket
      const messageSent = sendMessage(recipientAddress, content);

      if (!messageSent) {
        throw new Error("Failed to send message through WebSocket");
      }
    } catch (error) {
      console.error("Error in handleSendMessage:", error);
      setError(
        error instanceof Error ? error.message : "Failed to send message"
      );
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <ChatMessage
              key={index}
              sender={message.sender}
              content={message.content}
              timestamp={message.timestamp}
              isSelf={message.sender === publicKey?.toBase58()}
            />
          ))
        )}
      </div>

      {(error || wsError) && (
        <div className="px-4 py-2 bg-red-500/10 border-l-4 border-red-500 text-red-700">
          <p>{error || wsError}</p>
        </div>
      )}

      <div className="p-4 border-t border-gray-700">
        <MessageInput
          onSendMessage={handleSendMessage}
          disabled={!isConnected}
          placeholder={isConnected ? "Type your message..." : "Connecting..."}
        />
      </div>
    </div>
  );
};
