import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
} from "@solana/web3.js";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { FEES_CONFIG } from "../config/fees";

export const sendSolanaMessage = async (
  wallet: WalletContextState,
  connection: Connection,
  recipientAddress: string,
  amount: number = 1000 // 0.000001 SOL
): Promise<string> => {
  if (!wallet.publicKey) {
    throw new Error("Wallet not connected");
  }

  try {
    const recipient = new PublicKey(recipientAddress);

    // Create transaction instruction
    const instruction = SystemProgram.transfer({
      fromPubkey: wallet.publicKey,
      toPubkey: recipient,
      lamports: amount,
    });

    // Get latest blockhash first
    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash("finalized");

    // Create transaction with blockhash
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

    // Sign and send transaction
    const signature = await wallet.sendTransaction(transaction, connection, {
      maxRetries: 5,
    });

    // Wait for confirmation with more detailed error handling
    try {
      const confirmation = await connection.confirmTransaction(
        {
          signature,
          blockhash,
          lastValidBlockHeight,
        },
        "confirmed"
      );

      if (confirmation.value.err) {
        throw new Error(
          `Transaction failed: ${JSON.stringify(confirmation.value.err)}`
        );
      }
    } catch (error) {
      console.error("Confirmation error:", error);
      throw new Error(
        "Failed to confirm transaction. Please check your wallet for status."
      );
    }

    return signature;
  } catch (error: any) {
    console.error("Transaction error:", error);

    // Provide more specific error messages
    if (error.message.includes("insufficient funds")) {
      throw new Error(
        "Insufficient funds for transaction. Please check your balance."
      );
    } else if (error.message.includes("blockhash")) {
      throw new Error("Network error. Please try again.");
    } else {
      throw new Error(`Transaction failed: ${error.message}`);
    }
  }
};
