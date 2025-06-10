import { useEffect, useState } from 'react';
import './GameScreen.css';

const sentenceStarters = [
  "It all started when...",
  "The last thing I expected was...",
  "Before I knew it, the dog had...",
  "At midnight, something strange happened:",
  "If I could go back in time, I would..."
];

const emojis = ["😍", "😂", "🤔", "💩"];

interface Props {
  readonly nickname: string;
  readonly roomCode: string;
}

type SentenceEntry = {
  id: string;
  nickname: string;
  text: string;
  votes?: { [emoji: string]: number };
};

export default function GameScreen({ nickname, roomCode }: Props) {
  const [starter, setStarter] = useState('');
  const [sentence, setSentence] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [showAllSentences, setShowAllSentences] = useState(false);
  const [userVotes, setUserVotes] = useState<{ [key: string]: string }>({});
  const [shuffledSentences, setShuffledSentences] = useState<SentenceEntry[]>([]);

  useEffect(() => {
    const random = sentenceStarters[Math.floor(Math.random() * sentenceStarters.length)];
    setStarter(random);
  }, []);

  // Shuffle sentences only once when they should be displayed
  useEffect(() => {
    if (submitted && showAllSentences) {
      const mockSentences: SentenceEntry[] = [
        { id: '1', nickname: 'Alice', text: '…the cat stole my pizza!' },
        { id: '2', nickname: 'Bob', text: '…I woke up on Mars.' },
        { id: '3', nickname: 'Charlie', text: '…everything turned into cheese.' },
        { id: '4', nickname, text: sentence },
      ];
      setShuffledSentences(shuffleArray(mockSentences));
    }
  }, [submitted, showAllSentences, nickname, sentence]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (sentence.trim() === '') {
      alert("Please write a sentence ending.");
      return;
    }
    if (sentence.length > 200) {
      alert("Max 200 characters.");
      return;
    }

    setSubmitted(true);
    console.log(`User "${nickname}" in room "${roomCode}" submitted: ${sentence}`);

    setTimeout(() => {
      setShowAllSentences(true);
    }, 3000);
  };

  const handleNewRound = () => {
    setSentence('');
    setSubmitted(false);
    setShowAllSentences(false);
    setShuffledSentences([]);
    const newStarter = sentenceStarters[Math.floor(Math.random() * sentenceStarters.length)];
    setStarter(newStarter);
    setUserVotes({});
  };

  const handleVote = (key: string, emoji: string) => {
    setUserVotes(prev => ({ ...prev, [key]: emoji }));
  };

  function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  function renderContent() {
    if (!submitted) {
      return (
        <form onSubmit={handleSubmit}>
          <textarea
            value={sentence}
            onChange={(e) => setSentence(e.target.value)}
            maxLength={200}
            rows={4}
            placeholder="Finish the sentence..."
            className="input-field"
          />
          <button type="submit" className="button-join">Submit</button>
        </form>
      );
    }

    if (!showAllSentences) {
      return (
        <div style={{ marginTop: '1rem' }}>
          <p style={{ fontStyle: 'italic' }}>
            Your sentence was submitted!
          </p>
          <p className="waiting-message">
            Waiting for other players<span className="dots"></span>
          </p>
        </div>
      );
    }

    return (
      <div className="result-section">
        <p className="waiting-message">
          All players submitted! Here are the sentence endings:
        </p>
        <ul className="sentence-list">
          {shuffledSentences.map((entry) => {
            const key = entry.id;
            return (
              <li key={key}>
                <strong>{entry.nickname}:</strong> {entry.text}
                <div className="emoji-buttons">
                  {emojis.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleVote(key, emoji)}
                      className={`emoji-button ${userVotes[key] === emoji ? 'selected' : ''}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                {userVotes[key] && (
                  <div className="emoji-display">
                    You voted: <span>{userVotes[key]}</span>
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <button
            onClick={handleNewRound}
            className="button-join"
          >
            🔁 Start New Round
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="form-container-GameScreen">
      <h2>Hi {nickname}, your sentence is:</h2>
      <p style={{
        fontSize: "1.3rem",
        fontWeight: "bold",
        marginTop: "1rem",
        backgroundColor: "rgba(255,255,255,0.1)",
        padding: "10px",
        borderRadius: "8px",
      }}>
        {starter}
      </p>

      {renderContent()}

      <h4 style={{ marginTop: '1.5rem', fontStyle: 'italic', color: '#ccc' }}>
        Room: {roomCode}
      </h4>
    </div>
  );
}