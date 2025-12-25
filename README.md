# Hidden Pixels

Private image metadata vault using Zama FHEVM. Hidden Pixels lets users select a local image, generate a mock IPFS hash, encrypt that hash with a one-time EVM address, and store the encrypted reference on-chain together with a Zama-encrypted copy of the secret address. Only the uploader can decrypt the secret address through the Zama relayer and recover the IPFS hash.

## Overview

Hidden Pixels demonstrates how Fully Homomorphic Encryption (FHE) can be used to protect content-addressed references in a decentralized workflow. Instead of publishing a plain IPFS hash, the app encrypts it locally and stores only encrypted values on-chain. The on-chain data is still auditable and timestamped, but the underlying reference stays private until the uploader explicitly decrypts it.

## Problems Solved

- Plain IPFS hashes reveal content locations and can leak sensitive media metadata.
- Traditional decentralized apps often require centralized servers to store private pointers.
- Users need a way to keep ownership and auditability on-chain while preserving confidentiality.
- Privacy-aware metadata storage typically lacks a simple end-to-end flow for non-crypto users.

## Key Advantages

- Private-by-design: only encrypted references are stored on-chain.
- User-controlled decryption via Zama FHE relayer and wallet signatures.
- No centralized backend or database is required for storing image references.
- On-chain integrity: every entry is timestamped and attributed to an uploader.
- Clear audit trail without revealing the underlying IPFS hash.
- Frontend reads with viem and writes with ethers for a clean separation of concerns.

## How It Works (End-to-End)

1. The user selects an image locally in the browser.
2. The frontend simulates an IPFS upload by generating a random CID.
3. A one-time EVM address is created in the browser.
4. The IPFS hash is encrypted using XOR with a key derived from the secret address.
5. The secret address is encrypted with Zama FHE as an `eaddress`.
6. The contract stores:
   - the file name,
   - the encrypted IPFS hash,
   - the FHE-encrypted secret address,
   - a timestamp and uploader address.
7. When viewing the vault, the uploader triggers a Zama decryption request.
8. The decrypted secret address unlocks the IPFS hash locally.

## On-Chain Data Model

Each stored entry contains the following fields:

- `fileName` (string): Original file name chosen by the user.
- `encryptedIpfsHash` (string): Locally encrypted IPFS CID.
- `encryptedSecretAddress` (eaddress): Zama-encrypted one-time address.
- `createdAt` (uint256): Block timestamp at time of storage.
- `uploader` (address): Original uploader address.

## Cryptography Notes

- The IPFS hash encryption is a lightweight XOR using a key derived from
  `keccak256(secretAddress)`. This is a demo-grade mechanism, not a
  production-grade cryptosystem.
- The secret address is protected using Zama FHE (`eaddress`) and can only be
  decrypted with a user-signed request through the Zama relayer SDK.
- The contract grants FHE permissions to the uploader and the contract itself
  so decryption can be authorized later.

## Tech Stack

Smart contracts:

- Solidity with Zama FHEVM libraries (`FHE`, `eaddress`)
- Hardhat with hardhat-deploy
- TypeScript tests with chai and ethers

Frontend:

- React + Vite
- viem for contract reads
- ethers for contract writes
- wagmi + RainbowKit for wallet connections
- Zama relayer SDK for encryption and decryption
- CSS modules (no Tailwind)

Tooling and infrastructure:

- npm workspaces (root and `app` package)
- Sepolia testnet for deployment

## Repository Structure

```
contracts/          Smart contracts
deploy/             Hardhat deployment scripts
tasks/              Hardhat custom tasks
test/               Contract tests
app/                React + Vite frontend
hardhat.config.ts   Hardhat configuration
```

## Setup

### Prerequisites

- Node.js 20+
- npm

### Install Dependencies

Root (contracts, tasks, tests):

```bash
npm install
```

Frontend:

```bash
npm --prefix app install
```

### Compile and Test

```bash
npm run compile
npm run test
```

Tests are designed to run on the mock FHEVM network provided by Hardhat.

## Deployment

1. Create a `.env` file in the project root with:

   ```bash
   PRIVATE_KEY=your_sepolia_private_key
   INFURA_API_KEY=your_infura_sepolia_key
   ETHERSCAN_API_KEY=optional_for_verification
   ```

2. Deploy to Sepolia:

   ```bash
   npx hardhat deploy --network sepolia
   ```

3. Copy the ABI and address to the frontend:
   - Update `app/src/config/contracts.ts` with the deployed address.
   - Replace `CONTRACT_ABI` with the ABI from `deployments/sepolia/HiddenPixels.json`.

## Frontend Usage

Run the app:

```bash
npm --prefix app run dev
```

User flow:

1. Connect a wallet on Sepolia.
2. Select an image and generate a mock IPFS hash.
3. Encrypt the hash and store it on-chain.
4. Open the vault to list all saved images.
5. Decrypt a selected entry to recover the secret address and IPFS hash.

Notes:

- The frontend does not use environment variables or local storage.
- All contract reads use viem; all writes use ethers.

## Hardhat Tasks

Optional helper tasks:

- Print deployed address:
  ```bash
  npx hardhat task:address --network sepolia
  ```
- Store a test image:
  ```bash
  npx hardhat task:store-image --file example.png --hash QmExampleHash --network sepolia
  ```
- Decrypt a stored address:
  ```bash
  npx hardhat task:decrypt-address --owner <OWNER> --index <INDEX> --network sepolia
  ```

## Limitations and Non-Goals

- The IPFS upload is mocked and does not pin data to a real IPFS node.
- Only the IPFS hash is encrypted; the image file itself is not encrypted.
- The XOR-based hash encryption is for demonstration only.
- Sharing or delegation of access is not implemented.
- The UI is designed around Sepolia and does not support local networks.

## Future Roadmap

- Real IPFS upload and pinning integrations.
- Encrypt the image itself using a symmetric key protected by FHE.
- Add explicit sharing flows (per-image access grants and revocation).
- Batch uploads and bulk decryption to improve UX.
- Indexing layer for faster queries without exposing plaintext data.
- Gas optimizations and storage compression.
- Multi-chain deployment beyond Sepolia.
- Optional preview rendering once a hash is decrypted.

## License

BSD-3-Clause-Clear. See `LICENSE`.
