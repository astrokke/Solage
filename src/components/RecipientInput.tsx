import { FC } from "react";

interface RecipientInputProps {
  value: string;
  onChange: (value: string) => void;
}

export const RecipientInput: FC<RecipientInputProps> = ({
  value,
  onChange,
}) => {
  return (
    <div className="p-4 border-b border-[#383838]">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter recipient's Solana address..."
        className="w-full bg-[#1C1C1C] text-white rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#9945FF]"
      />
    </div>
  );
};
