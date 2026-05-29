import hre from "hardhat";

async function main() {
  console.log("🚀 Deploying FDPCertificateRegistry...");
  
  const FDPCertificateRegistry = await hre.ethers.getContractFactory("FDPCertificateRegistry");
  const registry = await FDPCertificateRegistry.deploy();
  await registry.waitForDeployment();
  
  const address = await registry.getAddress();
  console.log(`✅ FDPCertificateRegistry deployed to: ${address}`);
  console.log(`📋 Set this in your .env: BLOCKCHAIN_CONTRACT_ADDRESS=${address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
