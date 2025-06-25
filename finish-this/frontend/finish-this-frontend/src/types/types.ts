/**
 * @ Author: Levi Agostinho Horta
 * @ Create Time: 2025-06-16 11:38:02
 * @ Modified by: Your name
 * @ Modified time: 2025-06-25 14:45:09
 * @ Description: Defines the structure of a sentence object used in the game
 * @ Sources: Chatgpt and Claude AI, for Problems and Questions.
 */

// Represents a sentence submitted by a player in the game
export type SentenceEntry = {
  id: string; 
  text: string; 
  votes?: string[]; 
  author: string; 
  score?: number; 
};