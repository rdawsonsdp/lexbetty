'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCatering } from '@/context/CateringContext';
import { getProductById } from '@/lib/products';
import { formatCurrency } from '@/lib/pricing';
import { CateringProduct } from '@/lib/types';
import {
  ConciergeChatMessage,
  ConciergeResponse,
  ConciergeMatchedItem,
  ConciergeUnmatchedItem,
} from '@/lib/concierge/types';

// Calculate price directly from AI-specified quantity + product pricing
// (bypasses calculateProductOrder which auto-sizes by headcount)
function getItemPrice(product: CateringProduct, item: ConciergeMatchedItem): number {
  const p = product.pricing;
  switch (p.type) {
    case 'pan': {
      const size = p.sizes.find(s => s.size === (item.size || 'full')) || p.sizes[p.sizes.length - 1];
      return size.price * item.quantity;
    }
    case 'tray': {
      const size = p.sizes[p.sizes.length - 1]; // largest
      return size.price * item.quantity;
    }
    case 'per-each':
      return p.priceEach * item.quantity;
    case 'per-lb':
      return p.pricePerLb * item.quantity;
    case 'per-person':
      return p.pricePerPerson * item.quantity;
    case 'per-dozen':
      return p.pricePerDozen * item.quantity;
    case 'per-container':
      return p.pricePerContainer * item.quantity;
    case 'flat':
      return p.flatPrice * item.quantity;
    default:
      return 0;
  }
}

interface DisplayMessage {
  role: 'user' | 'assistant';
  content: string;
  response?: ConciergeResponse;
}

const SUGGESTED_PROMPTS = [
  "Hi, I'd like to place a catering order",
  'We need BBQ for 50 people next Saturday',
  'I have a corporate lunch for 75, budget around $20/person',
];

