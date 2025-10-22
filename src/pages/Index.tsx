import { useState } from "react";
import { VideoUpload } from "@/components/VideoUpload";
import { AnalysisResults } from "@/components/AnalysisResults";
import { Button } from "@/components/ui/button";
import { Loader2, Zap } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
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
  analysis: string;
}

const Index = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<AnalysisResult | null>(null);

  const handleVideoUpload = (file: File) => {
    setUploadedFile(file);
    setResults(null);
  };

  const handleAnalyze = async () => {
    if (!uploadedFile) {
      toast.error("Please upload a video first");
      return;
    }

    setIsAnalyzing(true);
    toast.info("Analyzing traffic patterns...");

    try {
      const { data, error } = await supabase.functions.invoke('analyze-traffic', {
        body: { 
          videoData: `Traffic video: ${uploadedFile.name} (${(uploadedFile.size / 1024 / 1024).toFixed(2)}MB)` 
        }
      });

      if (error) {
        throw error;
      }

      setResults(data);
      toast.success("Analysis complete!");
    } catch (error: any) {
      console.error('Analysis error:', error);
      if (error.message?.includes('429')) {
        toast.error("Rate limit exceeded. Please try again later.");
      } else if (error.message?.includes('402')) {
        toast.error("AI credits depleted. Please add credits to continue.");
      } else {
        toast.error("Analysis failed. Please try again.");
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

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
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">AI-Powered</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-foreground">
              Smart Traffic Management
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Advanced AI analysis for optimal traffic signal control and congestion reduction
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="space-y-8">
          <VideoUpload onVideoUpload={handleVideoUpload} isAnalyzing={isAnalyzing} />
          
          {uploadedFile && !results && (
            <div className="flex justify-center">
              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                size="lg"
                className="px-8 py-6 text-lg font-semibold"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Analyzing Traffic...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-5 w-5" />
                    Analyze Traffic
                  </>
                )}
              </Button>
            </div>
          )}

          {results && (
            <AnalysisResults
              signals={results.signals}
              congestionLevel={results.congestionLevel}
              vehicleCount={results.vehicleCount}
            />
          )}

          {results && (
            <div className="flex justify-center space-x-4">
              <Button
                onClick={() => {
                  setResults(null);
                  setUploadedFile(null);
                }}
                variant="outline"
              >
                Analyze New Video
              </Button>
              <Button onClick={handleAnalyze} disabled={isAnalyzing}>
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Re-analyzing...
                  </>
                ) : (
                  "Re-analyze"
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
