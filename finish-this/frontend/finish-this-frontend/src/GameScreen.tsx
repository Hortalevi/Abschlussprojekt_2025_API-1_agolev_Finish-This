import { useEffect, useState, useCallback } from 'react';
import './GameScreen.css';
import {
  submitSentence,
  vote,
  getSentences,
  isRoomReady,
  getStarter,
  getRoomStatus,
  hasEveryoneVoted,
  getRound,
  advanceRound
} from './api';
import CountdownBar from './components/CountdownBar';

const emojis = ["😍", "😂", "🤔", "💩"];

interface Props {
  readonly nickname: string;
  readonly roomCode: string;
}

type SentenceEntry = {
  id: string;
  text: string;
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function GameScreen({ nickname, roomCode }: Props) {
  const [starter, setStarter] = useState('');
  const [sentence, setSentence] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [showAllSentences, setShowAllSentences] = useState(false);
  const [userVotes, setUserVotes] = useState<{ [key: string]: string }>({});
  const [shuffledSentences, setShuffledSentences] = useState<SentenceEntry[]>([]);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [allVoted, setAllVoted] = useState(false);
  const [round, setRound] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [pollInterval, setPollInterval] = useState<number | null>(null);  

  const handleNewRound = useCallback(async () => {
    setSentence('');
    setSubmitted(false);
    setShowAllSentences(false);
    setShuffledSentences([]);
    setUserVotes({});
    setAllVoted(false);

    try {
      const res = await getStarter(roomCode);
      setStarter(res.starter);
    } catch (error) {
      console.error("Starter fetch error on new round", error);
    }
  }, [roomCode]);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const status = await getRoomStatus(roomCode);
        setSecondsLeft(status.secondsLeft);
        setGameStarted(status.started);

        const currentRound = await getRound(roomCode);
        if (currentRound !== round) {
          setRound(currentRound);
          await handleNewRound(); 
        }

        if (status.started && !starter) {
          const res = await getStarter(roomCode);
          setStarter(res.starter);
        }

        if (showAllSentences && !allVoted) {
          const res = await hasEveryoneVoted(roomCode);
          if (res.allVoted) setAllVoted(true);
        }
      } catch (error) {
        console.error("Failed to fetch status or round", error);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [roomCode, starter, showAllSentences, allVoted, round, handleNewRound]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (sentence.trim() === '') {
      alert("Please write a sentence ending.");
      return;
    }
    
    if (sentence.length > 200) {
      alert("Max 200 characters.");
      return;
    }

    setIsLoading(true);
    
    try {
      await submitSentence(roomCode, nickname, sentence);
      setSubmitted(true);
      pollUntilAllSubmitted();
    } catch (error) {
      console.error("Error submitting sentence.", error);
      alert("Error submitting sentence.");
    } finally {
      setIsLoading(false);
    }
  };

  const pollUntilAllSubmitted = useCallback(async () => {
    if (pollInterval) {
      clearInterval(pollInterval);
    }

    const interval = setInterval(async () => {
      try {
        const { ready } = await isRoomReady(roomCode);
        if (ready) {
          clearInterval(interval);
          setPollInterval(null);
          const serverSentences: SentenceEntry[] = await getSentences(roomCode);
          setShuffledSentences(serverSentences);
          setShowAllSentences(true);
        }
      } catch (error) {
        console.error("Polling error:", error);
      }
    }, 1000);

    setPollInterval(interval);
  }, [roomCode, pollInterval]);

  useEffect(() => {
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [pollInterval]);

  const handleVote = async (sentenceId: string, emoji: string) => {
    setUserVotes(prev => {
      if (prev[sentenceId] === emoji) {
        const updated = { ...prev };
        delete updated[sentenceId];
        return updated;
      }
      return { ...prev, [sentenceId]: emoji };
    });

    try {
      await vote(roomCode, sentenceId, nickname, emoji);
    } catch (error) {
      console.error("Voting error:", error);
      alert("Error while voting.");
      
      setUserVotes(prev => {
        const updated = { ...prev };
        delete updated[sentenceId];
        return updated;
      });
    }
  };

  const triggerNextRound = async () => {
    setIsLoading(true);
    
    try {
      await advanceRound(roomCode);
    } catch (error) {
      console.error("Could not start next round:", error);
      alert("Could not start next round.");
    } finally {
      setIsLoading(false);
    }
  };

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
            disabled={isLoading}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
            <span style={{ fontSize: '0.9rem', color: '#ccc' }}>
              {sentence.length}/200 characters
            </span>
          </div>
          <button 
            type="submit" 
            className="button-join"
            disabled={isLoading || sentence.trim() === ''}
          >
            {isLoading ? 'Submitting...' : 'Submit'}
          </button>
        </form>
      );
    }

    if (!showAllSentences) {
      return (
        <div style={{ marginTop: '1rem' }}>
          <p style={{ fontStyle: 'italic' }}>Your sentence was submitted!</p>
          <p className="waiting-message">
            Waiting for other players<span className="dots"></span>
          </p>
        </div>
      );
    }

    return (
      <div className="result-section">
        <p className="waiting-message">All players submitted! Here are the sentence endings:</p>

        <ul className="sentence-list">
          {shuffledSentences.map((entry) => {
            const key = entry.id;
            const isOwnSentence = entry.text === sentence;

            return (
              <li key={key}>
                <strong>Someone:</strong> {entry.text}
                {isOwnSentence ? (
                  <div style={{ marginTop: 5, fontStyle: 'italic', color: '#aaa' }}>
                    (You can't vote on your own sentence)
                  </div>
                ) : (
                  <div className="emoji-buttons">
                    {emojis.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => handleVote(key, emoji)}
                        className={`emoji-button ${userVotes[key] === emoji ? 'selected' : ''}`}
                        disabled={isLoading}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
                {!isOwnSentence && userVotes[key] && (
                  <div className="emoji-display">You voted: <span>{userVotes[key]}</span></div>
                )}
              </li>
            );
          })}
        </ul>

        {allVoted ? (
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <button 
              onClick={triggerNextRound} 
              className="button-join"
              disabled={isLoading}
            >
              {isLoading ? 'Starting...' : '🔁 Start New Round'}
            </button>
          </div>
        ) : (
          <div style={{ marginTop: "1rem", textAlign: "center", fontStyle: "italic", color: "#ccc" }}>
            Waiting for everyone to vote...
          </div>
        )}
      </div>
    );
  }

  if (!gameStarted) {
    return (
      <div className="form-container-GameScreen">
        <h2>Waiting for other players...</h2>
        <p>Game will start in <strong>{secondsLeft !== null ? formatTime(secondsLeft) : '...'}</strong></p>
        {secondsLeft !== null && <CountdownBar secondsLeft={secondsLeft} totalSeconds={90} />}
        <p style={{ marginTop: "2rem", fontStyle: "italic", color: "#ccc" }}>
          Room: {roomCode}
        </p>
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
        Room: {roomCode} | Round: {round}
      </h4>
    </div>
  );
}