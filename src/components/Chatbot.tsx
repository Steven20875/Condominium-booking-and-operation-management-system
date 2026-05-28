import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Sparkles, Building, User, Bot, HelpCircle } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatbotProps {
  user: { name: string; role: string; unitNumber?: string } | null;
}

const QUICK_SUGGESTIONS = [
  "Rent a loft / Zenith Suite price",
  "How to pay maintenance dues",
  "How fast is repair technical response?",
  "Where is One Spatial Iloilo located?"
];

export default function Chatbot({ user }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Welcome to **Gales Urban Haven** support desk! 🌟\n\nI can help you with renting rates, booking suites, paying bills via **One Spatial Pay**, or reporting maintenance issues (resolved in **under 20 minutes**).\n\nWhat can I assist you with?`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [promptBadge, setPromptBadge] = useState<boolean>(true);
  const messageEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom whenever messages list grows
  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  // Automatically fade out the "Need assistance?" prompt chip after 6 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setPromptBadge(false);
    }, 6000);
    return () => clearTimeout(timer);
  }, []);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      role: 'user',
      content: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      });

      if (!response.ok) {
        throw new Error('API server integration error.');
      }

      const data = await response.json();
      
      const assistantMsg: ChatMessage = {
        id: Math.random().toString(),
        role: 'assistant',
        content: data.text || "I apologize, but I couldn't reach the support center at this time.",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [
        ...prev,
        {
          id: Math.random().toString(),
          role: 'assistant',
          content: "I'm having trouble connecting to Gales Server. However, feel free to register or login to manage bookings or resolve issues! You can also contact us at support@galesurbanhaven.com or +63 917 123 4567.",
          timestamp: new Date()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const getCleanTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans select-none">
      
      {/* Floating Prompt Badge */}
      <AnimatePresence>
        {promptBadge && !isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute bottom-16 right-0 bg-slate-900 border border-blue-500/20 text-white py-3 px-4 rounded-2xl shadow-2xl text-xs w-52 leading-relaxed"
          >
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-3 w-3 text-blue-400 animate-pulse" />
              <span className="font-bold text-blue-400 uppercase tracking-widest text-[9px] font-mono">Gales Desk Active</span>
            </div>
            <p className="text-slate-300 font-medium text-[11px]">
              Need help with bookings or maintenance? Let's chat!
            </p>
            <button 
              onClick={() => setPromptBadge(false)}
              className="absolute top-2 right-2 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="h-3 w-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main FAB (Floating Action Button) */}
      <button
        id="chatbot-fab"
        onClick={() => {
          setIsOpen(!isOpen);
          setPromptBadge(false);
        }}
        className={`h-14 w-14 rounded-full flex items-center justify-center text-white shadow-2xl transition-all duration-300 transform active:scale-95 cursor-pointer relative overflow-hidden group border border-white/10 ${
          isOpen 
            ? 'bg-slate-950 text-white' 
            : 'bg-gradient-to-tr from-slate-900 via-blue-950 to-slate-950 hover:shadow-blue-500/10 hover:shadow-2xl'
        }`}
      >
        {/* Glowing border effects */}
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-700/20 to-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {isOpen ? (
          <X className="h-6 w-6 relative z-10 text-white" />
        ) : (
          <MessageSquare className="h-6 w-6 relative z-10 text-blue-400 group-hover:text-blue-200 transition-colors" />
        )}
      </button>

      {/* Chat Window Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: -20, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="absolute bottom-16 right-0 w-[410px] sm:w-[380px] max-w-[calc(100vw-32px)] h-[560px] bg-[#0c1322]/98 backdrop-blur-md rounded-3xl shadow-2xl border border-white/10 flex flex-col overflow-hidden"
          >
            {/* Header section with brand info */}
            <div className="bg-gradient-to-r from-slate-950 to-slate-900 border-b border-white/10 px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-blue-950 border border-blue-600/30 flex items-center justify-center">
                  <Building className="h-4.5 w-4.5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white font-serif tracking-wide">Gales Urban Desk</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-[10px] text-slate-400 font-mono">Agent matches live</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 px-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Conversation Messages List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
              
              {messages.map((m) => {
                const isUser = m.role === 'user';
                return (
                  <div key={m.id} className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
                    
                    {/* Bot Avatar */}
                    {!isUser && (
                      <div className="h-7 w-7 rounded-lg bg-blue-950 border border-blue-900/40 flex items-center justify-center shrink-0 mt-0.5">
                        <Bot className="h-3.5 w-3.5 text-blue-400" />
                      </div>
                    )}

                    <div className="flex flex-col max-w-[80%] space-y-1">
                      <div 
                        className={`text-xs px-4 py-3 rounded-2xl leading-relaxed font-normal ${
                          isUser
                            ? 'bg-blue-600 border border-blue-500/20 text-white rounded-br-none'
                            : 'bg-slate-900/90 border border-white/5 text-slate-200 rounded-bl-none font-medium'
                        }`}
                        style={{ whiteSpace: 'pre-wrap' }}
                      >
                        {/* Render simple formatting for highlights */}
                        {m.content.split('**').map((text, idx) => {
                          return idx % 2 === 1 ? <strong key={idx} className="font-bold text-white bg-white/5 px-1 rounded">{text}</strong> : text;
                        })}
                      </div>
                      
                      {/* Message metadata / sender */}
                      <span className={`text-[9px] text-slate-500 font-mono ${isUser ? 'text-right' : 'text-left'}`}>
                        {getCleanTime(m.timestamp)} {user && isUser ? `• ${user.name}` : ''}
                      </span>
                    </div>

                    {/* User Avatar */}
                    {isUser && (
                      <div className="h-7 w-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                        <User className="h-3.5 w-3.5 text-slate-300" />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Typing indicator */}
              {isLoading && (
                <div className="flex gap-2.5 justify-start">
                  <div className="h-7 w-7 rounded-lg bg-blue-950 border border-blue-900/40 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="h-3.5 w-3.5 text-blue-400" />
                  </div>
                  <div className="bg-slate-900/90 border border-white/5 px-4 py-3.5 rounded-2xl rounded-bl-none flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}

              <div ref={messageEndRef} />
            </div>

            {/* Suggestions Chips drawer */}
            {messages.length < 5 && (
              <div className="px-4 py-2 border-t border-white/5 bg-slate-950/40 space-y-1.5">
                <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500 font-mono block">Suggestions:</span>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_SUGGESTIONS.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSendMessage(suggestion)}
                      className="text-[10px] bg-white/5 border border-white/10 hover:border-blue-500/40 hover:bg-white/10 text-slate-300 hover:text-white px-2.5 py-1 rounded-full transition-all text-left truncate max-w-[340px] cursor-pointer"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Form with unified layout */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(input);
              }}
              className="p-4 bg-slate-950 border-t border-white/10 flex gap-2 items-center"
            >
              <input
                type="text"
                placeholder="Ask Gales support..."
                disabled={isLoading}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 bg-slate-900 text-white placeholder-slate-500 text-xs py-3 px-4 rounded-2xl border border-white/5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="h-9 w-9 flex items-center justify-center bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white disabled:text-slate-500 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
