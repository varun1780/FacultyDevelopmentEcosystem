import { expect } from "chai";
import hre from "hardhat";

describe("FDPCertificateRegistry", function () {
  let registry;
  let admin;
  let otherUser;

  beforeEach(async function () {
    [admin, otherUser] = await hre.ethers.getSigners();
    const Factory = await hre.ethers.getContractFactory("FDPCertificateRegistry");
    registry = await Factory.deploy();
    await registry.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the deployer as admin", async function () {
      expect(await registry.admin()).to.equal(admin.address);
    });

    it("Should have zero certificates initially", async function () {
      expect(await registry.getTotalCertificates()).to.equal(0);
    });
  });

  describe("Certificate Issuance", function () {
    it("Should issue a certificate successfully", async function () {
      await registry.issueCertificate("CERT-001", "Dr. Priya", "AI in Education", "0xabc123", Date.now());
      expect(await registry.verifyCertificate("CERT-001")).to.be.true;
      expect(await registry.getTotalCertificates()).to.equal(1);
    });

    it("Should not allow duplicate certificate IDs", async function () {
      await registry.issueCertificate("CERT-002", "Dr. Test", "FDP Test", "0xdef456", Date.now());
      await expect(
        registry.issueCertificate("CERT-002", "Dr. Test2", "FDP Test2", "0xghi789", Date.now())
      ).to.be.revertedWith("Certificate already exists");
    });

    it("Should not allow non-admin to issue", async function () {
      await expect(
        registry.connect(otherUser).issueCertificate("CERT-003", "Dr. Test", "FDP", "0x123", Date.now())
      ).to.be.revertedWith("Only admin can perform this action");
    });
  });

  describe("Certificate Verification", function () {
    it("Should return false for non-existent certificate", async function () {
      expect(await registry.verifyCertificate("NONEXISTENT")).to.be.false;
    });

    it("Should verify certificate hash", async function () {
      await registry.issueCertificate("CERT-004", "Dr. Hash", "FDP Hash", "0xhashvalue", Date.now());
      expect(await registry.verifyCertificateHash("CERT-004", "0xhashvalue")).to.be.true;
      expect(await registry.verifyCertificateHash("CERT-004", "0xwronghash")).to.be.false;
    });
  });

  describe("Certificate Revocation", function () {
    it("Should revoke a certificate", async function () {
      await registry.issueCertificate("CERT-005", "Dr. Revoke", "FDP Revoke", "0xrev", Date.now());
      await registry.revokeCertificate("CERT-005");
      expect(await registry.verifyCertificate("CERT-005")).to.be.false;
    });
  });
});
