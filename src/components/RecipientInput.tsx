import { FC } from 'react';

interface RecipientInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const RecipientInput: FC<RecipientInputProps> = ({ value, onChange, disabled }) => {
  return (
    <div className="p-4 border-b border-[#383838] bg-[#2C2C2C]">
      <label className="block text-sm font-medium text-gray-300 mb-2">
        Recipient's Public Key
      </label>
      <input
        type="text"
        placeholder="Enter recipient's Solana address"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full p-3 rounded-xl border border-[#383838] focus:ring-2 focus:ring-[#9945FF] outline-none bg-[#1C1C1C] text-white placeholder-gray-500 disabled:bg-[#242424] disabled:cursor-not-allowed"
      />
    </div>
  );
};