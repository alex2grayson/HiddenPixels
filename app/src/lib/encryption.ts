import { getBytes, hexlify, keccak256, toUtf8Bytes } from 'ethers';

function xorBytes(data: Uint8Array, key: Uint8Array): Uint8Array {
  const result = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    result[i] = data[i] ^ key[i % key.length];
  }
  return result;
}

function deriveKey(secretAddress: string): Uint8Array {
  return getBytes(keccak256(toUtf8Bytes(secretAddress.toLowerCase())));
}

export function encryptIpfsHash(ipfsHash: string, secretAddress: string): string {
  const key = deriveKey(secretAddress);
  const data = new TextEncoder().encode(ipfsHash);
  const cipher = xorBytes(data, key);
  return hexlify(cipher);
}

export function decryptIpfsHash(encryptedHash: string, secretAddress: string): string {
  try {
    const key = deriveKey(secretAddress);
    const cipherBytes = getBytes(encryptedHash);
    const plainBytes = xorBytes(cipherBytes, key);
    return new TextDecoder().decode(plainBytes);
  } catch (error) {
    console.error('Failed to decrypt IPFS hash', error);
    return '';
  }
}

export function shortenAddress(addr?: string, chars = 4): string {
  if (!addr) return '';
  return `${addr.slice(0, 2 + chars)}...${addr.slice(-chars)}`;
}

export function formatTimestamp(timestamp: bigint | number): string {
  const asNumber = typeof timestamp === 'bigint' ? Number(timestamp) : timestamp;
  if (!Number.isFinite(asNumber)) return '';
  return new Date(asNumber * 1000).toLocaleString();
}
