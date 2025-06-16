const rooms = [];

function getRoomByCode(code) {
  return rooms.find((r) => r.roomCode === code);
}

function addPlayer(roomCode, nickname) {
  let room = getRoomByCode(roomCode);

  if (!room) {
    room = {
      roomCode,
      players: [],
      sentences: [],
      starter: null,
      started: false,
      countdownEnd: null,
      round: 1,
    };
    rooms.push(room);
  }

  const existing = room.players.find((p) => p.nickname === nickname);
  if (!existing) {
    room.players.push({
      nickname,
      score: 0,
      submitted: false,
      voted: false,
    });
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
  room.sentences.push({ id, text, author: nickname, votes: [] });

  const player = room.players.find((p) => p.nickname === nickname);
  if (player) {
    player.submitted = true;
  }
}

function voteForSentence(roomCode, sentenceId, emoji) {
  const room = getRoomByCode(roomCode);
  if (!room) return;

  const sentence = room.sentences.find((s) => s.id === sentenceId);
  if (!sentence) return;

  if (!Array.isArray(sentence.votes)) {
    sentence.votes = [];
  }

  sentence.votes.push(emoji);
}

module.exports = {
  rooms,
  getRoomByCode,
  addPlayer,
  submitSentence,
  voteForSentence,
};
