import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, PatientInfo, ScreeningResult } from '../types';
import { chatWithHealthAssistant } from '../services/geminiService';
import { Send, Bot, User, MessageSquare } from 'lucide-react';

interface Props {
  patientInfo: PatientInfo;
  screeningResult: ScreeningResult;
}

const ChatAssistant: React.FC<Props> = ({ patientInfo, screeningResult }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: `Chào bạn, tôi là trợ lý ảo của VN HealthGuard. Dựa trên kết quả sàng lọc "${screeningResult.summary}", bạn có câu hỏi gì thêm về tình trạng sức khỏe, đơn thuốc tham khảo hay cách chăm sóc không?`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      // Filter messages for API context (limit history to last 10 interactions to save tokens)
      const historyForApi = messages.slice(-10);
      const responseText = await chatWithHealthAssistant(historyForApi, userMsg.text, patientInfo, screeningResult);

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "Xin lỗi, đã có lỗi xảy ra khi kết nối với máy chủ AI. Vui lòng thử lại.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200 flex flex-col h-[600px]">
      {/* Chat Header */}
      <div className="bg-indigo-600 p-4 flex items-center gap-3 text-white shadow-md z-10">
        <div className="p-2 bg-white/20 rounded-full">
            <MessageSquare className="w-5 h-5" />
        </div>
        <div>
            <h3 className="font-bold text-lg">Hỏi đáp với Bác sĩ AI</h3>
            <p className="text-indigo-200 text-xs">Hỗ trợ 24/7 về kết quả sàng lọc của bạn</p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-end gap-2 ${
              msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === 'user' ? 'bg-teal-500' : 'bg-indigo-500'
            }`}>
                {msg.role === 'user' ? <User size={16} className="text-white"/> : <Bot size={16} className="text-white"/>}
            </div>
            
            <div
              className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                msg.role === 'user'
                  ? 'bg-teal-500 text-white rounded-tr-none'
                  : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0">
                <Bot size={16} className="text-white"/>
            </div>
            <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-gray-200 shadow-sm">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex items-center gap-2 relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Nhập câu hỏi của bạn..."
            className="w-full pl-4 pr-12 py-3 bg-gray-100 border-0 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            disabled={isTyping}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="absolute right-2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors"
          >
            <Send size={18} />
          </button>
        </div>
        <p className="text-center text-xs text-gray-400 mt-2">AI có thể mắc lỗi. Hãy tham khảo ý kiến bác sĩ chuyên khoa.</p>
      </div>
    </div>
  );
};

export default ChatAssistant;
