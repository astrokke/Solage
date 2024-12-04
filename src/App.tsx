import { useState, useEffect, useRef } from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { Lock, MessageSquare } from "lucide-react";
import { Chat } from "./components/Chat";
import { RecipientInput } from "./components/RecipientInput";
import { WalletContextProvider } from "./components/WalletContextProvider";
import { PublicKey, Transaction, SystemProgram } from "@solana/web3.js";
import { Buffer } from "./utils/buffer";
interface Message {
  sender: string;
  content: string;
  timestamp: Date;
  isSelf: boolean;
}

window.Buffer = Buffer;
function ChatApp() {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [messages, setMessages] = useState<Message[]>([]);
  const [recipientAddress, setRecipientAddress] = useState("");
  const [error, setError] = useState("");
  const ws = useRef(null);

  const handleSendMessage = async (content) => {
    if (!publicKey || !content || !recipientAddress) {
      setError("Please fill in all fields and connect your wallet");
      return;
    }

    try {
      const recipient = new PublicKey(recipientAddress);

      // Créer la transaction
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: recipient,
          lamports: 1000000, // 0.001 SOL
        })
      );

      // Obtenir le dernier blockhash avec une durée de validité plus longue
      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash("finalized");
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      // Envoyer la transaction
      const signature = await sendTransaction(transaction, connection, {
        skipPreflight: false,
        preflightCommitment: "confirmed",
        maxRetries: 5,
      });

      // Attendre la confirmation avec un timeout plus long
      await connection.confirmTransaction(
        {
          signature,
          blockhash,
          lastValidBlockHeight,
        },
        "confirmed"
      );

      // Envoyer le message via WebSocket
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(
          JSON.stringify({
            type: "message",
            sender: publicKey.toBase58(),
            recipient: recipientAddress,
            content: content,
            signature: signature,
          })
        );

        // Ajouter le message localement
        setMessages((prev) => [
          ...prev,
          {
            sender: publicKey.toBase58(),
            content,
            timestamp: new Date(),
            isSelf: true,
          },
        ]);
      }
    } catch (error) {
      console.error("Error:", error);
      setError(error.message);
    }
  };

  useEffect(() => {
    if (publicKey) {
      // Créer la connexion WebSocket
      ws.current = new WebSocket("wss://solage-zzum.onrender.com");

      ws.current.onopen = () => {
        console.log("WebSocket connected");
        // Authentifier avec le wallet
        ws.current.send(
          JSON.stringify({
            type: "authenticate",
            walletAddress: publicKey.toBase58(),
          })
        );
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("Received message:", data);

          if (data.type === "message" && data.content) {
            setMessages((prev) => [
              ...prev,
              {
                sender: data.sender,
                content: data.content,
                timestamp: new Date(data.timestamp || Date.now()),
                isSelf: data.sender === publicKey.toBase58(),
              },
            ]);
          }
        } catch (error) {
          console.error("WebSocket message error:", error);
        }
      };

      ws.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        setError("Connection error");
      };

      return () => {
        if (ws.current) {
          ws.current.close();
        }
      };
    }
  }, [publicKey]);

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
              <div className="p-4 border-b border-[#383838]">
                <input
                  type="text"
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  placeholder="Enter recipient's Solana address..."
                  className="w-full bg-[#1C1C1C] text-white rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#9945FF]"
                />
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      msg.isSelf ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        msg.isSelf
                          ? "bg-[#9945FF] text-white"
                          : "bg-[#2C2C2C] border border-[#383838] text-gray-200"
                      }`}
                    >
                      <div className="text-sm">{msg.content}</div>
                    </div>
                  </div>
                ))}
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border-l-4 border-red-500 text-red-400">
                  {error}
                </div>
              )}

              <div className="p-4 border-t border-[#383838]">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const input = e.currentTarget.elements.namedItem(
                      "message"
                    ) as HTMLInputElement;
                    if (input.value.trim()) {
                      handleSendMessage(input.value.trim());
                      input.value = "";
                    }
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    name="message"
                    placeholder="Type your message..."
                    className="flex-1 bg-[#1C1C1C] text-white rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#9945FF]"
                  />
                  <button
                    type="submit"
                    className="bg-[#9945FF] text-white px-4 py-2 rounded-xl hover:bg-[#7C37CC] transition-colors"
                  >
                    Send
                  </button>
                </form>
              </div>
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
