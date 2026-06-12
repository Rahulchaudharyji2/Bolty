

"use client"

import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useAuth } from '@clerk/nextjs'
import { BackendUrl } from '@/config'
import { MessageCircle, Loader } from 'lucide-react'
import { useToast } from '@/hooks/useToast'

interface PromptItem {
  id: string
  content: string
  type: 'USER' | 'SYSTEM'
  createdAt: string
}

interface ConversationHistoryProps {
  projectId: string
}

const ConversationHistory = ({ projectId }: ConversationHistoryProps) => {
  
  const [prompts, setPrompts] = useState<PromptItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { getToken } = useAuth()
  const { error } = useToast()

  
  useEffect(() => {
    fetchPrompts()
  }, [projectId])

  
  const fetchPrompts = async () => {
    try {
      setIsLoading(true)
      const token = await getToken()

      const response = await axios.get(
        `${BackendUrl}/prompts/${projectId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      
      const prompts = response.data.prompts || [];

const userPrompts = prompts.filter(
  (p: PromptItem) => p.type === "USER"
);

setPrompts(userPrompts);
    } catch (err: any) {
      console.error('Failed to fetch prompts:', err)
      error('Failed to load conversation history')
    } finally {
      setIsLoading(false)
    }
  }

  
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    
    return date.toLocaleDateString()
  }

  
  const truncateText = (text: string, maxLength = 50) => {
    return text.length > maxLength 
      ? text.substring(0, maxLength) + '...' 
      : text
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {isLoading ? (
        
        <div className="flex items-center justify-center h-full">
          <Loader className="w-5 h-5 animate-spin text-gray-400" />
        </div>
      ) : prompts.length === 0 ? (
        
        <div className="flex flex-col items-center justify-center h-full text-gray-400">
          <MessageCircle className="w-8 h-8 mb-2 opacity-50" />
          <p className="text-sm">No prompts yet</p>
        </div>
      ) : (
        
        <div className="space-y-2 p-3">
          {prompts.map((prompt) => (
            <div
              key={prompt.id}
              className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer group"
              title={prompt.content} 
            >
              
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 line-clamp-2">
                {truncateText(prompt.content)}
              </p>

              
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {formatTime(prompt.createdAt)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ConversationHistory
