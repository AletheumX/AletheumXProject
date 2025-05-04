import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Star, StarHalf, Building2, Sparkles } from "lucide-react"
import Link from "next/link"
import { ConnectWalletButton } from "@/components/connect-wallet-button"
import { FeaturedBusinesses } from "@/components/featured-businesses"

export default function HomePage() {
  // Datos de ejemplo para los negocios
  const businesses = [
    {
      id: 1,
      name: "Café Blockchain",
      description: "Cafetería especializada con ambiente acogedor",
      rating: 4.5,
      reviewCount: 28,
      category: "Restaurantes",
    },
    {
      id: 2,
      name: "Tech Solutions",
      description: "Servicios de reparación y soporte técnico",
      rating: 4.2,
      reviewCount: 42,
      category: "Servicios",
    },
    {
      id: 3,
      name: "Crypto Market",
      description: "Tienda de productos orgánicos y locales",
      rating: 4.8,
      reviewCount: 56,
      category: "Tiendas",
    },
    {
      id: 4,
      name: "Digital Gym",
      description: "Centro de fitness con entrenadores especializados",
      rating: 3.9,
      reviewCount: 31,
      category: "Salud",
    },
    {
      id: 5,
      name: "Web3 Academy",
      description: "Academia de formación en tecnologías blockchain",
      rating: 4.7,
      reviewCount: 63,
      category: "Educación",
    },
    {
      id: 6,
      name: "NFT Gallery",
      description: "Galería de arte digital y exposiciones",
      rating: 4.3,
      reviewCount: 19,
      category: "Arte",
    },
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="flex flex-col items-center justify-between gap-4 mb-12 md:flex-row">
        <div className="text-center md:text-center w-full">
          <h1 className="text-6xl font-bold tracking-tight text-[#8C00FF]">Aletheum X</h1>
          <p className="text-xl text-gray-400 mt-2">Reseñas reales, verificadas en blockchain</p>
        </div>
        <div className="flex gap-2 absolute top-4 right-4">
          <ConnectWalletButton />
          <Button
            asChild
            variant="outline"
            className="flex items-center gap-2 border-[#8C00FF] text-[#8C00FF] hover:bg-[#8C00FF]/10"
          >
            <Link href="/register-business">
              <Building2 className="w-4 h-4" />
              <span>Registrar negocio</span>
            </Link>
          </Button>
        </div>
      </header>

      {/* Sección de negocios destacados */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center">
            <Sparkles className="w-5 h-5 mr-2 text-[#8C00FF]" />
            Negocios destacados
          </h2>
          <Button variant="link" asChild className="text-[#8C00FF] hover:text-[#8C00FF]/80">
            <Link href="/register-business">Promociona tu negocio</Link>
          </Button>
        </div>

        <FeaturedBusinesses />
      </section>

      <section className="mb-12">
        <div className="bg-gradient-to-r from-gray-900 to-black border border-gray-800 rounded-xl p-8 text-center">
          <h2 className="text-3xl font-bold mb-4 text-white">Descubre negocios con reseñas verificadas</h2>
          <p className="text-lg text-gray-400 mb-6 max-w-2xl mx-auto">
            Todas las reseñas están vinculadas a wallets digitales, garantizando autenticidad y transparencia.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button variant="outline" className="border-[#8C00FF] text-[#8C00FF] hover:bg-[#8C00FF]/10">
              Restaurantes
            </Button>
            <Button variant="outline" className="border-[#8C00FF] text-[#8C00FF] hover:bg-[#8C00FF]/10">
              Servicios
            </Button>
            <Button variant="outline" className="border-[#8C00FF] text-[#8C00FF] hover:bg-[#8C00FF]/10">
              Tiendas
            </Button>
            <Button variant="outline" className="border-[#8C00FF] text-[#8C00FF] hover:bg-[#8C00FF]/10">
              Salud
            </Button>
            <Button variant="outline" className="border-[#8C00FF] text-[#8C00FF] hover:bg-[#8C00FF]/10">
              Educación
            </Button>
            <Button variant="outline" className="border-[#8C00FF] text-[#8C00FF] hover:bg-[#8C00FF]/10">
              Arte
            </Button>
          </div>
        </div>
      </section>

      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Todos los negocios</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              Más recientes
            </Button>
            <Button variant="outline" size="sm">
              Mejor valorados
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {businesses.map((business) => (
            <Link href={`/business/${business.id}`} key={business.id} className="block">
              <Card className="h-full transition-all hover:shadow-md">
                <CardHeader>
                  <div className="text-sm text-muted-foreground">{business.category}</div>
                  <CardTitle>{business.name}</CardTitle>
                  <CardDescription>{business.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-1">
                    <RatingStars rating={business.rating} />
                    <span className="font-medium ml-2">{business.rating}</span>
                    <span className="text-muted-foreground ml-1">({business.reviewCount} reseñas)</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="ghost" className="w-full">
                    Ver detalles
                  </Button>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      </section>
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
