

import Navbar from "@/components/navbar"
import Suggestion from "@/components/suggestion"
import Prompt from "@/components/Prompt"

export default function Home() {
  return (
    <>
      <Navbar />
      <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center px-4">
        
        <div className="text-center mb-8">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4">
            What Do You Want To Build?
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Describe your idea in plain English, and our AI will generate the code for you.
          </p>
        </div>

        
        <div className="mb-8 w-full max-w-2xl">
          <Prompt />
        </div>

        
        <div className="w-full max-w-3xl">
          <p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-4">
            Or try one of these suggestions:
          </p>
          <Suggestion />
        </div>
      </div>
    </>
  )
}
