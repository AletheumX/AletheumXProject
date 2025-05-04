import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Shield, Info, Calendar } from "lucide-react"

interface EigenVerificationBadgeProps {
  confidenceScore: number
  quorumReached: boolean
  validatorCount: number
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
  className?: string
}

export function EigenVerificationBadge({
  confidenceScore,
  quorumReached,
  validatorCount,
  walletInfo,
  walletVerification,
  className = "",
}: EigenVerificationBadgeProps) {
  // Determinar el nivel de confianza basado en el puntaje
  const getConfidenceLevel = () => {
    if (confidenceScore >= 0.9) return "Alto"
    if (confidenceScore >= 0.7) return "Medio"
    return "Bajo"
  }

  // Configurar el color basado en el nivel de confianza
  const getBadgeStyle = () => {
    if (confidenceScore >= 0.9) {
      return "bg-[#8C00FF]/10 text-[#8C00FF] border-[#8C00FF]/30 dark:bg-[#8C00FF]/20 dark:text-[#8C00FF] dark:border-[#8C00FF]/30"
    }
    if (confidenceScore >= 0.7) {
      return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800"
    }
    return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800"
  }

  const confidencePercentage = Math.round(confidenceScore * 100)
  const badgeContent = (
    <Badge variant="outline" className={`flex items-center gap-1 ${getBadgeStyle()} ${className}`}>
      <Shield className="w-3 h-3" />
      <span>EigenLayer {getConfidenceLevel()}</span>
    </Badge>
  )

  // Formatear la fecha para mostrarla en el tooltip
  const formatDate = (date: Date | null) => {
    if (!date) return "Desconocida"
    return date.toLocaleDateString()
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badgeContent}</TooltipTrigger>
        <TooltipContent>
          <div className="flex items-start gap-2 max-w-xs">
            <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium">Verificado por EigenLayer</p>
              <p>Nivel de confianza: {confidencePercentage}%</p>
              <p>Validado por {validatorCount} operadores</p>
              <p>{quorumReached ? "Quórum alcanzado" : "Quórum no alcanzado"}</p>

              {walletInfo && (
                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <p className="font-medium flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    Información de la wallet
                  </p>
                  {walletInfo.firstTransactionDate && (
                    <p>Primera transacción: {formatDate(walletInfo.firstTransactionDate)}</p>
                  )}
                  {walletInfo.ageInDays && <p>Antigüedad: {walletInfo.ageInDays} días</p>}
                  <p>Transacciones: {walletInfo.transactionCount}</p>
                  {walletVerification && (
                    <p className={walletVerification.isValid ? "text-[#8C00FF]" : "text-amber-500"}>
                      {walletVerification.message}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
