export const isValidSolanaAddress = (address: string): boolean => {
  return /^[A-HJ-NP-Za-km-z1-9]{32,44}$/.test(address);
};
