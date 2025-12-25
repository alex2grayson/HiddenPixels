// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, eaddress, externalEaddress} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title HiddenPixels
/// @notice Stores encrypted IPFS references and encrypted secret addresses for user images.
contract HiddenPixels is ZamaEthereumConfig {
    struct EncryptedImage {
        string fileName;
        string encryptedIpfsHash;
        eaddress encryptedSecretAddress;
        uint256 createdAt;
        address uploader;
    }

    mapping(address => EncryptedImage[]) private _userImages;

    error InvalidFileName();
    error InvalidIpfsHash();
    error ImageNotFound(address owner, uint256 index);

    event ImageStored(
        address indexed owner,
        uint256 indexed index,
        string fileName,
        string encryptedIpfsHash,
        uint256 createdAt
    );

    /// @notice Store an encrypted image reference for the caller.
    /// @param fileName Original file name chosen by the user.
    /// @param encryptedIpfsHash IPFS hash encrypted with a locally generated secret.
    /// @param encryptedAddress Secret address encrypted for this contract.
    /// @param inputProof Zama input proof tied to the encrypted address.
    /// @return newIndex Index of the saved image for the caller.
    function storeImage(
        string calldata fileName,
        string calldata encryptedIpfsHash,
        externalEaddress encryptedAddress,
        bytes calldata inputProof
    ) external returns (uint256 newIndex) {
        if (bytes(fileName).length == 0) revert InvalidFileName();
        if (bytes(encryptedIpfsHash).length == 0) revert InvalidIpfsHash();

        eaddress secretAddress = FHE.fromExternal(encryptedAddress, inputProof);

        EncryptedImage memory entry = EncryptedImage({
            fileName: fileName,
            encryptedIpfsHash: encryptedIpfsHash,
            encryptedSecretAddress: secretAddress,
            createdAt: block.timestamp,
            uploader: msg.sender
        });

        _userImages[msg.sender].push(entry);

        // Allow the uploader and the contract to use or decrypt the encrypted address later.
        FHE.allow(secretAddress, msg.sender);
        FHE.allowThis(secretAddress);

        newIndex = _userImages[msg.sender].length - 1;
        emit ImageStored(msg.sender, newIndex, fileName, encryptedIpfsHash, block.timestamp);
    }

    /// @notice Get number of images saved by a user.
    /// @param user Address to check.
    function getUserImageCount(address user) external view returns (uint256) {
        return _userImages[user].length;
    }

    /// @notice Get a single encrypted image entry.
    /// @param user Owner of the image.
    /// @param index Entry index for that user.
    function getImage(address user, uint256 index) external view returns (EncryptedImage memory) {
        if (index >= _userImages[user].length) revert ImageNotFound(user, index);
        return _userImages[user][index];
    }

    /// @notice Get all encrypted images for a user.
    /// @param user Address to read.
    function getImages(address user) external view returns (EncryptedImage[] memory) {
        return _userImages[user];
    }
}
