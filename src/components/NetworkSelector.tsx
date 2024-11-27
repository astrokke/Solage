import { FC } from "react";
import { NetworkConfig, NETWORKS } from "../config/network";

interface NetworkSelectorProps {
  currentNetwork: NetworkConfig;
  onNetworkChange: (network: NetworkConfig) => void;
}

export const NetworkSelector: FC<NetworkSelectorProps> = ({
  currentNetwork,
  onNetworkChange,
}) => {
  return (
    <select
      value={currentNetwork.name}
      onChange={(e) => {
        const network = NETWORKS.find((n) => n.name === e.target.value);
        if (network) onNetworkChange(network);
      }}
      className="bg-[#1C1C1C] text-white text-sm rounded-xl px-3 py-1.5 border border-[#383838] focus:outline-none focus:ring-2 focus:ring-[#9945FF]"
    >
      {NETWORKS.map((network) => (
        <option key={network.name} value={network.name}>
          {network.name}
        </option>
      ))}
    </select>
  );
};
