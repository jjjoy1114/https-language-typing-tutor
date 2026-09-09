export type TypingMode = 'word' | 'sentence' | 'paragraph';

export interface HistoryRecord {
  id: string;
  name: string;
  date: string;
  textTitle: string;
  mode: TypingMode;
  wpm: number;
  cpm: number;
  accuracy: number;
  timeSpent: number; // in seconds
  completed: boolean;
}

export interface TextPreset {
  id: string;
  title: string;
  language: 'ko' | 'en' | 'custom';
  content: string;
  description: string;
}
