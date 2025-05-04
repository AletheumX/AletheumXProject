"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useWallet } from "@/context/wallet-context"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { PaymentService } from "@/services/payment-service"

interface PaymentModalProps {
  open: boolean
  onClose: () => void
  amount: number
  currency: string
  businessName: string
  onPaymentComplete: (txHash: string) => void
}

export function PaymentModal({ open, onClose, amount, currency, businessName, onPaymentComplete }: PaymentModalProps) {
  const { address, chainId } = useWallet()
  const { toast } = useToast()
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success" | "error">("idle")
  const [txHash, setTxHash] = useState<string>("")
  const [balance, setBalance] = useState<number | null>(null)
  const [isLoadingBalance, setIsLoadingBalance] = useState(false)

  // Cargar el balance de MXNB
  useEffect(() => {
    const loadBalance = async () => {
      if (!address) return

      setIsLoadingBalance(true)
      try {
        // En una implementación real, esto consultaría el balance real del token MXNB
        const balance = await PaymentService.getTokenBalance(address, "MXNB")
        setBalance(balance)
      } catch (error) {
        console.error("Error al cargar balance:", error)
        setBalance(null)
      } finally {
        setIsLoadingBalance(false)
      }
    }

    if (open) {
      loadBalance()
    }
  }, [address, open])

  // Procesar el pago
  const handlePayment = async () => {
    if (!address) {
      toast({
        title: "Error",
        description: "No se ha detectado una wallet conectada.",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    setPaymentStatus("processing")

    try {
      // En una implementación real, esto realizaría la transacción real en la blockchain
      const result = await PaymentService.makePayment({
        fromAddress: address,
        amount,
        currency,
        description: `Promoción de negocio: ${businessName}`,
      })

      setTxHash(result.txHash)
      setPaymentStatus("success")

      toast({
        title: "Pago exitoso",
        description: "Tu pago ha sido procesado correctamente.",
      })

      // Esperar un momento antes de cerrar el modal
      setTimeout(() => {
        onPaymentComplete(result.txHash)
      }, 2000)
    } catch (error: any) {
      console.error("Error al procesar pago:", error)
      setPaymentStatus("error")
      toast({
        title: "Error en el pago",
        description: error.message || "Hubo un problema al procesar tu pago. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Reiniciar el estado al cerrar
  const handleClose = () => {
    if (paymentStatus !== "processing") {
      setPaymentStatus("idle")
      setTxHash("")
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Pago con MXNB</DialogTitle>
          <DialogDescription>Realiza el pago para promocionar tu negocio en ReviewChain.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {paymentStatus === "idle" && (
            <>
              <div className="space-y-2">
                <Label>Detalles del pago</Label>
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-md space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Negocio:</span>
                    <span className="text-sm font-medium">{businessName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Monto:</span>
                    <span className="text-sm font-medium">
                      {amount} {currency}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Wallet:</span>
                    <span className="text-sm font-mono">
                      {address
                        ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
                        : "No conectada"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Balance:</span>
                    <span className="text-sm font-medium">
                      {isLoadingBalance ? (
                        <Loader2 className="h-4 w-4 animate-spin inline mr-1" />
                      ) : balance !== null ? (
                        `${balance} ${currency}`
                      ) : (
                        "Error al cargar balance"
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {balance !== null && balance < amount && (
                <div className="bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400 p-3 rounded-md flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Balance insuficiente</p>
                    <p className="text-sm">
                      No tienes suficiente MXNB para realizar este pago. Por favor, recarga tu wallet.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          {paymentStatus === "processing" && (
            <div className="flex flex-col items-center justify-center py-6">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-center font-medium">Procesando tu pago...</p>
              <p className="text-center text-sm text-muted-foreground mt-2">
                Por favor, no cierres esta ventana hasta que se complete la transacción.
              </p>
            </div>
          )}

          {paymentStatus === "success" && (
            <div className="flex flex-col items-center justify-center py-6">
              <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
              <p className="text-center font-medium">¡Pago completado con éxito!</p>
              <p className="text-center text-sm text-muted-foreground mt-2">
                Tu negocio será promocionado en ReviewChain.
              </p>
              <div className="mt-4 bg-slate-50 dark:bg-slate-900 p-3 rounded-md w-full">
                <p className="text-xs text-muted-foreground mb-1">Hash de transacción:</p>
                <p className="text-xs font-mono break-all">{txHash}</p>
              </div>
            </div>
          )}

          {paymentStatus === "error" && (
            <div className="flex flex-col items-center justify-center py-6">
              <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
              <p className="text-center font-medium">Error en el pago</p>
              <p className="text-center text-sm text-muted-foreground mt-2">
                Hubo un problema al procesar tu pago. Por favor, inténtalo de nuevo.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          {paymentStatus === "idle" && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button onClick={handlePayment} disabled={isProcessing || (balance !== null && balance < amount)}>
                Pagar {amount} {currency}
              </Button>
            </>
          )}

          {paymentStatus === "success" && <Button onClick={handleClose}>Cerrar</Button>}

          {paymentStatus === "error" && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button onClick={handlePayment}>Intentar de nuevo</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
