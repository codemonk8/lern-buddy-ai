import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, RotateCw, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";

interface Flashcard {
  id: string;
  front: string;
  back: string;
}

export default function LearningMode() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [knownCount, setKnownCount] = useState(0);
  const [unknownCount, setUnknownCount] = useState(0);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (id) {
      fetchCards();
    }
  }, [id]);

  const fetchCards = async () => {
    try {
      const { data, error } = await supabase
        .from("flashcards")
        .select("*")
        .eq("set_id", id)
        .order("created_at", { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) {
        toast.error("Keine Karten zum Lernen gefunden");
        navigate(`/set/${id}`);
        return;
      }

      // Shuffle cards
      const shuffled = [...data].sort(() => Math.random() - 0.5);
      setCards(shuffled);
    } catch (error) {
      console.error("Error fetching cards:", error);
      toast.error("Fehler beim Laden der Karten");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleKnown = () => {
    setKnownCount(knownCount + 1);
    nextCard();
  };

  const handleUnknown = () => {
    setUnknownCount(unknownCount + 1);
    nextCard();
  };

  const nextCard = () => {
    setIsFlipped(false);
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setShowResults(true);
    }
  };

  const restart = () => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
    setKnownCount(0);
    setUnknownCount(0);
    setShowResults(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">📚</div>
          <p className="text-muted-foreground">Bereite Karten vor...</p>
        </div>
      </div>
    );
  }

  if (showResults) {
    const total = knownCount + unknownCount;
    const percentage = Math.round((knownCount / total) * 100);

    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background">
        <div className="container mx-auto p-4 md:p-8 flex items-center justify-center min-h-screen">
          <Card className="max-w-lg w-full p-8 text-center shadow-card">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold mb-4">Gut gemacht!</h2>
            <div className="space-y-4 mb-8">
              <div className="flex items-center justify-center gap-2 text-lg">
                <CheckCircle className="h-5 w-5 text-success" />
                <span className="font-semibold text-success">{knownCount} gewusst</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-lg">
                <XCircle className="h-5 w-5 text-destructive" />
                <span className="font-semibold text-destructive">{unknownCount} nicht gewusst</span>
              </div>
              <div className="pt-4">
                <Progress value={percentage} className="h-3" />
                <p className="text-sm text-muted-foreground mt-2">
                  {percentage}% richtig beantwortet
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={restart} className="flex-1 bg-gradient-primary">
                <RotateCw className="h-4 w-4 mr-2" />
                Nochmal üben
              </Button>
              <Button onClick={() => navigate(`/set/${id}`)} variant="outline" className="flex-1">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Zurück zum Set
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const currentCard = cards[currentIndex];
  const progress = ((currentIndex + 1) / cards.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background">
      <div className="container mx-auto p-4 md:p-8">
        <div className="flex justify-between items-center mb-4">
          <Button variant="ghost" onClick={() => navigate(`/set/${id}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück
          </Button>
          <div className="flex items-center gap-4">
            <div className="text-sm font-medium">
              Karte {currentIndex + 1} von {cards.length}
            </div>
            <ThemeToggle />
          </div>
        </div>

        <Progress value={progress} className="mb-8 h-2" />

        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-full max-w-2xl">
            <div
              className={cn(
                "relative w-full aspect-[3/2] cursor-pointer transition-transform duration-500 preserve-3d",
                isFlipped && "rotate-y-180"
              )}
              onClick={handleFlip}
              style={{ perspective: "1000px" }}
            >
              <Card
                className={cn(
                  "absolute inset-0 flex items-center justify-center p-8 backface-hidden shadow-lg",
                  !isFlipped ? "z-10" : "z-0"
                )}
              >
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-4">Vorderseite</p>
                  <p className="text-2xl md:text-3xl font-semibold">{currentCard.front}</p>
                  <p className="text-sm text-muted-foreground mt-8">Klicke zum Umdrehen</p>
                </div>
              </Card>

              <Card
                className={cn(
                  "absolute inset-0 flex items-center justify-center p-8 backface-hidden shadow-lg rotate-y-180",
                  isFlipped ? "z-10" : "z-0"
                )}
              >
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-4">Rückseite</p>
                  <p className="text-xl md:text-2xl">{currentCard.back}</p>
                </div>
              </Card>
            </div>

            {isFlipped && (
              <div className="flex gap-4 mt-8 justify-center">
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleUnknown}
                  className="flex-1 max-w-[200px] border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  <XCircle className="h-5 w-5 mr-2" />
                  Nicht gewusst
                </Button>
                <Button
                  size="lg"
                  onClick={handleKnown}
                  className="flex-1 max-w-[200px] bg-gradient-accent"
                >
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Gewusst
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  );
}