import { PublicKey } from "@solana/web3.js";

export const FEES_CONFIG = {
  // Your wallet address to receive fees
  FEE_RECIPIENT: new PublicKey("ES3n6T1dzsL8C9okcrD1ighZAJ5HJAm8n55hJSYth95v"), // Replace with your wallet address
  // Fee amount in lamports (1 SOL = 1,000,000,000 lamports)
  FEE_AMOUNT: 500, // 0.0000005 SOL per message
  // Enable/disable fees
  FEES_ENABLED: false,
};
