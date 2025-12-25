// HiddenPixels contract ABI generated from deployments artifacts.
// Update CONTRACT_ADDRESS after deploying to Sepolia (deployments/sepolia/HiddenPixels.json).
export const CONTRACT_ADDRESS = '0x2195ffB427e227053854F9274522D8b2cbA245c4';

export const CONTRACT_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "index",
        "type": "uint256"
      }
    ],
    "name": "ImageNotFound",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidFileName",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidIpfsHash",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ZamaProtocolUnsupported",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "index",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "fileName",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "encryptedIpfsHash",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "createdAt",
        "type": "uint256"
      }
    ],
    "name": "ImageStored",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "confidentialProtocolId",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "index",
        "type": "uint256"
      }
    ],
    "name": "getImage",
    "outputs": [
      {
        "components": [
          {
            "internalType": "string",
            "name": "fileName",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "encryptedIpfsHash",
            "type": "string"
          },
          {
            "internalType": "eaddress",
            "name": "encryptedSecretAddress",
            "type": "bytes32"
          },
          {
            "internalType": "uint256",
            "name": "createdAt",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "uploader",
            "type": "address"
          }
        ],
        "internalType": "struct HiddenPixels.EncryptedImage",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "getImages",
    "outputs": [
      {
        "components": [
          {
            "internalType": "string",
            "name": "fileName",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "encryptedIpfsHash",
            "type": "string"
          },
          {
            "internalType": "eaddress",
            "name": "encryptedSecretAddress",
            "type": "bytes32"
          },
          {
            "internalType": "uint256",
            "name": "createdAt",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "uploader",
            "type": "address"
          }
        ],
        "internalType": "struct HiddenPixels.EncryptedImage[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "getUserImageCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "fileName",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "encryptedIpfsHash",
        "type": "string"
      },
      {
        "internalType": "externalEaddress",
        "name": "encryptedAddress",
        "type": "bytes32"
      },
      {
        "internalType": "bytes",
        "name": "inputProof",
        "type": "bytes"
      }
    ],
    "name": "storeImage",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "newIndex",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;
