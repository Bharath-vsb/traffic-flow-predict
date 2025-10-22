import { cn } from "@/lib/utils";

interface TrafficLightProps {
  state: "red" | "yellow" | "green";
  label: string;
  timing?: number;
}

export const TrafficLight = ({ state, label, timing }: TrafficLightProps) => {
  return (
    <div className="flex flex-col items-center space-y-3">
      <div className="relative">
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3 shadow-card">
          <div
            className={cn(
              "w-16 h-16 rounded-full transition-all duration-500",
              state === "red"
                ? "bg-traffic-red shadow-red animate-pulse"
                : "bg-muted/30"
            )}
          />
          <div
            className={cn(
              "w-16 h-16 rounded-full transition-all duration-500",
              state === "yellow"
                ? "bg-traffic-yellow shadow-yellow animate-pulse"
                : "bg-muted/30"
            )}
          />
          <div
            className={cn(
              "w-16 h-16 rounded-full transition-all duration-500",
              state === "green"
                ? "bg-traffic-green shadow-green animate-pulse"
                : "bg-muted/30"
            )}
          />
        </div>
        {timing !== undefined && (
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-card border border-border rounded-full px-4 py-1 text-sm font-bold">
            {timing}s
          </div>
        )}
      </div>
      <p className="text-sm font-medium text-muted-foreground mt-6">{label}</p>
    </div>
  );
};
