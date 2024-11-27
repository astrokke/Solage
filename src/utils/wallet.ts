import { WalletNotConnectedError } from '@solana/wallet-adapter-base';
import { Connection, Transaction, SystemProgram, PublicKey, Commitment } from '@solana/web3.js';
import { FEES_CONFIG } from '../config/fees';
import { TRANSACTION_SETTINGS, ERROR_MESSAGES } from './constants';

export async function sendMessageTransaction(
  connection: Connection,
  wallet: any,
  recipientAddress: string,
  onError: (error: string) => void
): Promise<string | null> {
  if (!wallet.publicKey || !wallet.signTransaction) {
    onError(ERROR_MESSAGES.WALLET_NOT_CONNECTED);
    return null;
  }

  try {
    const recipient = new PublicKey(recipientAddress);
    const instructions = [
      SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: recipient,
        lamports: TRANSACTION_SETTINGS.MESSAGE_FEE,
      })
    ];

    if (FEES_CONFIG.FEES_ENABLED) {
      instructions.push(
        SystemProgram.transfer({
          fromPubkey: wallet.publicKey,
          toPubkey: new PublicKey(FEES_CONFIG.FEE_RECIPIENT),
          lamports: FEES_CONFIG.FEE_AMOUNT,
        })
      );
    }

    const latestBlockhash = await connection.getLatestBlockhash(
      TRANSACTION_SETTINGS.CONFIRMATION_COMMITMENT
    );

    const transaction = new Transaction()
      .add(...instructions)
      .setSigners(wallet.publicKey);

    transaction.recentBlockhash = latestBlockhash.blockhash;
    transaction.feePayer = wallet.publicKey;

    const signed = await wallet.signTransaction(transaction);
    const signature = await connection.sendRawTransaction(signed.serialize(), {
      skipPreflight: false,
      preflightCommitment: TRANSACTION_SETTINGS.CONFIRMATION_COMMITMENT,
    });

    const confirmation = await connection.confirmTransaction({
      signature,
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    }, TRANSACTION_SETTINGS.CONFIRMATION_COMMITMENT);

    if (confirmation.value.err) {
      throw new Error(ERROR_MESSAGES.TRANSACTION_FAILED);
    }

    return signature;
  } catch (error: any) {
    console.error('Transaction error:', error);
    onError(error.message || ERROR_MESSAGES.TRANSACTION_FAILED);
    return n