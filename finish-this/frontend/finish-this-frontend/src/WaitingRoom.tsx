import { useEffect, useState } from "react";
import { getRoomStatus, startGameCountdown, isHost, forceStartGame } from "./api";
import CountdownBar from "./components/CountdownBar";

type WaitingRoomProps = {
  nickname: string;
  roomCode: string;
  onGameStart: () => void;
};

const WaitingRoom: React.FC<WaitingRoomProps> = ({ nickname, roomCode, onGameStart }) => {
  const [playerCount, setPlayerCount] = useState(1);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [host, setHost] = useState(false);

  useEffect(() => {
    isHost(roomCode, nickname).then(setHost);
  }, [roomCode, nickname]);

  useEffect(() => {
    const interval = setInterval(async () => {
      const status = await getRoomStatus(roomCode);
      setPlayerCount(status.playerCount);
      setCountdown(status.hasTimer ? status.secondsLeft : null);

      // Host starts countdown if needed
      if (host && status.playerCount >= 2 && !status.hasTimer) {
        await startGameCountdown(roomCode);
      }

      // ALL players (including host) switch to GameScreen when started
      if (status.started && status.hasTimer) {
        onGameStart();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [roomCode, onGameStart, host]);

  const handleForceStart = async () => {
    await forceStartGame(roomCode, nickname);
  };

  return (
    <div className="form-container-GameScreen">
      <h2>Waiting Room: {roomCode}</h2>
      <p>
        Players: <strong>{playerCount}</strong> (2+ required)
      </p>
      {playerCount < 2 && <p>Waiting for more players to join...</p>}
      {countdown !== null && (
        <>
          <p>
            Game starts in <strong>{countdown}s</strong>
          </p>
          <CountdownBar secondsLeft={countdown} totalSeconds={60} />
        </>
      )}
      {host && playerCount >= 2 && (
        <button onClick={handleForceStart}>
          Start Game Now (Host)
        </button>
      )}
      <p className="game-info">Share this code to invite friends!</p>
    </div>
  );
};

export default WaitingRoom;