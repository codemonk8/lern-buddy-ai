import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
// import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, LogOut, BookOpen, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { CreateSetDialog } from "./CreateSetDialog";

interface LearningSet {
  id: string;
  title: string;
  description: string | null;
  emoji: string;
  color: string;
  card_count?: number;
}

export function Dashboard() {
  const [sets, setSets] = useState<LearningSet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchSets();
  }, []);

  const fetchSets = async () => {
    try {
      const { data, error } = await supabase
        .from("learning_sets")
        .select(`
          *,
          flashcards(count)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const setsWithCount = data?.map(set => ({
        ...set,
        card_count: set.flashcards?.[0]?.count || 0
      })) || [];

      setSets(setsWithCount);
    } catch (error) {
      console.error("Error fetching sets:", error);
      toast.error("Fehler beim Laden der Lernsets");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const handleDeleteSet = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm("Möchtest du dieses Lernset wirklich löschen?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("learning_sets")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Lernset gelöscht");
      fetchSets();
    } catch (error) {
      console.error("Error deleting set:", error);
      toast.error("Fehler beim Löschen");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background">
      <div className="container mx-auto p-4 md:p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
              Lernbuddy
            </h1>
            <p className="text-muted-foreground">Deine intelligente Lernkarten-App</p>
          </div>
          <Button variant="ghost" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Abmelden
          </Button>
        </div>

        <Button
          size="lg"
          className="mb-8 bg-gradient-primary hover:opacity-90 transition-opacity"
          onClick={() => setIsCreateDialogOpen(true)}
        >
          <Plus className="h-5 w-5 mr-2" />
          Neues Lernset erstellen
        </Button>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="h-32 bg-muted" />
              </Card>
            ))}
          </div>
        ) : sets.length === 0 ? (
          <Card className="text-center p-12 shadow-card">
            <div className="text-6xl mb-4">📚</div>
            <CardTitle className="mb-2">Noch keine Lernsets</CardTitle>
            <CardDescription>Erstelle dein erstes Lernset, um loszulegen!</CardDescription>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sets.map((set) => (
              <Card
                key={set.id}
                className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 shadow-card group"
                onClick={() => navigate(`/set/${set.id}`)}
              >
                <CardHeader
                  className="relative"
                  style={{ backgroundColor: set.color + "20" }}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => handleDeleteSet(set.id, e)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <div className="text-4xl mb-2">{set.emoji}</div>
                  <CardTitle className="line-clamp-1">{set.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {set.description || "Keine Beschreibung"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <BookOpen className="h-4 w-4 mr-2" />
                    <span>{set.card_count || 0} Karten</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <CreateSetDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          onSetCreated={fetchSets}
        />
      </div>
    </div>
  );
}