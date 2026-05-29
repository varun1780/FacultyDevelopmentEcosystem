import { useState, useRef, useEffect } from 'react';
import { aiAPI } from '../services/api';
import { HiOutlinePaperAirplane } from 'react-icons/hi';
import { HiSparkles } from 'react-icons/hi2';

export default function AIMentorPage() {
  const [messages, setMessages] = useState([{ role: 'assistant', text: 'Hello! I\'m your AI Mentor. How can I help you with your faculty development journey today?' }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);
    try {
      const res = await aiAPI.chat(userMsg, 'FDP learning assistant');
      setMessages(prev => [...prev, { role: 'assistant', text: res.data.reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Sorry, I encountered an error. Please try again.' }]);
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-4 h-[calc(100vh-150px)] flex flex-col">
      <div><h1 className="page-title flex items-center gap-2"><HiSparkles className="text-primary-500" /> AI Mentor</h1><p className="text-gray-500 text-sm">Your intelligent learning companion</p></div>
      <div className="card flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${m.role === 'user' ? 'bg-gradient-to-r from-primary-600 to-accent-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                {m.text}
              </div>
            </div>
          ))}
          {loading && <div className="flex justify-start"><div className="bg-gray-100 rounded-2xl px-4 py-3"><div className="flex gap-1"><div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" /><div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.1s' }} /><div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.2s' }} /></div></div></div>}
          <div ref={endRef} />
        </div>
        <form onSubmit={sendMessage} className="p-4 border-t border-gray-100 flex gap-2">
          <input id="ai-mentor-input" value={input} onChange={e => setInput(e.target.value)} placeholder="Ask me anything about FDPs..." className="input-field flex-1" />
          <button id="ai-mentor-send" type="submit" disabled={loading} className="btn-primary !px-4"><HiOutlinePaperAirplane className="text-lg" /></button>
        </form>
      </div>
    </div>
  );
}
