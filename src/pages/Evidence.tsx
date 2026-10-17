import { useState, useEffect } from "react";
import { FileAudio, FileVideo, Trash2, Shield, Lock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BottomNav from "@/components/BottomNav";
import { useToast } from "@/components/ui/use-toast";

interface Recording {
  id: string;
  type: 'audio' | 'video';
  url: string;
  timestamp: Date;
  size: number;
}

export default function Evidence() {
  const { toast } = useToast();
  const [audioFiles, setAudioFiles] = useState<Recording[]>([]);
  const [videoFiles, setVideoFiles] = useState<Recording[]>([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('saha_recordings') || '[]');
    setAudioFiles(saved.filter((r: Recording) => r.type === 'audio'));
    setVideoFiles(saved.filter((r: Recording) => r.type === 'video'));

    const handleNewRecording = (event: CustomEvent) => {
      const recording = event.detail as Recording;
      if (recording.type === 'audio') {
        setAudioFiles(prev => [...prev, recording]);
      } else {
        setVideoFiles(prev => [...prev, recording]);
      }
    };

    window.addEventListener('newRecording', handleNewRecording as EventListener);
    return () => window.removeEventListener('newRecording', handleNewRecording as EventListener);
  }, []);

  const handleDelete = (type: "audio" | "video", id: string) => {
    const existing = JSON.parse(localStorage.getItem('saha_recordings') || '[]');
    const updated = existing.filter((r: Recording) => r.id !== id);
    localStorage.setItem('saha_recordings', JSON.stringify(updated));
    if (type === 'audio') {
      setAudioFiles(prev => prev.filter(f => f.id !== id));
    } else {
      setVideoFiles(prev => prev.filter(f => f.id !== id));
    }
    toast({ title: "🗑️ File deleted" });
  };

  const RecordingCard = ({ file, type }: { file: Recording; type: 'audio' | 'video' }) => (
    <div
      className="p-4 rounded-2xl card-hover"
      style={{
        background: 'rgba(255,255,255,0.7)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(236, 72, 153, 0.15)'
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, hsl(340 80% 60%), hsl(280 70% 55%))' }}
          >
            {type === 'audio'
              ? <FileAudio className="w-4 h-4 text-white" />
              : <FileVideo className="w-4 h-4 text-white" />
            }
          </div>
          <div>
            <p className="text-xs font-medium text-foreground">
              {type === 'audio' ? '🎙️ Audio Recording' : '📹 Video Recording'}
            </p>
            <p className="text-xs text-muted-foreground">
              {new Date(file.timestamp).toLocaleString()}
            </p>
          </div>
        </div>
        <button
          onClick={() => handleDelete(type, file.id)}
          className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-red-50 transition-all"
        >
          <Trash2 className="w-4 h-4 text-red-400" />
        </button>
      </div>
      {type === 'audio'
        ? <audio src={file.url} controls className="w-full" />
        : <video src={file.url} controls className="w-full rounded-xl" />
      }
    </div>
  );

  const EmptyState = ({ type }: { type: string }) => (
    <div
      className="p-8 text-center rounded-3xl"
      style={{
        background: 'rgba(255,255,255,0.5)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(236, 72, 153, 0.1)'
      }}
    >
      <div
        className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center float"
        style={{ background: 'rgba(236, 72, 153, 0.1)' }}
      >
        {type === 'video'
          ? <FileVideo className="w-8 h-8 text-primary" />
          : <FileAudio className="w-8 h-8 text-primary" />
        }
      </div>
      <h3 className="font-semibold gradient-text mb-1">
        No {type} recordings yet
      </h3>
      <p className="text-sm text-muted-foreground">
        Go to Tools tab to start recording
      </p>
    </div>
  );

  return (
    <div
      className="min-h-screen p-4 pb-24 page-enter"
      style={{ background: 'linear-gradient(135deg, hsl(340 100% 98%) 0%, hsl(280 100% 98%) 100%)' }}
    >
      <div className="max-w-md mx-auto space-y-4">

        {/* Header */}
        <div className="flex items-center gap-3 pt-2">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, hsl(340 80% 60%), hsl(280 70% 55%))' }}
          >
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold gradient-text">Evidence Vault</h1>
            <p className="text-xs text-muted-foreground">Secure local storage</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Audio', count: audioFiles.length, icon: '🎙️' },
            { label: 'Video', count: videoFiles.length, icon: '📹' },
            { label: 'Total', count: audioFiles.length + videoFiles.length, icon: '📁' }
          ].map(stat => (
            <div
              key={stat.label}
              className="p-3 rounded-2xl text-center"
              style={{
                background: 'rgba(255,255,255,0.7)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(236, 72, 153, 0.15)'
              }}
            >
              <p className="text-xl">{stat.icon}</p>
              <p className="text-2xl font-bold gradient-text">{stat.count}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList
            className="grid w-full grid-cols-3 rounded-2xl p-1"
            style={{ background: 'rgba(236, 72, 153, 0.1)' }}
          >
            <TabsTrigger value="all" className="rounded-xl text-xs">
              All ({audioFiles.length + videoFiles.length})
            </TabsTrigger>
            <TabsTrigger value="audio" className="rounded-xl text-xs">
              Audio ({audioFiles.length})
            </TabsTrigger>
            <TabsTrigger value="video" className="rounded-xl text-xs">
              Video ({videoFiles.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-3 mt-4">
            {audioFiles.length === 0 && videoFiles.length === 0 ? (
              <EmptyState type="audio or video" />
            ) : (
              <>
                {audioFiles.map(file => <RecordingCard key={file.id} file={file} type="audio" />)}
                {videoFiles.map(file => <RecordingCard key={file.id} file={file} type="video" />)}
              </>
            )}
          </TabsContent>

          <TabsContent value="audio" className="space-y-3 mt-4">
            {audioFiles.length === 0
              ? <EmptyState type="audio" />
              : audioFiles.map(file => <RecordingCard key={file.id} file={file} type="audio" />)
            }
          </TabsContent>

          <TabsContent value="video" className="space-y-3 mt-4">
            {videoFiles.length === 0
              ? <EmptyState type="video" />
              : videoFiles.map(file => <RecordingCard key={file.id} file={file} type="video" />)
            }
          </TabsContent>
        </Tabs>

        {/* Privacy card */}
        <div
          className="p-4 rounded-2xl"
          style={{
            background: 'rgba(236, 72, 153, 0.05)',
            border: '1px solid rgba(236, 72, 153, 0.15)'
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Lock className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm gradient-text">Privacy & Security</h3>
          </div>
          <ul className="text-xs text-muted-foreground space-y-1 pl-6">
            <li>• Recordings stored locally on your device</li>
            <li>• Timestamped for legal purposes</li>
            <li>• Download before clearing browser data</li>
          </ul>
        </div>
      </div>

      <BottomNav currentTab="evidence" onTabChange={() => {}} />
    </div>
  );
}