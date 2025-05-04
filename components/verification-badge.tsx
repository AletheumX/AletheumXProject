import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { CheckCircle2, Clock, XCircle, AlertCircle, Info } from "lucide-react"
import type { VerificationStatus } from "@/services/verification-service"

interface VerificationBadgeProps {
  status: VerificationStatus
  message?: string
  showTooltip?: boolean
  className?: string
  size?: "sm" | "md" | "lg"
}

export function VerificationBadge({
  status,
  message,
  showTooltip = true,
  className = "",
  size = "md",
}: VerificationBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case "verified":
        return {
          label: "Verificado",
          icon: <CheckCircle2 className={size === "sm" ? "w-3 h-3" : "w-4 h-4"} />,
          variant: "outline" as const,
          className:
            "bg-[#8C00FF]/10 text-[#8C00FF] border-[#8C00FF]/30 dark:bg-[#8C00FF]/20 dark:text-[#8C00FF] dark:border-[#8C00FF]/30",
        }
      case "pending":
        return {
          label: "Pendiente",
          icon: <Clock className={size === "sm" ? "w-3 h-3" : "w-4 h-4"} />,
          variant: "outline" as const,
          className:
            "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-400 dark:border-yellow-800",
        }
      case "rejected":
        return {
          label: "Rechazado",
          icon: <XCircle className={size === "sm" ? "w-3 h-3" : "w-4 h-4"} />,
          variant: "outline" as const,
          className: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800",
        }
      case "unverified":
      default:
        return {
          label: "No verificado",
          icon: <AlertCircle className={size === "sm" ? "w-3 h-3" : "w-4 h-4"} />,
          variant: "outline" as const,
          className:
            "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800",
        }
    }
  }

  const config = getStatusConfig()
  const badgeContent = (
    <Badge
      variant={config.variant}
      className={`flex items-center gap-1 ${config.className} ${
        size === "sm" ? "text-xs py-0 px-1.5 h-5" : size === "lg" ? "text-sm py-1 px-3 h-7" : ""
      } ${className}`}
    >
      {config.icon}
      <span>{config.label}</span>
    </Badge>
  )

  if (showTooltip && message) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{badgeContent}</TooltipTrigger>
          <TooltipContent>
            <div className="flex items-start gap-2 max-w-xs">
              <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p className="text-sm">{message}</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return badgeContent
}
