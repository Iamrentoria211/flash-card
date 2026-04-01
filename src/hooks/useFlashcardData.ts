import { useState, useEffect } from 'react';
import { calculateNextReview, INITIAL_SRS_STATE } from '../utils/srs';
import type { Deck, Card, Grade } from '../utils/srs';

const STORAGE_KEY = 'flash-card-data';

export function useFlashcardData() {
  const [decks, setDecks] = useState<Deck[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(decks));
  }, [decks]);

  const addDeck = (name: string, description: string) => {
    const newDeck: Deck = {
      id: crypto.randomUUID(),
      name,
      description,
      cards: [],
      createdAt: new Date().toISOString(),
    };
    setDecks([...decks, newDeck]);
  };

  const deleteDeck = (deckId: string) => {
    setDecks(decks.filter((d) => d.id !== deckId));
  };

  const addCard = (deckId: string, front: string, back: string, tags: string[] = []) => {
    const newCard: Card = {
      id: crypto.randomUUID(),
      front,
      back,
      tags,
      srs: { ...INITIAL_SRS_STATE },
      createdAt: new Date().toISOString(),
    };
    setDecks(
      decks.map((d) => (d.id === deckId ? { ...d, cards: [...d.cards, newCard] } : d))
    );
  };

  const updateCard = (deckId: string, cardId: string, updates: Partial<Card>) => {
    setDecks(
      decks.map((d) =>
        d.id === deckId
          ? {
              ...d,
              cards: d.cards.map((c) => (c.id === cardId ? { ...c, ...updates } : c)),
            }
          : d
      )
    );
  };

  const deleteCard = (deckId: string, cardId: string) => {
    setDecks(
      decks.map((d) =>
        d.id === deckId ? { ...d, cards: d.cards.filter((c) => c.id !== cardId) } : d
      )
    );
  };

  const reviewCard = (deckId: string, cardId: string, grade: Grade) => {
    setDecks(
      decks.map((d) =>
        d.id === deckId
          ? {
              ...d,
              cards: d.cards.map((c) =>
                c.id === cardId
                  ? { ...c, srs: calculateNextReview(grade, c.srs) }
                  : c
              ),
            }
          : d
      )
    );
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify(decks, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flashcards-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (data: any) => {
    try {
      if (Array.isArray(data)) {
        setDecks(data);
      }
    } catch (e) {
      console.error('Import failed', e);
    }
  };

  return {
    decks,
    addDeck,
    deleteDeck,
    addCard,
    updateCard,
    deleteCard,
    reviewCard,
    exportData,
    importData,
  };
}
