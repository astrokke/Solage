import { FC } from "react";

interface TabNavigationProps {
  activeTab: "conversations" | "pending";
  onTabChange: (tab: "conversations" | "pending") => void;
  pendingCount: number;
}

export const TabNavigation: FC<TabNavigationProps> = ({
  activeTab,
  onTabChange,
  pendingCount,
}) => {
  return (
    <div className="flex border-b border-[#383838]">
      <button
        className={`flex-1 py-3 px-4 ${
          activeTab === "conversations"
            ? "text-[#9945FF] border-b-2 border-[#9945FF]"
            : "text-gray-400"
        }`}
        onClick={() => onTabChange("conversations")}
      >
        Conversations
      </button>
      <button
        className={`flex-1 py-3 px-4 flex items-center justify-center ${
          activeTab === "pending"
            ? "text-[#9945FF] border-b-2 border-[#9945FF]"
            : "text-gray-400"
        }`}
        onClick={() => onTabChange("pending")}
      >
        Messages en attente
        {pendingCount > 0 && (
          <span className="ml-2 bg-[#9945FF] text-white text-xs px-2 py-1 rounded-full">
            {pendingCount}
          </span>
        )}
      </button>
    </div>
  );
};
