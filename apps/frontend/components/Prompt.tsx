"use client"
import React from 'react'
import { Textarea } from './ui/textarea'
import { Button } from './ui/button'
import { Send, Loader } from 'lucide-react'
import axios from 'axios'
import {useAuth} from "@clerk/nextjs"
import {BackendUrl} from "@/config"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/useToast"

interface PromptProps {
    projectId?: string
}

function Prompt({ projectId }: PromptProps) {
    
    const [prompt, setPrompt] = React.useState("")
    const [isLoading, setIsLoading] = React.useState(false)  
    const {getToken}= useAuth()
    const router = useRouter()
    const { error, success } = useToast()  
    
    
    async function handleSend(){
        
        if (!prompt.trim()) {
            error("Please enter a prompt", "Your message cannot be empty")
            return
        }

        
        setIsLoading(true)
        
        try{
            
            const token = await getToken()
            if (!token) {
                error("Authentication failed", "Please sign in to continue")
                setIsLoading(false)
                return
            }

            if (projectId) {
                
                await axios.post(`${BackendUrl}/prompt`, {
                    prompt: prompt,
                    projectId: projectId
                }, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                })

                success("Prompt sent!", "Generating code changes...")
                setPrompt("") 
            } else {
                
                const input = await axios.post(`${BackendUrl}/project`,{
                 prompt: prompt
                },{
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                })

                console.log("Project created with ID:", input.data.projectId)
                success("Project created successfully!", "Redirecting to editor...")

                
                router.push(`/project/${input.data.projectId}?initPrompt=${encodeURIComponent(prompt)}`)
            }
        }
        catch(err: any){
            
            console.error("Error sending prompt:", err)
            
            
            if (err.response?.status === 401) {
                error("Unauthorized", "Your session has expired. Please sign in again.")
            } else if (err.response?.status === 404) {
                error("Not found", "Backend server is not responding.")
            } else if (err.response?.status >= 500) {
                error("Server error", "Backend is experiencing issues. Please try again later.")
            } else if (err.message === "Network Error") {
                error("Network error", "Could not connect to backend. Check your connection.")
            } else {
                error("Error sending prompt", err.response?.data?.error || "Something went wrong")
            }
        }
        finally {
            
            setIsLoading(false)
        }
    }

    
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
            e.preventDefault()
            handleSend()
        }
    }

  return (
    <>
    <div className="flex w-full max-w-2xl gap-2">
            <Textarea
              placeholder="Enter your prompt here (Shift+Enter for new line)"
              className="flex-1 h-14 px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}  
            />

            <Button 
              className="h-14 w-14 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed" 
              onClick={handleSend}
              disabled={isLoading}  
              title={isLoading ? "Generating..." : "Send prompt"}
            >
              {isLoading ? (
                <Loader className="h-5 w-5 animate-spin" />  
              ) : (
                <Send className="h-9 w-9" />
              )}
            </Button>
          </div>
    </>
  )
}

export default Prompt