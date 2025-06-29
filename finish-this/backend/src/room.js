/**
 * @ Author: Levi Agostinho Horta
 * @ Create Time: 2025-06-20 14:49:01
 * @ Modified by: Your name
 * @ Modified time: 2025-06-29 16:08:22
 * @ Description: Has all the needed function for a Room
 * @ Sources: Chatgpt and Claude AI, for Problems and Questions.
 */

const pool = require("./db");

// List of possible story starters
const starters = [
  "Suddenly, the lights went out, and I heard...",
  "The letter in the mailbox said only one thing:",
  "Everyone vanished — except me and...",
  "The robot looked at me and whispered...",
  "When I touched the mirror, it...",
  "The stranger handed me a box and said...",
  "Under the bed, I found something that...",
  "I thought it was a dream until...",
  "As the elevator doors opened, I saw...",
  "My reflection moved before I did.",
  "I opened the book and the pages...",
  "Time froze, and I was the only one who...",
  "He looked exactly like me, except...",
  "I made a wish, and seconds later...",
  "The password worked. Now I had access to...",
  "The treasure map ended at...",
  "I heard my own voice calling from...",
  "The rules were simple...",
  "There was a knock at the door...",
];

// Generate a unique 4-digit room code and create a new room
async function generateUniqueRoomCode(hostNickname) {
  let roomCode;
  let exists = true;

  while (exists) {
    roomCode = Math.floor(1000 + Math.random() * 9000).toString();
    const result = await pool.query("SELECT 1 FROM rooms WHERE code = $1", [
      roomCode,
    ]);
    exists = result.rows.length > 0;
  }

  const now = new Date();
  await pool.query(
    "INSERT INTO rooms (code, round, starter, created_at, round_started_at, host_nickname, countdown_started_at) VALUES ($1, $2, $3, $4, $5, $6, $7)",
    [roomCode, 1, null, now, now, hostNickname, null]
  );

  return roomCode;
}

// Add a player to a room if not already present
async function addPlayer(roomCode, nickname) {
  const roomCheck = await pool.query("SELECT 1 FROM rooms WHERE code = $1", [
    roomCode,
  ]);
  if (roomCheck.rows.length === 0) {
    throw new Error("Room does not exist");
  }

  const playerCheck = await pool.query(
    "SELECT * FROM players WHERE nickname = $1 AND room_code = $2",
    [nickname, roomCode]
  );

  if (playerCheck.rows.length === 0) {
    await pool.query(
      "INSERT INTO players (nickname, room_code, total_points) VALUES ($1, $2, 0)",
      [nickname, roomCode]
    );
  }
}

// Get or set a random starter for the room
async function getStarter(roomCode) {
  const result = await pool.query("SELECT starter FROM rooms WHERE code = $1", [
    roomCode,
  ]);
  const current = result.rows[0]?.starter;

  if (current) return current;

  const starter = starters[Math.floor(Math.random() * starters.length)];
  await pool.query("UPDATE rooms SET starter = $1 WHERE code = $2", [
    starter,
    roomCode,
  ]);
  return starter;
}

// Get the current status of the room (timer, round, player count)
async function getRoomStatus(roomCode) {
  const result = await pool.query(
    "SELECT countdown_started_at, round FROM rooms WHERE code = $1",
    [roomCode]
  );
  if (result.rows.length === 0) throw new Error("Room not found");

  const currentRound = result.rows[0].round;
  const countdownStartedAtRaw = result.rows[0].countdown_started_at;

  if (currentRound === 1 && countdownStartedAtRaw) {
    const countdownStartedAt = new Date(countdownStartedAtRaw).getTime();
    const now = Date.now();
    const countdownMs = 60000;
    const countdownEnd = countdownStartedAt + countdownMs;
    const remainingMs = Math.max(countdownEnd - now, 0);
    const secondsLeft = Math.floor(remainingMs / 1000);

    return {
      started: remainingMs === 0,
      secondsLeft,
      playerCount: await getPlayerCount(roomCode),
      hasTimer: true,
    };
  }

  return {
    started: true,
    secondsLeft: 0,
    playerCount: await getPlayerCount(roomCode),
    hasTimer: false,
  };
}

async function getPlayerCount(roomCode) {
  const result = await pool.query(
    "SELECT COUNT(*) FROM players WHERE room_code = $1",
    [roomCode]
  );
  return parseInt(result.rows[0].count, 10);
}

async function getRound(roomCode) {
  const result = await pool.query("SELECT round FROM rooms WHERE code = $1", [
    roomCode,
  ]);
  return result.rows[0]?.round || 1;
}

async function advanceRound(roomCode) {
  const current = await getRound(roomCode);
  if (current >= 3) throw new Error("Max rounds reached");

  await pool.query(
    "UPDATE rooms SET round = $1, starter = NULL, round_started_at = NULL, countdown_started_at = NULL WHERE code = $2",
    [current + 1, roomCode]
  );
}

async function submitSentence(roomCode, nickname, text) {
  const round = await getRound(roomCode);

  const player = await pool.query(
    "SELECT id FROM players WHERE nickname = $1 AND room_code = $2",
    [nickname, roomCode]
  );
  if (player.rows.length === 0) return;

  const authorId = player.rows[0].id;

  await pool.query(
    "INSERT INTO sentences (text, author_id, room_code, round) VALUES ($1, $2, $3, $4)",
    [text, authorId, roomCode, round]
  );
}

