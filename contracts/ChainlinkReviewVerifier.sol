// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@chainlink/contracts/src/v0.8/ChainlinkClient.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./interfaces/IReviewVerifier.sol";

/**
 * @title ChainlinkReviewVerifier
 * @dev Verificador de reseñas que utiliza Chainlink para obtener datos externos
 */
contract ChainlinkReviewVerifier is IReviewVerifier, ChainlinkClient, AccessControl, ReentrancyGuard {
    using Chainlink for Chainlink.Request;
    
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
        
        function updateVerificationStatus(
            bytes32 reviewId,
            VerificationStatus status,
            VerificationData calldata verificationData
        ) external;
    }
    
    // Variables de Chainlink
    address private oracle;
    bytes32 private jobId;
    uint256 private fee;
    
    // Dirección del contrato ReviewChain
    address public reviewChainAddress;
    
    // Mapeo para rastrear solicitudes de Chainlink
    mapping(bytes32 => bytes32) private requestToReviewId;
    
    // Eventos
    event VerificationRequested(bytes32 indexed reviewId, bytes32 indexed requestId);
    event VerificationFulfilled(bytes32 indexed reviewId, bool success, uint256 confidenceScore);
    event OracleUpdated(address indexed oracle, bytes32 indexed jobId, uint256 fee);
    
    /**
     * @dev Constructor
     * @param _reviewChainAddress Dirección del contrato ReviewChain
     * @param _link Dirección del token LINK
     * @param _oracle Dirección del oráculo de Chainlink
     * @param _jobId ID del trabajo de Chainlink
     * @param _fee Tarifa en LINK para las solicitudes
     */
    constructor(
        address _reviewChainAddress,
        address _link,
        address _oracle,
        bytes32 _jobId,
        uint256 _fee
    ) {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(OPERATOR_ROLE, msg.sender);
        
        reviewChainAddress = _reviewChainAddress;
        
        // Configurar Chainlink
        setChainlinkToken(_link);
        oracle = _oracle;
        jobId = _jobId;
        fee = _fee;
    }
    
    /**
     * @dev Actualiza la configuración del oráculo
     * @param _oracle Nueva dirección del oráculo
     * @param _jobId Nuevo ID del trabajo
     * @param _fee Nueva tarifa
     */
    function updateOracle(address _oracle, bytes32 _jobId, uint256 _fee) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        oracle = _oracle;
        jobId = _jobId;
        fee = _fee;
        
        emit OracleUpdated(_oracle, _jobId, _fee);
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
     * @dev Solicita verificación para una reseña
     * @param reviewId ID de la reseña
     * @param businessId ID del negocio
     * @param reviewer Dirección del revisor
     * @param rating Calificación
     * @param content Contenido de la reseña
     * @param timestamp Timestamp de la reseña
     * @param signature Firma de la reseña
     */
    function requestVerification(
        bytes32 reviewId,
        uint256 businessId,
        address reviewer,
        uint8 rating,
        string calldata content,
        uint256 timestamp,
        bytes calldata signature
    ) 
        external 
        override 
        nonReentrant 
    {
        require(msg.sender == reviewChainAddress, "Only ReviewChain can request verification");
        
        // Crear solicitud de Chainlink
        Chainlink.Request memory request = buildChainlinkRequest(
            jobId,
            address(this),
            this.fulfillVerification.selector
        );
        
        // Añadir parámetros a la solicitud
        request.add("reviewId", bytes32ToString(reviewId));
        request.add("businessId", uint2str(businessId));
        request.add("reviewer", addressToString(reviewer));
        request.add("rating", uint2str(rating));
        request.add("content", content);
        request.add("timestamp", uint2str(timestamp));
        request.add("signature", bytesToHex(signature));
        
        // Enviar solicitud a Chainlink
        bytes32 requestId = sendChainlinkRequestTo(oracle, request, fee);
        
        // Almacenar mapeo de solicitud a reseña
        requestToReviewId[requestId] = reviewId;
        
        emit VerificationRequested(reviewId, requestId);
    }
    
    /**
     * @dev Callback de Chainlink para recibir el resultado de la verificación
     * @param _requestId ID de la solicitud
     * @param _success Si la verificación fue exitosa
     * @param _confidenceScore Puntuación de confianza (0-10000)
     * @param _walletVerified Si la wallet está verificada
     * @param _walletAge Edad de la wallet en días
     * @param _walletTxCount Número de transacciones de la wallet
     */
    function fulfillVerification(
        bytes32 _requestId,
        bool _success,
        uint256 _confidenceScore,
        bool _walletVerified,
        uint256 _walletAge,
        uint256 _walletTxCount
    ) 
        external 
        recordChainlinkFulfillment(_requestId) 
    {
        bytes32 reviewId = requestToReviewId[_requestId];
        require(reviewId != bytes32(0), "Unknown request ID");
        
        // Determinar estado de verificación
        IReviewChain.VerificationStatus status;
        if (_success) {
            status = IReviewChain.VerificationStatus.Verified;
        } else {
            status = IReviewChain.VerificationStatus.Rejected;
        }
        
        // Crear datos de verificación
        IReviewChain.VerificationData memory data = IReviewChain.VerificationData({
            confidenceScore: _confidenceScore,
            validatorCount: 1, // Chainlink es un validador
            eigenLayerVerified: false, // Esto será actualizado por el AVS de EigenLayer
            walletVerified: _walletVerified,
            walletAge: _walletAge,
            walletTxCount: _walletTxCount,
            verificationTimestamp: block.timestamp
        });
        
        // Actualizar estado en ReviewChain
        IReviewChain(reviewChainAddress).updateVerificationStatus(reviewId, status, data);
        
        emit VerificationFulfilled(reviewId, _success, _confidenceScore);
    }
    
    /**
     * @dev Permite a un operador actualizar manualmente el estado de verificación
     * @param reviewId ID de la reseña
     * @param success Si la verificación fue exitosa
     * @param confidenceScore Puntuación de confianza
     * @param walletVerified Si la wallet está verificada
     * @param walletAge Edad de la wallet
     * @param walletTxCount Número de transacciones de la wallet
     */
    function manualVerification(
        bytes32 reviewId,
        bool success,
        uint256 confidenceScore,
        bool walletVerified,
        uint256 walletAge,
        uint256 walletTxCount
    ) 
        external 
        onlyRole(OPERATOR_ROLE) 
        nonReentrant 
    {
        // Determinar estado de verificación
        IReviewChain.VerificationStatus status;
        if (success) {
            status = IReviewChain.VerificationStatus.Verified;
        } else {
            status = IReviewChain.VerificationStatus.Rejected;
        }
        
        // Crear datos de verificación
        IReviewChain.VerificationData memory data = IReviewChain.VerificationData({
            confidenceScore: confidenceScore,
            validatorCount: 1,
            eigenLayerVerified: false,
            walletVerified: walletVerified,
            walletAge: walletAge,
            walletTxCount: walletTxCount,
            verificationTimestamp: block.timestamp
        });
        
        // Actualizar estado en ReviewChain
        IReviewChain(reviewChainAddress).updateVerificationStatus(reviewId, status, data);
        
        emit VerificationFulfilled(reviewId, success, confidenceScore);
    }
    
    // Funciones auxiliares para convertir tipos
    
    function addressToString(address _addr) internal pure returns (string memory) {
        bytes memory addressBytes = abi.encodePacked(_addr);
        bytes memory stringBytes = new bytes(42);
        
        stringBytes[0] = '0';
        stringBytes[1] = 'x';
        
        for (uint256 i = 0; i < 20; i++) {
            uint8 leftNibble = uint8(addressBytes[i]) >> 4;
            uint8 rightNibble = uint8(addressBytes[i]) & 0xf;
            
            stringBytes[2 + i * 2] = leftNibble < 10 ? 
                bytes1(uint8(leftNibble + 48)) : bytes1(uint8(leftNibble + 87));
            stringBytes[2 + i * 2 + 1] = rightNibble < 10 ? 
                bytes1(uint8(rightNibble + 48)) : bytes1(uint8(rightNibble + 87));
        }
        
        return string(stringBytes);
    }
    
    function bytesToHex(bytes memory data) internal pure returns (string memory) {
        bytes memory hexChars = "0123456789abcdef";
        bytes memory hexString = new bytes(2 + data.length * 2);
        
        hexString[0] = '0';
        hexString[1] = 'x';
        
        for (uint256 i = 0; i < data.length; i++) {
            uint8 value = uint8(data[i]);
            hexString[2 + i * 2] = hexChars[value >> 4];
            hexString[2 + i * 2 + 1] = hexChars[value & 0xf];
        }
        
        return string(hexString);
    }
    
    function bytes32ToString(bytes32 _bytes32) internal pure returns (string memory) {
        bytes memory bytesArray = new bytes(64);
        for (uint256 i = 0; i < 32; i++) {
            bytesArray[i * 2] = bytes1(uint8(uint256(_bytes32) / (2**(8 * (31 - i))) % 16 + 48) + (uint8(uint256(_bytes32) / (2**(8 * (31 - i))) % 16) >= 10 ? 39 : 0));
            bytesArray[i * 2 + 1] = bytes1(uint8(uint256(_bytes32) / (2**(8 * (31 - i) + 4)) % 16 + 48) + (uint8(uint256(_bytes32) / (2**(8 * (31 - i) + 4)) % 16) >= 10 ? 39 : 0));
        }
        return string(bytesArray);
    }
    
    function uint2str(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) {
            return "0";
        }
        
        uint256 temp = _i;
        uint256 digits;
        
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        
        bytes memory buffer = new bytes(digits);
        
        while (_i != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(_i % 10)));
            _i /= 10;
        }
        
        return string(buffer);
    }
}
