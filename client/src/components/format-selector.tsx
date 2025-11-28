import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Video, Music, Image } from "lucide-react";
import { videoFormats, audioFormats, imageFormats, videoQualities, audioQualities, imageQualities } from "@shared/schema";

interface FormatSelectorProps {
  outputType: "video" | "audio" | "image";
  format: string;
  quality: string;
  onOutputTypeChange: (type: "video" | "audio" | "image") => void;
  onFormatChange: (format: string) => void;
  onQualityChange: (quality: string) => void;
  disabled?: boolean;
  showImageOption?: boolean;
}

export function FormatSelector({
  outputType,
  format,
  quality,
  onOutputTypeChange,
  onFormatChange,
  onQualityChange,
  disabled,
  showImageOption = false,
}: FormatSelectorProps) {
  const formats = outputType === "video" 
    ? videoFormats 
    : outputType === "audio" 
      ? audioFormats 
      : imageFormats;
  const qualities = outputType === "video" 
    ? videoQualities 
    : outputType === "audio" 
      ? audioQualities 
      : imageQualities;

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label className="text-sm font-medium">Output Type</Label>
        <RadioGroup
          value={outputType}
          onValueChange={(value) => onOutputTypeChange(value as "video" | "audio" | "image")}
          className="flex gap-4 flex-wrap"
          disabled={disabled}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem 
              value="video" 
              id="video" 
              data-testid="radio-video"
            />
            <Label 
              htmlFor="video" 
              className="flex items-center gap-2 cursor-pointer"
            >
              <Video className="h-4 w-4" />
              Video
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem 
              value="audio" 
              id="audio"
              data-testid="radio-audio"
            />
            <Label 
              htmlFor="audio" 
              className="flex items-center gap-2 cursor-pointer"
            >
              <Music className="h-4 w-4" />
              Audio Only
            </Label>
          </div>
          {showImageOption && (
            <div className="flex items-center space-x-2">
              <RadioGroupItem 
                value="image" 
                id="image"
                data-testid="radio-image"
              />
              <Label 
                htmlFor="image" 
                className="flex items-center gap-2 cursor-pointer"
              >
                <Image className="h-4 w-4" />
                Image
              </Label>
            </div>
          )}
        </RadioGroup>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Format</Label>
          <div className="flex flex-wrap gap-2">
            {formats.map((f) => (
              <Badge
                key={f}
                variant={format === f ? "default" : "outline"}
                className={`cursor-pointer px-3 py-1.5 text-xs uppercase tracking-wide ${
                  format === f ? "" : "hover-elevate"
                } ${disabled ? "opacity-50 pointer-events-none" : ""}`}
                onClick={() => !disabled && onFormatChange(f)}
                data-testid={`badge-format-${f}`}
              >
                {f}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Quality</Label>
          <Select
            value={quality}
            onValueChange={onQualityChange}
            disabled={disabled}
          >
            <SelectTrigger 
              className="w-full"
              data-testid="select-quality"
            >
              <SelectValue placeholder="Select quality" />
            </SelectTrigger>
            <SelectContent>
              {qualities.map((q) => (
                <SelectItem 
                  key={q} 
                  value={q}
                  data-testid={`option-quality-${q}`}
                >
                  {q}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
