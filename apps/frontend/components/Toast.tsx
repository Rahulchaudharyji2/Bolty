

"use client"

import { useState, useEffect } from "react"
import { AlertCircle, CheckCircle, Info, X } from "lucide-react"

export interface ToastMessage {
  id: string
  type: "success" | "error" | "info" | "warning"
  message: string
  description?: string
  duration?: number
}

interface ToastProps {
  toasts: ToastMessage[]
  onRemove: (id: string) => void
}

const Toast = ({ toasts, onRemove }: ToastProps) => {
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-md">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onRemove={() => onRemove(toast.id)}
        />
      ))}
    </div>
  )
}

interface ToastItemProps {
  toast: ToastMessage
  onRemove: () => void
}

const ToastItem = ({ toast, onRemove }: ToastItemProps) => {
  
  useEffect(() => {
    if (toast.duration === 0) return
    
    const timer = setTimeout(onRemove, toast.duration || 4000)
    return () => clearTimeout(timer)
  }, [toast.duration, onRemove])

  
  const config = {
    success: {
      bg: "bg-green-50 border-green-200",
      icon: <CheckCircle className="w-5 h-5 text-green-600" />,
      textColor: "text-green-800",
    },
    error: {
      bg: "bg-red-50 border-red-200",
      icon: <AlertCircle className="w-5 h-5 text-red-600" />,
      textColor: "text-red-800",
    },
    info: {
      bg: "bg-blue-50 border-blue-200",
      icon: <Info className="w-5 h-5 text-blue-600" />,
      textColor: "text-blue-800",
    },
    warning: {
      bg: "bg-yellow-50 border-yellow-200",
      icon: <AlertCircle className="w-5 h-5 text-yellow-600" />,
      textColor: "text-yellow-800",
    },
  }

  const style = config[toast.type]

  return (
    <div
      className={`${style.bg} border rounded-lg p-4 flex items-start gap-3 animate-in slide-in-from-right-5 fade-in`}
    >
      
      <div className="mt-0.5 flex-shrink-0">{style.icon}</div>

      
      <div className="flex-1">
        <p className={`font-medium ${style.textColor}`}>{toast.message}</p>
        {toast.description && (
          <p className={`text-sm mt-1 ${style.textColor} opacity-75`}>
            {toast.description}
          </p>
        )}
      </div>

      
      <button
        onClick={onRemove}
        className="flex-shrink-0 text-gray-400 hover:text-gray-600"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

export default Toast
