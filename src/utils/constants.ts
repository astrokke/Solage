export const WEBSOCKET_URL = 'wss://solage-56rf.onrender.com';
export const WEBSOCKET_RETRY_DELAY = 1000;
export const MAX_RECONNECT_ATTEMPTS = 5;

export const TRANSACTION_SETTINGS = {
  MESSAGE_FEE: 1000, // 0.000001 SOL
  CONFIRMATION_COMMITMENT: 'confirmed' as const,
};

export const ERROR_MESSAGES = {
  WALLET_NOT_CONNECTED: 'Please connect your wallet to continue',
  WEBSOCKET_CONNECTION_ERROR: 'Connection error. Retrying...',
  TRANSACTION_FAILED: 'Transaction failed. Please try again',
  RECIPIENT_OFFLINE: 'Recipient is currently offline',
  INVALID_RECIPIENT: 'Invalid recipi