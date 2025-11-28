import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link2, Loader2, X, Clipboard } from "lucide-react";
import { PlatformBadge } from "./platform-badge";
import { detectPlatform, type Platform } from "@shared/schema";

interface UrlInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export function UrlInput({ value, onChange, onSubmit, isLoading, disabled }: UrlInputProps) {
  const [detectedPlatform, setDetectedPlatform] = useState<Platform | null>(null);

  useEffect(() => {
    const platform = detectPlatform(value);
    setDetectedPlatform(platform);
  }, [value]);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      onChange(text);
    } catch (err) {
      console.error("Failed to read clipboard");
    }
  };

  const handleClear = () => {
    onChange("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && value && !isLoading && !disabled) {
      onSubmit();
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
          <Link2 className="h-5 w-5" />
        </div>
        <Input
          type="url"
          placeholder="Paste video URL here..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className="h-14 pl-12 pr-24 text-base rounded-lg border-2 focus:border-primary transition-colors"
          data-testid="input-url"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {value ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClear}
              disabled={disabled}
              className="h-8 w-8"
              data-testid="button-clear-url"
            >
              <X className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePaste}
              disabled={disabled}
              className="h-8 gap-1.5"
              data-testid="button-paste-url"
            >
              <Clipboard className="h-4 w-4" />
              <span className="hidden sm:inline">Paste</span>
            </Button>
          )}
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {detectedPlatform && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Detected:</span>
            <PlatformBadge platform={detectedPlatform} />
          </div>
        )}
        
        <Button
          onClick={onSubmit}
          disabled={!value || isLoading || disabled}
          className="w-full sm:w-auto sm:ml-auto h-12 px-8 text-base font-semibold"
          data-testid="button-download"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Processing...
            </>
          ) : (
            "Get Download"
          )}
        </Button>
      </div>
      
      <p className="text-sm text-muted-foreground text-center">
        Paste any video URL from YouTube, TikTok, Instagram, Twitter, Facebook, Vimeo, and more
      </p>
    </div>
  );
}
