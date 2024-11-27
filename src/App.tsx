import { useState, useEffect, useRef } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { PublicKey, Transaction, SystemProgram } from "@solana/web3.js";
import { Lock, Wallet, MessageSquare, Clock } from "lucide-react";
import { ChatMessage } from "./components/ChatMessage";
import { MessageInput } from "./components/MessageInput";
import { RecipientInput } from "./components/RecipientInput";
import { PendingMessage } from "./components/PendingMessage";
import { FEES_CONFIG } from "./config/fees";

interface Message {
  sender: string;
  content: string;
  timestamp: Date;
}

interface PendingMessageType {
  id: string;
  sender: string;
  recipient: string;
  content: string;
  timestamp: Date;
  status: "pending" | "accepted" | "rejected";
}

function App() {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [messages, setMessages] = useState<Message[]>([]);
  const [pendingMessages, setPendingMessages] = useState<PendingMessageType[]>(
    []
  );
  const websocket = useRef<WebSocket | null>(null);
  const [recipientPublicKey, setRecipientPublicKey] = useState("");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"chat" | "pending">("chat");

  const handleSendMessage = async (content: string) => {
    setError("");

    if (!publicKey || !content || !recipientPublicKey) {
      setError("Please fill in all fields and connect your wallet");
      return;
    }

    try {
      let recipient;
      try {
        recipient = new PublicKey(recipientPublicKey);
      } catch (e) {
        setError("Invalid recipient address");
        return;
      }
      const newMessage: Message = {
        sender: publicKey.toBase58(),
        content,
        timestamp: new Date(),
      };
      // Envoie le message via WebSocket
      if (websocket.current) {
        websocket.current.send(
          JSON.stringify({
            type: "message",
            sender: newMessage.sender,
            recipient: recipient.toBase58(),
            content: newMessage.content,
          })
        );
      }
      const tempId = Date.now().toString();
      const newPendingMsg: PendingMessageType = {
        id: tempId,
        sender: publicKey.toBase58(),
        recipient: recipientPublicKey,
        content,
        timestamp: new Date(),
        status: "pending",
      };

      setPendingMessages((prev) => [...prev, newPendingMsg]);

      // Create transaction instructions
      const instructions = [
        // Message fee transfer (1000 lamports)
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: recipient,
          lamports: 1000,
        }),
      ];

      // Add platform fee if enabled
      if (FEES_CONFIG.FEES_ENABLED) {
        instructions.push(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: FEES_CONFIG.FEE_RECIPIENT,
            lamports: FEES_CONFIG.FEE_AMOUNT,
          })
        );
      }

      const transaction = new Transaction().add(...instructions);

      const { blockhash } = await connection.getLatestBlockhash("finalized");
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      const signature = await sendTransaction(transaction, connection);

      setPendingMessages((prev) =>
        prev.map((msg) => (msg.id === tempId ? { ...msg, id: signature } : msg))
      );

      const confirmation = await connection.confirmTransaction(
        signature,
        "confirmed"
      );
      setMessages((prev) => [...prev, newMessage]);
      if (confirmation.value.err) {
        setPendingMessages((prev) =>
          prev.map((msg) =>
            msg.id === signature ? { ...msg, status: "rejected" } : msg
          )
        );
        throw new Error("Transaction failed");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setError("Failed to send message. Please try again.");
    }
  };

  const handleAcceptMessage = async (messageId: string) => {
    setPendingMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, status: "accepted" } : msg
      )
    );

    const message = pendingMessages.find((msg) => msg.id === messageId);
    if (message) {
      setMessages((prev) => [
        ...prev,
        {
          sender: message.sender,
          content: message.content,
          timestamp: message.timestamp,
        },
      ]);
    }
  };

  const handleRejectMessage = (messageId: string) => {
    setPendingMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, status: "rejected" } : msg
      )
    );
  };
  useEffect(() => {
    if (publicKey) {
      // Connecte au serveur WebSocket
      websocket.current = new WebSocket("wss://solage-zzum.onrender.com");

      // Authentifie l'utilisateur après la connexion WebSocket
      websocket.current.onopen = () => {
        const authPayload = JSON.stringify({
          type: "authenticate",
          walletAddress: publicKey.toBase58(),
        });
        websocket.current?.send(authPayload);
        console.log("WebSocket connecté et authentifié.");
      };

      // Gère la fermeture de la connexion
      websocket.current.onclose = () => {
        console.log("WebSocket déconnecté.");
      };

      // Gère les erreurs
      websocket.current.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      // Nettoie la connexion lors de la déconnexion du wallet
      return () => {
        websocket.current?.close();
      };
    }
  }, [publicKey]);
  useEffect(() => {
    if (websocket.current) {
      websocket.current.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === "message") {
          // Ajoute le message reçu à la liste des messages
          setMessages((prev) => [
            ...prev,
            {
              sender: data.sender,
              content: data.content,
              timestamp: new Date(data.timestamp),
            },
          ]);
        }
      };
    }
  }, [websocket]);
  useEffect(() => {
    return () => {
      if (websocket.current) {
        websocket.current.close();
      }
    };
  }, []);

  const getTotalFees = () => {
    const messageFee = 1000; // 0.000001 SOL
    const platformFee = FEES_CONFIG.FEES_ENABLED ? FEES_CONFIG.FEE_AMOUNT : 0;
    return (messageFee + platformFee) / 1e9; // Convert to SOL
  };

  return (
    <div className="min-h-screen bg-[#1C1C1C]">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="bg-[#2C2C2C] rounded-2xl shadow-xl overflow-hidden border border-[#383838]">
          {/* Header */}
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

              {/* Tabs */}
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
                    {pendingMessages.filter((msg) => msg.status === "pending")
                      .length > 0 && (
                      <span className="bg-[#9945FF] text-white rounded-full px-2 py-0.5 text-xs">
                        {
                          pendingMessages.filter(
                            (msg) => msg.status === "pending"
                          ).length
                        }
                      </span>
                    )}
                  </div>
                </button>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#2C2C2C]">
                {activeTab === "chat" ? (
                  messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                      <MessageSquare className="w-12 h-12 mb-4 text-[#9945FF]" />
                      <p>No messages yet. Start chatting!</p>
                    </div>
                  ) : (
                    messages.map((msg, index) => (
                      <ChatMessage
                        key={index}
                        sender={msg.sender}
                        content={msg.content}
                        timestamp={msg.timestamp}
                        isSelf={msg.sender === publicKey.toBase58()}
                      />
                    ))
                  )
                ) : pendingMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <Clock className="w-12 h-12 mb-4 text-[#9945FF]" />
                    <p>No pending messages</p>
                  </div>
                ) : (
                  pendingMessages.map((msg) => (
                    <PendingMessage
                      key={msg.id}
                      sender={msg.sender}
                      content={msg.content}
                      timestamp={msg.timestamp}
                      status={msg.status}
                      isSender={msg.sender === publicKey.toBase58()}
                      onAccept={() => handleAcceptMessage(msg.id)}
                      onReject={() => handleRejectMessage(msg.id)}
                    />
                  ))
                )}
              </div>

              {/* Error Message */}
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

export default App;
