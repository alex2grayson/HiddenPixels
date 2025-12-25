import { useMemo, useState } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { CONTRACT_ABI, CONTRACT_ADDRESS } from '../config/contracts';
import { useZamaInstance } from '../hooks/useZamaInstance';
import { useEthersSigner } from '../hooks/useEthersSigner';
import { decryptIpfsHash, formatTimestamp, shortenAddress } from '../lib/encryption';
import '../styles/Vault.css';

type EncryptedImage = {
  fileName: string;
  encryptedIpfsHash: string;
  encryptedSecretAddress: string;
  createdAt: bigint;
  uploader: string;
};

export function Vault() {
  const { address } = useAccount();
  const { instance } = useZamaInstance();
  const signerPromise = useEthersSigner();
  const [decryptingIndex, setDecryptingIndex] = useState<number | null>(null);
  const [decrypted, setDecrypted] = useState<Record<number, { address: string; ipfsHash: string }>>({});
  const [errorMessage, setErrorMessage] = useState<string>('');
  const contractReady = true

  const { data: encryptedImages, isFetching } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getImages',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && contractReady,
    },
  });

  const parsedImages: EncryptedImage[] = useMemo(() => {
    if (!encryptedImages) return [];
    return (encryptedImages as EncryptedImage[]).map((item) => ({
      fileName: item.fileName,
      encryptedIpfsHash: item.encryptedIpfsHash,
      encryptedSecretAddress: item.encryptedSecretAddress,
      createdAt: item.createdAt,
      uploader: item.uploader,
    }));
  }, [encryptedImages]);

  const decryptEntry = async (item: EncryptedImage, index: number) => {
    if (!instance || !address || !signerPromise) {
      setErrorMessage('Connect wallet and wait for the Zama relayer to load.');
      return;
    }

    setDecryptingIndex(index);
    setErrorMessage('');

    try {
      const keypair = instance.generateKeypair();
      const startTimeStamp = Math.floor(Date.now() / 1000).toString();
      const durationDays = "7";
      const contractAddresses = [CONTRACT_ADDRESS];
      const eip712 = instance.createEIP712(keypair.publicKey, contractAddresses, startTimeStamp, durationDays);
      const signer = await signerPromise;
      if (!signer) {
        throw new Error('Missing signer');
      }

      const signature = await signer.signTypedData(
        eip712.domain,
        { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
        eip712.message
      );

      const result = await instance.userDecrypt(
        [
          {
            handle: item.encryptedSecretAddress,
            contractAddress: CONTRACT_ADDRESS,
          },
        ],
        keypair.privateKey,
        keypair.publicKey,
        signature.replace("0x", ""),
        contractAddresses,
        address,
        startTimeStamp,
        durationDays
      );

      const recoveredAddress = result[item.encryptedSecretAddress];
      const recoveredHash = decryptIpfsHash(item.encryptedIpfsHash, recoveredAddress);

      setDecrypted((prev) => ({
        ...prev,
        [index]: {
          address: recoveredAddress,
          ipfsHash: recoveredHash,
        },
      }));
    } catch (error) {
      console.error('Unable to decrypt entry', error);
      setErrorMessage('Decryption failed. Make sure you are the uploader and try again.');
    } finally {
      setDecryptingIndex(null);
    }
  };

  if (!address) {
    return (
      <div className="vault-placeholder">
        <p>Connect your wallet to view encrypted images.</p>
      </div>
    );
  }

  if (!contractReady) {
    return (
      <div className="vault-placeholder">
        <p>Deploy HiddenPixels to Sepolia and update CONTRACT_ADDRESS to fetch your vault.</p>
      </div>
    );
  }

  return (
    <div className="vault-grid">
      {parsedImages.length === 0 && !isFetching ? (
        <div className="vault-placeholder">
          <p>No encrypted images yet. Upload one to populate your vault.</p>
        </div>
      ) : null}

      {parsedImages.map((item, index) => (
        <div key={`${item.fileName}-${index}`} className="vault-card">
          <div className="card-head">
            <div>
              <p className="label">File</p>
              <h4>{item.fileName}</h4>
              <p className="muted">{formatTimestamp(item.createdAt)}</p>
            </div>
            <div className="chip">Encrypted</div>
          </div>

          <div className="detail-row">
            <span className="label">Encrypted IPFS hash</span>
            <span className="mono">{item.encryptedIpfsHash.slice(0, 32)}...</span>
          </div>

          <div className="detail-row">
            <span className="label">Stored by</span>
            <span>{shortenAddress(item.uploader)}</span>
          </div>

          <div className="actions">
            <button
              className="primary"
              onClick={() => decryptEntry(item, index)}
              disabled={decryptingIndex === index}
            >
              {decryptingIndex === index ? 'Decrypting...' : 'Decrypt entry'}
            </button>
          </div>

          {decrypted[index] ? (
            <div className="decrypt-result">
              <p className="label">Secret address</p>
              <p className="mono">{decrypted[index].address}</p>
              <p className="label">Recovered IPFS hash</p>
              <p className="mono">{decrypted[index].ipfsHash}</p>
            </div>
          ) : null}
        </div>
      ))}

      {isFetching ? <div className="vault-placeholder">Loading vault...</div> : null}
      {errorMessage ? <div className="error-banner">{errorMessage}</div> : null}
    </div>
  );
}
