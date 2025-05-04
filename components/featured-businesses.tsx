"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star, StarHalf, Sparkles } from "lucide-react"
import Link from "next/link"
import { BusinessService } from "@/services/business-service"
import { Skeleton } from "@/components/ui/skeleton"

export function FeaturedBusinesses() {
  const [businesses, setBusinesses] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadFeaturedBusinesses = async () => {
      setIsLoading(true)
      try {
        const data = await BusinessService.getFeaturedBusinesses()
        setBusinesses(data)
      } catch (error) {
        console.error("Error al cargar negocios destacados:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadFeaturedBusinesses()
  }, [])

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="h-full">
            <CardHeader>
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-6 w-full mb-2" />
              <Skeleton className="h-4 w-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-32" />
            </CardContent>
            <CardFooter>
              <Skeleton className="h-10 w-full" />
            </CardFooter>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {businesses.map((business) => (
        <Link href={`/business/${business.id}`} key={business.id} className="block">
          <Card className="h-full transition-all hover:shadow-md border-[#8C00FF] dark:border-[#8C00FF] relative overflow-hidden bg-gray-900">
            <div className="absolute top-0 right-0">
              <div className="bg-[#8C00FF] text-white text-xs px-2 py-1 rounded-bl-md flex items-center">
                <Sparkles className="w-3 h-3 mr-1" />
                Destacado
              </div>
            </div>
            <CardHeader className="flex flex-row items-start gap-3">
              {business.logoUrl && (
                <div className="w-12 h-12 rounded-md overflow-hidden flex-shrink-0">
                  <img
                    src={business.logoUrl || "/placeholder.svg"}
                    alt={`${business.name} logo`}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div>
                <div className="text-sm text-muted-foreground">{business.category}</div>
                <CardTitle>{business.name}</CardTitle>
                <CardDescription>{business.description}</CardDescription>
              </div>
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
