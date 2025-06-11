const rooms = [];

function getRoomByCode(code) {
  return rooms.find((r) => r.roomCode === code);
}

function createRoomIfNotExists(roomCode) {
  let room = getRoomByCode(roomCode);
  if (!room) {
    room = {
      roomCode,
      players: [],
      sentences: [],
      starter: null,
      stared: false,
      countdownEnd: null,
    };
    room.players.push({ nickname, score: 0, submitted: false, voted: false });
    rooms.push(room);
  }
  return room;
}

function addPlayer(roomCode, nickname) {
  const room = createRoomIfNotExists(roomCode);
  const existing = room.players.find((p) => p.nickname === nickname);
  if (!existing) {
    room.players.push({ nickname, score: 0, submitted: false });
  }

  if (!room.countdownEnd) {
    const countdownMs = 90 * 1000;
    room.countdownEnd = Date.now() + countdownMs;

    setTimeout(() => {
      room.started = true;
    }, countdownMs);
  }
}

function submitSentence(roomCode, nickname, text) {
  const room = getRoomByCode(roomCode);
  if (!room) return;

  const id = `${Date.now()}-${Math.random()}`;
  room.sentences.push({ id, text, author: nickname, votes: 0 });

  const player = room.players.find((p) => p.nickname === nickname);
  if (player) {
    player.submitted = true;
  }
}

function voteForSentence(roomCode, sentenceId) {
  const room = getRoomByCode(roomCode);
  if (!room) return;

  const sentence = room.sentences.find((s) => s.id === sentenceId);
  if (!sentence) return;

  sentence.votes += 1;

  const player = room.players.find((p) => p.nickname === sentence.author);
  if (player) player.score += 1;
}

module.exports = {
  rooms,
  getRoomByCode,
  createRoomIfNotExists,
  addPlayer,
  submitSentence,
  voteForSentence,
};
