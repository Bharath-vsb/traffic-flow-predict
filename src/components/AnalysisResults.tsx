import { Card } from "@/components/ui/card";
import { TrafficLight } from "./TrafficLight";
import { Activity, Clock, AlertTriangle } from "lucide-react";

interface Signal {
  direction: string;
  state: "red" | "yellow" | "green";
  timing: number;
}

interface AnalysisResultsProps {
  signals: Signal[];
  congestionLevel: "low" | "medium" | "high";
  vehicleCount: number;
}

export const AnalysisResults = ({
  signals,
  congestionLevel,
  vehicleCount,
}: AnalysisResultsProps) => {
  const getCongestionColor = () => {
    switch (congestionLevel) {
      case "low":
        return "text-traffic-green";
      case "medium":
        return "text-traffic-yellow";
      case "high":
        return "text-traffic-red";
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-card border-border backdrop-blur-sm">
        <h3 className="text-xl font-bold text-foreground mb-6">Traffic Analysis</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="flex items-center space-x-4 p-4 bg-muted/20 rounded-lg">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Activity className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Vehicle Count</p>
              <p className="text-2xl font-bold text-foreground">{vehicleCount}</p>
            </div>
          </div>

          <div className="flex items-center space-x-4 p-4 bg-muted/20 rounded-lg">
            <div className="p-3 bg-secondary/10 rounded-lg">
              <Clock className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Cycle Time</p>
              <p className="text-2xl font-bold text-foreground">
                {signals.reduce((sum, s) => sum + s.timing, 0)}s
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4 p-4 bg-muted/20 rounded-lg">
            <div className="p-3 bg-accent/10 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Congestion Level</p>
              <p className={`text-2xl font-bold capitalize ${getCongestionColor()}`}>
                {congestionLevel}
              </p>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-8 bg-gradient-card border-border backdrop-blur-sm">
        <h3 className="text-xl font-bold text-foreground mb-8 text-center">
          Signal Recommendations
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 justify-items-center">
          {signals.map((signal, index) => (
            <TrafficLight
              key={index}
              state={signal.state}
              label={signal.direction}
              timing={signal.timing}
            />
          ))}
        </div>
      </Card>
    </div>
  );
};
