import { useEffect, useState } from 'react';
import './GameScreen.css';

const sentenceStarters = [
  "It all started when...",
  "The last thing I expected was...",
  "Before I knew it, the dog had...",
  "At midnight, something strange happened:",
  "If I could go back in time, I would..."
];

interface Props {
  readonly nickname: string;
  readonly roomCode: string;
}

export default function GameScreen({ nickname, roomCode }: Props) {
  const [starter, setStarter] = useState('');
  const [sentence, setSentence] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [showAllSentences, setShowAllSentences] = useState(false);

  useEffect(() => {
    const random = sentenceStarters[Math.floor(Math.random() * sentenceStarters.length)];
    setStarter(random);
  }, []);

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
    const newStarter = sentenceStarters[Math.floor(Math.random() * sentenceStarters.length)];
    setStarter(newStarter);
  };

  const mockSentences = [
    { nickname: 'Alice', text: '…the cat stole my pizza!' },
    { nickname: 'Bob', text: '…I woke up on Mars.' },
    { nickname: 'Charlie', text: '…everything turned into cheese.' },
    { nickname: nickname, text: sentence },
  ];

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
        {shuffleArray(mockSentences).map((entry) => (
          <li key={`${entry.nickname}-${entry.text}`}>
            <strong>{entry.nickname}:</strong> {entry.text}
          </li>
        ))}
      </ul>

      {/* 👇 Button clearly visible under the list */}
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
