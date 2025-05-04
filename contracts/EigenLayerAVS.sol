// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./interfaces/IEigenLayerAVS.sol";
import "./interfaces/IEigenLayerServiceManager.sol";

/**
 * @title EigenLayerAVS
 * @dev Servicio de Validación Activa para EigenLayer que verifica reseñas
 */
contract EigenLayerAVS is IEigenLayerAVS, AccessControl, ReentrancyGuard {
    // Roles
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    
    // Interfaz para el contrato ReviewChain
    interface IReviewChain {
        enum VerificationStatus {
            Unverified,
            Pending,
            Verified,
            Rejected
        }
        
        struct VerificationData {
            uint256 confidenceScore;
            uint256 validatorCount;
            bool eigenLayerVerified;
            bool walletVerified;
            uint256 walletAge;
            uint256 walletTxCount;
            uint256 verificationTimestamp;
        }
        
        function getVerificationDetails(bytes32 reviewId) 
            external 
            view 
            returns (VerificationStatus status, VerificationData memory data);
            
        function updateVerificationStatus(
            bytes32 reviewId,
            VerificationStatus status,
            VerificationData calldata verificationData
        ) external;
    }
    
    // Estructura para almacenar verificaciones de operadores
    struct OperatorVerification {
        bool hasVerified;
        uint256 confidenceScore;
        uint256 timestamp;
    }
    
    // Estructura para almacenar verificaciones de reseñas
    struct ReviewVerification {
        uint256 totalConfidenceScore;
        uint256 operatorCount;
        bool quorumReached;
        bool isVerified;
        uint256 timestamp;
        mapping(address => OperatorVerification) operatorVerifications;
    }
    
    // Dirección del contrato ReviewChain
    address public reviewChainAddress;
    
    // Dirección del contrato ServiceManager de EigenLayer
    IEigenLayerServiceManager public eigenLayerServiceManager;
    
    // Número mínimo de operadores para alcanzar quórum
    uint256 public quorumThreshold = 3;
    
    // Puntuación mínima de confianza para verificación (70%)
    uint256 public minConfidenceScore = 7000;
    
    // Mapeo de verificaciones por ID de reseña
    mapping(bytes32 => ReviewVerification) private reviewVerifications;
    
    // Eventos
    event VerificationRequested(bytes32 indexed reviewId);
    event OperatorVerified(bytes32 indexed reviewId, address indexed operator, uint256 confidenceScore);
    event VerificationCompleted(bytes32 indexed reviewId, bool success, uint256 confidenceScore, uint256 operatorCount);
    event QuorumThresholdUpdated(uint256 threshold);
    event MinConfidenceScoreUpdated(uint256 score);
    
    /**
     * @dev Constructor
     * @param _reviewChainAddress Dirección del contrato ReviewChain
     * @param _eigenLayerServiceManager Dirección del ServiceManager de EigenLayer
     */
    constructor(address _reviewChainAddress, address _eigenLayerServiceManager) {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(OPERATOR_ROLE, msg.sender);
        
        reviewChainAddress = _reviewChainAddress;
        eigenLayerServiceManager = IEigenLayerServiceManager(_eigenLayerServiceManager);
    }
    
    /**
     * @dev Actualiza la dirección del contrato ReviewChain
     * @param _reviewChainAddress Nueva dirección
     */
    function setReviewChainAddress(address _reviewChainAddress) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        reviewChainAddress = _reviewChainAddress;
    }
    
    /**
     * @dev Actualiza la dirección del ServiceManager de EigenLayer
     * @param _eigenLayerServiceManager Nueva dirección
     */
    function setEigenLayerServiceManager(address _eigenLayerServiceManager) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        eigenLayerServiceManager = IEigenLayerServiceManager(_eigenLayerServiceManager);
    }
    
    /**
     * @dev Actualiza el umbral de quórum
     * @param _quorumThreshold Nuevo umbral
     */
    function setQuorumThreshold(uint256 _quorumThreshold) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        require(_quorumThreshold > 0, "Quorum threshold must be greater than 0");
        quorumThreshold = _quorumThreshold;
        
        emit QuorumThresholdUpdated(_quorumThreshold);
    }
    
    /**
     * @dev Actualiza la puntuación mínima de confianza
     * @param _minConfidenceScore Nueva puntuación (0-10000)
     */
    function setMinConfidenceScore(uint256 _minConfidenceScore) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        require(_minConfidenceScore <= 10000, "Min confidence score must be <= 10000");
        minConfidenceScore = _minConfidenceScore;
        
        emit MinConfidenceScoreUpdated(_minConfidenceScore);
    }
    
    /**
     * @dev Solicita verificación a EigenLayer
     * @param reviewId ID de la reseña
     * @param businessId ID del negocio
     * @param reviewer Dirección del revisor
     * @param rating Calificación
     * @param content Contenido de la reseña
     * @param timestamp Timestamp de la reseña
     */
    function requestVerification(
        bytes32 reviewId,
        uint256 businessId,
        address reviewer,
        uint8 rating,
        string calldata content,
        uint256 timestamp
    ) 
        external 
        override 
        nonReentrant 
    {
        require(msg.sender == reviewChainAddress, "Only ReviewChain can request verification");
        
        // Inicializar estructura de verificación
        ReviewVerification storage verification = reviewVerifications[reviewId];
        verification.timestamp = block.timestamp;
        
        emit VerificationRequested(reviewId);
        
        // En una implementación real, aquí se notificaría a los operadores de EigenLayer
        // a través de eventos o un sistema de mensajería off-chain
    }
    
    /**
     * @dev Permite a un operador de EigenLayer enviar su verificación
     * @param reviewId ID de la reseña
     * @param confidenceScore Puntuación de confianza (0-10000)
     */
    function submitOperatorVerification(bytes32 reviewId, uint256 confidenceScore) 
        external 
        nonReentrant 
    {
        // Verificar que el remitente es un operador registrado en EigenLayer
        require(
            hasRole(OPERATOR_ROLE, msg.sender) || 
            eigenLayerServiceManager.isOperatorRegistered(msg.sender),
            "Not a registered operator"
        );
        
        require(confidenceScore <= 10000, "Confidence score must be <= 10000");
        
        ReviewVerification storage verification = reviewVerifications[reviewId];
        require(verification.timestamp > 0, "Verification not requested");
        require(!verification.operatorVerifications[msg.sender].hasVerified, "Operator already verified");
        
        // Registrar verificación del operador
        verification.operatorVerifications[msg.sender] = OperatorVerification({
            hasVerified: true,
            confidenceScore: confidenceScore,
            timestamp: block.timestamp
        });
        
        // Actualizar contadores
        verification.totalConfidenceScore += confidenceScore;
        verification.operatorCount++;
        
        emit OperatorVerified(reviewId, msg.sender, confidenceScore);
        
        // Comprobar si se ha alcanzado el quórum
        if (verification.operatorCount >= quorumThreshold && !verification.quorumReached) {
            verification.quorumReached = true;
            _finalizeVerification(reviewId);
        }
    }
    
    /**
     * @dev Finaliza el proceso de verificación y actualiza el estado en ReviewChain
     * @param reviewId ID de la reseña
     */
    function _finalizeVerification(bytes32 reviewId) internal {
        ReviewVerification storage verification = reviewVerifications[reviewId];
        
        // Calcular puntuación de confianza promedio
        uint256 avgConfidenceScore = verification.totalConfidenceScore / verification.operatorCount;
        
        // Determinar si la verificación es exitosa
        verification.isVerified = avgConfidenceScore >= minConfidenceScore;
        
        // Obtener datos de verificación actuales de ReviewChain
        (IReviewChain.VerificationStatus status, IReviewChain.VerificationData memory data) = 
            IReviewChain(reviewChainAddress).getVerificationDetails(reviewId);
        
        // Actualizar datos de verificación
        data.eigenLayerVerified = verification.isVerified;
        data.confidenceScore = avgConfidenceScore;
        data.validatorCount = verification.operatorCount;
        
        // Determinar estado final
        IReviewChain.VerificationStatus newStatus;
        if (verification.isVerified) {
            newStatus = IReviewChain.VerificationStatus.Verified;
        } else if (status == IReviewChain.VerificationStatus.Verified) {
            // Mantener verificado si ya lo estaba por otro verificador
            newStatus = IReviewChain.VerificationStatus.Verified;
        } else {
            newStatus = IReviewChain.VerificationStatus.Rejected;
        }
        
        // Actualizar estado en ReviewChain
        IReviewChain(reviewChainAddress).updateVerificationStatus(reviewId, newStatus, data);
        
        emit VerificationCompleted(
            reviewId, 
            verification.isVerified, 
            avgConfidenceScore, 
            verification.operatorCount
        );
    }
    
    /**
     * @dev Fuerza la finalización de la verificación (para casos donde no se alcanza el quórum)
     * @param reviewId ID de la reseña
     */
    function forceFinalize(bytes32 reviewId) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
        nonReentrant 
    {
        ReviewVerification storage verification = reviewVerifications[reviewId];
        require(verification.timestamp > 0, "Verification not requested");
        require(!verification.quorumReached, "Verification already finalized");
        require(verification.operatorCount > 0, "No operator verifications");
        
        _finalizeVerification(reviewId);
    }
    
    /**
     * @dev Obtiene el estado de verificación de una reseña
     * @param reviewId ID de la reseña
     * @return isVerified Si la reseña está verificada
     * @return confidenceScore Puntuación de confianza
     * @return operatorCount Número de operadores
     * @return quorumReached Si se alcanzó el quórum
     */
    function getVerificationStatus(bytes32 reviewId) 
        external 
        view 
        returns (
            bool isVerified,
            uint256 confidenceScore,
            uint256 operatorCount,
            bool quorumReached
        ) 
    {
        ReviewVerification storage verification = reviewVerifications[reviewId];
        
        if (verification.operatorCount == 0) {
            return (false, 0, 0, false);
        }
        
        uint256 avgConfidenceScore = verification.totalConfidenceScore / verification.operatorCount;
        
        return (
            verification.isVerified,
            avgConfidenceScore,
            verification.operatorCount,
            verification.quorumReached
        );
    }
    
    /**
     * @dev Comprueba si un operador ha verificado una reseña
     * @param reviewId ID de la reseña
     * @param operator Dirección del operador
     * @return hasVerified Si el operador ha verificado
     * @return confidenceScore Puntuación de confianza
     */
    function getOperatorVerification(bytes32 reviewId, address operator) 
        external 
        view 
        returns (bool hasVerified, uint256 confidenceScore) 
    {
        OperatorVerification storage opVerification = 
            reviewVerifications[reviewId].operatorVerifications[operator];
            
        return (opVerification.hasVerified, opVerification.confidenceScore);
    }
}
