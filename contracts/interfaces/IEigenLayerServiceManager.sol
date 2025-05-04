// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/**
 * @title IEigenLayerServiceManager
 * @dev Interfaz para el ServiceManager de EigenLayer
 */
interface IEigenLayerServiceManager {
    /**
     * @dev Registra un operador en el servicio
     * @param operator Dirección del operador
     */
    function registerOperator(address operator) external;
    
    /**
     * @dev Desregistra un operador del servicio
     * @param operator Dirección del operador
     */
    function deregisterOperator(address operator) external;
    
    /**
     * @dev Comprueba si un operador está registrado
     * @param operator Dirección del operador
     * @return Si el operador está registrado
     */
    function isOperatorRegistered(address operator) external view returns (bool);
    
    /**
     * @dev Obtiene la cantidad de ETH apostada por un operador
     * @param operator Dirección del operador
     * @return Cantidad de ETH apostada
     */
    function getOperatorStake(address operator) external view returns (uint256);
}
