// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title AuditLog
 * @dev Immutable compliance audit trail for RegShield AML Engine
 */
contract AuditLog {
    
    struct Audit {
        string auditHash;      // SHA-256 hash of compliance decision
        uint8 riskScore;       // Risk score (0-255)
        uint256 timestamp;     // Block timestamp
        address auditor;       // Address that logged the audit
    }
    
    Audit[] public audits;
    
    event AuditStored(
        uint256 indexed auditId,
        string auditHash,
        uint8 riskScore,
        uint256 timestamp,
        address auditor
    );
    
    /**
     * @dev Store a new compliance audit on the blockchain
     * @param auditHash The SHA-256 hash of the audit data
     * @param riskScore The calculated risk score (0-100+)
     */
    function storeAudit(string memory auditHash, uint8 riskScore) public {
        audits.push(Audit({
            auditHash: auditHash,
            riskScore: riskScore,
            timestamp: block.timestamp,
            auditor: msg.sender
        }));
        
        emit AuditStored(
            audits.length - 1,
            auditHash,
            riskScore,
            block.timestamp,
            msg.sender
        );
    }
    
    /**
     * @dev Get the total number of audits
     */
    function getAuditCount() public view returns (uint256) {
        return audits.length;
    }
    
    /**
     * @dev Retrieve a specific audit by ID
     */
    function getAudit(uint256 auditId) public view returns (
        string memory auditHash,
        uint8 riskScore,
        uint256 timestamp,
        address auditor
    ) {
        require(auditId < audits.length, "Audit ID does not exist");
        Audit memory audit = audits[auditId];
        return (audit.auditHash, audit.riskScore, audit.timestamp, audit.auditor);
    }
}
