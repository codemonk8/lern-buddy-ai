import { useState, useEffect } from "react";
// import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Flashcard {
  id: string;
  front: string;
  back: string;
}

interface CardEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setId: string;
  card: Flashcard | null;
  onCardSaved: () => void;
}

export function CardEditor({ open, onOpenChange, setId, card, onCardSaved }: CardEditorProps) {
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (card) {
      setFront(card.front);
      setBack(card.back);
    } else {
      setFront("");
      setBack("");
    }
  }, [card]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!front.trim() || !back.trim()) {
      toast.error("Bitte fülle beide Seiten aus");
      return;
    }

    setIsLoading(true);

    try {
      if (card) {
        // Update existing card
        const { error } = await supabase
          .from("flashcards")
          .update({
            front: front.trim(),
            back: back.trim(),
          })
          .eq("id", card.id);

        if (error) throw error;
        toast.success("Karte aktualisiert!");
      } else {
        // Create new card
        const { error } = await supabase.from("flashcards").insert({
          set_id: setId,
          front: front.trim(),
          back: back.trim(),
        });

        if (error) throw error;
        toast.success("Karte erstellt!");
      }

      onCardSaved();
      onOpenChange(false);
      setFront("");
      setBack("");
    } catch (error) {
      console.error("Error saving card:", error);
      toast.error("Fehler beim Speichern der Karte");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{card ? "Karte bearbeiten" : "Neue Karte"}</DialogTitle>
            <DialogDescription>
              {card ? "Bearbeite die Lernkarte" : "Erstelle eine neue Lernkarte"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="front">Vorderseite (Frage)*</Label>
              <Textarea
                id="front"
                placeholder="z.B. Was ist Photosynthese?"
                value={front}
                onChange={(e) => setFront(e.target.value)}
                disabled={isLoading}
                rows={3}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="back">Rückseite (Antwort)*</Label>
              <Textarea
                id="back"
                placeholder="z.B. Der Prozess, bei dem Pflanzen Lichtenergie in chemische Energie umwandeln..."
                value={back}
                onChange={(e) => setBack(e.target.value)}
                disabled={isLoading}
                rows={4}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {card ? "Aktualisieren" : "Erstellen"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}