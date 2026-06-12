

"use client"

import { useEffect, useRef, useState, useCallback } from 'react'
import { WsUrl } from '@/config'

export interface WebSocketMessage {
  event: string
  data: any
  projectId?: string
}

export interface UseWebSocketProps {
  projectId?: string
  onMessage?: (message: WebSocketMessage) => void
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: Event) => void
}

export const useWebSocket = ({
  projectId,
  onMessage,
  onConnect,
  onDisconnect,
  onError,
}: UseWebSocketProps) => {
  const ws = useRef<WebSocket | null>(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5
  const reconnectDelay = useRef(1000)
  const [isConnected, setIsConnected] = useState(false)

  
  const onMessageRef = useRef(onMessage)
  const onConnectRef = useRef(onConnect)
  const onDisconnectRef = useRef(onDisconnect)
  const onErrorRef = useRef(onError)

  useEffect(() => {
    onMessageRef.current = onMessage
    onConnectRef.current = onConnect
    onDisconnectRef.current = onDisconnect
    onErrorRef.current = onError
  }, [onMessage, onConnect, onDisconnect, onError])

  
  const send = useCallback((message: WebSocketMessage) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message))
    } else {
      console.warn('WebSocket not connected, message not sent:', message)
    }
  }, [])

  
  const connect = useCallback(() => {
    try {
      
      if (ws.current?.readyState === WebSocket.OPEN) {
        return
      }

      
      const wsUrl = `${WsUrl}${projectId ? `?projectId=${projectId}` : ''}`
      console.log('Connecting to WebSocket:', wsUrl)
      
      ws.current = new WebSocket(wsUrl)

      
      ws.current.onopen = () => {
        console.log('WebSocket connected')
        setIsConnected(true)
        reconnectAttempts.current = 0
        reconnectDelay.current = 1000
        
        onConnectRef.current?.()

        
        if (projectId) {
          send({
            event: 'subscribe',
            data: { projectId },
          })
        }
      }

      
      ws.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage
          console.log('WebSocket message received:', message)
          onMessageRef.current?.(message)
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err)
        }
      }

      
      ws.current.onerror = (event) => {
        console.warn(
          '⚠️ WebSocket connection error. Backend WebSocket endpoint not available yet. This is expected during development.'
        )
        setIsConnected(false)
        onErrorRef.current?.(event)
      }

      
      ws.current.onclose = () => {
        console.log('WebSocket disconnected')
        setIsConnected(false)
        onDisconnectRef.current?.()

        
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++
          console.log(
            `Reconnecting... (attempt ${reconnectAttempts.current}/${maxReconnectAttempts})`
          )
          setTimeout(connect, reconnectDelay.current)
          
          reconnectDelay.current = Math.min(
            reconnectDelay.current * 2,
            30000
          )
        }
      }
    } catch (err) {
      console.error('Failed to create WebSocket:', err)
      setIsConnected(false)
    }
  }, [projectId, send])

  
  const disconnect = useCallback(() => {
    if (ws.current) {
      ws.current.close()
      ws.current = null
      setIsConnected(false)
    }
  }, [])

  
  useEffect(() => {
    connect()

    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  return {
    isConnected,
    send,
    disconnect,
    reconnect: connect,
  }
}
