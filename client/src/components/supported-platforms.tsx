import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlatformIcon } from "./platform-icon";
import { Check } from "lucide-react";
import { supportedPlatforms, getPlatformName, type Platform } from "@shared/schema";

export function SupportedPlatforms() {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg text-center">Supported Platforms</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {supportedPlatforms.map((platform) => (
            <div
              key={platform}
              className="flex flex-col items-center gap-2 p-3 rounded-lg bg-muted/50 hover-elevate"
              data-testid={`platform-${platform}`}
            >
              <div className="relative">
                <PlatformIcon platform={platform} size={40} />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                  <Check className="h-2.5 w-2.5 text-white" />
                </div>
              </div>
              <span className="text-xs font-medium text-center">
                {getPlatformName(platform)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