async function voteForSentence(roomCode, sentenceId, voterNickname, emoji) {
  const voter = await pool.query(
    "SELECT id FROM players WHERE nickname = $1 AND room_code = $2",
    [voterNickname, roomCode]
  );
  if (voter.rows.length === 0) return;

  const voterId = voter.rows[0].id;

  await pool.query(
    "DELETE FROM votes WHERE sentence_id = $1 AND voter_id = $2",
    [sentenceId, voterId]
  );

  await pool.query(
    "INSERT INTO votes (sentence_id, voter_id, emoji) VALUES ($1, $2, $3)",
    [sentenceId, voterId, emoji]
  );
}

async function getSentences(roomCode) {
  const round = await getRound(roomCode);
  const result = await pool.query(
    `SELECT s.id, s.text, p.nickname AS author, s.round, s.room_code,
            ARRAY_REMOVE(ARRAY_AGG(v.emoji), NULL) AS votes
     FROM sentences s
     JOIN players p ON p.id = s.author_id
     LEFT JOIN votes v ON v.sentence_id = s.id
     WHERE s.room_code = $1 AND s.round = $2
     GROUP BY s.id, p.nickname
     ORDER BY s.id`,
    [roomCode, round]
  );
  return result.rows;
}

async function getAllSentences(roomCode) {
  const result = await pool.query(
    `SELECT s.id, s.text, p.nickname AS author, s.round, s.room_code,
            ARRAY_REMOVE(ARRAY_AGG(v.emoji), NULL) AS votes
     FROM sentences s
     JOIN players p ON p.id = s.author_id
     LEFT JOIN votes v ON v.sentence_id = s.id
     WHERE s.room_code = $1
     GROUP BY s.id, p.nickname
     ORDER BY s.id`,
    [roomCode]
  );
  return result.rows;
}

const emojiPoints = {
  "😍": 3,
  "😂": 2,
  "🤔": 1,
  "💩": 0,
};

async function updatePlayerScores(roomCode) {
  const sentences = await getSentences(roomCode);
  const scores = {};

  for (const sentence of sentences) {
    const voteArray = sentence.votes || [];
    const score = voteArray.reduce(
      (sum, emoji) => sum + (emojiPoints[emoji] || 0),
      0
    );
    const author = sentence.author;
    if (!scores[author]) scores[author] = 0;
    scores[author] += score;
  }

  for (const [nickname, score] of Object.entries(scores)) {
    await pool.query(
      `UPDATE players
       SET total_points = total_points + $1
       WHERE nickname = $2 AND room_code = $3`,
      [score, nickname, roomCode]
    );
  }
}

async function getRanking(roomCode) {
  const result = await pool.query(
    `SELECT nickname, total_points
     FROM players
     WHERE room_code = $1
     ORDER BY total_points DESC`,
    [roomCode]
  );
  return result.rows;
}

async function allSubmitted(roomCode) {
  const round = await getRound(roomCode);
  const result = await pool.query(
    "SELECT COUNT(*) AS total FROM players WHERE room_code = $1",
    [roomCode]
  );
  const totalPlayers = parseInt(result.rows[0].total, 10);

  const submitted = await pool.query(
    `SELECT COUNT(DISTINCT author_id) AS submitted
     FROM sentences
     WHERE room_code = $1 AND round = $2`,
    [roomCode, round]
  );
  const totalSubmitted = parseInt(submitted.rows[0].submitted, 10);

  return totalSubmitted === totalPlayers;
}

async function allVoted(roomCode) {
  const round = await getRound(roomCode);
  const result = await pool.query(
    "SELECT COUNT(*) AS total FROM players WHERE room_code = $1",
    [roomCode]
  );
  const totalPlayers = parseInt(result.rows[0].total, 10);

  const voted = await pool.query(
    `SELECT COUNT(DISTINCT voter_id) AS total FROM votes v
     JOIN sentences s ON s.id = v.sentence_id
     WHERE s.room_code = $1 AND s.round = $2`,
    [roomCode, round]
  );
  const totalVoted = parseInt(voted.rows[0].total, 10);

  return totalVoted === totalPlayers;
}

async function setCountdownNow(roomCode) {
  const now = new Date();
  await pool.query(
    "UPDATE rooms SET countdown_started_at = $1 WHERE code = $2 AND countdown_started_at IS NULL",
    [now, roomCode]
  );
}

async function isHost(roomCode, nickname) {
  const res = await pool.query(
    "SELECT host_nickname FROM rooms WHERE code = $1",
    [roomCode]
  );
  return res.rows[0]?.host_nickname === nickname;
}

async function forceStart(roomCode) {
  const now = new Date(Date.now() - 60000);
  await pool.query(
    "UPDATE rooms SET countdown_started_at = $1 WHERE code = $2",
    [now, roomCode]
  );
}

// Export all room-related functions
module.exports = {
  generateUniqueRoomCode,
  addPlayer,
  submitSentence,
  voteForSentence,
  getSentences,
  updatePlayerScores,
  getRanking,
  getStarter,
  getRoomStatus,
  getRound,
  advanceRound,
  allSubmitted,
  allVoted,
  setCountdownNow,
  isHost,
  forceStart,
  getAllSentences,
};