export default function ConciergePage() {
  const router = useRouter();
  const { dispatch } = useCatering();
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [apiMessages, setApiMessages] = useState<ConciergeChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latestResponse, setLatestResponse] = useState<ConciergeResponse | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + 'px';
    }
  }, [input]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        // Stop all tracks
        stream.getTracks().forEach(t => t.stop());

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (audioBlob.size === 0) return;

        setIsTranscribing(true);
        try {
          const formData = new FormData();
          formData.append('audio', audioBlob, 'recording.webm');

          const res = await fetch('/api/concierge/transcribe', {
            method: 'POST',
            body: formData,
          });

          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || 'Transcription failed');
          }

          const { text } = await res.json();
          if (text && text.trim()) {
            setInput(text.trim());
            // Focus the input so user can review/edit before sending
            inputRef.current?.focus();
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Voice transcription failed');
        } finally {
          setIsTranscribing(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch {
      setError('Microphone access denied. Please allow microphone access and try again.');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, []);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    setError(null);
    const userMessage: DisplayMessage = { role: 'user', content: text.trim() };
    setMessages(prev => [...prev, userMessage]);

    const newApiMessages: ConciergeChatMessage[] = [
      ...apiMessages,
      { role: 'user', content: text.trim() },
    ];
    setApiMessages(newApiMessages);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/concierge/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newApiMessages }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to get response');
      }

      const response: ConciergeResponse = await res.json();

      const assistantMessage: DisplayMessage = {
        role: 'assistant',
        content: response.message,
        response,
      };

      setMessages(prev => [...prev, assistantMessage]);
      setApiMessages(prev => [
        ...prev,
        { role: 'assistant', content: response.message },
      ]);
      setLatestResponse(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const loadOrderIntoCart = () => {
    if (!latestResponse) return;

    const headcount = latestResponse.event_details.headcount || 50;

    // Reset first
    dispatch({ type: 'RESET' });

    // Set up as wizard flow with build-your-own
    dispatch({ type: 'SET_ORDER_MODE', payload: 'wizard' });
    dispatch({ type: 'SET_EVENT_TYPE', payload: 'lunch' });
    dispatch({ type: 'SET_HEADCOUNT', payload: headcount });
    dispatch({ type: 'SET_ORDER_TYPE', payload: 'build-your-own' });

    // Add each matched item (quantity=1 per item — the pricing engine
    // auto-calculates pans/lbs based on headcount)
    latestResponse.matched_items.forEach((item: ConciergeMatchedItem) => {
      const product = getProductById(item.product_id);
      if (product) {
        dispatch({ type: 'ADD_ITEM', payload: product });
        // Set size override if the AI specified one
        if (item.size) {
          dispatch({
            type: 'SET_ITEM_SIZE',
            payload: { productId: product.id, size: item.size },
          });
        }
      }
    });
  };

  const handleLoadOrder = () => {
    loadOrderIntoCart();
    router.push('/checkout');
  };

  const handleEditOrder = () => {
    loadOrderIntoCart();
    dispatch({ type: 'SET_STEP', payload: 5 });
    router.push('/');
  };

  // Calculate order total from latest response using AI-specified quantities
  const getOrderSummary = () => {
    if (!latestResponse || latestResponse.matched_items.length === 0) return null;

    const headcount = latestResponse.event_details.headcount || 50;
    let total = 0;
    const items: { title: string; price: number; notes?: string }[] = [];

    latestResponse.matched_items.forEach((item: ConciergeMatchedItem) => {
      const product = getProductById(item.product_id);
      if (!product) return;

      const price = getItemPrice(product, item);
      total += price;
      items.push({
        title: product.title,
        price,
        notes: item.notes,
      });
    });

    return { items, total, headcount, perPerson: total / headcount };
  };

  const orderSummary = getOrderSummary();

  return (
    <div className="min-h-screen bg-[#F5EDE0] flex flex-col">
      {/* Header */}
      <div className="bg-[#1A1A1A] py-6">
        <div className="container mx-auto px-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-3 transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </Link>
          <h1 className="font-oswald text-3xl font-bold text-[#F5EDE0] tracking-wider">
            ASK BETTY
          </h1>
          <p className="text-white/60 mt-1">
            Tell us what you need — Betty will build your order
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6 h-full">
          {/* Chat Area */}
          <div className="lg:col-span-2 flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden" style={{ minHeight: '600px' }}>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Welcome message */}
              {messages.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-[#E8621A]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-[#E8621A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h2 className="font-oswald text-2xl font-bold text-[#1A1A1A] mb-2">
                    Hi, I&apos;m Betty!
                  </h2>
                  <p className="text-gray-500 max-w-md mx-auto mb-8">
                    Tell me what you need for your event and I&apos;ll build your catering order.
                    You can paste an email, describe your event, or just tell me what sounds good.
                  </p>

                  {/* Suggested prompts */}
                  <div className="flex flex-wrap justify-center gap-2">
                    {SUGGESTED_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        onClick={() => sendMessage(prompt)}
                        className="px-4 py-2 bg-[#F5EDE0] border border-gray-200 rounded-full text-sm text-[#1A1A1A] hover:border-[#E8621A] hover:text-[#E8621A] transition-colors"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Chat messages */}
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      msg.role === 'user'
                        ? 'bg-[#1A1A1A] text-white'
                        : 'bg-[#F5EDE0] border border-gray-200 text-[#1A1A1A]'
                    }`}
                  >
                    {msg.role === 'assistant' && (
                      <p className="text-xs font-oswald text-[#E8621A] font-bold mb-1 tracking-wider">BETTY</p>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>

                    {/* Unmatched items warnings */}
                    {msg.response?.unmatched_items && msg.response.unmatched_items.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {msg.response.unmatched_items.map((item: ConciergeUnmatchedItem, j: number) => (
                          <div key={j} className="bg-[#E8621A]/10 border border-[#E8621A]/20 rounded-lg p-3">
                            <p className="text-xs font-bold text-[#E8621A] mb-1">NOT ON MENU: {item.requested}</p>
                            <p className="text-xs text-[#1A1A1A]">{item.suggestion}</p>
                            {item.suggested_product_id && (
                              <button
                                onClick={() => sendMessage(`Yes, add ${item.suggestion.split('have ')[1]?.split('(')[0] || item.requested} instead`)}
                                className="mt-2 text-xs font-bold text-[#E8621A] hover:underline"
                              >
                                Accept substitute
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Package suggestion */}
                    {msg.response?.package_suggestion && (
                      <div className="mt-3">
                        <button
                          onClick={() => {
                            const headcount = latestResponse?.event_details.headcount || 50;
                            dispatch({ type: 'RESET' });
                            dispatch({ type: 'SET_ORDER_MODE', payload: 'wizard' });
                            dispatch({ type: 'SET_EVENT_TYPE', payload: 'lunch' });
                            dispatch({ type: 'SET_HEADCOUNT', payload: headcount });
                            dispatch({ type: 'SET_ORDER_TYPE', payload: 'packages' });
                            router.push('/');
                          }}
                          className="text-xs font-bold text-[#E8621A] bg-[#E8621A]/10 hover:bg-[#E8621A]/20 px-3 py-1.5 rounded-full transition-colors"
                        >
                          View Package Deals
                        </button>
                      </div>
                    )}

                    {/* Follow-up question buttons */}
                    {msg.response?.follow_up_questions && msg.response.follow_up_questions.length > 0 && i === messages.length - 1 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {msg.response.follow_up_questions.slice(0, 3).map((q: string, j: number) => (
                          <button
                            key={j}
                            onClick={() => sendMessage(q.replace(/\?$/, '').replace(/^Would you like to /, 'Yes, ').replace(/^Should I /, 'Yes, '))}
                            className="text-xs px-3 py-1.5 bg-white border border-gray-200 rounded-full text-[#1A1A1A] hover:border-[#E8621A] hover:text-[#E8621A] transition-colors"
                          >
                            {q.length > 50 ? q.slice(0, 50) + '...' : q}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-[#F5EDE0] border border-gray-200 rounded-2xl px-4 py-3">
                    <p className="text-xs font-oswald text-[#E8621A] font-bold mb-1 tracking-wider">BETTY</p>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-[#E8621A] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-[#E8621A] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-[#E8621A] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <form onSubmit={handleSubmit} className="border-t border-gray-200 p-4">
              <div className="flex gap-3 items-end">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Tell Betty what you need, or paste an email..."
                  rows={1}
                  className="flex-1 resize-none border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8621A]/50 focus:border-[#E8621A] text-[#1A1A1A]"
                  disabled={isLoading}
                />
                {/* Mic button */}
                <button
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isLoading || isTranscribing}
                  className={`p-3 rounded-xl transition-all flex-shrink-0 ${
                    isRecording
                      ? 'bg-red-500 text-white animate-pulse'
                      : isTranscribing
                      ? 'bg-gray-200 text-gray-400'
                      : 'bg-gray-100 text-[#1A1A1A] hover:bg-gray-200'
                  } disabled:opacity-40`}
                  title={isRecording ? 'Stop recording' : isTranscribing ? 'Transcribing...' : 'Record voice message'}
                >
                  {isTranscribing ? (
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : isRecording ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <rect x="6" y="6" width="12" height="12" rx="2" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  )}
                </button>

                {/* Send button */}
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="bg-[#E8621A] text-white p-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40 flex-shrink-0"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
              {isRecording && (
                <p className="text-xs text-red-500 font-medium mt-2 flex items-center gap-1">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  Recording... tap the stop button when done
                </p>
              )}
              {!isRecording && (
                <p className="text-xs text-gray-400 mt-2">
                  Press Enter to send, Shift+Enter for new line, or use the mic
                </p>
              )}
            </form>
          </div>

          {/* Order Preview Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="font-oswald text-lg font-bold text-[#1A1A1A] mb-4 tracking-wider">
                ORDER PREVIEW
              </h2>

              {!orderSummary ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-400">
                    Your order will appear here as Betty builds it
                  </p>
                </div>
              ) : (
                <>
                  {/* Event & contact details */}
                  {latestResponse?.event_details && (() => {
                    const d = latestResponse.event_details;
                    const v = (s?: string) => s && !s.includes('UNKNOWN') && !s.includes('unknown') ? s : '';
                    const name = v(d.customer_name);
                    const email = v(d.customer_email);
                    const phone = v(d.customer_phone);
                    const eventType = v(d.event_type);
                    return (
                    <div className="mb-4 pb-4 border-b border-gray-100 space-y-1">
                      {name && (
                        <p className="text-sm text-[#1A1A1A] font-medium">{name}</p>
                      )}
                      {email && (
                        <p className="text-xs text-gray-500">{email}</p>
                      )}
                      {phone && (
                        <p className="text-xs text-gray-500">{phone}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mt-1">
                        {eventType && (
                          <span className="bg-[#E8621A]/10 text-[#E8621A] px-2 py-0.5 rounded-full font-medium">
                            {eventType}
                          </span>
                        )}
                        {d.headcount && (
                          <span>{d.headcount} guests</span>
                        )}
                        {d.event_date && !d.event_date.includes('UNKNOWN') && (
                          <span>
                            {new Date(d.event_date + 'T12:00:00').toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        )}
                      </div>
                      {/* Missing info — prompt user to tell Betty */}
                      {(!name || !email || !phone || !eventType) && latestResponse.matched_items.length > 0 && (
                        <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded-lg p-2 space-y-1.5">
                          <p className="text-xs text-yellow-700 font-medium">Tell Betty:</p>
                          {!name && (
                            <button
                              onClick={() => { setInput('My name is '); inputRef.current?.focus(); }}
                              className="block w-full text-left text-xs text-yellow-700 hover:text-[#E8621A] transition-colors"
                            >
                              &rarr; Your name
                            </button>
                          )}
                          {!email && (
                            <button
                              onClick={() => { setInput('My email is '); inputRef.current?.focus(); }}
                              className="block w-full text-left text-xs text-yellow-700 hover:text-[#E8621A] transition-colors"
                            >
                              &rarr; Your email address
                            </button>
                          )}
                          {!phone && (
                            <button
                              onClick={() => { setInput('My phone number is '); inputRef.current?.focus(); }}
                              className="block w-full text-left text-xs text-yellow-700 hover:text-[#E8621A] transition-colors"
                            >
                              &rarr; Your phone number
                            </button>
                          )}
                          {!eventType && (
                            <button
                              onClick={() => { setInput('This is for a '); inputRef.current?.focus(); }}
                              className="block w-full text-left text-xs text-yellow-700 hover:text-[#E8621A] transition-colors"
                            >
                              &rarr; What type of event
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    );
                  })()}

                  {/* Items */}
                  <div className="space-y-3 mb-4">
                    {orderSummary.items.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <div className="flex-1 min-w-0">
                          <p className="text-[#1A1A1A] font-medium truncate">{item.title}</p>
                          {item.notes && (
                            <p className="text-xs text-gray-400 truncate">{item.notes}</p>
                          )}
                        </div>
                        <p className="font-semibold text-[#1A1A1A] ml-3 flex-shrink-0">
                          {formatCurrency(item.price)}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Totals */}
                  <div className="border-t border-gray-200 pt-4 space-y-2">
                    <div className="flex justify-between font-oswald font-bold text-lg">
                      <span className="text-[#1A1A1A]">Estimated Total</span>
                      <span className="text-[#E8621A]">{formatCurrency(orderSummary.total)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Per Person</span>
                      <span>{formatCurrency(orderSummary.perPerson)}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Delivery fee calculated at checkout
                    </p>
                  </div>

                  {/* Action buttons */}
                  <div className="mt-6 space-y-3">
                    {latestResponse?.order_ready && (
                      <button
                        onClick={handleLoadOrder}
                        className="w-full bg-[#E8621A] text-white font-oswald font-bold text-lg tracking-wider py-3 rounded-lg hover:opacity-90 transition-opacity"
                      >
                        PROCEED TO CHECKOUT
                      </button>
                    )}

                    {!latestResponse?.order_ready && orderSummary.items.length > 0 && (
                      <button
                        onClick={() => sendMessage("That looks good, let's proceed with this order")}
                        className="w-full bg-[#1A1A1A] text-white font-oswald font-bold tracking-wider py-3 rounded-lg hover:bg-[#E8621A] transition-colors"
                        disabled={isLoading}
                      >
                        CONFIRM THIS ORDER
                      </button>
                    )}

                    {orderSummary.items.length > 0 && (
                      <button
                        onClick={handleEditOrder}
                        className="w-full border-2 border-[#1A1A1A] text-[#1A1A1A] font-oswald font-bold tracking-wider py-3 rounded-lg hover:bg-[#1A1A1A] hover:text-white transition-colors"
                      >
                        EDIT ORDER
                      </button>
                    )}
                  </div>
                </>
              )}

              {/* Help */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-400">
                  Need help? Call{' '}
                  <a href="tel:3126008155" className="text-[#E8621A] font-semibold hover:underline">
                    (312) 600-8155
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
