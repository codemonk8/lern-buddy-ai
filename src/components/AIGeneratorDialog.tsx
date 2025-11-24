import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { topicSchema } from "@/lib/validations";

interface GeneratedCard {
  front: string;
  back: string;
}

interface AIGeneratorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setId: string;
  onCardsGenerated: () => void;
}

export function AIGeneratorDialog({ open, onOpenChange, setId, onCardsGenerated }: AIGeneratorDialogProps) {
  const [topic, setTopic] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCards, setGeneratedCards] = useState<GeneratedCard[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const handleGenerate = async () => {
    // Validate topic
    const validation = topicSchema.safeParse(topic);
    
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      toast.error(firstError.message);
      return;
    }

    setIsGenerating(true);
    setGeneratedCards([]);

    try {
      const { data, error } = await supabase.functions.invoke("generate-flashcards", {
        body: { topic: validation.data, setId },
      });

      if (error) {
        console.error("Function error:", error);
        throw error;
      }

      if (!data?.flashcards || data.flashcards.length === 0) {
        throw new Error("Keine Karten generiert");
      }

      setGeneratedCards(data.flashcards);
      toast.success(`${data.flashcards.length} Karten generiert!`);
    } catch (error: any) {
      console.error("Error generating cards:", error);
      if (error.message?.includes("429")) {
        toast.error("Zu viele Anfragen. Bitte warte einen Moment.");
      } else if (error.message?.includes("402")) {
        toast.error("AI-Guthaben aufgebraucht. Bitte Guthaben aufladen.");
      } else {
        toast.error("Fehler beim Generieren der Karten");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (generatedCards.length === 0) {
      toast.error("Keine Karten zum Speichern");
      return;
    }

    setIsSaving(true);

    try {
      const cardsToInsert = generatedCards.map((card) => ({
        set_id: setId,
        front: card.front,
        back: card.back,
      }));

      const { error } = await supabase.from("flashcards").insert(cardsToInsert);

      if (error) throw error;

      toast.success(`${generatedCards.length} Karten gespeichert!`);
      onCardsGenerated();
      onOpenChange(false);
      setTopic("");
      setGeneratedCards([]);
    } catch (error) {
      console.error("Error saving cards:", error);
      toast.error("Fehler beim Speichern der Karten");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditCard = (index: number, field: "front" | "back", value: string) => {
    const updated = [...generatedCards];
    updated[index][field] = value;
    setGeneratedCards(updated);
  };

  const handleRemoveCard = (index: number) => {
    setGeneratedCards(generatedCards.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-secondary" />
            KI Lernkarten Generator
          </DialogTitle>
          <DialogDescription>
            Gib ein Thema ein und die KI erstellt automatisch Lernkarten für dich
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="topic">Thema*</Label>
            <Input
              id="topic"
              placeholder="z.B. Photosynthese, Grundlagen BWL, Französische Revolution..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={isGenerating || isSaving}
            />
          </div>

          {generatedCards.length === 0 ? (
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full bg-gradient-secondary hover:opacity-90"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generiere Karten...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Karten generieren
                </>
              )}
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  {generatedCards.length} Karten generiert
                </p>
                <Button variant="outline" size="sm" onClick={() => setGeneratedCards([])}>
                  Neu generieren
                </Button>
              </div>

              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {generatedCards.map((card, index) => (
                  <Card key={index} className="shadow-card">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start gap-2">
                        <Label className="text-xs text-muted-foreground">
                          Vorderseite
                        </Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveCard(index)}
                          className="h-6 px-2"
                        >
                          Entfernen
                        </Button>
                      </div>
                      <Textarea
                        value={card.front}
                        onChange={(e) => handleEditCard(index, "front", e.target.value)}
                        className="min-h-[60px]"
                      />
                    </CardHeader>
                    <CardContent className="pt-0">
                      <Label className="text-xs text-muted-foreground">
                        Rückseite
                      </Label>
                      <Textarea
                        value={card.back}
                        onChange={(e) => handleEditCard(index, "back", e.target.value)}
                        className="mt-1 min-h-[80px]"
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        {generatedCards.length > 0 && (
          <DialogFooter>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Alle Karten speichern
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}