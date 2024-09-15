'use client'

import { useState, useEffect, useRef } from 'react'
import { useUser } from '@clerk/nextjs'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useChat } from 'ai/react'
import { supabase } from '@/lib/supabase'

export default function DollyChat() {
  const { user } = useUser()
  const [model, setModel] = useState('o1-preview')
  const { messages, input, handleInputChange, handleSubmit, setMessages } = useChat({
    api: '/api/chat',
    body: { model },
    onFinish: async (message) => {
      await saveMessageToSupabase(message)
    },
  })
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true })
      
      if (error) {
        console.error('Error fetching messages:', error)
      } else {
        setMessages(data)
      }
    }

    fetchMessages()
  }, [])

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  const saveMessageToSupabase = async (message: any) => {
    const { error } = await supabase
      .from('messages')
      .insert({ content: message.content, role: message.role })
    
    if (error) {
      console.error('Error saving message:', error)
    }
  }

  const handleModelChange = (newModel: string) => {
    setModel(newModel)
  }

  return (
    <div className="flex flex-col h-screen relative">
      <div className="absolute inset-0 bg-cover bg-center z-0 opacity-15" 
           style={{backgroundImage: "url('https://images.unsplash.com/photo-1635070041078-e363dbe005cb')"}} />
      <div className="absolute inset-0 bg-purple-500 opacity-30 z-10" />

      <div className="relative z-20 flex flex-col h-full">
        <header className="bg-purple-600 p-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Avatar>
              <AvatarImage src={user?.profileImageUrl} />
              <AvatarFallback>DP</AvatarFallback>
            </Avatar>
            <h1 className="text-2xl font-bold">DollyGPT - Physics Assistant</h1>
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={() => handleModelChange('o1-preview')}
              variant={model === 'o1-preview' ? 'secondary' : 'ghost'}
            >
              o1-preview
            </Button>
            <Button
              onClick={() => handleModelChange('o1-mini')}
              variant={model === 'o1-mini' ? 'secondary' : 'ghost'}
            >
              o1-mini
            </Button>
          </div>
        </header>
        <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
              <div className={`rounded-lg p-2 max-w-[70%] ${
                message.role === 'user' 
                  ? 'bg-purple-200 text-purple-900' 
                  : 'bg-white text-purple-800'
              }`}>
                {message.content}
              </div>
            </div>
          ))}
        </ScrollArea>
        <form onSubmit={handleSubmit} className="p-4 bg-purple-100">
          <div className="flex space-x-2">
            <Input 
              value={input} 
              onChange={handleInputChange}
              placeholder="Ask a physics question..."
              className="flex-grow bg-white"
            />
            <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white">Send</Button>
          </div>
        </form>
      </div>
    </div>
  )
}