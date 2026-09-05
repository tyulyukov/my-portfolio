import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

import type { FormEvent } from 'react';

interface Message {
  role: 'user' | 'bot';
  content: string;
}
const welcome: Message = {
  role: 'bot',
  content: "I'm ChatGBT. Ask me something strange, specific, or mildly embarrassing."
};
const prompts = [
  'Explain my career like a pirate',
  'Write a bad startup slogan',
  'Should I touch grass?'
];
function replyTo(message: string, count: number) {
  const text = message.toLowerCase();
  if (count === 0) return "I don't know what the fuck you are talking about";
  if (text.includes('grass')) return 'Yes. Take water too. I will keep your tabs warm.';
  if (text.includes('pirate'))
    return 'Arrr, a capable engineer sails toward bugs and leaves no console logs behind.';
  if (text.includes('slogan'))
    return '"We put the sync in asynchronous." Terrible. Use it immediately.';
  if (text.includes('hello') || text.includes('hi'))
    return 'Hello. I have read the room and it is mostly TypeScript.';
  return [
    'That sounds plausible. Write it down before the idea escapes.',
    'A bold move. My professional opinion is to add a snack break first.',
    'I ran the numbers on a napkin. The napkin requested a second opinion.'
  ][count % 3];
}
export default function ChatGBTApp() {
  const [messages, setMessages] = useState<Message[]>([welcome]);
  const [history, setHistory] = useState<Array<{ id: number; messages: Message[] }>>([]);
  const historyId = useRef(0);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollReference = useRef<HTMLDivElement>(null);
  const timerReference = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const countReference = useRef(0);
  const clearTimer = () => {
    if (timerReference.current) clearTimeout(timerReference.current);
    timerReference.current = undefined;
  };
  useEffect(() => clearTimer, []);
  useLayoutEffect(() => {
    const element = scrollReference.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [messages, isTyping]);
  const saveConversation = () => {
    if (messages.length > 1)
      setHistory((items) => [{ id: ++historyId.current, messages }, ...items]);
  };
  const restoreConversation = (id: number) => {
    const conversation = history.find((item) => item.id === id);
    if (!conversation || isTyping) return;
    saveConversation();
    setHistory((items) => items.filter((item) => item.id !== id));
    setMessages(conversation.messages);
    countReference.current = conversation.messages.filter(
      (message) => message.role === 'user'
    ).length;
    setInput('');
  };
  const newChat = () => {
    clearTimer();
    saveConversation();
    countReference.current = 0;
    setMessages([welcome]);
    setInput('');
    setIsTyping(false);
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const question = input.trim();
    if (!question || isTyping) return;
    const count = countReference.current++;
    setInput('');
    setMessages((items) => [...items, { role: 'user', content: question }]);
    setIsTyping(true);
    clearTimer();
    timerReference.current = setTimeout(() => {
      timerReference.current = undefined;
      setMessages((items) => [...items, { role: 'bot', content: replyTo(question, count) }]);
      setIsTyping(false);
    }, 650);
  };
  return (
    <div className='flex h-full min-h-0 bg-[#f7f7f8] font-sans text-[#202123]'>
      <aside className='hidden w-48 shrink-0 flex-col border-r border-black/[.07] bg-[#efefef] p-2.5 sm:flex'>
        <button
          onClick={newChat}
          className='rounded-lg border border-black/10 bg-white px-3 py-2 text-left text-xs font-medium shadow-sm transition hover:bg-zinc-50'
        >
          + New chat
        </button>
        <p className='mt-5 px-2 text-[10px] font-semibold uppercase tracking-[.12em] text-zinc-400'>
          Today
        </p>
        <p className='mt-2 truncate rounded-md bg-white/70 px-2.5 py-2 text-[11px] text-zinc-700'>
          {messages.find((message) => message.role === 'user')?.content ?? 'New conversation'}
        </p>
        <div className='min-h-0 overflow-y-auto'>
          {history.map((conversation) => (
            <button
              key={conversation.id}
              disabled={isTyping}
              onClick={() => restoreConversation(conversation.id)}
              className='mt-1 w-full truncate rounded-md px-2.5 py-2 text-left text-xs hover:bg-white/70 disabled:opacity-50'
            >
              {conversation.messages.find((message) => message.role === 'user')?.content}
            </button>
          ))}
        </div>
        <p className='mt-auto px-2 text-[10px] text-zinc-400'>ChatGBT 1.0</p>
      </aside>
      <main className='flex min-w-0 flex-1 flex-col'>
        <header className='flex h-11 shrink-0 items-center justify-between border-b border-black/[.07] bg-white/80 px-3 backdrop-blur'>
          <div className='flex items-center gap-2'>
            <span className='grid h-6 w-6 place-items-center rounded-full bg-[#10a37f] text-xs font-bold text-white'>
              G
            </span>
            <span className='text-xs font-semibold'>
              ChatGBT <span className='font-normal text-zinc-400'>3.5ish</span>
            </span>
          </div>
          <button
            onClick={newChat}
            className='rounded-md px-2 py-1 text-[11px] text-zinc-500 transition hover:bg-zinc-100 sm:hidden'
          >
            New chat
          </button>
        </header>
        <div
          ref={scrollReference}
          role='log'
          aria-label='Conversation'
          aria-live='polite'
          className='min-h-0 flex-1 overflow-y-auto'
        >
          <div className='mx-auto flex max-w-2xl flex-col gap-4 px-3 py-5 sm:px-6'>
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`flex gap-2.5 ${message.role === 'user' ? 'justify-end' : ''}`}
              >
                {message.role === 'bot' && (
                  <span className='grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#10a37f] text-[10px] font-bold text-white'>
                    G
                  </span>
                )}
                <p
                  className={`max-w-[82%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-[13px] leading-5 shadow-sm ${message.role === 'user' ? 'rounded-br-md bg-[#10a37f] text-white' : 'rounded-bl-md border border-black/[.05] bg-white text-zinc-800'}`}
                >
                  {message.content}
                </p>
              </div>
            ))}
            {isTyping && (
              <div className='flex items-center gap-2.5'>
                <span className='grid h-6 w-6 place-items-center rounded-full bg-[#10a37f] text-[10px] font-bold text-white'>
                  G
                </span>
                <span className='flex gap-1 rounded-2xl rounded-bl-md border border-black/[.05] bg-white px-3 py-3'>
                  <i className='h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-400 motion-reduce:animate-none' />
                  <i className='h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-400 [animation-delay:150ms] motion-reduce:animate-none' />
                  <i className='h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-400 [animation-delay:300ms] motion-reduce:animate-none' />
                </span>
              </div>
            )}
          </div>
        </div>
        <div className='shrink-0 border-t border-black/[.07] bg-white px-3 py-2.5'>
          <div className='mx-auto max-w-2xl'>
            <div className='mb-2 flex gap-1.5 overflow-x-auto pb-0.5'>
              {prompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => setInput(prompt)}
                  disabled={isTyping}
                  className='shrink-0 rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[10px] text-zinc-600 transition hover:border-[#10a37f]/40 hover:text-[#0d8064] disabled:opacity-50'
                >
                  {prompt}
                </button>
              ))}
            </div>
            <form
              onSubmit={submit}
              className='flex items-center rounded-xl border border-zinc-200 bg-white p-1 shadow-sm focus-within:border-[#10a37f]/60 focus-within:ring-2 focus-within:ring-[#10a37f]/10'
            >
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                disabled={isTyping}
                aria-label='Message ChatGBT'
                placeholder='Message ChatGBT...'
                className='min-w-0 flex-1 bg-transparent px-2 py-1.5 text-[13px] outline-none placeholder:text-zinc-400 disabled:opacity-50'
              />
              <button
                type='submit'
                disabled={isTyping || !input.trim()}
                aria-label='Send message'
                className='grid h-7 w-7 place-items-center rounded-lg bg-[#10a37f] text-sm text-white transition hover:bg-[#0d896b] disabled:bg-zinc-200 disabled:text-zinc-400'
              >
                ↑
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
