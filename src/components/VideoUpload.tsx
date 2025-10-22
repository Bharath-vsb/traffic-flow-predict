import { useState, useRef } from "react";
import { Upload, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

interface VideoUploadProps {
  onVideoUpload: (file: File) => void;
  isAnalyzing: boolean;
}

export const VideoUpload = ({ onVideoUpload, isAnalyzing }: VideoUploadProps) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      toast.error("Please upload a valid video file");
      return;
    }

    const url = URL.createObjectURL(file);
    setPreview(url);
    setFileName(file.name);
    onVideoUpload(file);
  };

  return (
    <Card className="p-8 bg-gradient-card border-border backdrop-blur-sm">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Video className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Upload Traffic Video</h2>
          <p className="text-muted-foreground">
            Upload a traffic video for AI-powered signal analysis
          </p>
        </div>

        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-border rounded-lg p-12 text-center cursor-pointer hover:border-primary/50 transition-all duration-300 hover:bg-muted/20"
        >
          {preview ? (
            <div className="space-y-4">
              <video
                src={preview}
                controls
                className="w-full max-h-64 rounded-lg mx-auto"
              />
              <p className="text-sm text-muted-foreground">{fileName}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <Upload className="w-12 h-12 text-muted-foreground mx-auto" />
              <div>
                <p className="text-lg font-medium text-foreground">
                  Click to upload or drag and drop
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  MP4, AVI, MOV (MAX. 50MB)
                </p>
              </div>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileChange}
          className="hidden"
          disabled={isAnalyzing}
        />

        {preview && (
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            className="w-full"
            disabled={isAnalyzing}
          >
            Choose Different Video
          </Button>
        )}
      </div>
    </Card>
  );
};
