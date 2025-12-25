import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { Wallet, ZeroHash } from "ethers";
import { ethers, fhevm } from "hardhat";
import { expect } from "chai";
import { HiddenPixels, HiddenPixels__factory } from "../types";

type Signers = {
  uploader: HardhatEthersSigner;
  viewer: HardhatEthersSigner;
};

async function deployFixture() {
  const factory = (await ethers.getContractFactory("HiddenPixels")) as HiddenPixels__factory;
  const contract = (await factory.deploy()) as HiddenPixels;
  const contractAddress = await contract.getAddress();

  return { contract, contractAddress };
}

describe("HiddenPixels", function () {
  let signers: Signers;
  let hiddenPixels: HiddenPixels;
  let contractAddress: string;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { uploader: ethSigners[0], viewer: ethSigners[1] };
  });

  beforeEach(async function () {
    if (!fhevm.isMock) {
      console.warn("HiddenPixels unit tests are only supported on the mock FHEVM network");
      this.skip();
    }

    ({ contract: hiddenPixels, contractAddress } = await deployFixture());
  });

  it("stores encrypted image data and decrypts the hidden address", async function () {
    const encryptedHash = "QmHiddenPixelsHash";
    const randomWallet = Wallet.createRandom();
    const encryptedInput = await fhevm
      .createEncryptedInput(contractAddress, signers.uploader.address)
      .addAddress(randomWallet.address)
      .encrypt();

    const tx = await hiddenPixels
      .connect(signers.uploader)
      .storeImage("aurora.png", encryptedHash, encryptedInput.handles[0], encryptedInput.inputProof);
    await tx.wait();

    const count = await hiddenPixels.getUserImageCount(signers.uploader.address);
    expect(count).to.eq(1n);

    const saved = await hiddenPixels.getImage(signers.uploader.address, 0);
    expect(saved.fileName).to.eq("aurora.png");
    expect(saved.encryptedIpfsHash).to.eq(encryptedHash);
    expect(saved.uploader).to.eq(signers.uploader.address);
    expect(saved.encryptedSecretAddress).to.not.eq(ZeroHash);

    const decrypted = await fhevm.userDecryptEaddress(saved.encryptedSecretAddress, contractAddress, signers.uploader);
    expect(decrypted.toLowerCase()).to.eq(randomWallet.address.toLowerCase());
  });

  it("returns all stored images", async function () {
    const walletA = Wallet.createRandom();
    const walletB = Wallet.createRandom();

    const encryptedA = await fhevm
      .createEncryptedInput(contractAddress, signers.uploader.address)
      .addAddress(walletA.address)
      .encrypt();
    const encryptedB = await fhevm
      .createEncryptedInput(contractAddress, signers.uploader.address)
      .addAddress(walletB.address)
      .encrypt();

    await hiddenPixels
      .connect(signers.uploader)
      .storeImage("first.png", "QmHashOne", encryptedA.handles[0], encryptedA.inputProof);
    await hiddenPixels
      .connect(signers.uploader)
      .storeImage("second.png", "QmHashTwo", encryptedB.handles[0], encryptedB.inputProof);

    const images = await hiddenPixels.getImages(signers.uploader.address);
    expect(images.length).to.eq(2);
    expect(images[0].fileName).to.eq("first.png");
    expect(images[1].encryptedIpfsHash).to.eq("QmHashTwo");
  });

  it("reverts on missing metadata", async function () {
    const wallet = Wallet.createRandom();
    const encrypted = await fhevm
      .createEncryptedInput(contractAddress, signers.uploader.address)
      .addAddress(wallet.address)
      .encrypt();

    await expect(
      hiddenPixels
        .connect(signers.uploader)
        .storeImage("", "QmMissingName", encrypted.handles[0], encrypted.inputProof),
    ).to.be.revertedWithCustomError(hiddenPixels, "InvalidFileName");

    await expect(
      hiddenPixels.connect(signers.uploader).storeImage("file.png", "", encrypted.handles[0], encrypted.inputProof),
    ).to.be.revertedWithCustomError(hiddenPixels, "InvalidIpfsHash");
  });

  it("reverts when fetching a missing index", async function () {
    await expect(hiddenPixels.getImage(signers.uploader.address, 0)).to.be.revertedWithCustomError(
      hiddenPixels,
      "ImageNotFound",
    );
  });
});
