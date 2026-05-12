import { useState, useEffect } from 'react';

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  updatedAt: string;
  createdAt: string;
}

const STORAGE_KEY = 'flash-card-notes';

export function useNotesData() {
  const [notes, setNotes] = useState<Note[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  }, [notes]);

  const addNote = (title: string, content: string, tags: string[] = []) => {
    const newNote: Note = {
      id: crypto.randomUUID(),
      title,
      content,
      tags,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setNotes([newNote, ...notes]);
    return newNote.id;
  };

  const updateNote = (id: string, updates: Partial<Note>) => {
    setNotes(
      notes.map((n) =>
        n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n
      )
    );
  };

  const deleteNote = (id: string) => {
    setNotes(notes.filter((n) => n.id !== id));
  };

  return {
    notes,
    addNote,
    updateNote,
    deleteNote,
  };
}
