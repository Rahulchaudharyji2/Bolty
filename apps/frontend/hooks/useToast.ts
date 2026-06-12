

"use client"

import { useState, useCallback } from "react"
import { ToastMessage } from "@/components/Toast"

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  
  const generateId = () => Math.random().toString(36).substr(2, 9)

  
  const addToast = useCallback(
    (
      message: string,
      type: "success" | "error" | "info" | "warning" = "info",
      description?: string,
      duration?: number
    ) => {
      const id = generateId()
      const newToast: ToastMessage = {
        id,
        type,
        message,
        description,
        duration,
      }

      
      setToasts((prev) => [...prev, newToast])

      
      if (duration !== 0) {
        setTimeout(
          () => removeToast(id),
          duration || 4000
        )
      }

      return id
    },
    []
  )

  
  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  
  const success = (message: string, description?: string) =>
    addToast(message, "success", description)
  
  const error = (message: string, description?: string) =>
    addToast(message, "error", description)
  
  const info = (message: string, description?: string) =>
    addToast(message, "info", description)
  
  const warning = (message: string, description?: string) =>
    addToast(message, "warning", description)

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    info,
    warning,
  }
}
