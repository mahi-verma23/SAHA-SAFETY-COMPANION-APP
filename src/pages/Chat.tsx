import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Send, Bot, User, Mic, Square, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import BottomNav from '@/components/BottomNav';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchMessages();
    const warmup = setInterval(() => {
      fetch(`${import.meta.env.VITE_BACKEND_URL}/health`).catch(() => {});
    }, 14 * 60 * 1000);
    return () => clearInterval(warmup);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    fetch(`${import.meta.env.VITE_BACKEND_URL}/health`).catch(() => {});
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) { console.error('Error fetching messages:', error); return; }
    if (data && data.length > 0) {
      setMessages(data.map(msg => ({ ...msg, role: msg.role as 'user' | 'assistant' })));
    }
  };

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { sampleRate: 24000, channelCount: 1, echoCancellation: true, noiseSuppression: true }
      });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processVoiceRecording(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      toast({ title: '🎙️ Recording...', description: 'Speak now. Tap stop when done.' });
    } catch (error) {
      toast({ title: 'Error', description: 'Could not access microphone.', variant: 'destructive' });
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processVoiceRecording = async (audioBlob: Blob) => {
    try {
      toast({ title: 'Processing...', description: 'Transcribing your voice message...' });
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const formData = new FormData();
        formData.append('audio', new File([audioBlob], 'recording.wav', { type: 'audio/webm' }));
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/anal-audio`, {
          method: 'POST', body: formData
        });
        const data = await response.json();
        if (!data.success) {
          toast({ title: '⚠️ Voice processing slow', description: 'Try again in 30 seconds', variant: 'destructive' });
          return;
        }
        setInput(data.transcript);
        toast({ title: '✅ Got it!', description: 'Review and send.' });
      };
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to transcribe voice.', variant: 'destructive' });
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const userMessage = input;
    setInput('');
    setIsLoading(true);

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMsg]);

    supabase.from('chat_messages').insert([{ user_id: user.id, role: 'user', content: userMessage }]).then(() => {});

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, session_id: user.id }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      const data = await response.json();
      if (!data.success) throw new Error(data.error);

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, aiMsg]);
      supabase.from('chat_messages').insert([{ user_id: user.id, role: 'assistant', content: data.response }]).then(() => {});
    } catch (error: any) {
      if (error.name === 'AbortError') {
        toast({ title: '⏳ Server waking up...', description: 'Please try again in 30 seconds!', variant: 'destructive' });
      } else {
        toast({ title: 'Error', description: 'Failed to get response', variant: 'destructive' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col pb-24 page-enter"
      style={{
        background: 'linear-gradient(135deg, hsl(340 100% 98%) 0%, hsl(280 100% 98%) 100%)'
      }}
    >
      {/* Header */}
      <div
        className="p-4 border-b sticky top-0 z-10"
        style={{
          background: 'rgba(255,255,255,0.8)',
          backdropFilter: 'blur(16px)',
          borderColor: 'rgba(236, 72, 153, 0.15)'
        }}
      >
        <div className="max-w-md mx-auto flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, hsl(340 80% 60%), hsl(280 70% 55%))' }}
          >
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold gradient-text">SAHA AI</h1>
            <p className="text-xs text-muted-foreground">Your safety companion</p>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-muted-foreground">Online</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-md mx-auto w-full">
        {messages.length === 0 && (
          <div
            className="p-8 text-center rounded-3xl mt-8"
            style={{
              background: 'rgba(255,255,255,0.6)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(236, 72, 153, 0.15)'
            }}
          >
            <div
              className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center float"
              style={{ background: 'linear-gradient(135deg, hsl(340 80% 60%), hsl(280 70% 55%))' }}
            >
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-xl font-bold gradient-text mb-2">Your AI Companion</h3>
            <p className="text-muted-foreground text-sm">
              I'm here to support you. Feel free to talk to me in any language.
            </p>
            <div className="flex flex-wrap gap-2 justify-center mt-4">
              {["I need help", "Draft a complaint", "I feel unsafe", "Legal advice"].map(suggestion => (
                <button
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  className="px-3 py-1 rounded-full text-xs font-medium transition-all"
                  style={{
                    background: 'rgba(236, 72, 153, 0.1)',
                    color: 'hsl(340 80% 60%)',
                    border: '1px solid rgba(236, 72, 153, 0.2)'
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(message => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            style={{ animation: 'slideUp 0.3s ease-out' }}
          >
            {message.role === 'assistant' && (
              <div
                className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, hsl(340 80% 60%), hsl(280 70% 55%))' }}
              >
                <Sparkles className="h-4 w-4 text-white" />
              </div>
            )}
            <div
              className="p-3 max-w-[80%] rounded-2xl"
              style={message.role === 'user' ? {
                background: 'linear-gradient(135deg, hsl(340 80% 60%), hsl(280 70% 55%))',
                color: 'white',
                borderBottomRightRadius: '4px'
              } : {
                background: 'rgba(255,255,255,0.8)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(236, 72, 153, 0.15)',
                borderBottomLeftRadius: '4px'
              }}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
            {message.role === 'user' && (
              <div
                className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(236, 72, 153, 0.1)' }}
              >
                <User className="h-4 w-4 text-primary" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div
              className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, hsl(340 80% 60%), hsl(280 70% 55%))' }}
            >
              <Sparkles className="h-4 w-4 text-white animate-pulse" />
            </div>
            <div
              className="p-4 rounded-2xl"
              style={{
                background: 'rgba(255,255,255,0.8)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(236, 72, 153, 0.15)',
                borderBottomLeftRadius: '4px'
              }}
            >
              <div className="flex gap-1 items-center">
                <span className="h-2 w-2 bg-pink-400 rounded-full animate-bounce" />
                <span className="h-2 w-2 bg-pink-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="h-2 w-2 bg-pink-400 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div
        className="p-4 max-w-md mx-auto w-full"
        style={{
          background: 'rgba(255,255,255,0.8)',
          backdropFilter: 'blur(16px)',
          borderTop: '1px solid rgba(236, 72, 153, 0.15)'
        }}
      >
        <div className="flex gap-2 items-center">
          <Input
            placeholder={isRecording ? "🎙️ Recording..." : "Type or speak your message..."}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && !isRecording && sendMessage()}
            disabled={isLoading || isRecording}
            className="rounded-xl border-pink-200 focus:border-pink-400 bg-white/80"
          />
          <button
            onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
            disabled={isLoading}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all flex-shrink-0"
            style={{
              background: isRecording
                ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                : 'rgba(236, 72, 153, 0.1)',
              color: isRecording ? 'white' : 'hsl(340 80% 60%)'
            }}
          >
            {isRecording
              ? <Square className="h-4 w-4 animate-pulse" />
              : <Mic className="h-4 w-4" />
            }
          </button>
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim() || isRecording}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all flex-shrink-0 btn-gradient"
            style={{ opacity: isLoading || !input.trim() ? 0.5 : 1 }}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>

      <BottomNav currentTab="chat" onTabChange={() => {}} />
    </div>
  );
}