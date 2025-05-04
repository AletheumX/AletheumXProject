"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useWallet } from "@/context/wallet-context"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { ArrowLeft, Building2, Clock, MapPin, Phone, Globe, Upload, Info } from "lucide-react"
import Link from "next/link"
import { ConnectWalletButton } from "@/components/connect-wallet-button"
import { PaymentModal } from "@/components/payment-modal"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { BusinessService } from "@/services/business-service"

// Esquema de validación para el formulario
const businessFormSchema = z.object({
  name: z.string().min(3, {
    message: "El nombre debe tener al menos 3 caracteres.",
  }),
  description: z
    .string()
    .min(20, {
      message: "La descripción debe tener al menos 20 caracteres.",
    })
    .max(500, {
      message: "La descripción no puede exceder los 500 caracteres.",
    }),
  category: z.string({
    required_error: "Por favor selecciona una categoría.",
  }),
  location: z.string().min(5, {
    message: "La dirección debe tener al menos 5 caracteres.",
  }),
  openHours: z.string().min(5, {
    message: "El horario debe tener al menos 5 caracteres.",
  }),
  phone: z.string().min(8, {
    message: "El teléfono debe tener al menos 8 caracteres.",
  }),
  website: z
    .string()
    .url({
      message: "Por favor ingresa una URL válida.",
    })
    .optional()
    .or(z.literal("")),
  logoUrl: z.string().optional(),
})

type BusinessFormValues = z.infer<typeof businessFormSchema>

// Categorías de negocios
const businessCategories = [
  { value: "restaurants", label: "Restaurantes" },
  { value: "services", label: "Servicios" },
  { value: "retail", label: "Tiendas" },
  { value: "health", label: "Salud" },
  { value: "education", label: "Educación" },
  { value: "art", label: "Arte" },
  { value: "technology", label: "Tecnología" },
  { value: "finance", label: "Finanzas" },
]

// Planes de promoción
const promotionPlans = [
  {
    id: "basic",
    name: "Básico",
    price: 100,
    duration: "30 días",
    features: ["Listado en la plataforma", "Página de perfil de negocio", "Recibir reseñas verificadas"],
  },
  {
    id: "premium",
    name: "Premium",
    price: 300,
    duration: "30 días",
    features: [
      "Todo lo del plan Básico",
      "Aparición destacada en la página principal",
      "Badge de negocio verificado",
      "Estadísticas de reseñas",
    ],
  },
  {
    id: "enterprise",
    name: "Empresarial",
    price: 800,
    duration: "30 días",
    features: [
      "Todo lo del plan Premium",
      "Posición prioritaria en búsquedas",
      "Responder a reseñas de clientes",
      "Análisis avanzado de sentimiento",
      "Soporte prioritario",
    ],
  },
]

