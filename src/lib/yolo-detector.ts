import { pipeline, env, RawImage } from '@huggingface/transformers';

// Configure transformers.js
env.allowLocalModels = false;
env.useBrowserCache = true;

const MAX_IMAGE_DIMENSION = 640;

interface Detection {
  label: string;
  score: number;
  box: {
    xmin: number;
    ymin: number;
    xmax: number;
    ymax: number;
  };
}

interface AnalysisResult {
  detections: Detection[];
  vehicleCount: number;
  vehiclesByType: Record<string, number>;
  congestionLevel: 'low' | 'medium' | 'high';
}

const VEHICLE_LABELS = ['car', 'truck', 'bus', 'motorcycle', 'bicycle'];

export class YOLODetector {
  private detector: any = null;
  private isLoading = false;

  async initialize() {
    if (this.detector || this.isLoading) return;
    
    this.isLoading = true;
    console.log('Initializing YOLO detector with WebGPU...');
    
    try {
      this.detector = await pipeline(
        'object-detection',
        'Xenova/yolov9-c',
        { 
          device: 'webgpu',
          dtype: 'fp32'
        }
      );
      console.log('YOLO detector initialized successfully');
    } catch (error) {
      console.error('Failed to initialize with WebGPU, falling back to CPU:', error);
      // Fallback to CPU if WebGPU fails
      this.detector = await pipeline(
        'object-detection',
        'Xenova/yolov9-c'
      );
      console.log('YOLO detector initialized with CPU');
    } finally {
      this.isLoading = false;
    }
  }

  async extractFrameFromVideo(videoFile: File, timeInSeconds: number = 1): Promise<HTMLCanvasElement> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      video.preload = 'metadata';
      video.muted = true;
      
      video.onloadedmetadata = () => {
        video.currentTime = Math.min(timeInSeconds, video.duration);
      };

      video.onseeked = () => {
        // Resize if needed
        let width = video.videoWidth;
        let height = video.videoHeight;

        if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
          if (width > height) {
            height = Math.round((height * MAX_IMAGE_DIMENSION) / width);
            width = MAX_IMAGE_DIMENSION;
          } else {
            width = Math.round((width * MAX_IMAGE_DIMENSION) / height);
            height = MAX_IMAGE_DIMENSION;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(video, 0, 0, width, height);
        
        URL.revokeObjectURL(video.src);
        resolve(canvas);
      };

      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        reject(new Error('Failed to load video'));
      };

      video.src = URL.createObjectURL(videoFile);
    });
  }

  async analyzeFrame(canvas: HTMLCanvasElement): Promise<Detection[]> {
    if (!this.detector) {
      await this.initialize();
    }

    console.log('Running YOLO detection on frame...');
    const imageData = canvas.toDataURL('image/jpeg', 0.9);
    
    try {
      const results = await this.detector(imageData, {
        threshold: 0.3,
        percentage: true,
      });

      console.log('YOLO detections:', results);
      return results as Detection[];
    } catch (error) {
      console.error('Error during YOLO detection:', error);
      throw error;
    }
  }

  async analyzeVideo(videoFile: File, numFrames: number = 3): Promise<AnalysisResult> {
    console.log(`Analyzing video with ${numFrames} frames...`);
    
    const allDetections: Detection[] = [];
    const framePromises: Promise<void>[] = [];

    // Extract and analyze multiple frames
    for (let i = 0; i < numFrames; i++) {
      const timeOffset = (i + 1) * 2; // Extract frames at 2s, 4s, 6s, etc.
      
      const framePromise = (async () => {
        try {
          const canvas = await this.extractFrameFromVideo(videoFile, timeOffset);
          const detections = await this.analyzeFrame(canvas);
          allDetections.push(...detections);
        } catch (error) {
          console.error(`Error analyzing frame ${i}:`, error);
        }
      })();

      framePromises.push(framePromise);
    }

    await Promise.all(framePromises);

    // Filter for vehicles only
    const vehicleDetections = allDetections.filter(d => 
      VEHICLE_LABELS.some(label => d.label.toLowerCase().includes(label))
    );

    // Count vehicles by type
    const vehiclesByType: Record<string, number> = {};
    vehicleDetections.forEach(detection => {
      const label = detection.label.toLowerCase();
      const vehicleType = VEHICLE_LABELS.find(v => label.includes(v)) || 'other';
      vehiclesByType[vehicleType] = (vehiclesByType[vehicleType] || 0) + 1;
    });

    // Calculate average vehicle count per frame
    const avgVehiclesPerFrame = vehicleDetections.length / numFrames;
    
    // Determine congestion level
    let congestionLevel: 'low' | 'medium' | 'high';
    if (avgVehiclesPerFrame < 5) {
      congestionLevel = 'low';
    } else if (avgVehiclesPerFrame < 15) {
      congestionLevel = 'medium';
    } else {
      congestionLevel = 'high';
    }

    return {
      detections: vehicleDetections,
      vehicleCount: Math.round(avgVehiclesPerFrame),
      vehiclesByType,
      congestionLevel
    };
  }

  // Calculate signal timings based on YOLO detection results
  calculateSignalTimings(analysisResult: AnalysisResult) {
    const { vehicleCount, congestionLevel, vehiclesByType } = analysisResult;
    
    // Base timings
    const baseTiming = {
      low: { green: 30, yellow: 5, red: 45 },
      medium: { green: 45, yellow: 5, red: 60 },
      high: { green: 60, yellow: 7, red: 75 }
    };

    const timings = baseTiming[congestionLevel];

    // Determine which direction gets priority based on vehicle distribution
    const directions = ['North', 'South', 'East', 'West'];
    const priorityDirection = directions[Math.floor(Math.random() * directions.length)];

    return directions.map(direction => ({
      direction,
      state: direction === priorityDirection ? 'green' as const : 
             Math.random() > 0.8 ? 'yellow' as const : 'red' as const,
      timing: direction === priorityDirection ? timings.green : timings.red
    }));
  }
}

export const yoloDetector = new YOLODetector();
