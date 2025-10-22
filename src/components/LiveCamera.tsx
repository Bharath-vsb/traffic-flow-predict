import { useEffect, useRef, useState } from "react";
import { Video, VideoOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

interface LiveCameraProps {
  onFrame: (canvas: HTMLCanvasElement) => void;
  isActive: boolean;
  onToggle: () => void;
}

export const LiveCamera = ({ onFrame, isActive, onToggle }: LiveCameraProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    if (isActive) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => stopCamera();
  }, [isActive]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        toast.success("Camera started");
        
        // Start capturing frames
        captureFrame();
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      toast.error("Failed to access camera");
    }
  };

  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (ctx && video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Send frame for analysis
      onFrame(canvas);
    }

    // Continue capturing frames (analyze every ~2 seconds)
    animationFrameRef.current = window.setTimeout(() => {
      requestAnimationFrame(captureFrame);
    }, 2000);
  };

  return (
    <Card className="p-8 bg-gradient-card border-border backdrop-blur-sm">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Video className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Live Traffic Monitoring</h2>
          <p className="text-muted-foreground">
            Real-time vehicle detection with YOLO
          </p>
        </div>

        <div className="relative rounded-lg overflow-hidden bg-muted/20 min-h-[400px] flex items-center justify-center">
          {isActive ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-auto"
            />
          ) : (
            <div className="text-center space-y-4">
              <VideoOff className="w-12 h-12 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">Camera is off</p>
            </div>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        <Button
          onClick={onToggle}
          className="w-full"
          variant={isActive ? "destructive" : "default"}
        >
          {isActive ? "Stop Camera" : "Start Camera"}
        </Button>
      </div>
    </Card>
  );
};
