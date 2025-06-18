const pool = require("./db");
const express = require("express");
const cors = require("cors");
const {
  addPlayer,
  createRoom,
  getRoomStatus,
  getStarter,
  submitSentence,
  getSentences,
  voteForSentence,
  allSubmitted,
  allVoted,
  advanceRound,
  getRound,
} = require("./room");
const {
  generateUniqueRoomCode,
  updatePlayerScores,
  getRanking,
} = require("./room");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.post("/join", async (req, res) => {
  const { roomCode, nickname } = req.body;
  if (!roomCode || !nickname) return res.status(400).send("Missing fields");

  try {
    await addPlayer(roomCode, nickname);
    res.status(200).send("Joined room");
  } catch (err) {
    console.error("JOIN ERROR:", err);
    res.status(500).send("Error joining room");
  }
});

app.post("/create", async (req, res) => {
  const { nickname } = req.body;
  if (!nickname) return res.status(400).send("Nickname is required");

  try {
    const roomCode = await generateUniqueRoomCode();
    await addPlayer(roomCode, nickname);

    res.status(200).json({ roomCode });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error creating room");
  }
});

app.get("/starter/:roomCode", async (req, res) => {
  try {
    const starter = await getStarter(req.params.roomCode);
    res.json({ starter });
  } catch (err) {
    console.error(err);
    res.status(500).send("Could not fetch starter");
  }
});

app.get("/status/:roomCode", async (req, res) => {
  try {
    const status = await getRoomStatus(req.params.roomCode);
    res.json(status);
  } catch (err) {
    console.error(err);
    res.status(500).send("Could not fetch status");
  }
});

app.post("/submit", async (req, res) => {
  const { roomCode, nickname, sentence } = req.body;
  if (!roomCode || !nickname || !sentence) {
    return res.status(400).send("Missing fields");
  }

  try {
    await submitSentence(roomCode, nickname, sentence);
    res.status(200).send("Sentence submitted");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error submitting sentence");
  }
});

app.get("/sentences/:roomCode", async (req, res) => {
  try {
    const sentences = await getSentences(req.params.roomCode);
    res.json(sentences);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching sentences");
  }
});

app.post("/vote", async (req, res) => {
  const { roomCode, sentenceId, nickname, emoji } = req.body;

  if (!roomCode || !sentenceId || !nickname || !emoji) {
    return res.status(400).send("Missing fields");
  }

  try {
    await voteForSentence(roomCode, sentenceId, nickname, emoji);
    res.status(200).send("Vote recorded");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error recording vote");
  }
});

app.post("/calculate-scores", async (req, res) => {
  const { roomCode } = req.body;
  try {
    await updatePlayerScores(roomCode);
    const scores = await getRanking(roomCode);
    res.json(scores);
  } catch (err) {
    console.error(err);
    res.status(500).send("Score update failed");
  }
});

app.get("/ready/:roomCode", async (req, res) => {
  try {
    const ready = await allSubmitted(req.params.roomCode);
    res.json({ ready });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error checking ready state");
  }
});

app.get("/voting-complete/:roomCode", async (req, res) => {
  try {
    const all = await allVoted(req.params.roomCode);
    res.json({ allVoted: all });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error checking voting state");
  }
});

app.get("/ranking/:roomCode", async (req, res) => {
  const { roomCode } = req.params;
  try {
    await updatePlayerScores(roomCode);
    const scores = await getRanking(roomCode);
    res.json(scores);
  } catch (err) {
    console.error(err);
    res.status(500).send("Score update failed");
  }
});

app.post("/next-round", async (req, res) => {
  const { roomCode } = req.body;
  if (!roomCode) return res.status(400).send("Missing roomCode");

  try {
    await advanceRound(roomCode);
    res.status(200).send("Round advanced");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error advancing round");
  }
});

app.get("/round/:roomCode", async (req, res) => {
  try {
    const round = await getRound(req.params.roomCode);
    res.json({ round });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching round");
  }
});

app.get("/best-sentences/:roomCode", async (req, res) => {
  try {
    const sentences = await getSentences(req.params.roomCode);
    const emojiPoints = { "😍": 3, "😂": 2, "🤔": 1, "💩": 0 };
    const withScores = sentences.map((s) => ({
      ...s,
      score: (s.votes || []).reduce(
        (sum, emoji) => sum + (emojiPoints[emoji] || 0),
        0
      ),
    }));
    res.json(withScores);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching best sentences");
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
