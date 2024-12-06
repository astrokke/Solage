import { useWallet } from "@solana/wallet-adapter-react";
import { WalletContextProvider } from "./components/WalletContextProvider";
import { Buffer } from "./utils/buffer";
import { useChat } from "./hooks/useChat";
import { formatDistanceToNow } from "date-fns";
import { MessageInput } from "./components/MessageInput";

window.Buffer = Buffer;

const shortenAddress = (address: string) => {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
};

function ChatApp() {
  const { publicKey } = useWallet();
  const {
    pendingMessages,
    currentConversation,
    setCurrentConversation,
    sendMessage,
  } = useChat(publicKey);

  return (
    <div className="min-h-screen bg-[#1C1C1C]">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="bg-[#2C2C2C] rounded-2xl shadow-xl overflow-hidden border border-[#383838]">
          {publicKey ? (
            <div className="flex h-[600px]">
              {/* Liste des messages en attente */}
              <div className="w-1/3 border-r border-[#383838] p-4">
                <h2 className="text-white text-lg mb-4">Messages</h2>
                {pendingMessages.map((msg) => (
                  <div
                    key={msg.id}
                    onClick={() => setCurrentConversation(msg.id)}
                    className="bg-[#1C1C1C] p-3 rounded-lg mb-2 cursor-pointer"
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

              {/* Affichage du message actuel */}
              <div className="flex-1 p-4">
                {currentConversation ? (
                  <div className="h-full flex flex-col">
                    <div className="flex-1">
                      <div className="bg-[#1C1C1C] p-4 rounded-lg">
                        <p className="text-white">
                          {currentConversation.content}
                        </p>
                        <p className="text-sm text-gray-400 mt-2">
                          Ce message disparaîtra dans{" "}
                          {formatDistanceToNow(currentConversation.expiresAt)}
                        </p>
                      </div>
                    </div>
                    <MessageInput
                      onSendMessage={(content) =>
                        sendMessage(currentConversation.sender, content)
                      }
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <p>Sélectionnez un message pour le lire</p>
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
