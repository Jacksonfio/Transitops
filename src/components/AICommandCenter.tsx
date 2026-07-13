import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Send, User, Bot, Loader2, RefreshCw, Zap, BarChart3, Truck, Users, DollarSign, Fuel } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const QUICK_PROMPTS = [
  { label: 'Highest Maintenance Cost', prompt: 'Which vehicle costs the most to maintain?', icon: Truck },
  { label: 'Expiring Licenses', prompt: 'Show drivers with licenses expiring this month or next.', icon: Users },
  { label: 'Best ROI Vehicle', prompt: 'Which vehicle has the best ROI?', icon: DollarSign },
  { label: 'Fuel Efficiency', prompt: 'Which trips had the worst fuel efficiency?', icon: Fuel },
  { label: 'Fleet Utilization', prompt: 'Show current fleet utilization breakdown.', icon: BarChart3 },
  { label: 'Dispatch Advice', prompt: 'Recommend the best vehicle and driver for a 5000 kg delivery.', icon: Zap },
];

export default function AICommandCenter() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0', role: 'assistant',
      content: `**Welcome to TransitOps AI Copilot** 🚛

I have real-time access to your entire fleet data. Ask me anything:

- Which vehicle costs the most to maintain?
- Show drivers with licenses expiring this month
- Recommend the best vehicle for a 600 kg delivery
- Why did operational costs increase this week?
- Which trips had the worst fuel efficiency?
- Which vehicle has the best ROI?

Use the quick action buttons below or type your own question!`,
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(), role: 'user', content: text, timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(), role: 'assistant',
        content: data.text || data.error || 'No response received.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (e) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(), role: 'assistant',
        content: 'Connection error. Please try again.', timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([messages[0]]);
  };

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-12rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-[#0F766E]" /> AI Operations Copilot
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Powered by Gemini AI · Ask questions in natural language
          </p>
        </div>
        <button onClick={clearChat} className="btn-outline">
          <RefreshCw className="w-4 h-4" /> Clear Chat
        </button>
      </div>

      {/* Quick prompts */}
      <div className="flex flex-wrap gap-2 mb-4">
        {QUICK_PROMPTS.map(qp => {
          const Icon = qp.icon;
          return (
            <button
              key={qp.label}
              onClick={() => sendMessage(qp.prompt)}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white dark:bg-[#1C2526] border border-[#E2EAE7] dark:border-[#2D3A32] text-slate-600 dark:text-[#6B7280] hover:border-[#0F766E] hover:text-[#0F766E] hover:bg-[#0F766E]/5 dark:hover:bg-[#0F766E]/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Icon className="w-3 h-3" /> {qp.label}
            </button>
          );
        })}
      </div>

      {/* Chat window */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto bg-white dark:bg-[#1C2526] rounded-2xl border border-[#E2EAE7] dark:border-[#2D3A32] p-5 space-y-4 mb-4"
      >
        <AnimatePresence initial={false}>
          {messages.map(msg => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${msg.role === 'user'
                  ? 'bg-[#0F766E]'
                  : 'bg-gradient-to-br from-[#0F766E] to-[#0A3C36]'
                }`}>
                {msg.role === 'user'
                  ? <User className="w-4 h-4 text-white" />
                  : <Bot className="w-4 h-4 text-white" />
                }
              </div>

              <div className={`max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                <div className={`rounded-2xl px-4 py-3 text-sm ${msg.role === 'user'
                    ? 'bg-[#0F766E] text-[#111827] rounded-tr-sm'
                    : 'bg-[#F8FAF8] dark:bg-[#0F1712] text-slate-800 dark:text-[#F3F4F6] rounded-tl-sm border border-[#E2EAE7] dark:border-[#2D3A32]'
                  }`}>
                  {msg.role === 'assistant' ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-headings:my-2 prose-li:my-0.5 prose-pre:bg-slate-800 prose-pre:text-slate-100 prose-code:text-[#0F766E] dark:prose-code:text-[#0F766E] prose-code:bg-[#0F766E]/10 dark:prose-code:bg-[#0F766E]/10 prose-code:px-1 prose-code:py-0.5 prose-code:rounded">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p>{msg.content}</p>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 px-1">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0F766E] to-[#0A3C36] flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-[#F8FAF8] dark:bg-[#0F1712] border border-[#E2EAE7] dark:border-[#2D3A32] rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin text-[#0F766E]" />
                <span className="text-sm">Analyzing fleet data...</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input bar */}
      <div className="flex gap-3">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
          placeholder="Ask anything about your fleet... (e.g., 'Which vehicle needs maintenance urgently?')"
          className="form-input flex-1 text-sm"
          disabled={loading}
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={loading || !input.trim()}
          className="btn-primary px-4 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
