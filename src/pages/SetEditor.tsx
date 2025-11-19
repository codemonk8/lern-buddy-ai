import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus, Play, Trash2, Sparkles, Share2 } from "lucide-react";
import { toast } from "sonner";
import { CardEditor } from "@/components/CardEditor";
import { AIGeneratorDialog } from "@/components/AIGeneratorDialog";
import { ShareDialog } from "@/components/ShareDialog";
import { ThemeToggle } from "@/components/ThemeToggle";

interface LearningSet {
  id: string;
  title: string;
  description: string | null;
  emoji: string;
  color: string;
  is_public: boolean;
  share_token: string | null;
  user_id: string;
}

interface Flashcard {
  id: string;
  front: string;
  back: string;
}

export default function SetEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [set, setSet] = useState<LearningSet | null>(null);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const [isCardEditorOpen, setIsCardEditorOpen] = useState(false);
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    if (id) {
      fetchSetAndCards();
    }
  }, [id]);

  const fetchSetAndCards = async () => {
    try {
      const { data: setData, error: setError } = await supabase
        .from("learning_sets")
        .select("*")
        .eq("id", id)
        .single();

      if (setError) throw setError;
      setSet(setData);

      // Check if the current user is the owner
      const { data: { user } } = await supabase.auth.getUser();
      setIsOwner(user?.id === setData.user_id);

      const { data: cardsData, error: cardsError } = await supabase
        .from("flashcards")
        .select("*")
        .eq("set_id", id)
        .order("created_at", { ascending: true });

      if (cardsError) throw cardsError;
      setCards(cardsData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Fehler beim Laden der Daten");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!confirm("Möchtest du diese Karte wirklich löschen?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("flashcards")
        .delete()
        .eq("id", cardId);

      if (error) throw error;

      toast.success("Karte gelöscht");
      fetchSetAndCards();
    } catch (error) {
      console.error("Error deleting card:", error);
      toast.error("Fehler beim Löschen");
    }
  };

  const handleAddNewCard = () => {
    setEditingCard(null);
    setIsCardEditorOpen(true);
  };

  const handleEditCard = (card: Flashcard) => {
    setEditingCard(card);
    setIsCardEditorOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">📚</div>
          <p className="text-muted-foreground">Lade Lernset...</p>
        </div>
      </div>
    );
  }

  if (!set) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background flex items-center justify-center">
        <Card className="text-center p-12">
          <div className="text-6xl mb-4">❌</div>
          <CardTitle>Lernset nicht gefunden</CardTitle>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background">
      <div className="container mx-auto p-4 md:p-8">
        <div className="flex justify-between items-center mb-4">
          <Button variant="ghost" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück
          </Button>
          <ThemeToggle />
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="text-5xl" style={{ color: set.color }}>
              {set.emoji}
            </div>
            <div>
              <h1 className="text-3xl font-bold">{set.title}</h1>
              {set.description && (
                <p className="text-muted-foreground">{set.description}</p>
              )}
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {cards.length > 0 && (
              <Button
                onClick={() => navigate(`/learn/${id}`)}
                variant="default"
                className="bg-gradient-accent hover:opacity-90"
              >
                <Play className="h-4 w-4 mr-2" />
                Lernen starten
              </Button>
            )}
            {isOwner && (
              <>
                <Button
                  onClick={handleAddNewCard}
                  className="bg-gradient-primary hover:opacity-90"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Karte hinzufügen
                </Button>
                <Button
                  onClick={() => setIsAIDialogOpen(true)}
                  variant="secondary"
                  className="bg-gradient-secondary hover:opacity-90"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Mit KI generieren
                </Button>
                <Button
                  onClick={() => setIsShareDialogOpen(true)}
                  variant="outline"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Teilen
                </Button>
              </>
            )}
            {!isOwner && (
              <p className="text-sm text-muted-foreground flex items-center">
                📖 Geteiltes Lernset (nur ansehen)
              </p>
            )}
          </div>
        </div>

        {cards.length === 0 ? (
          <Card className="text-center p-12 shadow-card">
            <div className="text-6xl mb-4">📝</div>
            <CardTitle className="mb-2">Noch keine Karten</CardTitle>
            <p className="text-muted-foreground mb-4">
              Füge Karten hinzu oder generiere sie mit KI
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {cards.map((card) => (
              <Card
                key={card.id}
                className={`hover:shadow-lg transition-all duration-300 hover:-translate-y-1 shadow-card group ${isOwner ? 'cursor-pointer' : ''}`}
                onClick={() => isOwner && handleEditCard(card)}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Vorderseite
                    </CardTitle>
                    {isOwner && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCard(card.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <p className="text-base font-semibold line-clamp-3">{card.front}</p>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-muted-foreground mb-1">Rückseite</p>
                  <p className="text-sm line-clamp-3">{card.back}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {isOwner && (
          <>
            <CardEditor
              open={isCardEditorOpen}
              onOpenChange={setIsCardEditorOpen}
              setId={id!}
              card={editingCard}
              onCardSaved={fetchSetAndCards}
            />

            <AIGeneratorDialog
              open={isAIDialogOpen}
              onOpenChange={setIsAIDialogOpen}
              setId={id!}
              onCardsGenerated={fetchSetAndCards}
            />

            <ShareDialog
              open={isShareDialogOpen}
              onOpenChange={setIsShareDialogOpen}
              setId={id!}
              isPublic={set.is_public}
              shareToken={set.share_token}
              onShareUpdated={fetchSetAndCards}
            />
          </>
        )}
      </div>
    </div>
  );
}