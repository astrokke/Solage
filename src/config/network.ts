import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";

export type NetworkConfig = {
  name: string;
  endpoint: string;
  network: WalletAdapterNetwork;
};

export const NETWORKS: NetworkConfig[] = [
  {
    name: "Devnet",
    endpoint: "https://api.devnet.solana.com",
    network: WalletAdapterNetwork.Devnet,
  },
  {
    name: "Testnet",
    endpoint: "https://api.testnet.solana.com",
    network: WalletAdapterNetwork.Testnet,
  },
  {
    name: "Mainnet",
    endpoint: "https://api.mainnet-beta.solana.com",
    network: WalletAdapterNetwork.Mainnet,
  },
];

export const DEFAULT_NETWORK = NETWORKS[0]; // Set Devnet as default for testing