export default function RegisterBusinessPage() {
  const { isConnected, address } = useWallet()
  const { toast } = useToast()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [registrationStep, setRegistrationStep] = useState<"form" | "plan" | "success">("form")
  const [businessData, setBusinessData] = useState<BusinessFormValues | null>(null)

  // Inicializar el formulario
  const form = useForm<BusinessFormValues>({
    resolver: zodResolver(businessFormSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
      location: "",
      openHours: "",
      phone: "",
      website: "",
      logoUrl: "",
    },
  })

  // Manejar la carga de logo
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // En una implementación real, aquí subiríamos el archivo a un servicio de almacenamiento
      // y obtendríamos la URL. Para este ejemplo, creamos una URL temporal.
      const previewUrl = URL.createObjectURL(file)
      setLogoPreview(previewUrl)
      form.setValue("logoUrl", previewUrl)
    }
  }

  // Manejar el envío del formulario
  const onSubmit = (data: BusinessFormValues) => {
    setBusinessData(data)
    setRegistrationStep("plan")
  }

  // Seleccionar un plan
  const selectPlan = (planId: string) => {
    setSelectedPlan(planId)
    setShowPaymentModal(true)
  }

  // Procesar el pago
  const handlePaymentComplete = async (txHash: string) => {
    setIsSubmitting(true)

    try {
      if (!businessData || !selectedPlan || !address) {
        throw new Error("Faltan datos para completar el registro")
      }

      // Obtener el plan seleccionado
      const plan = promotionPlans.find((p) => p.id === selectedPlan)
      if (!plan) {
        throw new Error("Plan no válido")
      }

      // Registrar el negocio
      const result = await BusinessService.registerBusiness({
        ...businessData,
        ownerAddress: address,
        planId: selectedPlan,
        planPrice: plan.price,
        planDuration: plan.duration,
        paymentTxHash: txHash,
        featured: selectedPlan !== "basic",
        registrationDate: new Date().toISOString(),
      })

      toast({
        title: "¡Registro exitoso!",
        description: "Tu negocio ha sido registrado y será revisado por nuestro equipo.",
      })

      setRegistrationStep("success")
    } catch (error: any) {
      console.error("Error al registrar negocio:", error)
      toast({
        title: "Error en el registro",
        description: error.message || "Hubo un problema al registrar tu negocio. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
      setShowPaymentModal(false)
    }
  }

  // Si el usuario no está conectado, mostrar mensaje
  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">Conecta tu wallet para registrar tu negocio</h1>
        <p className="text-muted-foreground mb-8">
          Necesitas conectar tu wallet para registrar y promocionar tu negocio en ReviewChain.
        </p>
        <ConnectWalletButton />
      </div>
    )
  }

  // Renderizar el paso de éxito
  if (registrationStep === "success") {
    return (
      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
          <CardHeader>
            <CardTitle className="text-center text-2xl text-green-700 dark:text-green-400">
              ¡Registro completado con éxito!
            </CardTitle>
            <CardDescription className="text-center text-green-600 dark:text-green-500">
              Tu negocio ha sido registrado en ReviewChain
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <Building2 className="w-8 h-8 text-green-600" />
              </div>
            </div>

            <p className="text-center">
              Tu negocio <span className="font-medium">{businessData?.name}</span> ha sido registrado correctamente y
              será revisado por nuestro equipo en las próximas 24 horas.
            </p>

            {selectedPlan && selectedPlan !== "basic" && (
              <Alert className="bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-400">
                <Info className="h-4 w-4" />
                <AlertTitle>Promoción activada</AlertTitle>
                <AlertDescription>
                  Tu negocio aparecerá destacado en la página principal una vez que sea aprobado.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter className="flex justify-center gap-4">
            <Button asChild>
              <Link href="/">Ir a la página principal</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  // Renderizar el paso de selección de plan
  if (registrationStep === "plan") {
    return (
      <div className="container mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center text-sm mb-6 hover:underline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a la página principal
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Selecciona un plan de promoción</h1>
          <p className="text-muted-foreground">Elige el plan que mejor se adapte a las necesidades de tu negocio.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {promotionPlans.map((plan) => (
            <Card
              key={plan.id}
              className={`${
                selectedPlan === plan.id ? "border-primary bg-primary/5" : ""
              } transition-all hover:shadow-md`}
            >
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>
                  <div className="mt-2 text-2xl font-bold text-[#8C00FF]">
                    {plan.price} MXNB
                    <span className="text-sm font-normal text-gray-400 ml-1">/ {plan.duration}</span>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <div className="mr-2 mt-1 h-2 w-2 rounded-full bg-primary"></div>
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={() => selectPlan(plan.id)}
                  className="w-full"
                  variant={plan.id === "premium" ? "default" : "outline"}
                  style={{
                    backgroundColor: plan.id === "premium" ? "#8C00FF" : "transparent",
                    borderColor: "#8C00FF",
                    color: plan.id === "premium" ? "white" : "#8C00FF",
                  }}
                >
                  Seleccionar plan
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setRegistrationStep("form")}>
            Volver al formulario
          </Button>
        </div>

        {showPaymentModal && selectedPlan && (
          <PaymentModal
            open={showPaymentModal}
            onClose={() => setShowPaymentModal(false)}
            amount={promotionPlans.find((p) => p.id === selectedPlan)?.price || 0}
            currency="MXNB"
            businessName={businessData?.name || ""}
            onPaymentComplete={handlePaymentComplete}
          />
        )}
      </div>
    )
  }

  // Renderizar el formulario de registro
  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/" className="inline-flex items-center text-sm mb-6 hover:underline">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Volver a la página principal
      </Link>

      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-2 text-[#8C00FF]">Registra tu negocio en Aletheum X</h1>
        <p className="text-gray-400">
          Completa el formulario para registrar tu negocio y comenzar a recibir reseñas verificadas en blockchain.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Información del negocio</CardTitle>
              <CardDescription>
                Proporciona los detalles de tu negocio para que los usuarios puedan encontrarlo.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre del negocio</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej. Café Blockchain" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descripción</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe tu negocio, productos o servicios..."
                            className="min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>{field.value.length}/500 caracteres</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Categoría</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona una categoría" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {businessCategories.map((category) => (
                                <SelectItem key={category.value} value={category.value}>
                                  {category.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dirección</FormLabel>
                          <FormControl>
                            <div className="flex">
                              <MapPin className="w-4 h-4 mr-2 text-muted-foreground mt-3" />
                              <Input placeholder="Ej. Calle Innovación 123, Ciudad Crypto" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="openHours"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Horario</FormLabel>
                          <FormControl>
                            <div className="flex">
                              <Clock className="w-4 h-4 mr-2 text-muted-foreground mt-3" />
                              <Input placeholder="Ej. Lun-Vie: 8:00-20:00, Sáb-Dom: 9:00-21:00" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Teléfono</FormLabel>
                          <FormControl>
                            <div className="flex">
                              <Phone className="w-4 h-4 mr-2 text-muted-foreground mt-3" />
                              <Input placeholder="Ej. +52 123 456 7890" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sitio web (opcional)</FormLabel>
                        <FormControl>
                          <div className="flex">
                            <Globe className="w-4 h-4 mr-2 text-muted-foreground mt-3" />
                            <Input placeholder="Ej. https://miempresa.com" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="logoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Logo (opcional)</FormLabel>
                        <FormControl>
                          <div className="flex items-center gap-4">
                            <div className="flex-1">
                              <label
                                htmlFor="logo-upload"
                                className="flex items-center justify-center w-full h-32 border-2 border-dashed rounded-md cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900"
                              >
                                {logoPreview ? (
                                  <img
                                    src={logoPreview || "/placeholder.svg"}
                                    alt="Logo preview"
                                    className="max-h-28 max-w-full object-contain"
                                  />
                                ) : (
                                  <div className="flex flex-col items-center">
                                    <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                                    <span className="text-sm text-muted-foreground">Haz clic para subir tu logo</span>
                                  </div>
                                )}
                                <input
                                  id="logo-upload"
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={handleLogoUpload}
                                />
                              </label>
                            </div>
                            {logoPreview && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setLogoPreview(null)
                                  form.setValue("logoUrl", "")
                                }}
                              >
                                Eliminar
                              </Button>
                            )}
                          </div>
                        </FormControl>
                        <FormDescription>Sube una imagen de tu logo en formato JPG, PNG o SVG.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end">
                    <Button type="submit">Continuar</Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Beneficios de registrarse</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium">Reseñas verificadas</h3>
                <p className="text-sm text-muted-foreground">
                  Recibe reseñas verificadas mediante blockchain, garantizando su autenticidad.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium">Perfil de negocio</h3>
                <p className="text-sm text-muted-foreground">
                  Página dedicada para tu negocio con toda la información relevante para tus clientes.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium">Promoción destacada</h3>
                <p className="text-sm text-muted-foreground">
                  Opciones para destacar tu negocio en la página principal y en los resultados de búsqueda.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium">Estadísticas y análisis</h3>
                <p className="text-sm text-muted-foreground">
                  Accede a estadísticas detalladas sobre las reseñas y la interacción de los usuarios.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Verificación blockchain</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Al registrar tu negocio, se creará un registro en la blockchain que verificará la autenticidad de tu
                negocio y las reseñas que recibas.
              </p>
              <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3 text-xs font-mono">
                <div className="mb-1">
                  Wallet: {address?.substring(0, 6)}...{address?.substring(address.length - 4)}
                </div>
                <div>Network: Ethereum</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
