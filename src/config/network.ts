import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";

export type NetworkConfig = {
  name: string;
  endpoint: string;
  network: WalletAdapterNetwork;
};

export const NETWORKS: NetworkConfig[] = [
  {
    name: "Mainnet",
    endpoint:
      "https://sleek-boldest-panorama.solana-mainnet.quiknode.pro/877bad8f90454ed409a9a63dbf2ca05496e9e146/",

    network: WalletAdapterNetwork.Mainnet,
  },
  {
    name: "Devnet",
    endpoint: "https://api.devnet.solana.com",
    network: WalletAdapterNetwork.Devnet,
  },
];

export const DEFAULT_NETWORK = NETWORKS[0];
