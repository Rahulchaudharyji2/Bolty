

"use client"

import React, { useEffect, useState } from "react"
import Navbar from "@/components/navbar"
import Prompt from "@/components/Prompt"
import ConversationHistory from "@/components/ConversationHistory"
import Toast, { ToastMessage } from "@/components/Toast"
import { useWebSocket } from "@/hooks/useWebSocket"
import { useToast } from "@/hooks/useToast"
import { VscodeUrl, VscodeBasePath } from "@/config"
import { useSearchParams } from "next/navigation"
import { Loader } from "lucide-react"
import { use } from "react";

interface ProjectPageProps {
  params: Promise<{
    projectid: string;
  }>;
}
function Project({ params }: ProjectPageProps) {
  const { projectid } = use(params);
  const searchParams = useSearchParams()
  
  
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationStatus, setGenerationStatus] = useState<string>("")
  const { toasts, removeToast } = useToast()
  const [vscodeFolder, setVscodeFolder] = useState(
    `${VscodeBasePath}/${projectid}`
  )
  const [viewMode, setViewMode] = useState<"editor" | "preview" | "instructions">("editor")
  const [previewPort, setPreviewPort] = useState<string>("8081")
  const [previewMode, setPreviewMode] = useState<"direct" | "proxy">("direct")

  const getPreviewUrl = () => {
    const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    if (previewMode === "direct") {
      return `http://${host}:${previewPort === "3000" ? "3001" : previewPort}/`;
    } else {
      return `${VscodeUrl}/proxy/${previewPort}/`;
    }
  };

  
  const { isConnected } = useWebSocket({
    projectId: projectid,
    onMessage: (message: any) => {
      console.log("Received WebSocket message:", message)
      
      
      switch (message.type) {
        case "prompt-start":
          setIsGenerating(true)
          setGenerationStatus("Starting code generation...")
          break
        
        case "update-file":
          setIsGenerating(true)
          const fileName = message.path ? message.path.split("/").pop() : "file"
          setGenerationStatus(`Writing file: ${fileName}`)
          break
        
        case "command":
          setIsGenerating(true)
          setGenerationStatus(`Running command: ${message.content}`)
          break
        
        case "prompt-end":
          setIsGenerating(false)
          setGenerationStatus("Done!")
          
          setTimeout(() => setGenerationStatus(""), 2000)
          break
        
        case "error":
          setIsGenerating(false)
          setGenerationStatus("Generation failed.")
          console.error("Generation error:", message.content || message)
          break
        
        default:
          console.log("Unhandled WebSocket message type:", message.type)
      }
    },
    onConnect: () => {
      console.log("WebSocket connected")
    },
    onDisconnect: () => {
      console.log("WebSocket disconnected")
    },
    onError: (error) => {
      console.error("WebSocket error:", error)
    },
  })

  
  useEffect(() => {
    const initPrompt = searchParams.get("initPrompt")
    if (initPrompt) {
      console.log("Initial prompt:", initPrompt)
      
    }
  }, [searchParams])

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-gray-900">
      
      <Navbar />

      
      {isGenerating && (
        <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/30 border-b border-blue-200 dark:border-blue-800 flex items-center gap-2">
          <Loader className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
            {generationStatus}
          </span>
        </div>
      )}

      
      <div className="px-4 py-1 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
        <div
          className={`w-2 h-2 rounded-full ${
            isConnected ? "bg-green-500" : "bg-red-500"
          }`}
        />
        <span className="text-xs text-gray-600 dark:text-gray-400">
          {isConnected ? "Connected" : "Connecting..."} • Using folder: {vscodeFolder}
        </span>
      </div>

      
      <div className="flex flex-1 overflow-hidden">
        
        <div
          className="border-r border-gray-200 dark:border-gray-700 overflow-y-auto flex flex-col"
          style={{ width: "300px" }}
        >
          
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              💬 Conversation
            </h2>
          </div>

          
          <ConversationHistory projectId={projectid} />

          
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
            <Prompt projectId={projectid} />
          </div>
        </div>

        
        <div className="flex-1 flex flex-col">
          
          <div className="px-4 py-1.5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setViewMode("editor")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === "editor"
                    ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm border border-gray-200 dark:border-gray-600"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                💻 Embedded Code Editor
              </button>
              <button
                onClick={() => setViewMode("preview")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === "preview"
                    ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm border border-gray-200 dark:border-gray-600"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                🌐 Live Preview
              </button>
              <button
                onClick={() => setViewMode("instructions")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === "instructions"
                    ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm border border-gray-200 dark:border-gray-600"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                🔧 Manual / Local Setup
              </button>
            </div>
            <div className="flex items-center gap-4">
              {viewMode === "preview" && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Port:</span>
                  <input
                    type="text"
                    value={previewPort}
                    onChange={(e) => setPreviewPort(e.target.value)}
                    className="w-16 px-2 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono"
                  />
                </div>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 font-mono hidden md:block">
                {vscodeFolder}
              </p>
            </div>
          </div>

          
          <div className="flex-1 overflow-hidden bg-gray-50 dark:bg-gray-900 flex flex-col">
            {viewMode === "editor" ? (
              <iframe
                src={`${VscodeUrl}/?folder=${vscodeFolder}`}
                className="w-full h-full border-none bg-gray-900"
                title="Code Editor"
                allow="clipboard-read; clipboard-write;"
              />
            ) : viewMode === "preview" ? (
              <div className="flex-1 flex flex-col bg-white dark:bg-gray-955">
                <div className="px-4 py-1.5 bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between text-xs text-gray-500">
                  <span className="font-mono truncate text-gray-600 dark:text-gray-400">
                    {getPreviewUrl()}
                  </span>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setPreviewMode(previewMode === "direct" ? "proxy" : "direct")}
                      className="px-2 py-0.5 hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 font-medium rounded transition-colors"
                      title="Switch between Direct Port and VS Code Proxy connection"
                    >
                      🔌 {previewMode === "direct" ? "Switch to Proxy" : "Switch to Direct"}
                    </button>
                    <button 
                      onClick={() => {
                        const iframe = document.getElementById('preview-iframe') as HTMLIFrameElement;
                        if (iframe) iframe.src = iframe.src;
                      }}
                      className="px-2 py-0.5 hover:bg-gray-200 dark:hover:bg-gray-800 text-blue-600 dark:text-blue-400 font-medium rounded transition-colors"
                    >
                      🔄 Reload Page
                    </button>
                  </div>
                </div>
                <iframe
                  id="preview-iframe"
                  src={getPreviewUrl()}
                  className="flex-1 w-full border-none bg-white"
                  title="App Live Preview"
                  allow="geolocation; microphone; camera; midi; encrypted-media;"
                />
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto flex items-center justify-center p-8">
                <div className="text-center space-y-6 max-w-md my-auto">
                  
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      💻 VS Code Integration
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300">
                      Open your project in VS Code to view and edit generated code
                    </p>
                  </div>

                  
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Project Folder:</p>
                    <code className="text-sm text-yellow-600 dark:text-yellow-400 break-all bg-gray-100 dark:bg-gray-900 p-2 rounded block">
                      {vscodeFolder}
                    </code>
                  </div>

                  
                  <button
                    onClick={() => {
                      
                      const url = `vscode://file${vscodeFolder}`
                      window.location.href = url
                      
                      setTimeout(() => {
                        alert('VS Code did not open.\n\nMake sure VS Code is installed and run:\ncode ' + vscodeFolder)
                      }, 2000)
                    }}
                    className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                  >
                    ✨ Open in VS Code
                  </button>

                  
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Or run this command in terminal:</p>
                    <div className="bg-gray-900 dark:bg-gray-950 rounded-lg p-3 font-mono text-sm text-green-400 overflow-x-auto">
                      <code>code {vscodeFolder}</code>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`code ${vscodeFolder}`)
                        alert('Copied to clipboard!')
                      }}
                      className="w-full px-3 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                      📋 Copy command
                    </button>
                  </div>

                  
                  <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Or open the entire workspace:</p>
                    <button
                      onClick={() => {
                        
                        const url = 'vscode://file' + window.location.pathname.split('/').slice(0, -2).join('/') + '/boltapp.code-workspace'
                        window.location.href = url
                        setTimeout(() => {
                          alert('Run in terminal:\ncode boltapp.code-workspace')
                        }, 2000)
                      }}
                      className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
                    >
                      📁 Open Workspace
                    </button>
                  </div>

                  
                  <p className="text-xs text-gray-500 dark:text-gray-400 pt-4">
                    ℹ️ Make sure VS Code is installed and accessible from command line
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      
      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  )
}

export default Project