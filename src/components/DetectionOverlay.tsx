import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Car, Truck, Bus, Bike } from "lucide-react";

interface DetectionOverlayProps {
  vehiclesByType: Record<string, number>;
  isAnalyzing: boolean;
}

const vehicleIcons: Record<string, any> = {
  car: Car,
  truck: Truck,
  bus: Bus,
  motorcycle: Bike,
  bicycle: Bike,
};

export const DetectionOverlay = ({ vehiclesByType, isAnalyzing }: DetectionOverlayProps) => {
  if (Object.keys(vehiclesByType).length === 0 && !isAnalyzing) return null;

  return (
    <Card className="p-6 bg-gradient-card border-border backdrop-blur-sm">
      <h3 className="text-lg font-bold text-foreground mb-4">
        YOLO Detection Results
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(vehiclesByType).map(([type, count]) => {
          const Icon = vehicleIcons[type] || Car;
          return (
            <div
              key={type}
              className="flex flex-col items-center space-y-2 p-4 bg-muted/20 rounded-lg border border-border"
            >
              <Icon className="w-8 h-8 text-primary" />
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{count}</p>
                <p className="text-xs text-muted-foreground capitalize">{type}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <Badge variant="outline" className="text-primary border-primary">
          Powered by YOLOv9
        </Badge>
        <p className="text-xs text-muted-foreground">
          Real-time object detection with WebGPU
        </p>
      </div>
    </Card>
  );
};
