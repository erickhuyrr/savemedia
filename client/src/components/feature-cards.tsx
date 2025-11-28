import { Card, CardContent } from "@/components/ui/card";
import { 
  Globe2, 
  Music4, 
  Settings2, 
  Zap, 
  Shield, 
  Download 
} from "lucide-react";

const features = [
  {
    icon: Globe2,
    title: "Multi-Platform Support",
    description: "Download from YouTube, TikTok, Instagram, Twitter, Facebook, Vimeo, and more",
  },
  {
    icon: Music4,
    title: "Audio Extraction",
    description: "Convert any video to MP3, M4A, WAV or OGG audio format with high quality",
  },
  {
    icon: Settings2,
    title: "Quality Options",
    description: "Choose from 4K, 1080p, 720p, 480p or select the best available quality",
  },
  {
    icon: Zap,
    title: "Fast Downloads",
    description: "High-speed downloads with real-time progress tracking and status updates",
  },
  {
    icon: Shield,
    title: "Safe & Private",
    description: "No registration required. Your downloads are private and secure",
  },
  {
    icon: Download,
    title: "No Limits",
    description: "Download as many videos as you want with no daily limits or restrictions",
  },
];

export function FeatureCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {features.map((feature, index) => {
        const Icon = feature.icon;
        return (
          <Card 
            key={index} 
            className="hover-elevate"
            data-testid={`card-feature-${index}`}
          >
            <CardContent className="p-6 text-center space-y-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-base">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
