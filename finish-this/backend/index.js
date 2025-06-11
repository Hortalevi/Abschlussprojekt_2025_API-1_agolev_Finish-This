const express = require("express");
const cors = require("cors");
const {
  rooms,
  addPlayer,
  submitSentence,
  voteForSentence,
  getRoomByCode,
} = require("./room");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.post("/join", (req, res) => {
  const { roomCode, nickname } = req.body;
  if (!roomCode || !nickname) return res.status(400).send("Missing fields");

  const room = getRoomByCode(roomCode);
  if (!room) return res.status(404).send("Room not found");

  const existing = room.players.find((p) => p.nickname === nickname);
  if (!existing) {
    room.players.push({ nickname, score: 0, submitted: false });
  }

  res.status(200).send("Joined room");
});

app.post("/create", (req, res) => {
  const { nickname } = req.body;
  if (!nickname) return res.status(400).send("Nickname is required");

  let roomCode;
  do {
    roomCode = Math.floor(1000 + Math.random() * 9000).toString();
  } while (rooms.find((r) => r.roomCode === roomCode));

  const countdownEnd = Date.now() + 90_000;

  const room = {
    roomCode,
    players: [{ nickname, score: 0, submitted: false }],
    sentences: [],
    starter: null,
    countdownEnd,
    started: false,
  };

  rooms.push(room);
  res.status(200).json({ roomCode });
});

app.get("/starter/:roomCode", (req, res) => {
  const room = getRoomByCode(req.params.roomCode);
  if (!room) return res.status(404).send("Room not found");

  if (!room.started) {
    return res.status(400).json({ error: "Game has not started yet" });
  }

  if (!room.starter) {
    const starters = [
      "It all started when...",
      "The last thing I expected was...",
      "Before I knew it, the dog had...",
      "At midnight, something strange happened:",
      "If I could go back in time, I would...",
    ];
    room.starter = starters[Math.floor(Math.random() * starters.length)];
  }

  res.json({ starter: room.starter });
});

app.get("/status/:roomCode", (req, res) => {
  const room = getRoomByCode(req.params.roomCode);
  if (!room) return res.status(404).send("Room not found");

  if (!room.countdownEnd) {
    room.countdownEnd = Date.now() + 90_000;
    room.started = false;
  }

  const now = Date.now();
  const remainingMs = Math.max(room.countdownEnd - now, 0);
  const secondsLeft = Math.floor(remainingMs / 1000);

  if (remainingMs === 0 && !room.started) {
    room.started = true;
  }

  res.json({
    started: room.started,
    secondsLeft,
    playerCount: room.players.length,
  });
});

app.post("/submit", (req, res) => {
  const { roomCode, nickname, sentence } = req.body;
  const room = getRoomByCode(roomCode);
  if (!room) return res.status(404).send("Room not found");

  const player = room.players.find((p) => p.nickname === nickname);
  if (!player) return res.status(403).send("Player not in room");

  const id = Date.now().toString();
  room.sentences.push({ id, text: sentence, author: nickname, votes: 0 });
  player.submitted = true;

  res.status(200).send("Sentence submitted");
});

app.post("/vote", (req, res) => {
  const { roomCode, sentenceId, nickname } = req.body;

  if (!roomCode || !sentenceId || !nickname) {
    return res.status(400).send("Missing fields");
  }

  const room = getRoomByCode(roomCode);
  if (!room) {
    return res.status(404).send("Room not found");
  }

  const sentence = room.sentences.find((s) => s.id === sentenceId);
  if (!sentence) {
    return res.status(404).send("Sentence not found");
  }

  sentence.votes = (sentence.votes || 0) + 1;

  const author = room.players.find((p) => p.nickname === sentence.author);
  if (author) {
    author.score = (author.score || 0) + 1;
  }

  const player = room.players.find((p) => p.nickname === nickname);
  if (player) {
    player.voted = true;
  }

  res.status(200).send("Vote recorded");
});

app.get("/voting-complete/:roomCode", (req, res) => {
  const room = getRoomByCode(req.params.roomCode);
  if (!room) return res.status(404).send("Room not found");

  const allVoted = room.players.every((p) => p.voted);
  res.json({ allVoted });
});

app.get("/ready/:roomCode", (req, res) => {
  const room = getRoomByCode(req.params.roomCode);
  if (!room) return res.status(404).send("Room not found");

  const allSubmitted = room.players.every((p) => p.submitted);
  res.json({ ready: allSubmitted });
});

app.get("/sentences/:roomCode", (req, res) => {
  const room = getRoomByCode(req.params.roomCode);
  if (!room) return res.status(404).send("Room not found");

  const sentences = room.sentences.map(({ id, text, votes }) => ({
    id,
    text,
    votes,
  }));

  res.json(sentences);
});

app.get("/scores/:roomCode", (req, res) => {
  const room = getRoomByCode(req.params.roomCode);
  if (!room) return res.status(404).send("Room not found");

  const scores = room.players.map((p) => ({
    nickname: p.nickname,
    score: p.score,
  }));

  res.json(scores);
});

app.post("/next-round", (req, res) => {
  const { roomCode } = req.body;
  const room = getRoomByCode(roomCode);
  if (!room) return res.status(404).send("Room not found");

  room.round = (room.round || 1) + 1;
  room.sentences = [];
  room.players.forEach((p) => {
    p.submitted = false;
    p.voted = false;
  });
  room.starter = null;

  res.status(200).send("Round advanced");
});

app.get("/round/:roomCode", (req, res) => {
  const room = getRoomByCode(req.params.roomCode);
  if (!room) return res.status(404).send("Room not found");

  res.json({ round: room.round || 1 });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
