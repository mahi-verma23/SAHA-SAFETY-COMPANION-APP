import { useState } from "react";
import { FileAudio, FileVideo, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BottomNav from "@/components/BottomNav";
import { useToast } from "@/components/ui/use-toast";

export default function Evidence() {
  const { toast } = useToast();
  const [audioFiles, setAudioFiles] = useState<any[]>([]);
  const [videoFiles, setVideoFiles] = useState<any[]>([]);

  const handleDelete = (type: "audio" | "video", id: string) => {
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
            <TabsTrigger value="all">All (0)</TabsTrigger>
            <TabsTrigger value="audio">Audio (0)</TabsTrigger>
            <TabsTrigger value="video">Video (0)</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-3 mt-4">
            <EmptyState
              icon={<FileAudio className="w-12 h-12 text-muted-foreground" />}
              title="No recordings yet"
              description="Start recording from Tools tab"
            />
          </TabsContent>

          <TabsContent value="audio" className="space-y-3 mt-4">
            <EmptyState
              icon={<FileAudio className="w-12 h-12 text-muted-foreground" />}
              title="No audio files"
              description="Use Voice Record to create audio evidence"
            />
          </TabsContent>

          <TabsContent value="video" className="space-y-3 mt-4">
            <EmptyState
              icon={<FileVideo className="w-12 h-12 text-muted-foreground" />}
              title="No video files"
              description="Use Video Record to create video evidence"
            />
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
