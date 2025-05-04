"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { ethers } from "ethers"

interface WalletContextType {
  address: string | null
  chainId: number | null
  isConnected: boolean
  isConnecting: boolean
  error: string | null
  connectWallet: () => Promise<void>
  disconnectWallet: () => void
  shortAddress: string | null
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null)
  const [chainId, setChainId] = useState<number | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Función para comprobar si ya hay una wallet conectada al cargar la página
  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window !== "undefined" && window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum)
          const accounts = await provider.listAccounts()

          if (accounts.length > 0) {
            const network = await provider.getNetwork()
            setAddress(accounts[0].address)
            setChainId(Number(network.chainId))
            setIsConnected(true)
          }
        } catch (err) {
          console.error("Error al comprobar la conexión:", err)
        }
      }
    }

    checkConnection()

    if (typeof window !== "undefined" && window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          setAddress(null)
          setIsConnected(false)
        } else {
          setAddress(accounts[0])
          setIsConnected(true)
        }
      }

      const handleChainChanged = (chainId: string) => {
        setChainId(Number.parseInt(chainId, 16))
        window.location.reload()
      }

      const handleDisconnect = () => {
        setAddress(null)
        setChainId(null)
        setIsConnected(false)
      }

      window.ethereum.on("accountsChanged", handleAccountsChanged)
      window.ethereum.on("chainChanged", handleChainChanged)
      window.ethereum.on("disconnect", handleDisconnect)

      return () => {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged)
        window.ethereum.removeListener("chainChanged", handleChainChanged)
        window.ethereum.removeListener("disconnect", handleDisconnect)
      }
    }
  }, [])

  // Función para conectar wallet
  const connectWallet = async () => {
    setIsConnecting(true)
    setError(null)

    try {
      if (typeof window !== "undefined" && window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum)

        // Solicitar conexión de cuenta
        const accounts = await provider.send("eth_requestAccounts", [])

        if (accounts.length > 0) {
          const network = await provider.getNetwork()
          setAddress(accounts[0])
          setChainId(Number(network.chainId))
          setIsConnected(true)
        } else {
          setError("No se seleccionó ninguna cuenta")
        }
      } else {
        setError("Por favor instala MetaMask u otra wallet compatible")
      }
    } catch (err: any) {
      console.error("Error al conectar wallet:", err)
      setError(err.message || "Error al conectar con la wallet")
    } finally {
      setIsConnecting(false)
    }
  }

  // Función para desconectar wallet
  const disconnectWallet = () => {
    setAddress(null)
    setChainId(null)
    setIsConnected(false)
  }

  // Crear una versión corta de la dirección para mostrar en la UI
  const shortAddress = address ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}` : null

  const value = {
    address,
    chainId,
    isConnected,
    isConnecting,
    error,
    connectWallet,
    disconnectWallet,
    shortAddress,
  }

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error("useWallet debe ser usado dentro de un WalletProvider")
  }
  return context
}
