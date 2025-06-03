import { useEffect, useState } from 'react';

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

  useEffect(() => {
    const random = sentenceStarters[Math.floor(Math.random() * sentenceStarters.length)];
    setStarter(random);
  }, []);

  return (
    <div className="form-container">
      <h2>Hi {nickname}, your sentence is:</h2>
      
      <p style={{ 
        fontSize: "1.3rem", 
        fontWeight: "bold", 
        marginTop: "1rem", 
        backgroundColor: "rgba(255, 255, 255, 0.1)", 
        padding: "10px", 
        borderRadius: "8px" 
      }}>
        {starter}
      </p>

      <h4 style={{ marginTop: '1.5rem', fontStyle: 'italic', color: '#ccc' }}>
        Room: {roomCode}
      </h4>
    </div>
  );
}
