import type { SentenceEntry } from "../types/types";
const BASE_URL = "http://localhost:3000";

export async function joinRoom(roomCode: string, nickname: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ roomCode, nickname }),
  });

  if (!res.ok) throw new Error("Failed to join room");
}

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

export async function submitSentence(roomCode: string, nickname: string, sentence: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ roomCode, nickname, sentence }),
  });

  if (!res.ok) throw new Error("Failed to submit sentence");
}

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

export async function vote(roomCode: string, sentenceId: string, nickname: string, emoji: string) {
  const res = await fetch(`${BASE_URL}/vote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ roomCode, sentenceId, nickname, emoji }),
  });

  if (!res.ok) throw new Error("Vote failed");
}

export async function isRoomReady(roomCode: string): Promise<{ ready: boolean }> {
  const res = await fetch(`${BASE_URL}/ready/${roomCode}`);
  if (!res.ok) throw new Error("Failed to check readiness");
  return res.json();
}

export async function getSentences(roomCode: string): Promise<SentenceEntry[]> {
  const response = await fetch(`${BASE_URL}/sentences/${roomCode}`);
  return await response.json();
}

export async function getScores(roomCode: string): Promise<{ nickname: string; score: number }[]> {
  const res = await fetch(`${BASE_URL}/scores/${roomCode}`);
  if (!res.ok) throw new Error("Failed to fetch scores");
  return res.json();
}


export async function getStarter(roomCode: string): Promise<{ starter: string }> {
  const res = await fetch(`${BASE_URL}/starter/${roomCode}`);
  if (!res.ok) throw new Error("Failed to fetch starter");
  return res.json();
}

export async function hasEveryoneVoted(roomCode: string): Promise<{ allVoted: boolean }> {
  const res = await fetch(`${BASE_URL}/voting-complete/${roomCode}`);
  return res.json();
}

export async function advanceRound(roomCode: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/next-round`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ roomCode }),
  });
  if (!res.ok) throw new Error("Failed to advance round");
}

export async function getRound(roomCode: string): Promise<number> {
  const res = await fetch(`${BASE_URL}/round/${roomCode}`);
  if (!res.ok) throw new Error("Failed to get round");
  const data = await res.json();
  return data.round;
}

export async function getBestSentences(roomCode: string) {
  const response = await fetch(`http://localhost:3000/best-sentences/${roomCode}`);
  if (!response.ok) throw new Error("Failed to get best sentences");
  return await response.json();
}

export async function startGameCountdown(roomCode: string) {
  await fetch(`http://localhost:3000/room/${roomCode}/start-countdown`, { method: "POST" });
}

export async function forceStartGame(roomCode: string, nickname: string) {
  await fetch(`http://localhost:3000/room/${roomCode}/force-start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nickname }),
  });
}

export async function isHost(roomCode: string, nickname: string): Promise<boolean> {
  const res = await fetch(`http://localhost:3000/room/${roomCode}/is-host/${nickname}`);
  const data = await res.json();
  return data.isHost;
}




