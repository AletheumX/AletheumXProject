// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./interfaces/IReviewVerifier.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ReviewVerifier
 * @dev Contrato para verificar reseñas según criterios específicos
 */
contract ReviewVerifier is IReviewVerifier, Ownable {
    // Interfaz para el contrato ReviewChain
    interface IReviewChain {
        enum VerificationStatus {
            Unverified,
            Pending,
            Verified,
            Rejected
        }
        
        function reviews(bytes32 reviewId) external view returns (
            bytes32 id,
            uint256 businessId,
            address reviewer,
            uint8 rating,
            string memory content,
            uint256 timestamp,
            bytes memory signature,
            VerificationStatus status,
            bytes32 verificationData
        );
        
        function updateVerificationStatus(
            bytes32 reviewId, 
            VerificationStatus status,
            bytes32 verificationData
        ) external;
    }
    
    // Dirección del contrato ReviewChain
    address public reviewChainAddress;
    
    // Mapeo para rastrear verificadores autorizados
    mapping(address => bool) public authorizedVerifiers;
    
    // Eventos
    event VerificationRequested(bytes32 indexed reviewId);
    event VerificationCompleted(bytes32 indexed reviewId, bool success, bytes32 verificationData);
    
    // Modificadores
    modifier onlyAuthorizedVerifier() {
        require(authorizedVerifiers[msg.sender] || msg.sender == owner(), "Not authorized verifier");
        _;
    }
    
    /**
     * @dev Constructor del contrato
     * @param _reviewChainAddress Dirección del contrato ReviewChain
     */
    constructor(address _reviewChainAddress) {
        reviewChainAddress = _reviewChainAddress;
        authorizedVerifiers[msg.sender] = true;
    }
    
    /**
     * @dev Actualiza la dirección del contrato ReviewChain
     * @param _reviewChainAddress Nueva dirección
     */
    function setReviewChainAddress(address _reviewChainAddress) external onlyOwner {
        reviewChainAddress = _reviewChainAddress;
    }
    
    /**
     * @dev Añade o elimina un verificador autorizado
     * @param verifier Dirección del verificador
     * @param isAuthorized Estado de autorización
     */
    function setVerifierAuthorization(address verifier, bool isAuthorized) external onlyOwner {
        authorizedVerifiers[verifier] = isAuthorized;
    }
    
    /**
     * @dev Inicia el proceso de verificación de una reseña
     * @param reviewId ID de la reseña
     */
    function verifyReview(bytes32 reviewId) external override {
        require(msg.sender == reviewChainAddress, "Only ReviewChain can request verification");
        
        emit VerificationRequested(reviewId);
        
        // En una implementación real, aquí se iniciaría un proceso asíncrono
        // Para esta demo, verificamos inmediatamente
        _processVerification(reviewId);
    }
    
    /**
     * @dev Procesa la verificación de una reseña (simulado)
     * @param reviewId ID de la reseña
     */
    function _processVerification(bytes32 reviewId) internal {
        IReviewChain reviewChain = IReviewChain(reviewChainAddress);
        
        // Obtener datos de la reseña
        (
            ,
            ,
            ,
            uint8 rating,
            string memory content,
            uint256 timestamp,
            ,
            ,
            
        ) = reviewChain.reviews(reviewId);
        
        // Criterios de verificación
        bool isContentValid = bytes(content).length >= 20; // Mínimo 20 caracteres
        bool isRatingValid = rating >= 1 && rating <= 5;
        bool isTimestampValid = timestamp > 0 && timestamp <= block.timestamp;
        
        // Determinar resultado de verificación
        IReviewChain.VerificationStatus status;
        bytes32 verificationData;
        
        if (isContentValid && isRatingValid && isTimestampValid) {
            status = IReviewChain.VerificationStatus.Verified;
            verificationData = keccak256(abi.encodePacked(
                "Verified by ReviewVerifier",
                block.timestamp,
                block.number
            ));
        } else {
            status = IReviewChain.VerificationStatus.Rejected;
            verificationData = keccak256(abi.encodePacked(
                "Rejected: ",
                isContentValid ? "" : "Content too short. ",
                isRatingValid ? "" : "Invalid rating. ",
                isTimestampValid ? "" : "Invalid timestamp."
            ));
        }
        
        // Actualizar estado en ReviewChain
        reviewChain.updateVerificationStatus(reviewId, status, verificationData);
        
        emit VerificationCompleted(reviewId, status == IReviewChain.VerificationStatus.Verified, verificationData);
    }
    
    /**
     * @dev Permite a un verificador autorizado actualizar manualmente el estado de verificación
     * @param reviewId ID de la reseña
     * @param status Nuevo estado de verificación
     * @param verificationData Datos adicionales de verificación
     */
    function manualVerification(
        bytes32 reviewId,
        IReviewChain.VerificationStatus status,
        bytes32 verificationData
    ) 
        external 
        onlyAuthorizedVerifier 
    {
        IReviewChain reviewChain = IReviewChain(reviewChainAddress);
        reviewChain.updateVerificationStatus(reviewId, status, verificationData);
        
        emit VerificationCompleted(
            reviewId, 
            status == IReviewChain.VerificationStatus.Verified, 
            verificationData
        );
    }
}
