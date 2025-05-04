const { ethers } = require("hardhat");
const { zksync } = require("zksync-web3");

async function main() {
  console.log("Desplegando contratos de Aletheum X en zkSync...");

  // Configuración de zkSync
  const zkSyncProvider = new zksync.Provider("https://testnet.era.zksync.dev");
  const wallet = new zksync.Wallet(process.env.PRIVATE_KEY, zkSyncProvider);

  // Desplegar ZkSyncReviewChain
  console.log("Desplegando ZkSyncReviewChain...");
  const ZkSyncReviewChain = await ethers.getContractFactory("ZkSyncReviewChain");
  const zkSyncReviewChain = await ZkSyncReviewChain.deploy(
    "0x0000000000000000000000000000000000000000", // Dirección temporal para ReviewVerifier
    "0x0000000000000000000000000000000000000000"  // Dirección temporal para EigenLayerAVS
  );
  await zkSyncReviewChain.deployed();
  console.log("ZkSyncReviewChain desplegado en:", zkSyncReviewChain.address);

  // Desplegar otros contratos necesarios
  console.log("Desplegando contratos auxiliares...");
  const ReviewVerifier = await ethers.getContractFactory("ReviewVerifier");
  const reviewVerifier = await ReviewVerifier.deploy(zkSyncReviewChain.address);
  await reviewVerifier.deployed();
  console.log("ReviewVerifier desplegado en:", reviewVerifier.address);

  const EigenLayerAVS = await ethers.getContractFactory("EigenLayerAVS");
  const eigenLayerAVS = await EigenLayerAVS.deploy(
    zkSyncReviewChain.address,
    "0x0000000000000000000000000000000000000000" // Dirección temporal para ServiceManager
  );
  await eigenLayerAVS.deployed();
  console.log("EigenLayerAVS desplegado en:", eigenLayerAVS.address);

  // Actualizar direcciones en ZkSyncReviewChain
  console.log("Actualizando direcciones en ZkSyncReviewChain...");
  await zkSyncReviewChain.updateVerifier(reviewVerifier.address);
  await zkSyncReviewChain.updateEigenLayerAVS(eigenLayerAVS.address);

  console.log("\nResumen de despliegue:");
  console.log("ZkSyncReviewChain:", zkSyncReviewChain.address);
  console.log("ReviewVerifier:", reviewVerifier.address);
  console.log("EigenLayerAVS:", eigenLayerAVS.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 