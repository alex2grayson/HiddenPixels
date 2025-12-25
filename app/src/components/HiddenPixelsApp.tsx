import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Header } from './Header';
import { UploadPanel } from './UploadPanel';
import { Vault } from './Vault';
import '../styles/AppShell.css';

export function HiddenPixelsApp() {
  const [activeTab, setActiveTab] = useState<'upload' | 'vault'>('upload');
  const { address } = useAccount();

  return (
    <div className="shell">
      <Header />
      <main className="main-content">
        <section className="hero">
          <div>
            <p className="eyebrow">Encrypted IPFS locker</p>
            <h1 className="hero-title">Hide your pixels in plain sight</h1>
            <p className="hero-subtitle">
              Upload images, mint a one-time address, encrypt the IPFS hash, and store it with Zama FHE. Decrypt on demand—only with the keys you locked inside.
            </p>
            <div className="hero-actions">
              <button
                className={`tab-button ${activeTab === 'upload' ? 'active' : 'inactive'}`}
                onClick={() => setActiveTab('upload')}
              >
                Upload & Encrypt
              </button>
              <button
                className={`tab-button ${activeTab === 'vault' ? 'active' : 'inactive'}`}
                onClick={() => setActiveTab('vault')}
              >
                My Vault
              </button>
            </div>
          </div>
          <div className="hero-panel">
            <div className="hero-chip">Network: Sepolia</div>
            <div className="hero-chip">Writes with ethers · Reads with viem</div>
            <div className="hero-chip">{address ? `Connected: ${address.slice(0, 6)}...${address.slice(-4)}` : 'Connect wallet to start'}</div>
          </div>
        </section>

        <section className="panel-area">
          {activeTab === 'upload' ? <UploadPanel /> : <Vault />}
        </section>
      </main>
    </div>
  );
}
