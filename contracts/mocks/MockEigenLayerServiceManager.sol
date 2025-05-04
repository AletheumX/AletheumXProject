// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IEigenLayerServiceManager.sol";

/**
 * @title MockEigenLayerServiceManager
 * @dev Contrato simulado para EigenLayerServiceManager para pruebas
 */
contract MockEigenLayerServiceManager is IEigenLayerServiceManager, Ownable {
    // Mapeo de operadores registrados
    mapping(address => bool) private registeredOperators;
    
    // Mapeo de stakes de operadores
    mapping(address => uint256) private operatorStakes;
    
    /**
     * @dev Registra un operador en el servicio
     * @param operator Dirección del operador
     */
    function registerOperator(address operator) external override {
        registeredOperators[operator] = true;
    }
    
    /**
     * @dev Desregistra un operador del servicio
     * @param operator Dirección del operador
     */
    function deregisterOperator(address operator) external override {
        registeredOperators[operator] = false;
    }
    
    /**
     * @dev Comprueba si un operador está registrado
     * @param operator Dirección del operador
     * @return Si el operador está registrado
     */
    function isOperatorRegistered(address operator) external view override returns (bool) {
        return registeredOperators[operator];
    }
    
    /**
     * @dev Obtiene la cantidad de ETH apostada por un operador
     * @param operator Dirección del operador
     * @return Cantidad de ETH apostada
     */
    function getOperatorStake(address operator) external view override returns (uint256) {
        return operatorStakes[operator];
    }
    
    /**
     * @dev Establece el stake de un operador (solo para pruebas)
     * @param operator Dirección del operador
     * @param stake Cantidad de stake
     */
    function setOperatorStake(address operator, uint256 stake) external onlyOwner {
        operatorStakes[operator] = stake;
    }
    
    /**
     * @dev Registra múltiples operadores a la vez (solo para pruebas)
     * @param operators Array de direcciones de operadores
     */
    function batchRegisterOperators(address[] calldata operators) external onlyOwner {
        for (uint256 i = 0; i < operators.length; i++) {
            registeredOperators[operators[i]] = true;
        }
    }
}
