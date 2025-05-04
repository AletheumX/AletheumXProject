import { ethers } from "ethers"
import { EigenVerificationService } from "./eigen-verification-service"

// Tipos para el sistema de verificación
export type VerificationStatus = "verified" | "pending" | "rejected" | "unverified"

// Añadir propiedades relacionadas con EigenLayer y la verificación de wallet
export interface VerificationResult {
  status: VerificationStatus
  message: string
  timestamp: number
  transactionHash?: string
  blockNumber?: number
  eigenLayerVerified?: boolean
  eigenConfidenceScore?: number
  eigenValidatorCount?: number
  eigenQuorumReached?: boolean
  walletInfo?: {
    firstTransactionDate: Date | null
    ageInDays: number | null
    isOldEnough: boolean
    transactionCount: number
  }
  walletVerification?: {
    isValid: boolean
    confidenceScore: number
    message: string
  }
}

export interface ReviewVerification {
  reviewId: string | number
  businessId: string | number
  reviewerAddress: string
  rating: number
  reviewText: string
  timestamp: number
  signature?: string
  verification?: VerificationResult
}

// Servicio de verificación
export const VerificationService = {
  // Genera un mensaje para firmar basado en los datos de la reseña
  generateReviewMessage: (review: Omit<ReviewVerification, "signature" | "verification">): string => {
    return `Aletheum X Verification\n\nBusiness: ${review.businessId}\nRating: ${review.rating}\nReview: ${review.reviewText}\nTimestamp: ${review.timestamp}`
  },

  // Firma una reseña con la wallet del usuario
  signReview: async (review: Omit<ReviewVerification, "signature" | "verification">): Promise<string | null> => {
    try {
      if (!window.ethereum) {
        throw new Error("MetaMask no está instalado")
      }

      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()

      // Verificar que la dirección del firmante coincide con la dirección de la reseña
      if (signer.address.toLowerCase() !== review.reviewerAddress.toLowerCase()) {
        throw new Error("La dirección de la wallet no coincide con la dirección de la reseña")
      }

      // Generar el mensaje a firmar
      const message = VerificationService.generateReviewMessage(review)

      // Firmar el mensaje
      const signature = await signer.signMessage(message)
      return signature
    } catch (error) {
      console.error("Error al firmar la reseña:", error)
      return null
    }
  },

  // Verifica la firma de una reseña
  verifySignature: (review: ReviewVerification): boolean => {
    try {
      if (!review.signature) return false

      const message = VerificationService.generateReviewMessage({
        reviewId: review.reviewId,
        businessId: review.businessId,
        reviewerAddress: review.reviewerAddress,
        rating: review.rating,
        reviewText: review.reviewText,
        timestamp: review.timestamp,
      })

      // Recuperar la dirección que firmó el mensaje
      const recoveredAddress = ethers.verifyMessage(message, review.signature)

      // Verificar que la dirección recuperada coincide con la dirección de la reseña
      return recoveredAddress.toLowerCase() === review.reviewerAddress.toLowerCase()
    } catch (error) {
      console.error("Error al verificar la firma:", error)
      return false
    }
  },

  // Simula la verificación en blockchain con la nueva funcionalidad de verificación de wallet
  verifyOnBlockchain: async (review: ReviewVerification): Promise<VerificationResult> => {
    // Simulamos una llamada a la blockchain
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Primero verificamos la firma
    const isSignatureValid = VerificationService.verifySignature(review)
    if (!isSignatureValid) {
      return {
        status: "rejected",
        message: "La firma digital no es válida",
        timestamp: Date.now(),
      }
    }

    // Simulamos diferentes resultados de verificación basados en criterios
    // En un entorno real, esto consultaría el estado en la blockchain

    // Simulamos que las reseñas con rating 3 están pendientes
    if (review.rating === 3) {
      return {
        status: "pending",
        message: "Verificación en proceso. Esperando confirmaciones en la blockchain.",
        timestamp: Date.now(),
      }
    }

    // Simulamos que las reseñas con texto muy corto son rechazadas
    if (review.reviewText.length < 20) {
      return {
        status: "rejected",
        message: "La reseña no cumple con los requisitos mínimos de contenido.",
        timestamp: Date.now(),
      }
    }

    // Para el resto, realizamos la verificación completa con EigenLayer y verificación de wallet
    try {
      // 1. Verificar con EigenLayer
      const eigenResult = await EigenVerificationService.verifyReviewWithEigenLayer(review)

      // 2. Si tenemos información de la wallet, validarla con el AVS
      let walletVerification = undefined
      if (eigenResult.walletInfo) {
        walletVerification = await EigenVerificationService.validateWalletInfoWithAVS(
          review.reviewerAddress,
          eigenResult.walletInfo,
        )
      }

      // 3. Ajustar el puntaje de confianza basado en la verificación de la wallet
      let finalConfidenceScore = eigenResult.confidenceScore
      if (walletVerification) {
        // Promediamos los puntajes de confianza, dando más peso al resultado de EigenLayer
        finalConfidenceScore = eigenResult.confidenceScore * 0.7 + walletVerification.confidenceScore * 0.3
      }

      // 4. Determinar el mensaje final
      let finalMessage = "Verificado en blockchain y validado por EigenLayer."
      if (walletVerification) {
        if (eigenResult.walletInfo?.isOldEnough) {
          finalMessage += ` Wallet verificada con ${eigenResult.walletInfo.ageInDays} días de antigüedad.`
        } else {
          finalMessage += " Wallet verificada, pero es relativamente nueva."
        }
      }

      // Integrar los resultados en la respuesta
      return {
        status: "verified",
        message: finalMessage,
        timestamp: Date.now(),
        transactionHash: `0x${Math.random().toString(16).substring(2, 42)}`,
        blockNumber: Math.floor(Math.random() * 1000000),
        eigenLayerVerified: eigenResult.isVerified,
        eigenConfidenceScore: finalConfidenceScore,
        eigenValidatorCount: eigenResult.validatorSignatures.length,
        eigenQuorumReached: eigenResult.quorumReached,
        walletInfo: eigenResult.walletInfo,
        walletVerification,
      }
    } catch (error) {
      console.error("Error en verificación EigenLayer:", error)

      // Fallback a verificación estándar si EigenLayer falla
      return {
        status: "verified",
        message: "Verificado en blockchain. La verificación EigenLayer no está disponible.",
        timestamp: Date.now(),
        transactionHash: `0x${Math.random().toString(16).substring(2, 42)}`,
        blockNumber: Math.floor(Math.random() * 1000000),
      }
    }
  },

  // Verifica si un usuario ha interactuado con un negocio (simulado)
  verifyUserInteraction: async (userAddress: string, businessId: string | number): Promise<boolean> => {
    // En un entorno real, esto consultaría a un contrato inteligente o una API
    // que verifique si el usuario ha interactuado con el negocio (por ejemplo, mediante un token NFT)
    await new Promise((resolve) => setTimeout(resolve, 800))

    // Simulamos que los usuarios con dirección que termina en números pares han interactuado
    const lastChar = userAddress.slice(-1)
    const lastDigit = Number.parseInt(lastChar, 16)
    return lastDigit % 2 === 0
  },
}
