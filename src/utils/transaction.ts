import { PublicKey, Transaction, SystemProgram } from "@solana/web3.js";
import { FEES_CONFIG } from "../config/fees";

export const createMessageTransaction = (
  senderPublicKey: PublicKey,
  recipientAddress: string
): Transaction => {
  const transaction = new Transaction();

  // Simple platform fee transfer
  transaction.add(
    SystemProgram.transfer({
      fromPubkey: senderPublicKey,
      toPubkey: new PublicKey(FEES_CONFIG.PLATFORM_FEE_RECIPIENT),
      lamports: FEES_CONFIG.MESSAGE_FEE,
    })
  );

  return transaction;
};
