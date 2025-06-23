DROP TABLE IF EXISTS votes;
DROP TABLE IF EXISTS sentences;
DROP TABLE IF EXISTS players;
DROP TABLE IF EXISTS rooms;

CREATE TABLE rooms (
  id SERIAL PRIMARY KEY,
  code VARCHAR(4) UNIQUE NOT NULL,
  round INT DEFAULT 1,
  starter TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  round_started_at TIMESTAMP,
  host_nickname VARCHAR(50),
  countdown_started_at TIMESTAMP
);

CREATE TABLE players (
  id SERIAL PRIMARY KEY,
  nickname VARCHAR(50) NOT NULL,
  room_code VARCHAR(4) REFERENCES rooms(code) ON DELETE CASCADE,
  total_points INT DEFAULT 0
);

CREATE TABLE sentences (
  id SERIAL PRIMARY KEY,
  text TEXT NOT NULL,
  author_id INT REFERENCES players(id) ON DELETE CASCADE,
  room_code VARCHAR(4) REFERENCES rooms(code) ON DELETE CASCADE,
  round INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE votes (
  id SERIAL PRIMARY KEY,
  sentence_id INT REFERENCES sentences(id) ON DELETE CASCADE,
  voter_id INT REFERENCES players(id) ON DELETE CASCADE,
  emoji VARCHAR(4),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_vote_per_sentence_per_voter UNIQUE (sentence_id, voter_id)
);

CREATE INDEX idx_players_room_code ON players(room_code);
CREATE INDEX idx_sentences_room_round ON sentences(room_code, round);
CREATE INDEX idx_votes_sentence_id ON votes(sentence_id);