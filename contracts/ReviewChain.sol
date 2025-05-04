// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./interfaces/IReviewVerifier.sol";
import "./interfaces/IEigenLayerAVS.sol";

/**
 * @title ReviewChain
 * @dev Sistema de reseñas verificadas en blockchain con integraciones reales
 */
contract ReviewChain is AccessControl, ReentrancyGuard {
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
        uint256 verificationLevel; // 0: no verificado, 1: básico, 2: premium
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
    }

    struct VerificationData {
        uint256 confidenceScore; // 0-10000 (0-100.00%)
        uint256 validatorCount;
        bool eigenLayerVerified;
        bool walletVerified;
        uint256 walletAge; // en días
        uint256 walletTxCount;
        uint256 verificationTimestamp;
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
    mapping(address => mapping(uint256 => bool)) public hasReviewed; // usuario -> negocioId -> ha reseñado
    
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
    event VerifierUpdated(address indexed verifier);
    event EigenLayerAVSUpdated(address indexed avs);
    
    /**
     * @dev Constructor
     * @param _reviewVerifier Dirección del contrato verificador
     * @param _eigenLayerAVS Dirección del AVS de EigenLayer
     */
    constructor(address _reviewVerifier, address _eigenLayerAVS) {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(BUSINESS_MANAGER_ROLE, msg.sender);
        _setupRole(VERIFIER_ROLE, msg.sender);
        
        reviewVerifier = IReviewVerifier(_reviewVerifier);
        eigenLayerAVS = IEigenLayerAVS(_eigenLayerAVS);
        
        // Iniciar el contador de negocios en 1
        _businessIdCounter.increment();
    }
    
    /**
     * @dev Actualiza la dirección del verificador
     * @param _reviewVerifier Nueva dirección del verificador
     */
    function setReviewVerifier(address _reviewVerifier) external onlyRole(DEFAULT_ADMIN_ROLE) {
        reviewVerifier = IReviewVerifier(_reviewVerifier);
        emit VerifierUpdated(_reviewVerifier);
    }
    
    /**
     * @dev Actualiza la dirección del AVS de EigenLayer
     * @param _eigenLayerAVS Nueva dirección del AVS
     */
    function setEigenLayerAVS(address _eigenLayerAVS) external onlyRole(DEFAULT_ADMIN_ROLE) {
        eigenLayerAVS = IEigenLayerAVS(_eigenLayerAVS);
        emit EigenLayerAVSUpdated(_eigenLayerAVS);
    }
    
    /**
     * @dev Registra un nuevo negocio
     * @param name Nombre del negocio
     * @param metadata Metadatos del negocio (JSON)
     * @return businessId ID del negocio registrado
     */
    function registerBusiness(string calldata name, string calldata metadata) 
        external 
        nonReentrant 
        returns (uint256 businessId) 
    {
        businessId = _businessIdCounter.current();
        _businessIdCounter.increment();
        
        businesses[businessId] = Business({
            id: businessId,
            owner: msg.sender,
            name: name,
            metadata: metadata,
            isActive: true,
            registrationDate: block.timestamp,
            verificationLevel: 0 // No verificado por defecto
        });
        
        emit BusinessRegistered(businessId, msg.sender, name);
    }
    
    /**
     * @dev Actualiza la información de un negocio
     * @param businessId ID del negocio
     * @param name Nuevo nombre
     * @param metadata Nuevos metadatos
     */
    function updateBusiness(uint256 businessId, string calldata name, string calldata metadata) 
        external 
        nonReentrant 
    {
        Business storage business = businesses[businessId];
        require(business.owner == msg.sender || hasRole(BUSINESS_MANAGER_ROLE, msg.sender), "Not authorized");
        require(business.isActive, "Business is not active");
        
        business.name = name;
        business.metadata = metadata;
        
        emit BusinessUpdated(businessId, name, metadata);
    }
    
    /**
     * @dev Cambia el nivel de verificación de un negocio
     * @param businessId ID del negocio
     * @param level Nuevo nivel de verificación
     */
    function setBusinessVerificationLevel(uint256 businessId, uint256 level) 
        external 
        onlyRole(BUSINESS_MANAGER_ROLE) 
    {
        require(level <= 2, "Invalid verification level");
        require(businesses[businessId].id == businessId, "Business does not exist");
        
        businesses[businessId].verificationLevel = level;
        
        emit BusinessVerificationLevelChanged(businessId, level);
    }
    
    /**
     * @dev Envía una nueva reseña
     * @param businessId ID del negocio
     * @param rating Calificación (1-5)
     * @param content Contenido de la reseña
     * @param signature Firma digital de la reseña
     * @return reviewId ID de la reseña
     */
    function submitReview(
        uint256 businessId,
        uint8 rating,
        string calldata content,
        bytes calldata signature
    ) 
        external 
        nonReentrant 
        returns (bytes32 reviewId) 
    {
        require(businesses[businessId].isActive, "Business is not active");
        require(rating >= 1 && rating <= 5, "Rating must be between 1 and 5");
        require(!hasReviewed[msg.sender][businessId], "User has already reviewed this business");
        
        // Crear mensaje para verificar firma
        string memory message = string(abi.encodePacked(
            "Aletheum X Verification\n\nBusiness: ", _toString(businessId),
            "\nRating: ", _toString(rating),
            "\nReview: ", content,
            "\nTimestamp: ", _toString(block.timestamp)
        ));
        
        // Verificar firma
        bytes32 messageHash = keccak256(bytes(message));
        bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();
        address signer = ethSignedMessageHash.recover(signature);
        
        require(signer == msg.sender, "Invalid signature");
        
        // Generar ID único para la reseña
        reviewId = keccak256(abi.encodePacked(msg.sender, businessId, block.timestamp, content));
        
        // Almacenar la reseña
        reviews[reviewId] = Review({
            id: reviewId,
            businessId: businessId,
            reviewer: msg.sender,
            rating: rating,
            content: content,
            timestamp: block.timestamp,
            signature: signature,
            status: VerificationStatus.Pending,
            verificationDataHash: bytes32(0)
        });
        
        // Actualizar índices
        businessReviews[businessId].push(reviewId);
        userReviews[msg.sender].push(reviewId);
        userReviewCount[msg.sender]++;
        hasReviewed[msg.sender][businessId] = true;
        
        // Solicitar verificación
        _requestVerification(reviewId);
        
        emit ReviewSubmitted(reviewId, businessId, msg.sender, rating);
        
        return reviewId;
    }
    
    /**
     * @dev Solicita verificación para una reseña
     * @param reviewId ID de la reseña
     */
    function _requestVerification(bytes32 reviewId) internal {
        Review storage review = reviews[reviewId];
        
        // Solicitar verificación al verificador externo
        reviewVerifier.requestVerification(
            reviewId,
            review.businessId,
            review.reviewer,
            review.rating,
            review.content,
            review.timestamp,
            review.signature
        );
        
        // Solicitar verificación a EigenLayer AVS si está configurado
        if (address(eigenLayerAVS) != address(0)) {
            eigenLayerAVS.requestVerification(
                reviewId,
                review.businessId,
                review.reviewer,
                review.rating,
                review.content,
                review.timestamp
            );
        }
        
        emit ReviewVerificationRequested(reviewId, review.reviewer);
    }
    
    /**
     * @dev Actualiza el estado de verificación de una reseña (llamado por oráculos/verificadores)
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
    {
        require(hasRole(VERIFIER_ROLE, msg.sender) || hasRole(ORACLE_ROLE, msg.sender), "Not authorized");
        require(reviews[reviewId].id == reviewId, "Review does not exist");
        
        Review storage review = reviews[reviewId];
        
        // Actualizar estado
        review.status = status;
        
        // Almacenar datos de verificación
        verificationData[reviewId] = _verificationData;
        
        // Calcular y almacenar hash de los datos de verificación para referencia en la cadena
        review.verificationDataHash = keccak256(abi.encode(_verificationData));
        
        emit ReviewVerificationUpdated(reviewId, status, _verificationData.confidenceScore);
    }
    
    /**
     * @dev Obtiene las reseñas de un negocio
     * @param businessId ID del negocio
     * @param offset Desplazamiento para paginación
     * @param limit Límite de resultados
     * @return reviewIds Array de IDs de reseñas
     */
    function getBusinessReviews(uint256 businessId, uint256 offset, uint256 limit) 
        external 
        view 
        returns (bytes32[] memory reviewIds) 
    {
        bytes32[] storage allReviews = businessReviews[businessId];
        uint256 totalReviews = allReviews.length;
        
        if (offset >= totalReviews) {
            return new bytes32[](0);
        }
        
        uint256 resultCount = (offset + limit > totalReviews) ? totalReviews - offset : limit;
        reviewIds = new bytes32[](resultCount);
        
        for (uint256 i = 0; i < resultCount; i++) {
            reviewIds[i] = allReviews[offset + i];
        }
        
        return reviewIds;
    }
    
    /**
     * @dev Obtiene las reseñas de un usuario
     * @param user Dirección del usuario
     * @param offset Desplazamiento para paginación
     * @param limit Límite de resultados
     * @return reviewIds Array de IDs de reseñas
     */
    function getUserReviews(address user, uint256 offset, uint256 limit) 
        external 
        view 
        returns (bytes32[] memory reviewIds) 
    {
        bytes32[] storage allReviews = userReviews[user];
        uint256 totalReviews = allReviews.length;
        
        if (offset >= totalReviews) {
            return new bytes32[](0);
        }
        
        uint256 resultCount = (offset + limit > totalReviews) ? totalReviews - offset : limit;
        reviewIds = new bytes32[](resultCount);
        
        for (uint256 i = 0; i < resultCount; i++) {
            reviewIds[i] = allReviews[offset + i];
        }
        
        return reviewIds;
    }
    
    /**
     * @dev Obtiene los detalles completos de verificación de una reseña
     * @param reviewId ID de la reseña
     * @return status Estado de verificación
     * @return data Datos de verificación
     */
    function getVerificationDetails(bytes32 reviewId) 
        external 
        view 
        returns (VerificationStatus status, VerificationData memory data) 
    {
        require(reviews[reviewId].id == reviewId, "Review does not exist");
        
        return (reviews[reviewId].status, verificationData[reviewId]);
    }
    
    /**
     * @dev Obtiene la calificación promedio de un negocio
     * @param businessId ID del negocio
     * @return avgRating Calificación promedio
     * @return totalRatings Número total de calificaciones
     * @return verifiedRatings Número de calificaciones verificadas
     */
    function getBusinessRating(uint256 businessId) 
        external 
        view 
        returns (uint8 avgRating, uint256 totalRatings, uint256 verifiedRatings) 
    {
        bytes32[] storage reviewIds = businessReviews[businessId];
        totalRatings = reviewIds.length;
        
        if (totalRatings == 0) {
            return (0, 0, 0);
        }
        
        uint256 sum = 0;
        verifiedRatings = 0;
        
        for (uint256 i = 0; i < totalRatings; i++) {
            Review storage review = reviews[reviewIds[i]];
            if (review.status == VerificationStatus.Verified) {
                sum += review.rating;
                verifiedRatings++;
            }
        }
        
        if (verifiedRatings == 0) {
            return (0, totalRatings, 0);
        }
        
        avgRating = uint8(sum / verifiedRatings);
        return (avgRating, totalRatings, verifiedRatings);
    }
    
    /**
     * @dev Convierte un uint a string
     * @param value Valor a convertir
     * @return Representación en string
     */
    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        
        uint256 temp = value;
        uint256 digits;
        
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        
        bytes memory buffer = new bytes(digits);
        
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        
        return string(buffer);
    }
}
