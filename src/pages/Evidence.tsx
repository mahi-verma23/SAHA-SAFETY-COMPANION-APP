import { useState } from "react";
import { FileAudio, FileVideo, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BottomNav from "@/components/BottomNav";
import { useToast } from "@/components/ui/use-toast";
import { useEffect } from "react";

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
    const audio = saved.filter((r: Recording) => r.type === 'audio');
    const video = saved.filter((r: Recording) => r.type === 'video');
    setAudioFiles(audio);
    setVideoFiles(video);

    const handleNewRecording = (event: CustomEvent) => {
      const recording = event.detail as Recording;
      if (recording.type === 'audio') {
        setAudioFiles(prev => [...prev, recording]);
      } else {
        setVideoFiles(prev => [...prev, recording]);
      }
    };

    window.addEventListener('newRecording', handleNewRecording as EventListener);
    return () => {
      window.removeEventListener('newRecording', handleNewRecording as EventListener);
    };
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
    toast({
      title: "File deleted",
      description: "Recording has been removed",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary to-background p-4 pb-24">
      <div className="max-w-md mx-auto space-y-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-primary">Evidence Vault</h1>
          <p className="text-sm text-muted-foreground">Secure storage for recordings</p>
        </div>

        <Card className="p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileAudio className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{audioFiles.length}</p>
                  <p className="text-xs text-muted-foreground">Audio Files</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                  <FileVideo className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{videoFiles.length}</p>
                  <p className="text-xs text-muted-foreground">Video Files</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground text-center">
                Total Recordings: {audioFiles.length + videoFiles.length}
              </p>
            </div>
          </div>
        </Card>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All ({audioFiles.length + videoFiles.length})</TabsTrigger>
            <TabsTrigger value="audio">Audio ({audioFiles.length})</TabsTrigger>
            <TabsTrigger value="video">Video ({videoFiles.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-3 mt-4">
            {audioFiles.length === 0 && videoFiles.length === 0 ? (
              <EmptyState
                icon={<FileAudio className="w-12 h-12 text-muted-foreground" />}
                title="No recordings yet"
                description="Start recording from Tools tab"
              />
            ) : (
              <>
                {audioFiles.map(file => (
                  <Card key={file.id} className="p-4">
                    <p className="text-xs text-muted-foreground mb-2">
                      🎙️ Audio — {new Date(file.timestamp).toLocaleString()}
                    </p>
                    <audio src={file.url} controls className="w-full" />
                  </Card>
                ))}
                {videoFiles.map(file => (
                  <Card key={file.id} className="p-4">
                    <p className="text-xs text-muted-foreground mb-2">
                      📹 Video — {new Date(file.timestamp).toLocaleString()}
                    </p>
                    <video src={file.url} controls className="w-full rounded-lg" />
                  </Card>
                ))}
              </>
            )}
          </TabsContent>

          <TabsContent value="audio" className="space-y-3 mt-4">
            {audioFiles.length === 0 ? (
              <EmptyState
                icon={<FileAudio className="w-12 h-12 text-muted-foreground" />}
                title="No audio files"
                description="Use Voice Record to create audio evidence"
              />
            ) : (
              audioFiles.map(file => (
                <Card key={file.id} className="p-4">
                  <p className="text-xs text-muted-foreground mb-2">
                    🎙️ {new Date(file.timestamp).toLocaleString()}
                  </p>
                  <audio src={file.url} controls className="w-full" />
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="video" className="space-y-3 mt-4">
            {videoFiles.length === 0 ? (
              <EmptyState
                icon={<FileVideo className="w-12 h-12 text-muted-foreground" />}
                title="No video files"
                description="Use Video Record to create video evidence"
              />
            ) : (
              videoFiles.map(file => (
                <Card key={file.id} className="p-4">
                  <p className="text-xs text-muted-foreground mb-2">
                    📹 {new Date(file.timestamp).toLocaleString()}
                  </p>
                  <video src={file.url} controls className="w-full rounded-lg" />
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>

        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="text-sm">🔒</div>
              <h3 className="font-semibold text-sm">Privacy & Security</h3>
            </div>
            <ul className="text-xs text-muted-foreground space-y-1 pl-6">
              <li>• All recordings are stored locally on your device</li>
              <li>• Evidence is timestamped for legal purposes</li>
              <li>• Download recordings before clearing browser data</li>
              <li>• For cloud backup, upgrade to premium version</li>
            </ul>
          </div>
        </Card>
      </div>

      <BottomNav currentTab="evidence" onTabChange={() => {}} />
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card className="p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-secondary mx-auto mb-4 flex items-center justify-center">
        {icon}
      </div>
      <h3 className="font-semibold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </Card>
  );
}
