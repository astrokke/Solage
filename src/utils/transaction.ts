import {
  PublicKey,
  Transaction,
  SystemProgram,
  Connection,
  TransactionInstruction,
} from "@solana/web3.js";
import { FEES_CONFIG } from "../config/fees";
import { MESSAGE_FEE } from "./constants";

export const createMessageTransaction = async (
  connection: Connection,
  senderPublicKey: PublicKey,
  recipientAddress: string
): Promise<Transaction> => {
  const recipient = new PublicKey(recipientAddress);

  // Get recent blockhash
  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash("finalized");
  // Create transaction
  const transaction = new Transaction({
    blockhash,
    feePayer: senderPublicKey,
    lastValidBlockHeight,
  });

  // Add message fee transfer instruction
  const transferInstruction = SystemProgram.transfer({
    fromPubkey: senderPublicKey,
    toPubkey: recipient,
    lamports: MESSAGE_FEE,
  });

  // Add platform fee instruction if enabled
  if (FEES_CONFIG.FEES_ENABLED) {
    const platformFeeInstruction = SystemProgram.transfer({
      fromPubkey: senderPublicKey,
      toPubkey: new PublicKey(FEES_CONFIG.PLATFORM_FEE_RECIPIENT),
      lamports: FEES_CONFIG.FEE_AMOUNT,
    });
    transaction.add(platformFeeInstruction);
  }

  // Add memo instruction for transaction tracking
  const memoInstruction = new TransactionInstruction({
    keys: [],
    programId: new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"),
    data: Buffer.from("solana-chat-message", "utf-8"),
  });

  transaction.add(transferInstruction, memoInstruction);

  return transaction;
};

export const verifyTransaction = async (
  connection: Connection,
  signature: string
): Promise<boolean> => {
  try {
    const confirmation = await connection.confirmTransaction(
      signature,
      "confirmed"
    );
    return !confirmation.value.err;
  } catch (error) {
    console.error("Transaction verification failed:", error);
    return false;
  }
};
