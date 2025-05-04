// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/**
 * @title IEigenLayerAVS
 * @dev Interfaz para el AVS de EigenLayer
 */
interface IEigenLayerAVS {
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
    ) external;
}
