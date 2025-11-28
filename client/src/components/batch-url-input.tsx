import { useState, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, X, ListPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { detectPlatform, type Platform } from "@shared/schema";
import { PlatformIcon } from "./platform-icon";

interface BatchUrlInputProps {
  urls: string[];
  onChange: (urls: string[]) => void;
  onAddToQueue?: () => void;
  disabled?: boolean;
  isAddingToQueue?: boolean;
}

export function BatchUrlInput({ urls, onChange, onAddToQueue, disabled, isAddingToQueue }: BatchUrlInputProps) {
  const [inputValue, setInputValue] = useState("");

  const parseUrls = useCallback((text: string): string[] => {
    const lines = text.split(/[\n,]/).map(line => line.trim()).filter(Boolean);
    const validUrls: string[] = [];
    
    for (const line of lines) {
      try {
        new URL(line);
        if (!urls.includes(line) && !validUrls.includes(line)) {
          validUrls.push(line);
        }
      } catch {
        // Skip invalid URLs
      }
    }
    
    return validUrls;
  }, [urls]);

  const handleAddUrls = () => {
    const newUrls = parseUrls(inputValue);
    if (newUrls.length > 0) {
      onChange([...urls, ...newUrls]);
      setInputValue("");
    }
  };

  const handleRemoveUrl = (index: number) => {
    const newUrls = [...urls];
    newUrls.splice(index, 1);
    onChange(newUrls);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAddUrls();
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <ListPlus className="h-5 w-5 text-muted-foreground" />
          <span className="font-medium">Batch Download</span>
          <Badge variant="secondary" className="ml-auto">
            {urls.length} URL{urls.length !== 1 ? "s" : ""}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Paste multiple URLs (one per line or comma-separated)
        </p>
      </div>

      <div className="flex gap-2">
        <Textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="https://youtube.com/watch?v=...&#10;https://tiktok.com/...&#10;https://instagram.com/..."
          className="min-h-[100px] resize-none"
          disabled={disabled}
          data-testid="input-batch-urls"
        />
      </div>

      <Button 
        onClick={handleAddUrls} 
        disabled={disabled || !inputValue.trim()}
        variant="outline"
        className="w-full"
        data-testid="button-add-urls"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add URLs to List
      </Button>

      {urls.length > 0 && (
        <div className="space-y-2 max-h-[200px] overflow-y-auto">
          {urls.map((url, index) => {
            const platform = detectPlatform(url);
            return (
              <div 
                key={`${url}-${index}`}
                className="flex items-center gap-2 p-2 bg-muted/50 rounded-md group"
                data-testid={`queue-item-${index}`}
              >
                {platform && <PlatformIcon platform={platform} size={16} />}
                <span className="flex-1 text-sm truncate">{url}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveUrl(index)}
                  disabled={disabled}
                  className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6"
                  data-testid={`button-remove-url-${index}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
