import { useRef, useState } from 'react';
import { useAccount } from 'wagmi';
import { Contract, Wallet } from 'ethers';
import { useEthersSigner } from '../hooks/useEthersSigner';
import { useZamaInstance } from '../hooks/useZamaInstance';
import { CONTRACT_ABI, CONTRACT_ADDRESS } from '../config/contracts';
import { encryptIpfsHash, shortenAddress } from '../lib/encryption';
import { mockUploadToIpfs } from '../lib/ipfs';
import '../styles/UploadPanel.css';

export function UploadPanel() {
  const { address } = useAccount();
  const { instance, isLoading: zamaLoading } = useZamaInstance();
  const signerPromise = useEthersSigner();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const contractReady = true

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [ipfsHash, setIpfsHash] = useState<string>('');
  const [encryptedHash, setEncryptedHash] = useState<string>('');
  const [secretAddress, setSecretAddress] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setIpfsHash('');
    setEncryptedHash('');
    setSecretAddress('');
    setStatus('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setStatus('Ready to upload to IPFS');
      setIpfsHash('');
      setEncryptedHash('');
      setSecretAddress('');
    }
  };

  const handleUploadToIPFS = async () => {
    if (!selectedFile) {
      setStatus('Select an image to continue');
      return;
    }

    setIsUploading(true);
    setStatus('Generating mock IPFS hash...');

    try {
      const uploadResult = await mockUploadToIpfs(selectedFile);
      setIpfsHash(uploadResult.hash);

      const generatedWallet = Wallet.createRandom();
      setSecretAddress(generatedWallet.address);

      const cipher = encryptIpfsHash(uploadResult.hash, generatedWallet.address);
      setEncryptedHash(cipher);
      setStatus('IPFS hash encrypted with a fresh address. Ready to store on-chain.');
    } catch (error) {
      console.error('Failed to prepare IPFS data:', error);
      setStatus('Upload failed. Try again with a different file.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleStoreOnChain = async () => {
    if (!contractReady) {
      setStatus('Deploy the HiddenPixels contract to Sepolia and update CONTRACT_ADDRESS.');
      return;
    }
    if (!address || !instance || !signerPromise) {
      setStatus('Connect your wallet and wait for the Zama relayer.');
      return;
    }
    if (!selectedFile || !encryptedHash || !secretAddress || !ipfsHash) {
      setStatus('Upload to IPFS and generate encryption before storing.');
      return;
    }

    setIsSubmitting(true);
    setStatus('Encrypting secret address with Zama and sending transaction...');

    try {
      const input = instance.createEncryptedInput(CONTRACT_ADDRESS, address);
      input.addAddress(secretAddress);
      const encryptedInput = await input.encrypt();

      const signer = await signerPromise;
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const tx = await contract.storeImage(
        selectedFile.name,
        encryptedHash,
        encryptedInput.handles[0],
        encryptedInput.inputProof
      );

      await tx.wait();
      setStatus('Stored successfully on-chain. Check it in your vault.');
    } catch (error) {
      console.error('Failed to store encrypted image', error);
      setStatus('Transaction failed. Please retry once your wallet confirms the request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="upload-card">
      <div className="upload-headline">
        <div>
          <p className="eyebrow">Step-by-step</p>
          <h2>Upload, encrypt, and anchor your image</h2>
          <p className="muted">
            We mint a one-time EVM address for every upload, encrypt the mock IPFS hash with it, and store both the cipher and Zama-encrypted address on Sepolia.
          </p>
        </div>
        <button className="ghost-button" onClick={resetForm}>Reset</button>
      </div>

      <div className="upload-grid">
        <div className="panel">
          <h3 className="panel-title">1 · Choose an image</h3>
          <label className="file-drop">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="file-input"
            />
            <span>{selectedFile ? selectedFile.name : 'Drop or click to pick an image'}</span>
          </label>
          {previewUrl && (
            <div className="preview-box">
              <img src={previewUrl} alt="Selected" />
            </div>
          )}
          <button
            type="button"
            onClick={handleUploadToIPFS}
            className="primary"
            disabled={isUploading || !selectedFile}
          >
            {isUploading ? 'Minting fake IPFS hash...' : 'Create IPFS hash'}
          </button>
          {ipfsHash && (
            <div className="data-tile">
              <p className="label">Mock IPFS hash</p>
              <p className="value">{ipfsHash}</p>
            </div>
          )}
        </div>

        <div className="panel">
          <h3 className="panel-title">2 · Lock it with FHE</h3>
          <div className="data-tile">
            <p className="label">One-time address</p>
            <p className="value">{secretAddress ? secretAddress : 'Generated after IPFS step'}</p>
          </div>
          <div className="data-tile">
            <p className="label">Encrypted IPFS hash</p>
            <p className="value code">{encryptedHash || 'Pending encryption'}</p>
          </div>
          <p className="muted">
            The IPFS hash is XOR-encrypted using the generated address as a key, then the address is encrypted with Zama FHE before storage.
          </p>
          {!contractReady && (
            <p className="warning">
              Deploy HiddenPixels to Sepolia and replace CONTRACT_ADDRESS before storing entries.
            </p>
          )}
          <button
            type="button"
            className="secondary"
            onClick={handleStoreOnChain}
            disabled={!encryptedHash || isSubmitting || zamaLoading || !contractReady}
          >
            {zamaLoading ? 'Preparing Zama relayer...' : isSubmitting ? 'Waiting for confirmation...' : 'Store on-chain'}
          </button>
          {status && (
            <p className="status-line">
              <span className="dot" /> {status}
            </p>
          )}
          {address && (
            <p className="muted mini">Uploader: {shortenAddress(address)}</p>
          )}
        </div>
      </div>
    </div>
  );
}
