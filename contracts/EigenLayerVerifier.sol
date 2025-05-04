// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./interfaces/IEigenLayerVerifier.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title EigenLayerVerifier
 * @dev Contrato para integrar con EigenLayer y verificar reseñas
 */
contract EigenLayerVerifier is IEigenLayerVerifier, Ownable {
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
    
    // Estructura para almacenar información de verificación de EigenLayer
    struct EigenVerification {
        bool isVerified;
        uint8 validatorCount;
        bool quorumReached;
        uint256 confidenceScore; // 0-1000 (0-100.0%)
        uint256 timestamp;
        address[] validators;
    }
    
    // Mapeo de verificaciones por ID de reseña
    mapping(bytes32 => EigenVerification) public eigenVerifications;
    
    // Mapeo de operadores de EigenLayer autorizados
    mapping(address => bool) public authorizedOperators;
    
    // Eventos
    event VerificationRequested(bytes32 indexed reviewId, address indexed reviewer);
    event OperatorVerified(bytes32 indexed reviewId, address indexed operator, uint256 confidenceScore);
    event VerificationCompleted(
        bytes32 indexed reviewId, 
        bool success, 
        uint256 confidenceScore, 
        uint8 validatorCount, 
        bool quorumReached
    );
    
    // Modificadores
    modifier onlyAuthorizedOperator() {
        require(authorizedOperators[msg.sender] || msg.sender == owner(), "Not authorized operator");
        _;
    }
    
    /**
     * @dev Constructor del contrato
     * @param _reviewChainAddress Dirección del contrato ReviewChain
     */
    constructor(address _reviewChainAddress) {
        reviewChainAddress = _reviewChainAddress;
        authorizedOperators[msg.sender] = true;
    }
    
    /**
     * @dev Actualiza la dirección del contrato ReviewChain
     * @param _reviewChainAddress Nueva dirección
     */
    function setReviewChainAddress(address _reviewChainAddress) external onlyOwner {
        reviewChainAddress = _reviewChainAddress;
    }
    
    /**
     * @dev Añade o elimina un operador autorizado
     * @param operator Dirección del operador
     * @param isAuthorized Estado de autorización
     */
    function setOperatorAuthorization(address operator, bool isAuthorized) external onlyOwner {
        authorizedOperators[operator] = isAuthorized;
    }
    
    /**
     * @dev Solicita verificación a EigenLayer
     * @param reviewId ID de la reseña
     */
    function requestVerification(bytes32 reviewId) external override {
        require(msg.sender == reviewChainAddress, "Only ReviewChain can request verification");
        
        IReviewChain reviewChain = IReviewChain(reviewChainAddress);
        
        // Obtener datos de la reseña
        (
            ,
            ,
            address reviewer,
            ,
            ,
            ,
            ,
            ,
            
        ) = reviewChain.reviews(reviewId);
        
        // Inicializar estructura de verificación
        eigenVerifications[reviewId] = EigenVerification({
            isVerified: false,
            validatorCount: 0,
            quorumReached: false,
            confidenceScore: 0,
            timestamp: block.timestamp,
            validators: new address[](0)
        });
        
        emit VerificationRequested(reviewId, reviewer);
        
        // En una implementación real, aquí se notificaría a los operadores de EigenLayer
        // Para esta demo, simulamos el proceso
    }
    
    /**
     * @dev Permite a un operador de EigenLayer enviar su verificación
     * @param reviewId ID de la reseña
     * @param confidenceScore Puntuación de confianza (0-1000)
     */
    function submitOperatorVerification(bytes32 reviewId, uint256 confidenceScore) 
        external 
        onlyAuthorizedOperator 
    {
        require(confidenceScore <= 1000, "Confidence score must be between 0-1000");
        require(eigenVerifications[reviewId].timestamp > 0, "Verification not requested");
        
        EigenVerification storage verification = eigenVerifications[reviewId];
        
        // Verificar que el operador no haya verificado ya
        for (uint256 i = 0; i < verification.validators.length; i++) {
            require(verification.validators[i] != msg.sender, "Operator already verified");
        }
        
        // Añadir operador a la lista de validadores
        verification.validators.push(msg.sender);
        verification.validatorCount++;
        
        // Actualizar puntuación de confianza (promedio)
        if (verification.confidenceScore == 0) {
            verification.confidenceScore = confidenceScore;
        } else {
            verification.confidenceScore = (
                verification.confidenceScore * (verification.validatorCount - 1) + confidenceScore
            ) / verification.validatorCount;
        }
        
        // Comprobar si se ha alcanzado el quórum (3 validadores)
        if (verification.validatorCount >= 3 && !verification.quorumReached) {
            verification.quorumReached = true;
            _finalizeVerification(reviewId);
        }
        
        emit OperatorVerified(reviewId, msg.sender, confidenceScore);
    }
    
    /**
     * @dev Finaliza el proceso de verificación y actualiza el estado en ReviewChain
     * @param reviewId ID de la reseña
     */
    function _finalizeVerification(bytes32 reviewId) internal {
        EigenVerification storage verification = eigenVerifications[reviewId];
        
        // Determinar si la verificación es exitosa (confianza > 70%)
        verification.isVerified = verification.confidenceScore >= 700;
        
        // Crear datos de verificación
        bytes32 verificationData = keccak256(abi.encodePacked(
            "EigenLayer Verification",
            verification.isVerified,
            verification.confidenceScore,
            verification.validatorCount,
            verification.quorumReached,
            block.timestamp
        ));
        
        // Actualizar estado en ReviewChain
        IReviewChain reviewChain = IReviewChain(reviewChainAddress);
        IReviewChain.VerificationStatus status = verification.isVerified 
            ? IReviewChain.VerificationStatus.Verified 
            : IReviewChain.VerificationStatus.Rejected;
        
        reviewChain.updateVerificationStatus(reviewId, status, verificationData);
        
        emit VerificationCompleted(
            reviewId, 
            verification.isVerified, 
            verification.confidenceScore, 
            verification.validatorCount, 
            verification.quorumReached
        );
    }
    
    /**
     * @dev Fuerza la finalización de la verificación (para casos donde no se alcanza el quórum)
     * @param reviewId ID de la reseña
     */
    function forceFinalize(bytes32 reviewId) external onlyOwner {
        require(eigenVerifications[reviewId].timestamp > 0, "Verification not requested");
        require(!eigenVerifications[reviewId].quorumReached, "Verification already finalized");
        
        _finalizeVerification(reviewId);
    }
    
    /**
     * @dev Obtiene los detalles de verificación de EigenLayer
     * @param reviewId ID de la reseña
     * @return isVerified Estado de verificación
     * @return validatorCount Número de validadores
     * @return quorumReached Si se alcanzó el quórum
     * @return confidenceScore Puntuación de confianza
     */
    function getVerificationDetails(bytes32 reviewId) 
        external 
        view 
        returns (
            bool isVerified,
            uint8 validatorCount,
            bool quorumReached,
            uint256 confidenceScore
        ) 
    {
        EigenVerification storage verification = eigenVerifications[reviewId];
        return (
            verification.isVerified,
            verification.validatorCount,
            verification.quorumReached,
            verification.confidenceScore
        );
    }
    
    /**
     * @dev Obtiene la lista de validadores para una reseña
     * @param reviewId ID de la reseña
     * @return Lista de direcciones de validadores
     */
    function getValidators(bytes32 reviewId) external view returns (address[] memory) {
        return eigenVerifications[reviewId].validators;
    }
}
