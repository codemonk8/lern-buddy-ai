import { z } from "zod";

// Learning Set validation
export const learningSetSchema = z.object({
  title: z.string()
    .trim()
    .min(1, "Titel erforderlich")
    .max(100, "Titel darf maximal 100 Zeichen haben"),
  description: z.string()
    .trim()
    .max(500, "Beschreibung darf maximal 500 Zeichen haben")
    .optional(),
  emoji: z.string()
    .min(1, "Emoji erforderlich")
    .max(10, "Ungültiges Emoji"),
  color: z.string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Ungültige Farbe"),
});

// Flashcard validation
export const flashcardSchema = z.object({
  front: z.string()
    .trim()
    .min(1, "Vorderseite erforderlich")
    .max(1000, "Vorderseite darf maximal 1000 Zeichen haben"),
  back: z.string()
    .trim()
    .min(1, "Rückseite erforderlich")
    .max(2000, "Rückseite darf maximal 2000 Zeichen haben"),
});

// Topic validation for AI generation
export const topicSchema = z.string()
  .trim()
  .min(2, "Thema muss mindestens 2 Zeichen haben")
  .max(200, "Thema darf maximal 200 Zeichen haben");

// Auth validation
export const authSchema = z.object({
  email: z.string()
    .trim()
    .email("Ungültige E-Mail-Adresse")
    .max(255, "E-Mail darf maximal 255 Zeichen haben"),
  password: z.string()
    .min(6, "Passwort muss mindestens 6 Zeichen haben")
    .max(100, "Passwort darf maximal 100 Zeichen haben"),
});
