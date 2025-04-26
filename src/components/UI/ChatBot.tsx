import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Anthropic } from '@anthropic-ai/sdk';
import { MessageParam } from '@anthropic-ai/sdk/resources';

// Initialize Anthropic client with API key from environment variables
const anthropic = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY
});

interface Message {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

const ChatBot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const retryCount = useRef(0);
  const maxRetries = 3;
  const abortController = useRef<AbortController | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    return () => {
      // Cleanup: abort any ongoing streams when component unmounts
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, []);

  const fetchDataFromSupabase = async (query: string) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items(*)
        `);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching data:', error);
      return [];
    }
  };

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const isNetworkError = (error: Error): boolean => {
    return (
      error instanceof TypeError && (
        error.message.includes('NetworkError') ||
        error.message.includes('Failed to fetch') ||
        error.message.includes('Network request failed')
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setError(null);
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      // Validate API key
      if (!import.meta.env.VITE_ANTHROPIC_API_KEY) {
        throw new Error('Anthropic API key is not configured. Please check your environment variables.');
      }

      // Fetch relevant data from Supabase
      const data = await fetchDataFromSupabase(userMessage);

      // Prepare context for Claude
      const context = `You are an AI analytics assistant for a restaurant management system. 
      You have access to the following data: ${JSON.stringify(data)}
      
      Please analyze this data to answer the user's question: "${userMessage}"
      
      Provide insights, trends, and recommendations based on the data. Use specific numbers and percentages when relevant.
      Format your response in a clear, concise way using markdown.`;
      
      // Create a new abort controller for this request
      if (abortController.current) {
        abortController.current.abort();
      }
      abortController.current = new AbortController();
      
      // Add empty assistant message that will be streamed to
      setMessages(prev => [...prev, { 
        role: 'assistant',
        content: '',
        isStreaming: true
      }]);
      
      let lastError: Error | null = null;
      
      while (retryCount.current < maxRetries) {
        try {
          const stream = await anthropic.messages.create({
            model: "claude-3-sonnet-20240229",
            max_tokens: 1024,
            messages: [{
              role: 'user',
              content: context
            }] as MessageParam[],
            stream: true
          });
          
          let streamedContent = '';
          
          for await (const chunk of stream) {
            if (chunk.type === 'content_block_delta') {
              streamedContent += chunk.delta.text;
              setMessages(prev => prev.map((msg, i) => 
                i === prev.length - 1 ? { ...msg, content: streamedContent } : msg
              ));
            }
          }
          
          // Mark message as no longer streaming
          setMessages(prev => prev.map((msg, i) => 
            i === prev.length - 1 ? { ...msg, isStreaming: false } : msg
          ));
          
          // Reset retry counter on successful request
          retryCount.current = 0;
          return;
          
        } catch (error) {
          if (error.name === 'AbortError') {
            console.log('Request aborted');
            return;
          }
          
          lastError = error;
          retryCount.current++;
          
          if (retryCount.current < maxRetries) {
            // Exponential backoff
            await delay(Math.pow(2, retryCount.current) * 1000);
            continue;
          }
        }
      }

      // If we've exhausted retries and still have an error, throw it
      if (lastError) throw lastError;

    } catch (error) {
      console.error('ChatBot Error:', error);
      let errorMessage = 'An unexpected error occurred';

      if (error instanceof Error) {
        if (isNetworkError(error)) {
          errorMessage = 'Network connection error. Please check your internet connection and try again.';
        }
        // API key errors
        else if (error.message.includes('API key') || error.message.includes('401')) {
          errorMessage = 'Authentication error. Please contact support.';
        }
        // Rate limiting
        else if (error.message.includes('rate') || error.message.includes('429')) {
          errorMessage = 'Too many requests. Please wait a moment and try again.';
        }
        // Model errors
        else if (error.message.includes('model')) {
          errorMessage = 'AI model temporarily unavailable. Please try again later.';
        }
        // Other known errors
        else {
          errorMessage = error.message;
        }
      }

      setError(errorMessage);
      setMessages(prev => {
        // Remove the streaming message if it exists
        const newMessages = prev.filter(msg => !msg.isStreaming);
        return [...newMessages, { 
          role: 'assistant', 
          content: `I apologize, but I encountered an error: ${errorMessage}. Please try again later.`
        }];
      });
    } finally {
      setIsLoading(false);
      abortController.current = null;
      retryCount.current = 0;
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center">
        <Bot className="w-6 h-6 text-teal-600 dark:text-teal-500 mr-2" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Analytics Assistant</h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-teal-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
              }`}
            >
              <div className="prose dark:prose-invert max-w-none">
                {message.content}
                {message.isStreaming && (
                  <span className="inline-block w-2 h-4 ml-1 bg-teal-600 dark:bg-teal-500 animate-pulse" />
                )}
              </div>
            </div>
          </div>
        ))}
        {isLoading && !messages.some(m => m.isStreaming) && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
              <Loader2 className="w-6 h-6 animate-spin text-teal-600 dark:text-teal-500" />
            </div>
          </div>
        )}
        {error && (
          <div className="flex justify-center">
            <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100 rounded-lg p-3 text-sm">
              {error}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your business data..."
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 dark:bg-gray-700 dark:text-white"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <Send size={20} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatBot;