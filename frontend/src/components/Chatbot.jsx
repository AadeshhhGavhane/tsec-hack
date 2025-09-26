import { useEffect, useState } from 'react';
import { Send, X, Mic, ImageIcon } from 'lucide-react';
import { chatAPI, transactionAPI } from '../services/api';

const Chatbot = ({ open = false, onClose = () => {} }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([{ 
    role: 'assistant', 
    content: 'Hi! I can add transactions or show your recent ones. Try "add lunch 250" or "show groceries this week".' 
  }]);
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);

  const send = async () => {
    if (!input.trim()) return;
    const msg = { role: 'user', content: input.trim() };
    setMessages(m => [...m, msg]);
    setInput('');
    setLoading(true);
    try {
      const res = await chatAPI.chatWithTools([...messages, msg].map(m => ({ role: m.role, content: m.content })));
      if (res.success) {
        setMessages(m => [...m, { role: 'assistant', content: res.data.reply }]);
      } else {
        setMessages(m => [...m, { role: 'assistant', content: 'Sorry, I could not complete that.' }]);
      }
    } catch (e) {
      setMessages(m => [...m, { role: 'assistant', content: 'Error contacting assistant.' }]);
    } finally {
      setLoading(false);
    }
  };

  const uploadImage = async (file) => {
    try {
      setMessages(m => [...m, { role: 'user', content: 'Uploaded receipt image.' }]);
      const res = await transactionAPI.analyzeImage(file);
      if (res.success) {
        const d = res.data;
        // Provide full structured hint so chat tool can create without guessing
        const structured = `add title:${d.record_title} amount:${d.record_amount} category:${d.record_category} type:${d.record_flow} desc:${d.record_description}`;
        setInput('');
        const prompt = { role: 'user', content: structured };
        setMessages(m => [...m, prompt]);
        setLoading(true);
        const r = await chatAPI.chatWithTools([...messages, prompt].map(m => ({ role: m.role, content: m.content })));
        if (r.success) {
          setMessages(m => [...m, { role: 'assistant', content: r.data.reply }]);
        }
      } else {
        setMessages(m => [...m, { role: 'assistant', content: 'Could not read the image.' }]);
      }
    } catch (e) {
      setMessages(m => [...m, { role: 'assistant', content: 'Image analysis failed.' }]);
    } finally { 
      setLoading(false); 
    }
  };

  const toggleRecord = async () => {
    if (recording) {
      try { 
        mediaRecorder && mediaRecorder.stop(); 
      } catch {}
      setRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      const chunks = [];
      mr.ondataavailable = (e) => { 
        if (e.data.size > 0) chunks.push(e.data); 
      };
      mr.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setMessages(m => [...m, { role: 'user', content: 'Recorded voice note.' }]);
        setLoading(true);
        try {
          const res = await transactionAPI.analyzeAudio(blob);
          if (res.success) {
            const d = res.data;
            const structured = `add title:${d.record_title} amount:${d.record_amount} category:${d.record_category} type:${d.record_flow} desc:${d.record_description}`;
            const prompt = { role: 'user', content: structured };
            setMessages(m => [...m, prompt]);
            const r = await chatAPI.chatWithTools([...messages, prompt].map(m => ({ role: m.role, content: m.content })));
            if (r.success) {
              setMessages(m => [...m, { role: 'assistant', content: r.data.reply }]);
            }
          } else {
            setMessages(m => [...m, { role: 'assistant', content: 'Could not transcribe audio.' }]);
          }
        } catch { 
          setMessages(m => [...m, { role: 'assistant', content: 'Audio analysis failed.' }]); 
        }
        finally { 
          setLoading(false); 
        }
      };
      mr.start();
      setMediaRecorder(mr);
      setRecording(true);
    } catch { 
      setMessages(m => [...m, { role: 'assistant', content: 'Microphone permission denied.' }]); 
    }
  };

  return (
    <>
      {open && (
        <div className="fixed right-0 top-16 bottom-0 z-50 w-80 sm:w-96 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="font-semibold text-gray-900 dark:text-white">Assistant</div>
            <button 
              onClick={onClose} 
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X size={18} />
            </button>
          </div>
          
          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3" style={{ height: 'calc(100vh - 180px)' }}>
            {messages.map((m, i) => (
              <div 
                key={i} 
                className={`px-3 py-2 rounded-lg text-sm max-w-xs ${
                  m.role === 'user'
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 ml-auto'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                }`}
              >
                {m.content}
              </div>
            ))}
            {loading && (
              <div className="text-sm text-gray-500 px-3">Thinking…</div>
            )}
          </div>
          
          {/* Input Area - Fixed at bottom */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-3 bg-white dark:bg-gray-800">
            <div className="flex items-center gap-2">
              <button 
                className={`p-2 rounded-lg transition-colors ${
                  recording 
                    ? 'bg-red-500 text-white' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                onClick={toggleRecord}
                title={recording ? 'Stop recording' : 'Start voice recording'}
              >
                <Mic size={18} />
              </button>
              
              <label className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer transition-colors"
                title="Upload image">
                <ImageIcon size={18} />
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => { 
                    const f = e.target.files?.[0]; 
                    if (f) uploadImage(f); 
                    e.target.value = ''; 
                  }} 
                />
              </label>
              
              <input 
                value={input} 
                onChange={e => setInput(e.target.value)} 
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} 
                placeholder="Type a message…" 
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
              
              <button 
                onClick={send} 
                disabled={loading || !input.trim()} 
                className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white transition-colors"
                title="Send message"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;