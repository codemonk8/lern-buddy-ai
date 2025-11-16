import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const EMOJIS = ["📚", "🎯", "🧠", "💡", "📝", "🎓", "🔬", "🌟", "💪", "🚀"];
const COLORS = ["#9b87f5", "#F97316", "#10B981", "#3B82F6", "#8B5CF6", "#EC4899", "#F59E0B", "#06B6D4"];

interface CreateSetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSetCreated: () => void;
}

export function CreateSetDialog({ open, onOpenChange, onSetCreated }: CreateSetDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [emoji, setEmoji] = useState("📚");
  const [color, setColor] = useState("#9b87f5");
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Bitte gib einen Titel ein");
      return;
    }

    if (!user) {
      toast.error("Du musst angemeldet sein");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.from("learning_sets").insert({
        user_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        emoji,
        color,
      });

      if (error) throw error;

      toast.success("Lernset erstellt!");
      onSetCreated();
      onOpenChange(false);

      // Reset form
      setTitle("");
      setDescription("");
      setEmoji("📚");
      setColor("#9b87f5");
    } catch (error) {
      console.error("Error creating set:", error);
      toast.error("Fehler beim Erstellen des Lernsets");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Neues Lernset erstellen</DialogTitle>
            <DialogDescription>
              Erstelle ein neues Lernset für deine Lernkarten
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titel*</Label>
              <Input
                id="title"
                placeholder="z.B. Biologie Kapitel 3"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Beschreibung</Label>
              <Textarea
                id="description"
                placeholder="Was wirst du mit diesem Set lernen?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isLoading}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Emoji</Label>
              <div className="flex flex-wrap gap-2">
                {EMOJIS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    className={`text-2xl p-2 rounded-lg transition-all hover:scale-110 ${emoji === e ? "bg-primary/20 ring-2 ring-primary" : "hover:bg-muted"
                      }`}
                    onClick={() => setEmoji(e)}
                    disabled={isLoading}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Farbe</Label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`w-10 h-10 rounded-lg transition-all hover:scale-110 ${color === c ? "ring-2 ring-offset-2 ring-primary" : ""
                      }`}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                    disabled={isLoading}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Erstellen
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}