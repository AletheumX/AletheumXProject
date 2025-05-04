"use client"

import React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Star } from "lucide-react"
import { useWallet } from "@/context/wallet-context"
import { VerificationService, type ReviewVerification } from "@/services/verification-service"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { InfoIcon } from "lucide-react"

interface ReviewFormProps {
  onSubmit: (reviewData: ReviewVerification) => void
  onCancel: () => void
  businessId: string | number
}

export function ReviewForm({ onSubmit, onCancel, businessId }: ReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [reviewText, setReviewText] = useState("")
  const [hoveredRating, setHoveredRating] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasInteracted, setHasInteracted] = useState<boolean | null>(null)
  const [isCheckingInteraction, setIsCheckingInteraction] = useState(false)
  const { isConnected, address } = useWallet()
  const { toast } = useToast()

  // Verificar si el usuario ha interactuado con el negocio
  const checkUserInteraction = async () => {
    if (!address) return

    setIsCheckingInteraction(true)
    try {
      const hasInteracted = await VerificationService.verifyUserInteraction(address, businessId)
      setHasInteracted(hasInteracted)

      if (!hasInteracted) {
        toast({
          title: "Advertencia",
          description:
            "No hemos podido verificar que hayas interactuado con este negocio. Tu reseña tendrá un nivel de confianza menor.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error al verificar interacción:", error)
      setHasInteracted(false)
    } finally {
      setIsCheckingInteraction(false)
    }
  }

  // Verificar interacción cuando se conecta la wallet
  React.useEffect(() => {
    if (isConnected && address && hasInteracted === null) {
      checkUserInteraction()
    }
  }, [isConnected, address])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isConnected || !address) {
      toast({
        title: "Error",
        description: "Debes conectar tu wallet para enviar una reseña",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Crear objeto de reseña
      const reviewData: Omit<ReviewVerification, "signature" | "verification"> = {
        reviewId: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        businessId,
        reviewerAddress: address,
        rating,
        reviewText,
        timestamp: Date.now(),
      }

      // Firmar la reseña
      const signature = await VerificationService.signReview(reviewData)

      if (!signature) {
        throw new Error("No se pudo firmar la reseña")
      }

      // Añadir firma a los datos
      const signedReview: ReviewVerification = {
        ...reviewData,
        signature,
      }

      // Verificar en blockchain (simulado)
      const verification = await VerificationService.verifyOnBlockchain(signedReview)

      // Añadir resultado de verificación
      const verifiedReview: ReviewVerification = {
        ...signedReview,
        verification,
      }

      // Notificar resultado
      toast({
        title:
          verification.status === "verified"
            ? "Reseña verificada"
            : verification.status === "pending"
              ? "Reseña pendiente de verificación"
              : "Reseña no verificada",
        description: verification.message,
        variant: verification.status === "verified" ? "default" : "destructive",
      })

      // Enviar datos completos
      onSubmit(verifiedReview)
    } catch (error: any) {
      console.error("Error al enviar la reseña:", error)
      toast({
        title: "Error al enviar la reseña",
        description: error.message || "Hubo un error al procesar tu reseña. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const isValid = rating > 0 && reviewText.trim().length > 0 && reviewText.length <= 280 && isConnected

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {hasInteracted === false && (
        <Alert
          variant="warning"
          className="bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-400 dark:border-yellow-800"
        >
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>No se ha verificado interacción</AlertTitle>
          <AlertDescription>
            No hemos podido verificar que hayas interactuado con este negocio. Puedes continuar, pero tu reseña tendrá
            un nivel de confianza menor.
          </AlertDescription>
        </Alert>
      )}

      <div>
        <div className="mb-2 font-medium">Tu calificación</div>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="focus:outline-none"
            >
              <Star
                className={`w-8 h-8 ${
                  (hoveredRating ? star <= hoveredRating : star <= rating)
                    ? "fill-primary text-primary"
                    : "text-muted-foreground"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-2 font-medium">Tu reseña</div>
        <Textarea
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          placeholder="Comparte tu experiencia con este negocio..."
          className="min-h-[100px]"
          maxLength={280}
        />
        <div className="mt-1 text-xs text-right text-muted-foreground">{reviewText.length}/280 caracteres</div>
        {reviewText.length < 20 && reviewText.length > 0 && (
          <div className="mt-1 text-xs text-amber-600">
            Las reseñas con menos de 20 caracteres pueden no ser verificadas.
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={!isValid || isSubmitting}>
          {isSubmitting ? "Verificando..." : "Publicar Reseña"}
        </Button>
      </div>

      {!isConnected && (
        <div className="text-sm text-amber-600 mt-2">Debes conectar tu wallet para poder enviar una reseña.</div>
      )}
    </form>
  )
}
