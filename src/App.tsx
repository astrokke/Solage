import { useState, useEffect } from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { Lock } from "lucide-react";
import { WalletContextProvider } from "./components/WalletContextProvider";
import { ContactsList } from "./components/ContactList";
import { MessageView } from "./components/MessageView";
import { NewChatInput } from "./components/NewChatInput";
import { Message, Contact } from "./types/message";
import { FEES_CONFIG } from "./config/fees";
import { createMessageTransaction } from "./utils/transaction";
import { useFirebaseChat } from "./hooks/useFirebaseChat";
import { Buffer } from "./utils/buffer";

window.Buffer = Buffer;

function ChatApp() {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { messages, conversations, sendMessage } = useFirebaseChat(publicKey);

  const handleSendMessage = async (content: string) => {
    if (!publicKey || !selectedContact) return;

    try {
      // First create and send the Solana transaction
      const transaction = await createMessageTransaction(
        connection,
        publicKey,
        selectedContact
      );

      const signature = await window.solana.signAndSendTransaction(transaction);
      console.log("Transaction sent:", signature);

      // Then store the message in Firebase
      await sendMessage(selectedContact, content);
    } catch (error) {
      console.error("Error sending message:", error);
      setError("Failed to send message");
    }
  };

  const handleStartNewChat = (address: string) => {
    setSelectedContact(address);
  };

  const handleMarkAsRead = (messageId: string) => {
    // This will be handled by Firebase listeners
  };

  return (
    <div className="min-h-screen bg-[#1C1C1C]">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-[#2C2C2C] rounded-2xl shadow-xl overflow-hidden border border-[#383838]">
          <div className="bg-gradient-to-r from-[#9945FF] to-[#14F195] p-0.5">
            <div className="bg-[#2C2C2C] p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Lock className="text-[#14F195] w-5 h-5" />
                <h1 className="text-lg font-medium text-white">Solana Chat</h1>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-400">
                  Fee: {FEES_CONFIG.MESSAGE_FEE / 1e9} SOL
                </div>
                <WalletMultiButton className="!bg-[#9945FF] hover:!bg-[#7C37CC] !transition-colors !rounded-xl" />
              </div>
            </div>
          </div>

          {publicKey ? (
            <div className="flex h-[600px]">
              <div className="w-80 flex flex-col border-r border-[#383838]">
                <NewChatInput onStartChat={handleStartNewChat} />
                <ContactsList
                  contacts={conversations}
                  onSelectContact={setSelectedContact}
                  selectedAddress={selectedContact ?? undefined}
                />
              </div>
              {selectedContact ? (
                <MessageView
                  messages={messages.filter(
                    (msg) =>
                      msg.sender === selectedContact ||
                      msg.recipient === selectedContact
                  )}
                  recipientAddress={selectedContact}
                  onSendMessage={handleSendMessage}
                  onMarkAsRead={handleMarkAsRead}
                />
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-400">
                  Select a contact to start chatting
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center text-gray-400">
              <Lock className="w-16 h-16 mx-auto mb-4 text-[#9945FF]" />
              <h2 className="text-xl font-medium mb-2 text-white">
                Connect Your Wallet
              </h2>
              <p className="mb-6">
                Please connect your Solana wallet to start chatting
              </p>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-900/20 border-l-4 border-red-500 text-red-400 text-sm">
              {error}
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
