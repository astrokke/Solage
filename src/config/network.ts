import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";

export type NetworkConfig = {
  name: string;
  endpoint: string;
  network: WalletAdapterNetwork;
};

export const NETWORKS: NetworkConfig[] = [

  {
    name: "Mainnet",
    endpoint: "https://api.mainnet-beta.solana.com",
    network: WalletAdapterNetwork.Mainnet,
  },
];

export const DEFAULT_NETWORK = NETWORKS[0]; 
