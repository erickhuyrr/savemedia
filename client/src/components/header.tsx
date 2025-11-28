import { ThemeToggle } from "./theme-toggle";
import { Download, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between gap-4 px-4 mx-auto max-w-6xl">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
            <Download className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg tracking-tight">SaveMedia</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="gap-1.5"
                data-testid="button-how-to-use"
              >
                <HelpCircle className="h-4 w-4" />
                <span className="hidden sm:inline">How to Use</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>How to Download Videos</DialogTitle>
                <DialogDescription>
                  Follow these simple steps to download any video or audio.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Copy the video URL</p>
                    <p className="text-sm text-muted-foreground">
                      Go to YouTube, TikTok, Instagram, or any supported platform and copy the video link.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Paste the URL</p>
                    <p className="text-sm text-muted-foreground">
                      Paste the copied link into the input field above and we'll automatically detect the platform.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Choose format & quality</p>
                    <p className="text-sm text-muted-foreground">
                      Select whether you want video or audio, then choose your preferred format and quality.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                    4
                  </div>
                  <div>
                    <p className="font-medium">Download</p>
                    <p className="text-sm text-muted-foreground">
                      Click the download button and wait for your file to be ready. Then save it to your device!
                    </p>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
