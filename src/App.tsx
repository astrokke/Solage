import { useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Lock, Wallet, MessageSquare, Clock } from "lucide-react";
import { ChatMessage } from "./components/ChatMessage";
import { MessageInput } from "./components/MessageInput";
import { RecipientInput } from "./components/RecipientInput";
import { WalletContextProvider } from "./components/WalletContextProvider";
import { useMessaging } from "./hooks/useChat";
import { sendSolanaMessage } from "./utils/solana";
import { isValidSolanaAddress } from "./utils/wallet";
import { MESSAGE_FEE, PLATFORM_FEE } from "./utils/constants";

interface Message {
  sender: string;
  content: string;
  timestamp: Date;
}

function ChatApp() {
  const wallet = useWallet(); // Get wallet instance at component level
  const { publicKey } = wallet;
  const { connection } = useConnection();
  const [recipientPublicKey, setRecipientPublicKey] = useState("");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"chat" | "pending">("chat");

  const { conversations, sendMessage, acceptConversation, rejectConversation } =
    useMessaging();

  const handleSendMessage = async (content: string) => {
    setError("");

    if (!publicKey || !content || !recipientPublicKey) {
      setError("Please fill in all fields and connect your wallet");
      return;
    }

    if (!isValidSolanaAddress(recipientPublicKey)) {
      setError("Invalid recipient address");
      return;
    }

    try {
      const signature = await sendSolanaMessage(
        wallet, // Use the wallet instance from above
        connection,
        recipientPublicKey,
        MESSAGE_FEE
      );

      await sendMessage(recipientPublicKey, content);
      console.log("Transaction signature:", signature);
    } catch (error) {
      console.error("Error sending message:", error);
      setError("Failed to send message. Please try again.");
    }
  };

  const getTotalFees = () => {
    return (MESSAGE_FEE + PLATFORM_FEE) / 1e9; // Convert to SOL
  };

  return (
    <div className="min-h-screen bg-[#1C1C1C]">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="bg-[#2C2C2C] rounded-2xl shadow-xl overflow-hidden border border-[#383838]">
          <div className="bg-gradient-to-r from-[#9945FF] to-[#14F195] p-0.5">
            <div className="bg-[#2C2C2C] p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Lock className="text-[#14F195] w-5 h-5" />
                <h1 className="text-lg font-medium text-white">Solana Chat</h1>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-400">
                  Fee per message: {getTotalFees()} SOL
                </div>
                <WalletMultiButton className="!bg-[#9945FF] hover:!bg-[#7C37CC] !transition-colors !rounded-xl" />
              </div>
            </div>
          </div>

          {publicKey ? (
            <div className="flex flex-col h-[600px]">
              <RecipientInput
                value={recipientPublicKey}
                onChange={setRecipientPublicKey}
              />

              <div className="flex border-b border-[#383838]">
                <button
                  className={`flex-1 py-3 px-4 ${
                    activeTab === "chat"
                      ? "border-b-2 border-[#9945FF] text-[#14F195]"
                      : "text-gray-400 hover:text-gray-300"
                  }`}
                  onClick={() => setActiveTab("chat")}
                >
                  <div className="flex items-center justify-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Chat
                  </div>
                </button>
                <button
                  className={`flex-1 py-3 px-4 ${
                    activeTab === "pending"
                      ? "border-b-2 border-[#9945FF] text-[#14F195]"
                      : "text-gray-400 hover:text-gray-300"
                  }`}
                  onClick={() => setActiveTab("pending")}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Clock className="w-4 h-4" />
                    Pending
                  </div>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#2C2C2C]">
                {activeTab === "chat" ? (
                  conversations.filter((conv) => conv.status === "active")
                    .length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                      <MessageSquare className="w-12 h-12 mb-4 text-[#9945FF]" />
                      <p>No messages yet. Start chatting!</p>
                    </div>
                  ) : (
                    conversations
                      .filter((conv) => conv.status === "active")
                      .map((conversation) =>
                        conversation.messages.map((msg, index) => (
                          <ChatMessage
                            key={index}
                            sender={msg.sender}
                            content={msg.content}
                            timestamp={new Date(msg.timestamp)}
                            isSelf={msg.sender === publicKey?.toBase58()}
                          />
                        ))
                      )
                  )
                ) : (
                  // Pending messages tab
                  conversations
                    .filter((conv) => conv.status === "pending")
                    .map((conversation) => (
                      <div
                        key={conversation.id}
                        className="flex justify-between items-center"
                      >
                        <ChatMessage
                          sender={conversation.messages[0].sender}
                          content={conversation.messages[0].content}
                          timestamp={
                            new Date(conversation.messages[0].timestamp)
                          }
                          isSelf={
                            conversation.messages[0].sender ===
                            publicKey?.toBase58()
                          }
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => acceptConversation(conversation.id)}
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => rejectConversation(conversation.id)}
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))
                )}
              </div>

              {error && (
                <div className="p-3 bg-red-900/20 border-l-4 border-red-500 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <MessageInput
                onSendMessage={handleSendMessage}
                disabled={!recipientPublicKey}
              />
            </div>
          ) : (
            <div className="p-12 text-center">
              <Wallet className="w-16 h-16 mx-auto mb-4 text-[#9945FF]" />
              <h2 className="text-xl font-medium mb-2 text-white">
                Connect Your Wallet
              </h2>
              <p className="text-gray-400 mb-6">
                Please connect your Solana wallet to start chatting
              </p>
              <WalletMultiButton className="!bg-[#9945FF] hover:!bg-[#7C37CC] !transition-colors !rounded-xl" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <WalletContextProvider>
      <ChatApp />
    </WalletContextProvider>
  );
}

export default App;
