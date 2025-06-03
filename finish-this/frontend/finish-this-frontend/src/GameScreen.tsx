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
  nickname: string;
  roomCode: string;
}

export default function GameScreen({ nickname, roomCode }: Props) {
  const [starter, setStarter] = useState('');
  const [sentence, setSentence] = useState('');
  const [submitted, setSubmitted] = useState(false);

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
  };

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

      {!submitted ? (
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
      ) : (
        <p style={{ marginTop: '1rem', fontStyle: 'italic' }}>
              Your sentence was submitted!
        </p>
      )}

      <h4 style={{ marginTop: '1.5rem', fontStyle: 'italic', color: '#ccc' }}>
        Room: {roomCode}
      </h4>
    </div>
  );
}
