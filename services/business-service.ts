// Servicio para manejar operaciones relacionadas con negocios
export const BusinessService = {
  // Registrar un nuevo negocio
  registerBusiness: async (businessData: any): Promise<{ success: boolean; businessId: string }> => {
    // En una implementación real, esto enviaría los datos a una API o blockchain
    // Para este ejemplo, simulamos un registro exitoso
    await new Promise((resolve) => setTimeout(resolve, 1500)) // Simular delay de red

    // Simular un ID de negocio
    const businessId = `biz_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

    // Simular éxito o fallo (95% de éxito)
    const success = Math.random() > 0.05

    if (!success) {
      throw new Error("Error al registrar el negocio. Por favor, inténtalo de nuevo.")
    }

    // En una implementación real, aquí se guardarían los datos en una base de datos
    // y se registraría el negocio en la blockchain
    console.log("Negocio registrado:", businessData)

    return {
      success: true,
      businessId,
    }
  },

  // Obtener negocios destacados
  getFeaturedBusinesses: async (): Promise<any[]> => {
    // En una implementación real, esto consultaría los negocios destacados de una API o blockchain
    // Para este ejemplo, devolvemos datos de ejemplo
    await new Promise((resolve) => setTimeout(resolve, 800)) // Simular delay de red

    return [
      {
        id: "biz_1",
        name: "Café Blockchain",
        description: "Cafetería especializada con ambiente acogedor",
        rating: 4.5,
        reviewCount: 28,
        category: "Restaurantes",
        featured: true,
        logoUrl: "/placeholder.svg?height=80&width=80",
      },
      {
        id: "biz_2",
        name: "Tech Solutions",
        description: "Servicios de reparación y soporte técnico",
        rating: 4.2,
        reviewCount: 42,
        category: "Servicios",
        featured: true,
        logoUrl: "/placeholder.svg?height=80&width=80",
      },
      {
        id: "biz_3",
        name: "Crypto Market",
        description: "Tienda de productos orgánicos y locales",
        rating: 4.8,
        reviewCount: 56,
        category: "Tiendas",
        featured: true,
        logoUrl: "/placeholder.svg?height=80&width=80",
      },
    ]
  },
}
