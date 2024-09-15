'use client'

import { useState, useEffect, useRef } from 'react'
import { useUser, RedirectToSignIn } from '@clerk/nextjs'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useChat } from 'ai/react'
import { db } from '@/db'
import { messages, chats } from '@/db/schema'
import { v4 as uuidv4 } from 'uuid';

export default function DollyChat() {
  const { user, isLoaded, isSignedIn } = useUser()
  const [model, setModel] = useState('o1-preview')
  const [chatId, setChatId] = useState<string | null>(null)
  const { messages: chatMessages, input, handleInputChange, handleSubmit, setMessages } = useChat({
    api: '/api/chat',
    body: { model, chatId },
    onFinish: async (message) => {
      await saveMessageToDatabase(message)
    },
  })
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      return <RedirectToSignIn />;
    }

    const initializeChat = async () => {
      if (user) {
        const newChatId = uuidv4();
        await db.insert(chats).values({
          id: newChatId,
          userId: user.id,
          title: 'New Chat',
        });
        setChatId(newChatId);
      }
    };

    initializeChat();
  }, [isLoaded, isSignedIn, user]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (chatId) {
        const fetchedMessages = await db.select().from(messages).where(eq(messages.chatId, chatId));
        setMessages(fetchedMessages);
      }
    }

    fetchMessages()
  }, [chatId])

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [chatMessages])

  const saveMessageToDatabase = async (message: any) => {
    if (chatId) {
      await db.insert(messages).values({
        chatId,
        role: message.role,
        content: message.content,
      });
    }
  }

  const handleModelChange = (newModel: string) => {
    setModel(newModel)
  }

  if (!isLoaded || !isSignedIn) {
    return null; // or a loading spinner
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
            <h1 className="text-2xl font-bold">DollyGPT - Physics & Chemistry Assistant</h1>
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
          {chatMessages.map((message, index) => (
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
              placeholder="Ask a physics or chemistry question..."
              className="flex-grow bg-white"
            />
            <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white">Send</Button>
          </div>
        </form>
      </div>
    </div>
  )
}