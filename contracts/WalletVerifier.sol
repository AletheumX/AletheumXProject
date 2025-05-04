// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@chainlink/contracts/src/v0.8/ChainlinkClient.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title WalletVerifier
 * @dev Contrato para verificar información de wallets utilizando Chainlink y The Graph
 */
contract WalletVerifier is ChainlinkClient, AccessControl, ReentrancyGuard {
    using Chainlink for Chainlink.Request;
    
    // Roles
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    
    // Estructura para almacenar información de wallets
    struct WalletInfo {
        uint256 firstTxTimestamp;
        uint256 txCount;
        uint256 ethBalance;
        uint256 lastUpdateTimestamp;
        bool isVerified;
        uint256 confidenceScore; // 0-10000 (0-100.00%)
    }
    
    // Variables de Chainlink
    address private oracle;
    bytes32 private jobId;
    uint256 private fee;
    
    // Mapeo de información de wallets
    mapping(address => WalletInfo) public walletInfo;
    
    // Mapeo para rastrear solicitudes de Chainlink
    mapping(bytes32 => address) private requestToWallet;
    
    // Eventos
    event WalletVerificationRequested(address indexed wallet, bytes32 indexed requestId);
    event WalletVerificationFulfilled(
        address indexed wallet, 
        bool success, 
        uint256 firstTxTimestamp, 
        uint256 txCount, 
        uint256 confidenceScore
    );
    event WalletInfoUpdated(
        address indexed wallet, 
        uint256 firstTxTimestamp, 
        uint256 txCount, 
        uint256 confidenceScore
    );
    event OracleUpdated(address indexed oracle, bytes32 indexed jobId, uint256 fee);
    
    /**
     * @dev Constructor
     * @param _link Dirección del token LINK
     * @param _oracle Dirección del oráculo de Chainlink
     * @param _jobId ID del trabajo de Chainlink
     * @param _fee Tarifa en LINK para las solicitudes
     */
    constructor(
        address _link,
        address _oracle,
        bytes32 _jobId,
        uint256 _fee
    ) {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(OPERATOR_ROLE, msg.sender);
        _setupRole(ORACLE_ROLE, msg.sender);
        
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
     * @dev Solicita verificación para una wallet
     * @param wallet Dirección de la wallet
     * @return requestId ID de la solicitud
     */
    function requestWalletVerification(address wallet) 
        external 
        nonReentrant 
        returns (bytes32 requestId) 
    {
        // Crear solicitud de Chainlink
        Chainlink.Request memory request = buildChainlinkRequest(
            jobId,
            address(this),
            this.fulfillWalletVerification.selector
        );
        
        // Añadir parámetros a la solicitud
        request.add("wallet", addressToString(wallet));
        
        // Enviar solicitud a Chainlink
        requestId = sendChainlinkRequestTo(oracle, request, fee);
        
        // Almacenar mapeo de solicitud a wallet
        requestToWallet[requestId] = wallet;
        
        emit WalletVerificationRequested(wallet, requestId);
        
        return requestId;
    }
    
    /**
     * @dev Callback de Chainlink para recibir el resultado de la verificación
     * @param _requestId ID de la solicitud
     * @param _success Si la verificación fue exitosa
     * @param _firstTxTimestamp Timestamp de la primera transacción
     * @param _txCount Número de transacciones
     * @param _ethBalance Balance de ETH
     * @param _confidenceScore Puntuación de confianza (0-10000)
     */
    function fulfillWalletVerification(
        bytes32 _requestId,
        bool _success,
        uint256 _firstTxTimestamp,
        uint256 _txCount,
        uint256 _ethBalance,
        uint256 _confidenceScore
    ) 
        external 
        recordChainlinkFulfillment(_requestId) 
    {
        address wallet = requestToWallet[_requestId];
        require(wallet != address(0), "Unknown request ID");
        
        if (_success) {
            // Actualizar información de la wallet
            walletInfo[wallet] = WalletInfo({
                firstTxTimestamp: _firstTxTimestamp,
                txCount: _txCount,
                ethBalance: _ethBalance,
                lastUpdateTimestamp: block.timestamp,
                isVerified: true,
                confidenceScore: _confidenceScore
            });
        }
        
        emit WalletVerificationFulfilled(
            wallet, 
            _success, 
            _firstTxTimestamp, 
            _txCount, 
            _confidenceScore
        );
    }
    
    /**
     * @dev Permite a un operador actualizar manualmente la información de una wallet
     * @param wallet Dirección de la wallet
     * @param firstTxTimestamp Timestamp de la primera transacción
     * @param txCount Número de transacciones
     * @param ethBalance Balance de ETH
     * @param confidenceScore Puntuación de confianza (0-10000)
     */
    function manualUpdateWalletInfo(
        address wallet,
        uint256 firstTxTimestamp,
        uint256 txCount,
        uint256 ethBalance,
        uint256 confidenceScore
    ) 
        external 
        onlyRole(OPERATOR_ROLE) 
        nonReentrant 
    {
        require(confidenceScore <= 10000, "Confidence score must be <= 10000");
        
        // Actualizar información de la wallet
        walletInfo[wallet] = WalletInfo({
            firstTxTimestamp: firstTxTimestamp,
            txCount: txCount,
            ethBalance: ethBalance,
            lastUpdateTimestamp: block.timestamp,
            isVerified: true,
            confidenceScore: confidenceScore
        });
        
        emit WalletInfoUpdated(wallet, firstTxTimestamp, txCount, confidenceScore);
    }
    
    /**
     * @dev Obtiene la información de una wallet
     * @param wallet Dirección de la wallet
     * @return info Información de la wallet
     */
    function getWalletInfo(address wallet) 
        external 
        view 
        returns (WalletInfo memory info) 
    {
        return walletInfo[wallet];
    }
    
    /**
     * @dev Comprueba si una wallet es lo suficientemente antigua
     * @param wallet Dirección de la wallet
     * @param minAgeInDays Antigüedad mínima en días
     * @return isOldEnough Si la wallet es lo suficientemente antigua
     */
    function isWalletOldEnough(address wallet, uint256 minAgeInDays) 
        external 
        view 
        returns (bool isOldEnough) 
    {
        WalletInfo storage info = walletInfo[wallet];
        
        if (!info.isVerified) {
            return false;
        }
        
        uint256 ageInSeconds = block.timestamp - info.firstTxTimestamp;
        uint256 ageInDays = ageInSeconds / 86400; // 86400 segundos = 1 día
        
        return ageInDays >= minAgeInDays;
    }
    
    /**
     * @dev Comprueba si una wallet tiene suficientes transacciones
     * @param wallet Dirección de la wallet
     * @param minTxCount Número mínimo de transacciones
     * @return hasEnoughTx Si la wallet tiene suficientes transacciones
     */
    function hasEnoughTransactions(address wallet, uint256 minTxCount) 
        external 
        view 
        returns (bool hasEnoughTx) 
    {
        WalletInfo storage info = walletInfo[wallet];
        
        if (!info.isVerified) {
            return false;
        }
        
        return info.txCount >= minTxCount;
    }
    
    /**
     * @dev Convierte una dirección a string
     * @param _addr Dirección a convertir
     * @return Representación en string
     */
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
}
