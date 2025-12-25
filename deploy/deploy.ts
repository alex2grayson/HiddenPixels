import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployedHiddenPixels = await deploy("HiddenPixels", {
    from: deployer,
    log: true,
  });

  console.log(`HiddenPixels contract: `, deployedHiddenPixels.address);
};
export default func;
func.id = "deploy_hiddenpixels"; // id required to prevent reexecution
func.tags = ["HiddenPixels"];
