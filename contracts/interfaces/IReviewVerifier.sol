// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/**
 * @title IReviewVerifier
 * @dev Interfaz para el verificador de reseñas
 */
interface IReviewVerifier {
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
    ) external;
}
