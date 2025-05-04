"use client"

import { Button } from "@/components/ui/button"
import { Wallet } from "lucide-react"
import { useWallet } from "@/context/wallet-context"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { LogOut, Copy, ExternalLink } from "lucide-react"
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"

interface ConnectWalletButtonProps {
  onConnect?: () => void
}

export function ConnectWalletButton({ onConnect }: ConnectWalletButtonProps) {
  const { isConnected, isConnecting, connectWallet, disconnectWallet, shortAddress, address, chainId, error } =
    useWallet()
  const [showNetworkInfo, setShowNetworkInfo] = useState(false)
  const { toast } = useToast()

  const handleConnect = async () => {
    await connectWallet()
    if (onConnect) {
      onConnect()
    }
  }

  const handleDisconnect = () => {
    disconnectWallet()
  }

  const copyAddressToClipboard = () => {
    if (address) {
      navigator.clipboard.writeText(address)
      toast({
        title: "Dirección copiada",
        description: "La dirección de tu wallet ha sido copiada al portapapeles",
      })
    }
  }

  const getNetworkName = (chainId: number | null) => {
    if (!chainId) return "Red desconocida"

    switch (chainId) {
      case 1:
        return "Ethereum Mainnet"
      case 5:
        return "Goerli Testnet"
      case 11155111:
        return "Sepolia Testnet"
      case 137:
        return "Polygon Mainnet"
      case 80001:
        return "Mumbai Testnet"
      default:
        return `ChainID: ${chainId}`
    }
  }

  const openEtherscan = () => {
    if (!address || !chainId) return

    let url = ""
    if (chainId === 1) {
      url = `https://etherscan.io/address/${address}`
    } else if (chainId === 5) {
      url = `https://goerli.etherscan.io/address/${address}`
    } else if (chainId === 11155111) {
      url = `https://sepolia.etherscan.io/address/${address}`
    } else if (chainId === 137) {
      url = `https://polygonscan.com/address/${address}`
    } else if (chainId === 80001) {
      url = `https://mumbai.polygonscan.com/address/${address}`
    }

    if (url) {
      window.open(url, "_blank")
    }
  }

  // Si hay un error, mostrar un toast
  if (error) {
    toast({
      variant: "destructive",
      title: "Error de conexión",
      description: error,
    })
  }

  if (isConnected && shortAddress) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <Wallet className="w-4 h-4" />
            <span>{shortAddress}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={copyAddressToClipboard}>
            <Copy className="w-4 h-4 mr-2" />
            Copiar dirección
          </DropdownMenuItem>
          <DropdownMenuItem onClick={openEtherscan}>
            <ExternalLink className="w-4 h-4 mr-2" />
            Ver en Etherscan
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowNetworkInfo(!showNetworkInfo)}>
            <div className="flex flex-col">
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                {getNetworkName(chainId)}
              </div>
              {showNetworkInfo && chainId && (
                <div className="text-xs text-muted-foreground mt-1 ml-4">Chain ID: {chainId}</div>
              )}
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDisconnect}>
            <LogOut className="w-4 h-4 mr-2" />
            Desconectar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <Button onClick={handleConnect} disabled={isConnecting} className="flex items-center gap-2">
      <Wallet className="w-4 h-4" />
      {isConnecting ? "Conectando..." : "Conectar Wallet"}
    </Button>
  )
}
