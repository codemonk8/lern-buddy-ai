import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Copy, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setId: string;
  isPublic: boolean;
  shareToken: string | null;
  onShareUpdated: () => void;
}

export function ShareDialog({
  open,
  onOpenChange,
  setId,
  isPublic: initialIsPublic,
  shareToken: initialShareToken,
  onShareUpdated,
}: ShareDialogProps) {
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [shareToken, setShareToken] = useState<string | null>(initialShareToken);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = shareToken
    ? `${window.location.origin}/set/${setId}?token=${shareToken}`
    : "";

  const handleToggleSharing = async (enabled: boolean) => {
    setIsLoading(true);
    try {
      let token = shareToken;

      if (enabled && !token) {
        // Generate a new share token
        const { data, error } = await supabase.rpc("generate_share_token");
        if (error) throw error;
        token = data;
      }

      const { error: updateError } = await supabase
        .from("learning_sets")
        .update({
          is_public: enabled,
          share_token: enabled ? token : null,
        })
        .eq("id", setId);

      if (updateError) throw updateError;

      setIsPublic(enabled);
      setShareToken(enabled ? token : null);
      onShareUpdated();

      toast.success(
        enabled ? "Lernset ist jetzt öffentlich" : "Lernset ist jetzt privat"
      );
    } catch (error) {
      console.error("Error updating share settings:", error);
      toast.error("Fehler beim Aktualisieren der Freigabe-Einstellungen");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link kopiert!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Lernset teilen</DialogTitle>
          <DialogDescription>
            Aktiviere die Freigabe, um dein Lernset mit Freunden zu teilen.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="share-toggle">Öffentliche Freigabe</Label>
              <p className="text-sm text-muted-foreground">
                Jeder mit dem Link kann dieses Lernset sehen
              </p>
            </div>
            <Switch
              id="share-toggle"
              checked={isPublic}
              onCheckedChange={handleToggleSharing}
              disabled={isLoading}
            />
          </div>

          {isPublic && shareToken && (
            <div className="space-y-2">
              <Label htmlFor="share-link">Freigabe-Link</Label>
              <div className="flex gap-2">
                <Input
                  id="share-link"
                  value={shareUrl}
                  readOnly
                  className="flex-1"
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={handleCopyLink}
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Hinweis: Freunde können das Lernset nur ansehen, nicht bearbeiten
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
