// Script para desplegar los contratos de Aletheum X con integraciones reales

const { ethers } = require("hardhat")

async function main() {
  console.log("Desplegando contratos de Aletheum X con integraciones reales...")

  // Obtener las cuentas
  const [deployer] = await ethers.getSigners()
  console.log("Desplegando contratos con la cuenta:", deployer.address)

  // Configuración de Chainlink
  const linkToken = "0x326C977E6efc84E512bB9C30f76E30c160eD06FB" // Goerli LINK
  const oracle = "0x2f90A6D021db21e1B2A077c5a37B3C7E75D15b7e" // Oráculo de Chainlink
  const jobId = ethers.utils.formatBytes32String("29fa9aa13bf1468788b7cc4a500a45b8") // ID del trabajo
  const fee = ethers.utils.parseEther("0.1") // 0.1 LINK

  // Desplegar WalletVerifier
  console.log("Desplegando WalletVerifier...")
  const WalletVerifier = await ethers.getContractFactory("WalletVerifier")
  const walletVerifier = await WalletVerifier.deploy(linkToken, oracle, jobId, fee)
  await walletVerifier.deployed()
  console.log("WalletVerifier desplegado en:", walletVerifier.address)

  // Desplegar EigenLayerServiceManager (simulado para pruebas)
  console.log("Desplegando EigenLayerServiceManager simulado...")
  const EigenLayerServiceManager = await ethers.getContractFactory("MockEigenLayerServiceManager")
  const eigenLayerServiceManager = await EigenLayerServiceManager.deploy()
  await eigenLayerServiceManager.deployed()
  console.log("EigenLayerServiceManager desplegado en:", eigenLayerServiceManager.address)

  // Desplegar ChainlinkReviewVerifier (con dirección temporal para ReviewChain)
  console.log("Desplegando ChainlinkReviewVerifier...")
  const ChainlinkReviewVerifier = await ethers.getContractFactory("ChainlinkReviewVerifier")
  const chainlinkReviewVerifier = await ChainlinkReviewVerifier.deploy(
    deployer.address, // Dirección temporal para ReviewChain
    linkToken,
    oracle,
    jobId,
    fee,
  )
  await chainlinkReviewVerifier.deployed()
  console.log("ChainlinkReviewVerifier desplegado en:", chainlinkReviewVerifier.address)

  // Desplegar EigenLayerAVS (con dirección temporal para ReviewChain)
  console.log("Desplegando EigenLayerAVS...")
  const EigenLayerAVS = await ethers.getContractFactory("EigenLayerAVS")
  const eigenLayerAVS = await EigenLayerAVS.deploy(
    deployer.address, // Dirección temporal para ReviewChain
    eigenLayerServiceManager.address,
  )
  await eigenLayerAVS.deployed()
  console.log("EigenLayerAVS desplegado en:", eigenLayerAVS.address)

  // Desplegar ReviewChain
  console.log("Desplegando ReviewChain...")
  const ReviewChain = await ethers.getContractFactory("ReviewChain")
  const reviewChain = await ReviewChain.deploy(chainlinkReviewVerifier.address, eigenLayerAVS.address)
  await reviewChain.deployed()
  console.log("ReviewChain desplegado en:", reviewChain.address)

  // Actualizar direcciones en los verificadores
  console.log("Actualizando direcciones en los verificadores...")

  await chainlinkReviewVerifier.setReviewChainAddress(reviewChain.address)
  console.log("Dirección de ReviewChain actualizada en ChainlinkReviewVerifier")

  await eigenLayerAVS.setReviewChainAddress(reviewChain.address)
  console.log("Dirección de ReviewChain actualizada en EigenLayerAVS")

  // Otorgar roles en ReviewChain
  console.log("Otorgando roles en ReviewChain...")

  const VERIFIER_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("VERIFIER_ROLE"))
  const ORACLE_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("ORACLE_ROLE"))

  await reviewChain.grantRole(VERIFIER_ROLE, chainlinkReviewVerifier.address)
  await reviewChain.grantRole(VERIFIER_ROLE, eigenLayerAVS.address)
  await reviewChain.grantRole(ORACLE_ROLE, deployer.address)

  console.log("Roles otorgados correctamente")

  console.log("Despliegue completado!")
  console.log("-------------------")
  console.log("Resumen de contratos:")
  console.log("ReviewChain:", reviewChain.address)
  console.log("ChainlinkReviewVerifier:", chainlinkReviewVerifier.address)
  console.log("EigenLayerAVS:", eigenLayerAVS.address)
  console.log("WalletVerifier:", walletVerifier.address)
  console.log("EigenLayerServiceManager:", eigenLayerServiceManager.address)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
