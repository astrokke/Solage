import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
} from "@solana/web3.js";
import { WalletContextState } from "@solana/wallet-adapter-react";

export const sendSolanaMessage = async (
  wallet: WalletContextState,
  connection: Connection,
  recipientAddress: string,
  amount: number
) => {
  // Vérification du solde
  const balance = await connection.getBalance(wallet.publicKey!);
  const totalNecessaire = amount + 0; // Ajout des frais de transaction

  if (balance < totalNecessaire) {
    throw new Error(`Solde insuffisant. Il faut ${totalNecessaire / 1e9} SOL`);
  }
  console.log("Starting transaction...");
  console.log("Wallet public key:", wallet.publicKey?.toBase58());
  console.log("Recipient address:", recipientAddress);
  console.log("Amount:", amount);

  try {
    if (!wallet.publicKey) {
      throw new Error("Wallet public key is undefined");
    }

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: new PublicKey(recipientAddress),
        lamports: amount,
      })
    );

    const latestBlockhash = await connection.getLatestBlockhash();
    transaction.recentBlockhash = latestBlockhash.blockhash;
    transaction.feePayer = wallet.publicKey;

    if (!wallet.signTransaction) {
      throw new Error("Wallet signTransaction method is undefined");
    }

    const signed = await wallet.signTransaction(transaction);
    const signature = await connection.sendRawTransaction(signed.serialize());
    await connection.confirmTransaction(signature);

    return signature;
  } catch (error) {
    console.error("Transaction error details:", error);
    throw new Error(
      `Transaction failed: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
};
