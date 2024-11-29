import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
} from "@solana/web3.js";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { FEES_CONFIG } from "../config/fees";

const MESSAGE_FEE = 1000; // 0.000001 SOL

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

    // Create transaction instruction for message fee
    const instruction = SystemProgram.transfer({
      fromPubkey: wallet.publicKey,
      toPubkey: recipient,
      lamports: MESSAGE_FEE,
    });

    // Create transaction
    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash("finalized");
    const transaction = new Transaction({
      feePayer: wallet.publicKey,
      recentBlockhash: blockhash,
    }).add(instruction);

    // Add platform fee if enabled
    if (FEES_CONFIG.FEES_ENABLED) {
      const platformFeeInstruction = SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: new PublicKey(FEES_CONFIG.FEE_RECIPIENT),
        lamports: FEES_CONFIG.FEE_AMOUNT,
      });
      transaction.add(platformFeeInstruction);
    }

    // Send and confirm transaction
    const signature = await wallet.sendTransaction(transaction, connection);
    const confirmation = await connection.confirmTransaction(
      {
        signature,
        blockhash,
        lastValidBlockHeight,
      },
      "confirmed"
    );

    if (confirmation.value.err) {
      throw new Error("Transaction failed");
    }

    return signature;
  } catch (error) {
    console.error("Transaction error:", error);
    throw error;
  }
};
