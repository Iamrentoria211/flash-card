import { useState, useEffect } from 'react';
import { calculateNextReview, INITIAL_SRS_STATE } from '../utils/srs';
import type { Deck, Card, Grade } from '../utils/srs';

export interface SessionHistoryItem {
  id: string;
  completedAt: string;
  itemCount: number;
  status: 'completed' | 'skipped' | 'failed';
}

const STORAGE_KEY = 'flash-card-data-v2';

export function useFlashcardData() {
  const [data, setData] = useState<{ decks: Deck[], history: SessionHistoryItem[] }>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
    // Fallback to old key for migration
    const oldSaved = localStorage.getItem('flash-card-data');
    if (oldSaved) {
      return { decks: JSON.parse(oldSaved), history: [] };
    }
    return { decks: [], history: [] };
  });

  const decks = data.decks;
  const sessionHistory = data.history;

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const setDecks = (newDecks: Deck[]) => {
    setData(prev => ({ ...prev, decks: newDecks }));
  };

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

  const recordSession = (itemCount: number, status: SessionHistoryItem['status']) => {
    const newSession: SessionHistoryItem = {
      id: crypto.randomUUID(),
      completedAt: new Date().toISOString(),
      itemCount,
      status,
    };
    setData(prev => ({
      ...prev,
      history: [newSession, ...prev.history].slice(0, 500) // Keep last 500 sessions
    }));
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flashcards-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (importedData: any) => {
    try {
      if (importedData.decks && Array.isArray(importedData.decks)) {
        setData(importedData);
      } else if (Array.isArray(importedData)) {
        setData({ decks: importedData, history: [] });
      }
    } catch (e) {
      console.error('Import failed', e);
    }
  };

  return {
    decks,
    sessionHistory,
    addDeck,
    deleteDeck,
    addCard,
    updateCard,
    deleteCard,
    reviewCard,
    recordSession,
    exportData,
    importData,
  };
}
