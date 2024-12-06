import { FC } from "react";
import { NetworkConfig } from "../config/network";

interface NetworkSelectorProps {
  currentNetwork: NetworkConfig;
}

export const NetworkSelector: FC<NetworkSelectorProps> = ({
  currentNetwork,
}) => {
  return (
    <div className="bg-[#1C1C1C] text-white text-sm rounded-xl px-3 py-1.5 border border-[#383838]">
      {currentNetwork.name}
    </div>
  );
};
