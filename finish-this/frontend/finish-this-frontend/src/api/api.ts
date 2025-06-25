/**
 * @ Author: Levi Agostinho Horta
 * @ Create Time: 2025-06-11 13:28:57
 * @ Modified by: Your name
 * @ Modified time: 2025-06-25 15:52:33
 * @ Description: Frontend API-Request for the Backend
 * @ Sources: Chatgpt and Claude AI, for Problems and Questions.
 */

import type { SentenceEntry } from "../types/types";
const BASE_URL = `${import.meta.env.VITE_API_URL}`;

// Join an existing game room
export async function joinRoom(roomCode: string, nickname: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ roomCode, nickname }),
  });

  if (!res.ok) throw new Error("Failed to join room");
}

// Create a new game room and return its code
export async function createRoom(nickname: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nickname }),
  });

  if (!res.ok) throw new Error("Failed to create room");

  const data = await res.json();
  return data.roomCode;
}

// Submit a sentence for the current round
export async function submitSentence(roomCode: string, nickname: string, sentence: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ roomCode, nickname, sentence }),
  });

  if (!res.ok) throw new Error("Failed to submit sentence");
}

// Get current room status (timer, player count, etc.)
export async function getRoomStatus(roomCode: string): Promise<{
  started: boolean;
  secondsLeft: number;
  playerCount: number;
  hasTimer: boolean;
}> {
  const res = await fetch(`${BASE_URL}/status/${roomCode}`);
  if (!res.ok) throw new Error("Failed to fetch room status");
  return res.json();
}

// Submit a vote (emoji) for a sentence
export async function vote(roomCode: string, sentenceId: string, nickname: string, emoji: string) {
  const res = await fetch(`${BASE_URL}/vote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ roomCode, sentenceId, nickname, emoji }),
  });

  if (!res.ok) throw new Error("Vote failed");
}

// Check if the room is ready to start
export async function isRoomReady(roomCode: string): Promise<{ ready: boolean }> {
  const res = await fetch(`${BASE_URL}/ready/${roomCode}`);
  if (!res.ok) throw new Error("Failed to check readiness");
  return res.json();
}

// Get all submitted sentences for the round
export async function getSentences(roomCode: string): Promise<SentenceEntry[]> {
  const response = await fetch(`${BASE_URL}/sentences/${roomCode}`);
  return await response.json();
}

// Get player scores for the room
export async function getScores(roomCode: string): Promise<{ nickname: string; score: number }[]> {
  const res = await fetch(`${BASE_URL}/scores/${roomCode}`);
  if (!res.ok) throw new Error("Failed to fetch scores");
  return res.json();
}

// Get the starter sentence for the round
export async function getStarter(roomCode: string): Promise<{ starter: string }> {
  const res = await fetch(`${BASE_URL}/starter/${roomCode}`);
  if (!res.ok) throw new Error("Failed to fetch starter");
  return res.json();
}

// Check if all players have voted
export async function hasEveryoneVoted(roomCode: string): Promise<{ allVoted: boolean }> {
  const res = await fetch(`${BASE_URL}/voting-complete/${roomCode}`);
  return res.json();
}

// Advance to the next round
export async function advanceRound(roomCode: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/next-round`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ roomCode }),
  });
  if (!res.ok) throw new Error("Failed to advance round");
}

// Get the current round number
export async function getRound(roomCode: string): Promise<number> {
  const res = await fetch(`${BASE_URL}/round/${roomCode}`);
  if (!res.ok) throw new Error("Failed to get round");
  const data = await res.json();
  return data.round;
}

// Get the best sentences of the game
export async function getBestSentences(roomCode: string) {
  const response = await fetch(`${BASE_URL}/best-sentences/${roomCode}`);
  if (!response.ok) throw new Error("Failed to get best sentences");
  return await response.json();
}

// Start the game countdown (host only)
export async function startGameCountdown(roomCode: string) {
  await fetch(`${BASE_URL}/room/${roomCode}/start-countdown`, { method: "POST" });
}

// Force start the game (host only)
export async function forceStartGame(roomCode: string, nickname: string) {
  await fetch(`${BASE_URL}/room/${roomCode}/force-start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nickname }),
  });
}

// Check if the user is the host
export async function isHost(roomCode: string, nickname: string): Promise<boolean> {
  const res = await fetch(`${BASE_URL}/room/${roomCode}/is-host/${nickname}`);
  const data = await res.json();
  return data.isHost;
}

// Get the list of player nicknames in the room
export async function getPlayers(roomCode: string): Promise<string[]> {
  const res = await fetch(`${BASE_URL}/players/${roomCode}`);
  if (!res.ok) throw new Error("Failed to get players");
  return await res.json();
}



