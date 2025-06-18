const pool = require("./db");

const starters = [
  "It all started when...",
  "The last thing I expected was...",
  "Before I knew it, the dog had...",
  "At midnight, something strange happened:",
  "If I could go back in time, I would...",
  "No one believed me when I said...",
  "Everything changed the day I found...",
  "I never meant to open that door, but...",
  "The message was clear: run.",
  "I had one job, and I blew it.",
  "She whispered something I'll never forget...",
  "Somewhere between reality and dream, I saw...",
  "The rain didn't stop for three days.",
  "They told me not to press the red button.",
  "I woke up in a place I didn't recognize.",
  "Just five minutes earlier, and everything would be different.",
  "We made a deal — one I instantly regretted.",
  "It was supposed to be a normal Tuesday...",
  "The silence was louder than any scream.",
  "They weren't supposed to come back.",
];

// Nur beim Raum erstellen verwenden
async function generateUniqueRoomCode() {
  let roomCode;
  let exists = true;

  while (exists) {
    roomCode = Math.floor(1000 + Math.random() * 9000).toString();
    const result = await pool.query("SELECT 1 FROM rooms WHERE code = $1", [
      roomCode,
    ]);
    exists = result.rows.length > 0;
  }

  // Setze round_started_at nur für die erste Runde (Timer)
  const now = new Date();
  await pool.query(
    "INSERT INTO rooms (code, round, starter, created_at, round_started_at) VALUES ($1, $2, $3, $4, $5)",
    [roomCode, 1, null, now, now]
  );

  return roomCode;
}

async function addPlayer(roomCode, nickname) {
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

async function getRoomStatus(roomCode) {
  const result = await pool.query(
    "SELECT round_started_at, round FROM rooms WHERE code = $1",
    [roomCode]
  );
  if (result.rows.length === 0) throw new Error("Room not found");

  const currentRound = result.rows[0].round;
  const roundStartedAtRaw = result.rows[0].round_started_at;

  // Timer nur in Runde 1
  if (currentRound === 1 && roundStartedAtRaw) {
    const roundStartedAt = new Date(roundStartedAtRaw).getTime();
    const now = Date.now();
    const countdownMs = 30000; // 30 Sekunden
    const countdownEnd = roundStartedAt + countdownMs;
    const remainingMs = Math.max(countdownEnd - now, 0);
    const secondsLeft = Math.floor(remainingMs / 1000);

    return {
      started: remainingMs === 0,
      secondsLeft,
      playerCount: await getPlayerCount(roomCode),
      hasTimer: true,
    };
  }

  // Ab Runde 2: Kein Timer
  return {
    started: true, // Spiel ist immer "gestartet" ab Runde 2
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
  if (current >= 7) throw new Error("Max rounds reached");

  // WICHTIG: Setze round_started_at auf NULL für Runden > 1
  // Nur round und starter werden aktualisiert, KEIN neuer Timer
  await pool.query(
    "UPDATE rooms SET round = $1, starter = NULL, round_started_at = NULL WHERE code = $2",
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

  // Lösche vorherige Stimme für diesen Satz vom gleichen Wähler
  await pool.query(
    "DELETE FROM votes WHERE sentence_id = $1 AND voter_id = $2",
    [sentenceId, voterId]
  );

  // Füge neue Stimme hinzu
  await pool.query(
    "INSERT INTO votes (sentence_id, voter_id, emoji) VALUES ($1, $2, $3)",
    [sentenceId, voterId, emoji]
  );
}

async function getSentences(roomCode) {
  const round = await getRound(roomCode);
  const result = await pool.query(
    `SELECT s.id, s.text, p.nickname AS author, s.round, s.room_code,
            ARRAY_AGG(v.emoji) AS votes
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
};
