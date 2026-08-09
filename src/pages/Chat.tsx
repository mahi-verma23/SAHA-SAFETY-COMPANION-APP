import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Send, Bot, User, Mic, Square } from 'lucide-react';
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
  const {
    toast
  } = useToast();
  useEffect(() => {
    fetchMessages();
  }, []);
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  };
  const fetchMessages = async () => {
    const {
      data,
      error
    } = await supabase.from('chat_messages').select('*').order('created_at', {
      ascending: true
    }).limit(50);
    if (error) {
      console.error('Error fetching messages:', error);
      return;
    }
    setMessages((data || []).map(msg => ({
      ...msg,
      role: msg.role as 'user' | 'assistant'
    })));
  };
  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });
      mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: 'audio/webm'
        });
        await processVoiceRecording(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      toast({
        title: 'Recording...',
        description: 'Speak now. Tap the stop button when done.'
      });
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        title: 'Error',
        description: 'Could not access microphone. Please check permissions.',
        variant: 'destructive'
      });
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
      toast({
        title: 'Processing...',
        description: 'Transcribing your voice message...'
      });

      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = reader.result?.toString().split(',')[1];
        if (!base64Audio) {
          throw new Error('Failed to process audio');
        }

        // Call speech-to-text edge function
        const {
          data,
          error
        } = await supabase.functions.invoke('speech-to-text', {
          body: {
            audio: base64Audio
          }
        });
        if (error) throw error;
        setInput(data.text);
        toast({
          title: 'Success',
          description: 'Voice transcribed! Review and send.'
        });
      };
    } catch (error) {
      console.error('Error processing voice:', error);
      toast({
        title: 'Error',
        description: 'Failed to transcribe voice. Please try again.',
        variant: 'destructive'
      });
    }
  };
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const {
      data: {
        user
      }
    } = await supabase.auth.getUser();
    if (!user) return;
    const userMessage = input;
    setInput('');
    setIsLoading(true);

    // Save user message
    const {
      error: userError
    } = await supabase.from('chat_messages').insert([{
      user_id: user.id,
      role: 'user',
      content: userMessage
    }]);
    if (userError) {
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive'
      });
      setIsLoading(false);
      return;
    }
    try {
      // Call AI companion edge function
      const {
        data,
        error
      } = await supabase.functions.invoke('ai-chat', {
        body: {
          message: userMessage
        }
      });
      if (error) throw error;

      // Save AI response
      await supabase.from('chat_messages').insert([{
        user_id: user.id,
        role: 'assistant',
        content: data.response,
        emotion: data.sentiment
      }]);
      fetchMessages();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to get response from AI companion',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  return <div className="min-h-screen bg-gradient-to-b from-secondary to-background flex flex-col pb-24">
      <div className="bg-background/50 backdrop-blur-sm p-4 border-b sticky top-0 z-10">
        <div className="max-w-md mx-auto">
          <h1 className="text-xl font-bold text-primary">SAHA</h1>
          <p className="text-sm text-muted-foreground mt-1">Emotion aware chatbot            </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-md mx-auto w-full">
        {messages.length === 0 && <Card className="p-8 text-center">
            <Bot className="h-16 w-16 mx-auto mb-4 text-secondary" />
            <h3 className="text-xl font-semibold mb-2">Your AI Companion</h3>
            <p className="text-muted-foreground">
              I'm here to support you. Feel free to talk to me about anything.
            </p>
          </Card>}

        {messages.map(message => <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {message.role === 'assistant' && <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                <Bot className="h-5 w-5 text-secondary-foreground" />
              </div>}
            <Card className={`p-3 max-w-[80%] ${message.role === 'user' ? 'bg-secondary text-secondary-foreground' : 'bg-card'}`}>
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </Card>
            {message.role === 'user' && <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <User className="h-5 w-5 text-primary-foreground" />
              </div>}
          </div>)}

        {isLoading && <div className="flex gap-3">
            <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
              <Bot className="h-5 w-5 text-secondary-foreground animate-pulse" />
            </div>
            <Card className="p-3">
              <div className="flex gap-1">
                <span className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce" />
                <span className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </Card>
          </div>}

        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-background border-t max-w-md mx-auto w-full">
        <div className="flex gap-2">
          <Input placeholder={isRecording ? "Recording..." : "Type your message..."} value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && !isRecording && sendMessage()} disabled={isLoading || isRecording} className={isRecording ? "bg-red-50 dark:bg-red-950/20" : ""} />
          <Button onClick={isRecording ? stopVoiceRecording : startVoiceRecording} disabled={isLoading} variant={isRecording ? "destructive" : "secondary"} size="icon">
            {isRecording ? <Square className="h-4 w-4 animate-pulse" /> : <Mic className="h-4 w-4" />}
          </Button>
          <Button onClick={sendMessage} disabled={isLoading || !input.trim() || isRecording}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <BottomNav currentTab="chat" onTabChange={() => {}} />
    </div>;
}