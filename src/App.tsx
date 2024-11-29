import { useState } from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { Lock, MessageSquare } from "lucide-react";
import { Chat } from "./components/Chat";
import { RecipientInput } from "./components/RecipientInput";
import { WalletContextProvider } from "./components/WalletContextProvider";

function ChatApp() {
  const { publicKey } = useWallet();
  const [recipientAddress, setRecipientAddress] = useState("");

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
              <WalletMultiButton className="!bg-[#9945FF] hover:!bg-[#7C37CC] !transition-colors !rounded-xl" />
            </div>
          </div>

          {publicKey ? (
            <div className="flex flex-col h-[600px]">
              <RecipientInput
                value={recipientAddress}
                onChange={setRecipientAddress}
              />

              {recipientAddress ? (
                <Chat recipientAddress={recipientAddress} />
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 text-[#9945FF]" />
                    <p>Enter a recipient address to start chatting</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center text-gray-400">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-[#9945FF]" />
              <h2 className="text-xl font-medium mb-2 text-white">
                Connect Your Wallet
              </h2>
              <p className="mb-6">
                Please connect your Solana wallet to start chatting
              </p>
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
