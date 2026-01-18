import { useEffect, useLayoutEffect, useRef, useState } from 'react';

interface Message {
  role: 'user' | 'bot';
  content: string;
}

export default function ChatGBTApp() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', content: "Hello! I'm ChatGBT, how can I help you today?" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollContainerReference = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollContainerReference.current) {
      scrollContainerReference.current.scrollTop = scrollContainerReference.current.scrollHeight;
    }
  };

  useLayoutEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    const timer = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timer);
  }, [messages, isTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((previous) => [...previous, { role: 'user', content: userMessage }]);
    setIsTyping(true);

    const typingDuration = 2000 + Math.random() * 1500;
    setTimeout(() => {
      setIsTyping(false);
      setMessages((previous) => [
        ...previous,
        { role: 'bot', content: 'I don\'t know what the fuck you are talking about' }
      ]);
    }, typingDuration);
  };

  return (
    <div className='flex h-full flex-col bg-gray-900'>
      <div className='border-b border-white/10 bg-gradient-to-r from-green-600 to-teal-600 px-3 py-1.5'>
        <span className='text-[10px] font-bold text-white'>ChatGBT</span>
        <span className='ml-2 text-[8px] text-white/70'>Always Helpful™</span>
      </div>

      <div ref={scrollContainerReference} className='flex-1 space-y-2 overflow-y-auto p-2'>
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-2 py-1.5 text-[10px] ${
                message.role === 'user' ? 'bg-violet-600 text-white' : 'bg-white/10 text-white/90'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className='flex justify-start'>
            <div className='rounded-lg bg-white/10 px-2 py-1.5'>
              <div className='flex gap-1'>
                <span
                  className='h-1.5 w-1.5 animate-bounce rounded-full bg-white/50'
                  style={{ animationDelay: '0ms' }}
                />
                <span
                  className='h-1.5 w-1.5 animate-bounce rounded-full bg-white/50'
                  style={{ animationDelay: '150ms' }}
                />
                <span
                  className='h-1.5 w-1.5 animate-bounce rounded-full bg-white/50'
                  style={{ animationDelay: '300ms' }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className='border-t border-white/10 p-1.5'>
        <div className='flex gap-1.5'>
          <input
            type='text'
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='Ask me anything...'
            disabled={isTyping}
            className='flex-1 rounded border border-white/10 bg-white/5 px-2 py-1 font-mono text-[10px] text-white placeholder-white/30 outline-none focus:border-violet-500/50 disabled:opacity-50'
          />
          <button
            type='submit'
            disabled={isTyping || !input.trim()}
            className='rounded bg-violet-600 px-2 py-1 text-[10px] font-medium text-white transition-colors hover:bg-violet-500 disabled:opacity-50'
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
