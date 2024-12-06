import { FC, useState, useEffect } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { MessageInput } from "./MessageInput";
import { ChatMessage } from "./ChatMessage";
import { useChat } from "../hooks/useChat";
import { sendSolanaMessage } from "../utils/solana";
import { SecureStorage } from "../utils/storage";
import { isValidSolanaAddress } from "../utils/validation";

interface ChatProps {
  recipientAddress: string;
}

export const Chat: FC<ChatProps> = ({ recipientAddress }) => {
  const wallet = useWallet();
  const { publicKey } = wallet;
  const { connection } = useConnection();
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const {
    messages: wsMessages,
    sendMessage,
    isConnected,
    error: wsError,
  } = useChat(publicKey);

  useEffect(() => {
    if (publicKey) {
      SecureStorage.loadMessages(publicKey.toBase58()).then(setMessages);
    }
  }, [publicKey]);

  useEffect(() => {
    if (publicKey && messages.length > 0) {
      SecureStorage.saveMessages(messages, publicKey.toBase58());
    }
  }, [messages, publicKey]);

  const handleSendMessage = async (content: string) => {
    if (!publicKey || !content || !recipientAddress) {
      setError("Champs requis manquants");
      return;
    }

    try {
      setError(null);

      // Vérifier la validité de l'adresse du destinataire
      if (!isValidSolanaAddress(recipientAddress)) {
        throw new Error("Adresse du destinataire invalide");
      }

      // Envoyer la transaction Solana
      const signature = await sendSolanaMessage(
        wallet,
        connection,
        recipientAddress
      );

      // Attendre la confirmation de la transaction
      const confirmation = await connection.confirmTransaction(signature);
      if (confirmation.value.err) {
        throw new Error("La transaction a échoué");
      }

      // Envoyer le message chiffré via WebSocket
      const messageSent = await sendMessage(recipientAddress, content);
      if (!messageSent) {
        throw new Error("Échec de l'envoi du message");
      }
    } catch (error) {
      console.error("Erreur lors de l'envoi du message:", error);
      setError(
        error instanceof Error ? error.message : "Échec de l'envoi du message"
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
