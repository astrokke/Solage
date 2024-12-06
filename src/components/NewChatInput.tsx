import { FC, useState } from "react";
import { UserPlus } from "lucide-react";
import { isValidSolanaAddress } from "../utils/validation";

interface NewChatInputProps {
  onStartChat: (address: string) => void;
}

export const NewChatInput: FC<NewChatInputProps> = ({ onStartChat }) => {
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!address.trim()) {
      setError("Please enter a wallet address");
      return;
    }

    if (!isValidSolanaAddress(address.trim())) {
      setError("Invalid Solana address");
      return;
    }

    onStartChat(address.trim());
    setAddress("");
  };

  return (
    <div className="p-4 border-b border-[#383838]">
      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter recipient's Solana address..."
            className="flex-1 bg-[#1C1C1C] text-white rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#9945FF]"
          />
          <button
            type="submit"
            className="bg-[#9945FF] text-white p-2 rounded-xl hover:bg-[#7C37CC] transition-colors"
          >
            <UserPlus className="w-5 h-5" />
          </button>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </form>
    </div>
  );
};
