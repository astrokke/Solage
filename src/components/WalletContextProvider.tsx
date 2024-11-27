import { FC, ReactNode, useMemo, useState } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { NetworkSelector } from "./NetworkSelector";
import { NETWORKS, DEFAULT_NETWORK, NetworkConfig } from "../config/network";
import "@solana/wallet-adapter-react-ui/styles.css";

interface Props {
  children: ReactNode;
}

export const WalletContextProvider: FC<Props> = ({ children }) => {
  const [selectedNetwork, setSelectedNetwork] =
    useState<NetworkConfig>(DEFAULT_NETWORK);

  const endpoint = useMemo(() => selectedNetwork.endpoint, [selectedNetwork]);

  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    [selectedNetwork.network]
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <div className="fixed top-4 right-4 z-50">
            <NetworkSelector
              currentNetwork={selectedNetwork}
              onNetworkChange={setSelectedNetwork}
            />
          </div>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};
