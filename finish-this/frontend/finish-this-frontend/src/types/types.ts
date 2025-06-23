/**
 * @ Author: Levi Agostinho Horta
 * @ Create Time: 2025-06-16 11:38:02
 * @ Modified by: Your name
 * @ Modified time: 2025-06-23 16:23:40
 * @ Description: Defines the structure of a sentence object used in the game
 */

export type SentenceEntry = {
  id: string;
  text: string;
  votes?: string[];
  author: string;
  score?: number;
};