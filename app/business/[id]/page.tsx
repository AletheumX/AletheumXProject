"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Star, StarHalf, MapPin, Calendar, ArrowLeft, Shield, Info } from "lucide-react"
import Link from "next/link"
import { ConnectWalletButton } from "@/components/connect-wallet-button"
import { ReviewForm } from "@/components/review-form"
import { useWallet } from "@/context/wallet-context"
import { useToast } from "@/components/ui/use-toast"
import { VerificationBadge } from "@/components/verification-badge"
import { VerificationDetails } from "@/components/verification-details"
import { EigenVerificationBadge } from "@/components/eigen-verification-badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import type { ReviewVerification, VerificationResult } from "@/services/verification-service"

export default function BusinessPage({ params }: { params: { id: string } }) {
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [hasReviewed, setHasReviewed] = useState(false)
  const [userReview, setUserReview] = useState<ReviewVerification | null>(null)
  const [selectedReview, setSelectedReview] = useState<{
    review: any
    verification: VerificationResult
  } | null>(null)
  const { isConnected, address, chainId } = useWallet()
  const { toast } = useToast()
  const [verificationDialogOpen, setVerificationDialogOpen] = useState(false)

  // Datos de ejemplo para el negocio
  const business = {
    id: Number.parseInt(params.id),
    name: "Café Blockchain",
    description:
      "Cafetería especializada con ambiente acogedor y productos de alta calidad. Ofrecemos una variedad de cafés de especialidad, tés orgánicos y pasteles artesanales.",
    location: "Calle Innovación 123, Ciudad Crypto",
    category: "Restaurantes",
    rating: 4.5,
    reviewCount: 28,
    openHours: "Lun-Vie: 8:00 - 20:00, Sáb-Dom: 9:00 - 21:00",
    website: "https://cafeblockchain.com",
    phone: "+1 234 567 890",
    contractAddress: "0x1a2b3c4d5e6f7g8h9i0j",
  }

  // Datos de ejemplo para las reseñas con verificación
  const reviews = [
    {
      id: 1,
      walletAddress: "0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t",
      rating: 5,
      text: "Excelente servicio y ambiente. El café es de primera calidad y el personal muy amable. Definitivamente volveré.",
      date: "2023-04-15",
      verification: {
        status: "verified" as const,
        message: "Verificado en blockchain. La reseña es auténtica.",
        timestamp: Date.now() - 3600000 * 24 * 30,
        transactionHash: "0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t",
        blockNumber: 12345678,
        eigenLayerVerified: true,
        eigenConfidenceScore: 0.92,
        eigenValidatorCount: 5,
        eigenQuorumReached: true,
        walletInfo: {
          firstTransactionDate: new Date(Date.now() - 3600000 * 24 * 365), // 1 año atrás
          ageInDays: 365,
          isOldEnough: true,
          transactionCount: 48,
        },
        walletVerification: {
          isValid: true,
          confidenceScore: 0.95,
          message: "Wallet verificada con 365 días de antigüedad.",
        },
      },
    },
    {
      id: 2,
      walletAddress: "0x5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x",
      rating: 4,
      text: "Muy buen lugar para trabajar o estudiar. Buena conexión WiFi y enchufes disponibles. El café podría ser un poco más fuerte.",
      date: "2023-03-22",
      verification: {
        status: "verified" as const,
        message: "Verificado en blockchain. La reseña es auténtica.",
        timestamp: Date.now() - 3600000 * 24 * 45,
        transactionHash: "0x5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x",
        blockNumber: 12340123,
        eigenLayerVerified: true,
        eigenConfidenceScore: 0.78,
        eigenValidatorCount: 4,
        eigenQuorumReached: true,
        walletInfo: {
          firstTransactionDate: new Date(Date.now() - 3600000 * 24 * 180), // 6 meses atrás
          ageInDays: 180,
          isOldEnough: true,
          transactionCount: 25,
        },
        walletVerification: {
          isValid: true,
          confidenceScore: 0.82,
          message: "Wallet verificada con 180 días de antigüedad.",
        },
      },
    },
    {
      id: 3,
      walletAddress: "0x9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c",
      rating: 5,
      text: "Los pasteles son increíbles, especialmente el de zanahoria. Precios razonables para la calidad que ofrecen.",
      date: "2023-02-10",
      verification: {
        status: "pending" as const,
        message: "Verificación en proceso. Esperando confirmaciones en la blockchain.",
        timestamp: Date.now() - 3600000 * 2,
        eigenLayerVerified: false,
        eigenConfidenceScore: 0.5,
        eigenValidatorCount: 2,
        eigenQuorumReached: false,
        walletInfo: {
          firstTransactionDate: new Date(Date.now() - 3600000 * 24 * 20), // 20 días atrás
          ageInDays: 20,
          isOldEnough: false,
          transactionCount: 5,
        },
        walletVerification: {
          isValid: true,
          confidenceScore: 0.4,
          message: "Wallet verificada, pero es relativamente nueva.",
        },
      },
    },
    {
      id: 4,
      walletAddress: "0xd1e2f3g4h5i6j7k8l9m0n1o2p3q4r5s6t7u8v9w",
      rating: 2,
      text: "Servicio lento y precios altos.",
      date: "2023-01-05",
      verification: {
        status: "rejected" as const,
        message: "La reseña no cumple con los requisitos mínimos de contenido.",
        timestamp: Date.now() - 3600000 * 24 * 60,
        walletInfo: {
          firstTransactionDate: new Date(Date.now() - 3600000 * 24 * 10), // 10 días atrás
          ageInDays: 10,
          isOldEnough: false,
          transactionCount: 2,
        },
        walletVerification: {
          isValid: false,
          confidenceScore: 0.2,
          message: "La información de la wallet no coincide con nuestros registros en el AVS.",
        },
      },
    },
  ]

  // Comprobar si el usuario ya ha escrito una reseña para este negocio
  useEffect(() => {
    if (isConnected && address) {
      // Aquí normalmente consultaríamos a la blockchain para ver si el usuario ya ha escrito una reseña
      // Por ahora, simulamos que no ha escrito una reseña
      setHasReviewed(false)
      setUserReview(null)
    }
  }, [isConnected, address])

  const handleSubmitReview = (reviewData: ReviewVerification) => {
    setShowReviewForm(false)
    setHasReviewed(true)
    setUserReview(reviewData)

    toast({
      title: "Reseña enviada",
      description: "Tu reseña ha sido procesada y su estado de verificación ha sido actualizado.",
    })
  }

  const openVerificationDetails = (review: any) => {
    setSelectedReview({
      review,
      verification: review.verification,
    })
    setVerificationDialogOpen(true)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/" className="inline-flex items-center text-sm mb-6 hover:underline">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Volver a la página principal
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <Badge className="mb-2">{business.category}</Badge>
                  <CardTitle className="text-3xl">{business.name}</CardTitle>
                  <CardDescription className="text-lg mt-2">{business.description}</CardDescription>
                </div>
                {!isConnected ? (
                  <ConnectWalletButton />
                ) : hasReviewed ? (
                  <VerificationBadge
                    status={userReview?.verification?.status || "unverified"}
                    message={userReview?.verification?.message}
                  />
                ) : (
                  <Button onClick={() => setShowReviewForm(true)} disabled={showReviewForm}>
                    Escribir Reseña
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center mb-4">
                <RatingStars rating={business.rating} />
                <span className="font-medium ml-2">{business.rating}</span>
                <span className="text-muted-foreground ml-1">({business.reviewCount} reseñas)</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-start">
                  <MapPin className="w-5 h-5 mr-2 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="font-medium">Ubicación</div>
                    <div className="text-muted-foreground">{business.location}</div>
                  </div>
                </div>
                <div className="flex items-start">
                  <Calendar className="w-5 h-5 mr-2 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="font-medium">Horario</div>
                    <div className="text-muted-foreground">{business.openHours}</div>
                  </div>
                </div>
              </div>

              {showReviewForm && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-4">Escribe tu reseña</h3>
                  <ReviewForm
                    onSubmit={handleSubmitReview}
                    onCancel={() => setShowReviewForm(false)}
                    businessId={business.id}
                  />
                </div>
              )}

              <Separator className="my-6" />

              <div>
                <h3 className="text-lg font-medium mb-4">Reseñas de usuarios</h3>
                <div className="space-y-6">
                  {userReview && (
                    <div className="border rounded-lg p-4 bg-slate-50 dark:bg-slate-900">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center">
                          <div className="font-medium mr-2">Tu reseña</div>
                          <VerificationBadge
                            status={userReview.verification?.status || "unverified"}
                            message={userReview.verification?.message}
                            size="sm"
                          />
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(userReview.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center mb-2">
                        <RatingStars rating={userReview.rating} />
                      </div>
                      <p className="text-sm">{userReview.reviewText}</p>
                      <div className="mt-3 flex justify-between items-center">
                        <div className="flex items-center">
                          {userReview.verification?.eigenLayerVerified &&
                            userReview.verification?.eigenConfidenceScore && (
                              <EigenVerificationBadge
                                confidenceScore={userReview.verification.eigenConfidenceScore}
                                quorumReached={userReview.verification.eigenQuorumReached || false}
                                validatorCount={userReview.verification.eigenValidatorCount || 0}
                                walletInfo={userReview.verification.walletInfo}
                                walletVerification={userReview.verification.walletVerification}
                                className="mr-2"
                              />
                            )}
                        </div>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="flex items-center gap-1">
                              <Shield className="w-3 h-3" />
                              <span>Detalles de verificación</span>
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Verificación de reseña</DialogTitle>
                              <DialogDescription>
                                Detalles sobre la verificación de tu reseña en la blockchain
                              </DialogDescription>
                            </DialogHeader>
                            {userReview.verification && (
                              <VerificationDetails
                                verification={userReview.verification}
                                reviewerAddress={userReview.reviewerAddress}
                                chainId={chainId}
                              />
                            )}
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  )}

                  {reviews.map((review) => (
                    <div key={review.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center">
                          <div className="font-medium mr-2 truncate max-w-[150px] md:max-w-[250px]">
                            {review.walletAddress.substring(0, 6)}...
                            {review.walletAddress.substring(review.walletAddress.length - 4)}
                          </div>
                          <VerificationBadge
                            status={review.verification.status}
                            message={review.verification.message}
                            size="sm"
                          />
                        </div>
                        <div className="text-sm text-muted-foreground">{review.date}</div>
                      </div>
                      <div className="flex items-center mb-2">
                        <RatingStars rating={review.rating} />
                      </div>
                      <p className="text-sm">{review.text}</p>
                      <div className="mt-3 flex justify-between items-center">
                        <div className="flex items-center">
                          {review.verification.eigenLayerVerified && review.verification.eigenConfidenceScore && (
                            <EigenVerificationBadge
                              confidenceScore={review.verification.eigenConfidenceScore}
                              quorumReached={review.verification.eigenQuorumReached || false}
                              validatorCount={review.verification.eigenValidatorCount || 0}
                              walletInfo={review.verification.walletInfo}
                              walletVerification={review.verification.walletVerification}
                              className="mr-2"
                            />
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex items-center gap-1"
                          onClick={() => openVerificationDetails(review)}
                        >
                          <Info className="w-3 h-3" />
                          <span>Ver verificación</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Información de contacto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="font-medium">Sitio web</div>
                <a
                  href={business.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {business.website}
                </a>
              </div>
              <div>
                <div className="font-medium">Teléfono</div>
                <div>{business.phone}</div>
              </div>
              <div>
                <div className="font-medium">Dirección</div>
                <div>{business.location}</div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">
                Ver en mapa
              </Button>
            </CardFooter>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Verificación blockchain</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Todas las reseñas en Aletheum X están verificadas mediante tecnología blockchain, garantizando su
                autenticidad y transparencia.
              </p>
              <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3 text-xs font-mono">
                <div className="mb-1">Contract: {business.contractAddress}</div>
                <div>Total Reviews: {business.reviewCount}</div>
              </div>

              <div className="mt-4 space-y-2">
                <h4 className="text-sm font-medium">Niveles de verificación:</h4>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <VerificationBadge status="verified" showTooltip={false} size="sm" />
                    <span className="text-xs">Reseña verificada en blockchain</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <VerificationBadge status="pending" showTooltip={false} size="sm" />
                    <span className="text-xs">Verificación en proceso</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <VerificationBadge status="rejected" showTooltip={false} size="sm" />
                    <span className="text-xs">No cumple requisitos de verificación</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <VerificationBadge status="unverified" showTooltip={false} size="sm" />
                    <span className="text-xs">Sin verificación</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Diálogo para mostrar detalles de verificación de reseñas existentes */}
      <Dialog open={verificationDialogOpen} onOpenChange={setVerificationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verificación de reseña</DialogTitle>
            <DialogDescription>Detalles sobre la verificación de esta reseña en la blockchain</DialogDescription>
          </DialogHeader>
          {selectedReview && (
            <VerificationDetails
              verification={selectedReview.verification}
              reviewerAddress={selectedReview.review.walletAddress}
              chainId={chainId}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function RatingStars({ rating }: { rating: number }) {
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 >= 0.5

  return (
    <div className="flex">
      {[...Array(fullStars)].map((_, i) => (
        <Star key={`star-${i}`} className="w-4 h-4 fill-[#8C00FF] text-[#8C00FF]" />
      ))}
      {hasHalfStar && <StarHalf className="w-4 h-4 fill-[#8C00FF] text-[#8C00FF]" />}
      {[...Array(5 - fullStars - (hasHalfStar ? 1 : 0))].map((_, i) => (
        <Star key={`empty-star-${i}`} className="w-4 h-4 text-gray-600" />
      ))}
    </div>
  )
}
