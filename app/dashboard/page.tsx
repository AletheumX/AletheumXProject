"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Star, StarHalf, ArrowLeft, Award, History, User } from "lucide-react"
import Link from "next/link"
import { useWallet } from "@/context/wallet-context"
import { ConnectWalletButton } from "@/components/connect-wallet-button"

export default function DashboardPage() {
  const { isConnected, shortAddress, address } = useWallet()

  // Datos de ejemplo para el usuario
  const user = {
    reputation: 78,
    reviewCount: 12,
    joinedDate: "Enero 2023",
    level: "Verificador Confiable",
  }

  // Datos de ejemplo para las reseñas del usuario
  const userReviews = [
    {
      id: 1,
      businessName: "Café Blockchain",
      businessId: 1,
      rating: 5,
      text: "Excelente servicio y ambiente. El café es de primera calidad y el personal muy amable. Definitivamente volveré.",
      date: "15 Abril, 2023",
      verified: true,
    },
    {
      id: 2,
      businessName: "Tech Solutions",
      businessId: 2,
      rating: 4,
      text: "Buen servicio técnico, resolvieron mi problema rápidamente. Precios un poco elevados.",
      date: "22 Marzo, 2023",
      verified: true,
    },
    {
      id: 3,
      businessName: "Crypto Market",
      businessId: 3,
      rating: 5,
      text: "Productos frescos y de calidad. El personal es muy amable y conocedor.",
      date: "10 Febrero, 2023",
      verified: true,
    },
  ]

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">Conecta tu wallet para ver tu dashboard</h1>
        <p className="text-muted-foreground mb-8">Necesitas conectar tu wallet para acceder a tu perfil y reseñas.</p>
        <ConnectWalletButton />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/" className="inline-flex items-center text-sm mb-6 hover:underline">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Volver a la página principal
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Perfil de Usuario</CardTitle>
              <CardDescription>Información de tu wallet y reputación</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                  <User className="w-10 h-10 text-slate-500" />
                </div>
                <div className="font-medium">{shortAddress}</div>
                <div className="text-sm text-muted-foreground">Miembro desde {user.joinedDate}</div>
              </div>

              <Separator />

              <div>
                <div className="flex justify-between mb-2">
                  <div className="font-medium">Reputación</div>
                  <div>{user.reputation}/100</div>
                </div>
                <Progress value={user.reputation} className="h-2" />
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 text-center">
                <Award className="w-8 h-8 mx-auto mb-2 text-primary" />
                <div className="font-medium">{user.level}</div>
                <div className="text-sm text-muted-foreground">Nivel de confianza</div>
              </div>

              <div className="text-sm">
                <div className="flex justify-between py-2">
                  <div>Total de reseñas</div>
                  <div className="font-medium">{user.reviewCount}</div>
                </div>
                <div className="flex justify-between py-2">
                  <div>Reseñas verificadas</div>
                  <div className="font-medium">{user.reviewCount}</div>
                </div>
                <div className="flex justify-between py-2">
                  <div>Calificación promedio</div>
                  <div className="font-medium">4.7/5</div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" onClick={() => navigator.clipboard.writeText(address || "")}>
                Copiar dirección completa
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Tabs defaultValue="reviews">
            <TabsList className="mb-6">
              <TabsTrigger value="reviews">Mis Reseñas</TabsTrigger>
              <TabsTrigger value="activity">Actividad</TabsTrigger>
              <TabsTrigger value="reputation">Reputación</TabsTrigger>
            </TabsList>

            <TabsContent value="reviews">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Historial de Reseñas</CardTitle>
                    <History className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <CardDescription>Has escrito {user.reviewCount} reseñas verificadas</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {userReviews.map((review) => (
                      <div key={review.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <Link href={`/business/${review.businessId}`} className="font-medium hover:underline">
                            {review.businessName}
                          </Link>
                          <div className="text-sm text-muted-foreground">{review.date}</div>
                        </div>
                        <div className="flex items-center mb-2">
                          <RatingStars rating={review.rating} />
                        </div>
                        <p className="text-sm">{review.text}</p>
                        <div className="mt-3 flex justify-between items-center">
                          <div className="text-xs text-muted-foreground">TX: 0x1a2b...3c4d</div>
                          <Button variant="ghost" size="sm">
                            Editar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity">
              <Card>
                <CardHeader>
                  <CardTitle>Actividad Reciente</CardTitle>
                  <CardDescription>Historial de acciones en la plataforma</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                      <div>
                        <div className="font-medium">Escribiste una reseña para Café Blockchain</div>
                        <div className="text-sm text-muted-foreground">15 Abril, 2023 - 14:32</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                      <div>
                        <div className="font-medium">Escribiste una reseña para Tech Solutions</div>
                        <div className="text-sm text-muted-foreground">22 Marzo, 2023 - 10:15</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                      <div>
                        <div className="font-medium">Conectaste tu wallet por primera vez</div>
                        <div className="text-sm text-muted-foreground">15 Enero, 2023 - 09:45</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reputation">
              <Card>
                <CardHeader>
                  <CardTitle>Sistema de Reputación</CardTitle>
                  <CardDescription>Cómo se calcula tu nivel de confianza</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-medium mb-2">Tu puntuación actual: {user.reputation}/100</h3>
                      <Progress value={user.reputation} className="h-2 mb-4" />
                      <p className="text-sm text-muted-foreground">
                        Tu reputación se basa en tu actividad en la plataforma, la calidad de tus reseñas y la
                        verificación de tu wallet.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border rounded-lg p-4">
                        <h4 className="font-medium mb-2">Factores positivos</h4>
                        <ul className="text-sm space-y-2">
                          <li className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            Reseñas verificadas en blockchain
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            Consistencia en calificaciones
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            Antigüedad de la wallet
                          </li>
                        </ul>
                      </div>

                      <div className="border rounded-lg p-4">
                        <h4 className="font-medium mb-2">Factores negativos</h4>
                        <ul className="text-sm space-y-2">
                          <li className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-red-500"></div>
                            Reseñas reportadas
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-red-500"></div>
                            Calificaciones extremas sin justificación
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-red-500"></div>
                            Inactividad prolongada
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

function RatingStars({ rating }: { rating: number }) {
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 >= 0.5

  return (
    <div className="flex">
      {[...Array(fullStars)].map((_, i) => (
        <Star key={`star-${i}`} className="w-4 h-4 fill-primary text-primary" />
      ))}
      {hasHalfStar && <StarHalf className="w-4 h-4 fill-primary text-primary" />}
      {[...Array(5 - fullStars - (hasHalfStar ? 1 : 0))].map((_, i) => (
        <Star key={`empty-star-${i}`} className="w-4 h-4 text-muted-foreground" />
      ))}
    </div>
  )
}
