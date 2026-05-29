// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title FDPCertificateRegistry
 * @dev Smart contract for issuing, verifying, and revoking FDP certificates on-chain.
 * Stores certificate metadata and hashes for tamper-proof verification.
 */
contract FDPCertificateRegistry {
    address public admin;

    struct Certificate {
        string certificateId;
        string facultyName;
        string fdpName;
        string certificateHash;
        uint256 issueDate;
        address issuerAddress;
        bool isValid;
        bool exists;
    }

    mapping(string => Certificate) public certificates;
    string[] public certificateIds;
    uint256 public totalCertificates;

    event CertificateIssued(
        string certificateId,
        string facultyName,
        string fdpName,
        string certificateHash,
        uint256 issueDate
    );
    event CertificateRevoked(string certificateId);
    event AdminTransferred(address oldAdmin, address newAdmin);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    /**
     * @dev Issue a new certificate on-chain.
     */
    function issueCertificate(
        string memory _certificateId,
        string memory _facultyName,
        string memory _fdpName,
        string memory _certificateHash,
        uint256 _issueDate
    ) public onlyAdmin {
        require(!certificates[_certificateId].exists, "Certificate already exists");
        require(bytes(_certificateId).length > 0, "Certificate ID cannot be empty");
        require(bytes(_certificateHash).length > 0, "Certificate hash cannot be empty");

        certificates[_certificateId] = Certificate({
            certificateId: _certificateId,
            facultyName: _facultyName,
            fdpName: _fdpName,
            certificateHash: _certificateHash,
            issueDate: _issueDate,
            issuerAddress: msg.sender,
            isValid: true,
            exists: true
        });

        certificateIds.push(_certificateId);
        totalCertificates++;

        emit CertificateIssued(_certificateId, _facultyName, _fdpName, _certificateHash, _issueDate);
    }

    /**
     * @dev Verify if a certificate is valid.
     */
    function verifyCertificate(string memory _certificateId) public view returns (bool) {
        if (!certificates[_certificateId].exists) {
            return false;
        }
        return certificates[_certificateId].isValid;
    }

    /**
     * @dev Get full certificate details.
     */
    function getCertificate(string memory _certificateId) public view returns (
        string memory certificateId,
        string memory facultyName,
        string memory fdpName,
        string memory certificateHash,
        uint256 issueDate,
        address issuerAddress,
        bool isValid
    ) {
        require(certificates[_certificateId].exists, "Certificate does not exist");

        Certificate memory cert = certificates[_certificateId];
        return (
            cert.certificateId,
            cert.facultyName,
            cert.fdpName,
            cert.certificateHash,
            cert.issueDate,
            cert.issuerAddress,
            cert.isValid
        );
    }

    /**
     * @dev Verify certificate hash matches on-chain record.
     */
    function verifyCertificateHash(
        string memory _certificateId,
        string memory _hash
    ) public view returns (bool) {
        require(certificates[_certificateId].exists, "Certificate does not exist");
        return keccak256(abi.encodePacked(certificates[_certificateId].certificateHash)) ==
               keccak256(abi.encodePacked(_hash));
    }

    /**
     * @dev Revoke a certificate.
     */
    function revokeCertificate(string memory _certificateId) public onlyAdmin {
        require(certificates[_certificateId].exists, "Certificate does not exist");
        require(certificates[_certificateId].isValid, "Certificate already revoked");

        certificates[_certificateId].isValid = false;
        emit CertificateRevoked(_certificateId);
    }

    /**
     * @dev Transfer admin rights.
     */
    function transferAdmin(address _newAdmin) public onlyAdmin {
        require(_newAdmin != address(0), "Invalid address");
        emit AdminTransferred(admin, _newAdmin);
        admin = _newAdmin;
    }

    /**
     * @dev Get total number of issued certificates.
     */
    function getTotalCertificates() public view returns (uint256) {
        return totalCertificates;
    }
}
