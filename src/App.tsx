import { useWallet } from "@solana/wallet-adapter-react";
import { WalletContextProvider } from "./components/WalletContextProvider";
import { Buffer } from "./utils/buffer";
import { useChat } from "./hooks/useChat";
import { formatDistanceToNow } from "date-fns";
import { MessageInput } from "./components/MessageInput";
import { TabNavigation } from "./components/TabNavigation";
import { useState } from "react";
import { Chat } from "./components/Chat";
window.Buffer = Buffer;

const shortenAddress = (address: string) => {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
};

function ChatApp() {
  const { publicKey } = useWallet();
  const [activeTab, setActiveTab] = useState<"conversations" | "pending">(
    "conversations"
  );
  const {
    pendingMessages,
    currentMessage,
    openMessage,
    sendMessage,
    isConnected,
  } = useChat(publicKey);

  return (
    <div className="min-h-screen bg-[#1C1C1C]">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-[#2C2C2C] rounded-2xl shadow-xl overflow-hidden border border-[#383838]">
          {publicKey ? (
            <div className="flex h-[600px]">
              <div className="w-1/3 border-r border-[#383838] flex flex-col">
                <TabNavigation
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                  pendingCount={pendingMessages.length}
                />

                {activeTab === "pending" ? (
                  <div className="flex-1 overflow-y-auto p-4">
                    {pendingMessages.map((msg) => (
                      <div
                        key={msg.id}
                        onClick={() => openMessage(msg.id)}
                        className="bg-[#1C1C1C] p-3 rounded-lg mb-2 cursor-pointer hover:bg-[#383838]"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-white">
                            {shortenAddress(msg.sender)}
                          </span>
                          <span className="text-sm text-gray-400">
                            {formatDistanceToNow(msg.timestamp, {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Chat recipientAddress={currentMessage?.sender || ""} />
                )}
              </div>

              <div className="flex-1">
                {currentMessage ? (
                  <div className="h-full flex flex-col">
                    <div className="p-4 border-b border-[#383838]">
                      <h2 className="text-white">
                        {shortenAddress(currentMessage.sender)}
                      </h2>
                    </div>
                    <div className="flex-1 p-4 overflow-y-auto">
                      <div className="bg-[#1C1C1C] p-4 rounded-lg">
                        <p className="text-white">{currentMessage.content}</p>
                        {currentMessage.expiresAt && (
                          <p className="text-sm text-gray-400 mt-2">
                            Expire dans{" "}
                            {formatDistanceToNow(currentMessage.expiresAt)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="p-4 border-t border-[#383838]">
                      <MessageInput
                        onSendMessage={(content) =>
                          sendMessage(currentMessage.sender, content)
                        }
                        disabled={!isConnected}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <p>Sélectionnez un message pour commencer</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-gray-400">
              <p>Connectez votre wallet pour commencer</p>
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
