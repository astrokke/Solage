import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
} from "@solana/web3.js";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { FEES_CONFIG } from "../config/fees";

const MESSAGE_FEE = 1000; // 0.01 SOL

export const sendSolanaMessage = async (
  wallet: WalletContextState,
  connection: Connection,
  recipientAddress: string
): Promise<string> => {
  if (!wallet.publicKey) {
    throw new Error("Wallet not connected");
  }

  try {
    const recipient = new PublicKey(recipientAddress);

    // Get latest blockhash
    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash("finalized");

    // Create transaction instruction for message fee
    const instruction = SystemProgram.transfer({
      fromPubkey: wallet.publicKey,
      toPubkey: recipient,
      lamports: MESSAGE_FEE,
    });

    // Create transaction with shorter validity period
    const transaction = new Transaction({
      feePayer: wallet.publicKey,
      recentBlockhash: blockhash,
    }).add(instruction);

    // Send transaction
    const signature = await wallet.sendTransaction(transaction, connection, {
      maxRetries: 5,
      skipPreflight: false,
    });

    // Wait for confirmation with shorter timeout
    const confirmation = await connection.confirmTransaction(
      {
        signature,
        blockhash,
        lastValidBlockHeight,
      },
      "processed"
    ); // Use 'processed' instead of 'confirmed' for faster confirmation

    if (confirmation.value.err) {
      throw new Error("Transaction failed");
    }

    return signature;
  } catch (error) {
    console.error("Transaction error:", error);
    throw error;
  }
};
