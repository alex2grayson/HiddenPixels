import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

task("task:address", "Prints the HiddenPixels contract address").setAction(async function (_taskArguments: TaskArguments, hre) {
  const { deployments } = hre;
  const deployment = await deployments.get("HiddenPixels");

  console.log("HiddenPixels address is " + deployment.address);
});

task("task:store-image", "Stores an encrypted image reference for testing")
  .addParam("file", "File name to record")
  .addParam("hash", "Encrypted IPFS hash string")
  .addOptionalParam("secret", "Secret address to encrypt (defaults to sender address)")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;

    await fhevm.initializeCLIApi();

    const deployment = await deployments.get("HiddenPixels");
    const contract = await ethers.getContractAt("HiddenPixels", deployment.address);

    const [sender] = await ethers.getSigners();
    const secretAddress: string = (taskArguments.secret as string | undefined) || sender.address;

    const encryptedInput = await fhevm.createEncryptedInput(deployment.address, sender.address).addAddress(secretAddress).encrypt();

    const tx = await contract
      .connect(sender)
      .storeImage(taskArguments.file as string, taskArguments.hash as string, encryptedInput.handles[0], encryptedInput.inputProof);
    const receipt = await tx.wait();

    const count = await contract.getUserImageCount(sender.address);
    console.log(`Stored image for ${sender.address} at index ${count - 1n}. tx:${receipt?.hash}`);
  });

task("task:decrypt-address", "Decrypts the encrypted address for an image")
  .addParam("owner", "Image owner address")
  .addParam("index", "Image index")
  .addOptionalParam("accountIndex", "Local account index to decrypt with", "0")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;

    await fhevm.initializeCLIApi();

    const deployment = await deployments.get("HiddenPixels");
    const contract = await ethers.getContractAt("HiddenPixels", deployment.address);

    const accountIndex = parseInt(taskArguments.accountIndex as string, 10);
    const signers = await ethers.getSigners();
    const signer = signers[accountIndex];

    const image = await contract.getImage(taskArguments.owner as string, BigInt(taskArguments.index as string));
    const decrypted = await fhevm.userDecryptEaddress(image.encryptedSecretAddress, deployment.address, signer);

    console.log(`Decrypted secret address for user ${taskArguments.owner} index ${taskArguments.index}: ${decrypted}`);
  });
