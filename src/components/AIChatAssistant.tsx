import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Brain } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTED_QUESTIONS = [
  'How do I report a road problem?',
  'Where is my complaint?',
  'Which department handles water problems?',
  'What is my complaint status?',
];

function generateResponse(question: string): string {
  const q = question.toLowerCase();
  if (q.includes('report') || q.includes('submit') || q.includes('file') || q.includes('road')) {
    return "To submit a complaint, click on 'Submit a Complaint' on the home page or go to the Submit Complaint page in your citizen dashboard. Fill in the complaint details, and GRACE AI will automatically classify and route it to the correct department.";
  }
  if (q.includes('where') && q.includes('complaint')) {
    return "You can track your complaint by going to the Track Complaint page and entering your complaint ID (e.g., GRV-2026-XXXXX). You'll see a full timeline and live SLA countdown.";
  }
  if (q.includes('water')) {
    return "Water supply complaints are handled by the Water Supply Department. When you submit a water-related complaint, GRACE AI will automatically route it to this department with an SLA of 24 hours.";
  }
  if (q.includes('status')) {
    return "To check your complaint status, go to your Citizen Dashboard and click on 'My Complaints', or use the Track Complaint page with your complaint ID.";
  }
  if (q.includes('electric')) {
    return "Electricity complaints (street lights, power outages) are routed to the Electrical Department with an SLA of 24 hours. Submit your complaint and GRACE AI will handle the routing.";
  }
  if (q.includes('sla')) {
    return "SLA (Service Level Agreement) is the expected resolution time for your complaint. GRACE AI predicts this based on complaint category and priority. High priority = 24h, Medium = 48h, Low = 72h.";
  }
  if (q.includes('department')) {
    return "GRACE AI manages 8 departments: Municipal Engineering, Water Supply, Electricity, Sanitation, Public Health, Police, Transport, and Education. Each complaint is automatically routed to the relevant department.";
  }
  if (q.includes('hello') || q.includes('hi') || q.includes('hey')) {
    return "Hello! I'm GRACE AI, your grievance assistant. How can I help you today? You can ask me about submitting complaints, tracking status, or department information.";
  }
  return "I'm GRACE AI, your grievance assistant. I can help you with submitting complaints, tracking their status, understanding SLA, or finding the right department. Try asking: 'How do I report a road problem?' or 'Which department handles water complaints?'";
}

export function AIChatAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hi! I'm GRACE AI, your grievance assistant. How can I help you today?" },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setTyping(true);
    setTimeout(() => {
      const response = generateResponse(text);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      setTyping(false);
    }, 800);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-105 transition-all flex items-center justify-center group"
      >
        <Brain className="w-6 h-6" />
        <span className="absolute right-full mr-3 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity border border-slate-700">
          Ask GRACE AI
        </span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[calc(100vw-3rem)] sm:w-96 h-[500px] max-h-[80vh] flex flex-col rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden animate-slide-up">
      <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold text-white">GRACE AI Assistant</div>
            <div className="text-[10px] text-cyan-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400" /> Online
            </div>
          </div>
        </div>
        <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-200">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm ${
              msg.role === 'user'
                ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white rounded-br-md'
                : 'bg-slate-800 text-slate-200 rounded-bl-md'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {typing && (
          <div className="flex justify-start">
            <div className="bg-slate-800 px-4 py-3 rounded-2xl rounded-bl-md">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {messages.length <= 2 && (
        <div className="px-4 pb-2">
          <div className="text-xs text-slate-500 mb-2">Suggested questions:</div>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED_QUESTIONS.map((q, i) => (
              <button
                key={i}
                onClick={() => handleSend(q)}
                className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="p-3 border-t border-slate-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend(input)}
            placeholder="Ask me anything..."
            className="flex-1 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50"
          />
          <button
            onClick={() => handleSend(input)}
            className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 text-white flex items-center justify-center hover:opacity-90 transition-opacity"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
