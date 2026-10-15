import React, { useEffect, useRef, useState } from 'react';
import { SendIcon, XIcon, MessageSquareIcon } from 'lucide-react';

const ChatPanel = ({ isOpen, onClose, messages = [], onSendMessage, currentUser }) => {
  const [text, setText] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim()) {
      onSendMessage(text);
      setText("");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  if (!isOpen) return null;

  return (
    <aside className="w-full sm:w-88 h-full bg-white/95 backdrop-blur-2xl border-l border-slate-200/90 flex flex-col z-30 shadow-2xl transition-all duration-300">
      
      {/* Header */}
      <div className="p-4.5 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
            <MessageSquareIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 text-sm">Meeting Chat</h3>
            <span className="text-[11px] text-slate-400">Real-time in-session messages</span>
          </div>
        </div>
        <button 
          onClick={onClose} 
          className="p-1.5 rounded-xl hover:bg-slate-200/70 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer" 
          aria-label="Close chat"
        >
          <XIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3.5">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 text-xs px-6">
            <div className="p-4 rounded-full bg-slate-100 text-slate-400 mb-3">
              <MessageSquareIcon className="w-6 h-6" />
            </div>
            <p className="font-semibold text-slate-700">No messages yet</p>
            <p className="mt-1 text-slate-400 leading-relaxed">
              Send a message below to start chatting with other participants in this meeting.
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.senderId === currentUser?.id || msg.sender === currentUser?.id;
            const formattedTime = msg.time || (msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "");

            return (
              <div key={msg.id || index} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                <div className="flex items-center gap-1.5 mb-1 px-1">
                  <span className="text-[11px] font-semibold text-slate-500">
                    {isMe ? "You" : msg.senderName}
                  </span>
                  {formattedTime && (
                    <span className="text-[10px] text-slate-400">
                      • {formattedTime}
                    </span>
                  )}
                </div>

                <div className={`px-4 py-2.5 rounded-2xl max-w-[85%] text-xs leading-relaxed shadow-xs ${
                  isMe 
                    ? "bg-primary text-white rounded-tr-xs font-normal" 
                    : "bg-slate-100 text-slate-800 rounded-tl-xs border border-slate-200/80 font-normal"
                }`}>
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Composer */}
      <form onSubmit={handleSubmit} className="p-3.5 border-t border-slate-200/80 bg-slate-50/70 flex items-center gap-2">
        <input 
          type="text"
          placeholder="Type a message (Enter to send)..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-white border border-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 outline-none transition-all shadow-xs"
        />

        <button
          type="submit"
          disabled={!text.trim()}
          className="p-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white disabled:opacity-40 transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
          title="Send message"
        >
          <SendIcon className="w-4 h-4" />
        </button>
      </form>

    </aside>
  );
};

export default ChatPanel;
