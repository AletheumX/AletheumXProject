// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./interfaces/IReviewVerifier.sol";
import "./interfaces/IEigenLayerAVS.sol";

/**
 * @title ZkSyncReviewChain
 * @dev Sistema de reseñas verificadas en blockchain con integración zkSync
 */
contract ZkSyncReviewChain is AccessControl, ReentrancyGuard {
    using ECDSA for bytes32;
    using Counters for Counters.Counter;

    // Roles
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    bytes32 public constant BUSINESS_MANAGER_ROLE = keccak256("BUSINESS_MANAGER_ROLE");
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    
    // Estructuras de datos
    struct Business {
        uint256 id;
        address owner;
        string name;
        string metadata;
        bool isActive;
        uint256 registrationDate;
        uint256 verificationLevel;
    }

    struct Review {
        bytes32 id;
        uint256 businessId;
        address reviewer;
        uint8 rating;
        string content;
        uint256 timestamp;
        bytes signature;
        VerificationStatus status;
        bytes32 verificationDataHash;
        bool isZkSyncVerified;
    }

    struct VerificationData {
        uint256 confidenceScore;
        uint256 validatorCount;
        bool eigenLayerVerified;
        bool walletVerified;
        uint256 walletAge;
        uint256 walletTxCount;
        uint256 verificationTimestamp;
        bool zkSyncVerified;
        bytes32 zkProof;
    }

    enum VerificationStatus {
        Unverified,
        Pending,
        Verified,
        Rejected
    }

    // Contadores
    Counters.Counter private _businessIdCounter;
    
    // Mappings
    mapping(uint256 => Business) public businesses;
    mapping(bytes32 => Review) public reviews;
    mapping(bytes32 => VerificationData) public verificationData;
    mapping(uint256 => bytes32[]) public businessReviews;
    mapping(address => bytes32[]) public userReviews;
    mapping(address => uint256) public userReviewCount;
    mapping(address => mapping(uint256 => bool)) public hasReviewed;
    
    // Integraciones externas
    IReviewVerifier public reviewVerifier;
    IEigenLayerAVS public eigenLayerAVS;
    
    // Eventos
    event BusinessRegistered(uint256 indexed businessId, address indexed owner, string name);
    event BusinessUpdated(uint256 indexed businessId, string name, string metadata);
    event BusinessVerificationLevelChanged(uint256 indexed businessId, uint256 level);
    event ReviewSubmitted(bytes32 indexed reviewId, uint256 indexed businessId, address indexed reviewer, uint8 rating);
    event ReviewVerificationRequested(bytes32 indexed reviewId, address reviewer);
    event ReviewVerificationUpdated(bytes32 indexed reviewId, VerificationStatus status, uint256 confidenceScore);
    event ZkSyncVerificationCompleted(bytes32 indexed reviewId, bool success, bytes32 zkProof);
    event VerifierUpdated(address indexed verifier);
    event EigenLayerAVSUpdated(address indexed avs);
    
    constructor(address _reviewVerifier, address _eigenLayerAVS) {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(BUSINESS_MANAGER_ROLE, msg.sender);
        _setupRole(VERIFIER_ROLE, msg.sender);
        
        reviewVerifier = IReviewVerifier(_reviewVerifier);
        eigenLayerAVS = IEigenLayerAVS(_eigenLayerAVS);
        
        _businessIdCounter.increment();
    }

    /**
     * @dev Actualiza el estado de verificación de una reseña con soporte zkSync
     * @param reviewId ID de la reseña
     * @param status Nuevo estado
     * @param _verificationData Datos de verificación
     */
    function updateVerificationStatus(
        bytes32 reviewId,
        VerificationStatus status,
        VerificationData calldata _verificationData
    ) 
        external 
        nonReentrant 
        onlyRole(VERIFIER_ROLE)
    {
        require(reviews[reviewId].id != bytes32(0), "Review does not exist");
        
        // Actualizar datos de verificación
        verificationData[reviewId] = _verificationData;
        
        // Actualizar estado de la reseña
        reviews[reviewId].status = status;
        reviews[reviewId].isZkSyncVerified = _verificationData.zkSyncVerified;
        
        emit ReviewVerificationUpdated(reviewId, status, _verificationData.confidenceScore);
        
        if (_verificationData.zkSyncVerified) {
            emit ZkSyncVerificationCompleted(reviewId, true, _verificationData.zkProof);
        }
    }

    /**
     * @dev Obtiene los detalles de verificación de una reseña
     * @param reviewId ID de la reseña
     * @return status Estado de verificación
     * @return data Datos de verificación
     */
    function getVerificationDetails(bytes32 reviewId) 
        external 
        view 
        returns (VerificationStatus status, VerificationData memory data) 
    {
        return (reviews[reviewId].status, verificationData[reviewId]);
    }
} 