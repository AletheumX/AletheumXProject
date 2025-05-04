import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { VerificationBadge } from "@/components/verification-badge"
import type { VerificationResult } from "@/services/verification-service"
import { Separator } from "@/components/ui/separator"
import { ExternalLink, Calendar, AlertTriangle, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface VerificationDetailsProps {
  verification: VerificationResult
  reviewerAddress: string
  chainId?: number | null
}

export function VerificationDetails({ verification, reviewerAddress, chainId }: VerificationDetailsProps) {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  const getExplorerUrl = () => {
    if (!verification.transactionHash || !chainId) return null

    let baseUrl = ""
    switch (chainId) {
      case 1:
        baseUrl = "https://etherscan.io"
        break
      case 5:
        baseUrl = "https://goerli.etherscan.io"
        break
      case 11155111:
        baseUrl = "https://sepolia.etherscan.io"
        break
      case 137:
        baseUrl = "https://polygonscan.com"
        break
      case 80001:
        baseUrl = "https://mumbai.polygonscan.com"
        break
      default:
        return null
    }

    return `${baseUrl}/tx/${verification.transactionHash}`
  }

  const getWalletExplorerUrl = () => {
    if (!reviewerAddress || !chainId) return null

    let baseUrl = ""
    switch (chainId) {
      case 1:
        baseUrl = "https://etherscan.io"
        break
      case 5:
        baseUrl = "https://goerli.etherscan.io"
        break
      case 11155111:
        baseUrl = "https://sepolia.etherscan.io"
        break
      case 137:
        baseUrl = "https://polygonscan.com"
        break
      case 80001:
        baseUrl = "https://mumbai.polygonscan.com"
        break
      default:
        return null
    }

    return `${baseUrl}/address/${reviewerAddress}`
  }

  const explorerUrl = getExplorerUrl()
  const walletExplorerUrl = getWalletExplorerUrl()

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Detalles de verificación</CardTitle>
          <VerificationBadge status={verification.status} showTooltip={false} size="lg" />
        </div>
        <CardDescription>Información sobre la verificación de esta reseña</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="text-sm font-medium mb-1">Estado</h4>
          <p className="text-sm">{verification.message}</p>
        </div>

        <div>
          <h4 className="text-sm font-medium mb-1">Fecha de verificación</h4>
          <p className="text-sm">{formatDate(verification.timestamp)}</p>
        </div>

        <div>
          <h4 className="text-sm font-medium mb-1">Dirección del revisor</h4>
          <div className="flex items-center justify-between">
            <p className="text-sm font-mono break-all">{reviewerAddress}</p>
            {walletExplorerUrl && (
              <Button variant="ghost" size="sm" className="ml-2 p-1 h-auto" asChild>
                <a href={walletExplorerUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4" />
                  <span className="sr-only">Ver wallet en explorador</span>
                </a>
              </Button>
            )}
          </div>
        </div>

        {verification.walletInfo && (
          <div className="bg-gray-900 rounded-lg p-4 mt-2">
            <h4 className="text-sm font-medium mb-2 flex items-center">
              <Calendar className="w-4 h-4 mr-2 text-[#8C00FF]" />
              Información de la wallet
            </h4>
            <div className="space-y-2 text-sm">
              {verification.walletInfo.firstTransactionDate && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Primera transacción:</span>
                  <span>{new Date(verification.walletInfo.firstTransactionDate).toLocaleDateString()}</span>
                </div>
              )}
              {verification.walletInfo.ageInDays !== null && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Antigüedad:</span>
                  <span>{verification.walletInfo.ageInDays} días</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-400">Transacciones:</span>
                <span>{verification.walletInfo.transactionCount}</span>
              </div>
              <div className="flex items-center mt-1">
                {verification.walletInfo.isOldEnough ? (
                  <CheckCircle2 className="w-4 h-4 text-[#8C00FF] mr-2" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-500 mr-2" />
                )}
                <span className={verification.walletInfo.isOldEnough ? "text-[#8C00FF]" : "text-amber-500"}>
                  {verification.walletInfo.isOldEnough
                    ? "Wallet con suficiente antigüedad"
                    : "Wallet relativamente nueva"}
                </span>
              </div>
            </div>
          </div>
        )}

        {verification.status === "verified" && (
          <>
            <Separator />

            <div>
              <h4 className="text-sm font-medium mb-1">Información blockchain</h4>
              <div className="space-y-2">
                {verification.blockNumber && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Bloque:</span>
                    <span className="text-sm font-mono">{verification.blockNumber}</span>
                  </div>
                )}
                {verification.transactionHash && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">TX Hash:</span>
                    <span className="text-sm font-mono truncate max-w-[200px]">{verification.transactionHash}</span>
                  </div>
                )}
              </div>
            </div>

            {explorerUrl && (
              <Button variant="outline" size="sm" className="w-full" asChild>
                <a href={explorerUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                  <ExternalLink className="w-4 h-4" />
                  <span>Ver en explorador</span>
                </a>
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
