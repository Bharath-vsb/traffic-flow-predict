import { useState, useCallback } from "react";
import { LiveCamera } from "@/components/LiveCamera";
import { AnalysisResults } from "@/components/AnalysisResults";
import { DetectionOverlay } from "@/components/DetectionOverlay";
import { Brain } from "lucide-react";
import { toast } from "sonner";
import { yoloDetector } from "@/lib/yolo-detector";
import heroImage from "@/assets/hero-traffic.jpg";

interface Signal {
  direction: string;
  state: "red" | "yellow" | "green";
  timing: number;
}

interface AnalysisResult {
  signals: Signal[];
  congestionLevel: "low" | "medium" | "high";
  vehicleCount: number;
  vehiclesByType: Record<string, number>;
  analysis: string;
}

const Index = () => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [detectorInitialized, setDetectorInitialized] = useState(false);

  const handleToggleCamera = useCallback(() => {
    setIsCameraActive(prev => !prev);
    if (!isCameraActive && !detectorInitialized) {
      initializeDetector();
    }
  }, [isCameraActive, detectorInitialized]);

  const initializeDetector = async () => {
    try {
      toast.loading("Initializing YOLO detector...");
      await yoloDetector.initialize();
      setDetectorInitialized(true);
      toast.dismiss();
      toast.success("YOLO detector ready!");
    } catch (error: any) {
      console.error("Detector initialization error:", error);
      toast.dismiss();
      toast.error(
        error.message?.includes('WebGPU') 
          ? "WebGPU not available. Please use a compatible browser (Chrome/Edge)." 
          : "Failed to initialize detector"
      );
    }
  };

  const handleFrame = useCallback(async (canvas: HTMLCanvasElement) => {
    if (!detectorInitialized || isAnalyzing) return;

    setIsAnalyzing(true);

    try {
      // Analyze current frame
      const detections = await yoloDetector.analyzeFrame(canvas);
      
      // Count vehicles by type
      const vehiclesByType: Record<string, number> = {};
      let vehicleCount = 0;

      detections.forEach(detection => {
        const label = detection.label.toLowerCase();
        vehiclesByType[label] = (vehiclesByType[label] || 0) + 1;
        vehicleCount++;
      });

      // Determine congestion level
      let congestionLevel: "low" | "medium" | "high" = "low";
      if (vehicleCount > 15) congestionLevel = "high";
      else if (vehicleCount > 8) congestionLevel = "medium";

      // Calculate signal timings
      const analysisResult = { vehicleCount, vehiclesByType, congestionLevel, detections };
      const signals = yoloDetector.calculateSignalTimings(analysisResult);

      setResults({
        signals,
        congestionLevel,
        vehicleCount,
        vehiclesByType,
        analysis: `Detected ${vehicleCount} vehicles with ${congestionLevel} congestion level`
      });
    } catch (error) {
      console.error("Frame analysis error:", error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [detectorInitialized, isAnalyzing]);

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 to-background z-10" />
        <img 
          src={heroImage} 
          alt="Traffic Management System"
          className="w-full h-[400px] object-cover opacity-40"
        />
        <div className="absolute inset-0 z-20 flex items-center justify-center">
          <div className="text-center space-y-4 px-4">
            <div className="inline-flex items-center space-x-2 bg-primary/10 backdrop-blur-sm border border-primary/20 rounded-full px-6 py-2 mb-4">
              <Brain className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">YOLO + AI Powered</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-foreground">
              Smart Traffic Management
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Live vehicle detection with YOLOv9 and real-time traffic signal optimization
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="space-y-8">
          <LiveCamera 
            onFrame={handleFrame}
            isActive={isCameraActive}
            onToggle={handleToggleCamera}
          />

          {isCameraActive && results && (
            <>
              <DetectionOverlay 
                vehiclesByType={results.vehiclesByType} 
                isAnalyzing={false}
              />
              <AnalysisResults
                signals={results.signals}
                congestionLevel={results.congestionLevel}
                vehicleCount={results.vehicleCount}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
