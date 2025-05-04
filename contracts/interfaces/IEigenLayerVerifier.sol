// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/**
 * @title IEigenLayerVerifier
 * @dev Interfaz para el verificador de EigenLayer
 */
interface IEigenLayerVerifier {
    /**
     * @dev Solicita verificación a EigenLayer
     * @param reviewId ID de la reseña a verificar
     */
    function requestVerification(bytes32 reviewId) external;
}
