export type Grade = 0 | 1 | 2 | 3; // Again, Hard, Good, Easy

export interface SRSState {
  repetitions: number;
  easeFactor: number;
  interval: number;
  nextReview: string; // ISO date string
}

export interface Card {
  id: string;
  front: string;
  back: string;
  tags: string[];
  srs: SRSState;
  createdAt: string;
}

export interface Deck {
  id: string;
  name: string;
  description: string;
  cards: Card[];
  createdAt: string;
}

export const INITIAL_SRS_STATE: SRSState = {
  repetitions: 0,
  easeFactor: 2.5,
  interval: 0,
  nextReview: new Date().toISOString(),
};

/**
 * Simplified SM-2 Algorithm
 */
export function calculateNextReview(grade: Grade, srs: SRSState): SRSState {
  let { repetitions, easeFactor, interval } = srs;

  if (grade >= 2) {
    // Correct response
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions++;
  } else {
    // Incorrect response
    repetitions = 0;
    interval = 1;
  }

  // Calculate new ease factor
  // Based on the formula: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  // We adapt it for a 0-3 scale (multiplied by 5/3 approx, or just simplified)
  // Standard SM-2 q=3 (Good) -> no change. q=4 (Easy) -> increase. q=2 (Hard) -> decrease.
  // Our mapping: 0: Again, 1: Hard, 2: Good, 3: Easy
  // Standard mapping: 0-5. 2 is Hard, 3 is Good, 4 is Easy, 5 is Perfect.
  // Let's use a simpler linear adjustment:
  const adjustment = 0.1 - (3 - grade) * (0.08 + (3 - grade) * 0.02);
  easeFactor = Math.max(1.3, easeFactor + adjustment);

  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + interval);

  return {
    repetitions,
    easeFactor,
    interval,
    nextReview: nextReviewDate.toISOString(),
  };
}
