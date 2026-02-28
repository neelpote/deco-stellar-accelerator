/**
 * Utility functions for handling blockchain data types
 */

import * as StellarSdk from '@stellar/stellar-sdk';

/**
 * Safely convert BigInt or number to number
 * Useful for blockchain data that might come as BigInt
 */
export const toNumber = (value: number | bigint): number => {
  return typeof value === 'bigint' ? Number(value) : value;
};

/**
 * Calculate percentage from two values that might be BigInt
 */
export const calculatePercentage = (numerator: number | bigint, denominator: number | bigint): number => {
  const num = toNumber(numerator);
  const den = toNumber(denominator);
  return den > 0 ? Math.round((num / den) * 100) : 0;
};

/**
 * Format time remaining from timestamp (handles BigInt)
 */
export const formatTimeRemaining = (endTime: number | bigint): string => {
  const now = Math.floor(Date.now() / 1000);
  const endTimeNum = toNumber(endTime);
  const remaining = endTimeNum - now;
  
  if (remaining <= 0) return 'Ended';
  
  const days = Math.floor(remaining / (24 * 60 * 60));
  const hours = Math.floor((remaining % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((remaining % (60 * 60)) / 60);
  
  if (days > 0) return `${days}d ${hours}h remaining`;
  if (hours > 0) return `${hours}h ${minutes}m remaining`;
  return `${minutes}m remaining`;
};

/**
 * Check if voting is still active (handles BigInt)
 */
export const isVotingActive = (endTime: number | bigint): boolean => {
  const now = Math.floor(Date.now() / 1000);
  return now < toNumber(endTime);
};

/**
 * Properly convert values to Stellar ScVal types
 */
export const toScVal = {
  /**
   * Convert boolean to ScVal
   */
  bool: (value: boolean) => StellarSdk.xdr.ScVal.scvBool(value),
  
  /**
   * Convert number to i128 ScVal (for large numbers like amounts)
   */
  i128: (value: number) => StellarSdk.nativeToScVal(BigInt(value), { type: 'i128' }),
  
  /**
   * Convert string to ScVal
   */
  string: (value: string) => StellarSdk.nativeToScVal(value, { type: 'string' }),
  
  /**
   * Convert address string to ScVal
   */
  address: (value: string) => StellarSdk.Address.fromString(value).toScVal(),
};