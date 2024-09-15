import { OpenAIStream, StreamingTextResponse } from 'ai'
import { Configuration, OpenAIApi } from 'openai-edge'

const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
})
const openai = new OpenAIApi(config)

export const runtime = 'edge'

export async function POST(req: Request) {
  const { messages, model } = await req.json()

  const response = await openai.createChatCompletion({
    model: model === 'o1-preview' ? 'gpt-4-0125-preview' : 'gpt-3.5-turbo-0125',
    stream: true,
    messages: [
      { role: 'system', content: "You are DollyGPT, an AI assistant specialized in physics and organic chemistry. Your primary user is Dolly, a student learning physics and organic chemistry. Provide clear, concise, and accurate explanations for physics and organic chemistry concepts and problems." },
      ...messages
    ],
  })

  const stream = OpenAIStream(response)
  return new StreamingTextResponse(stream)
}