/**
 * @ Author: Levi Agostinho Horta
 * @ Create Time: 2025-06-20 08:59:56
 * @ Modified by: Your name
 * @ Modified time: 2025-06-25 15:19:57
 * @ Description: Waiting-Room for Players to join
 * @ Sources: Chatgpt and Claude AI, for Problems and Questions.
 */

import { useEffect, useState } from "react";
import { getRoomStatus, startGameCountdown, isHost, forceStartGame, getPlayers } from "../../api/api";
import CountdownBar from "../../components/CountdownBar/CountdownBar";
import "./WaitingRoom.css"

// Props for WaitingRoom: player nickname, room code, and callback for game start
type WaitingRoomProps = {
  nickname: string;
  roomCode: string;
  onGameStart: () => void;
};

const WaitingRoom: React.FC<WaitingRoomProps> = ({ nickname, roomCode, onGameStart }) => {
  const [playerCount, setPlayerCount] = useState(1);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [host, setHost] = useState(false);
  const [players, setPlayers] = useState<string[]>([]);

  // Check if user is host on mount or when nickname/room changes
  useEffect(() => {
    isHost(roomCode, nickname).then(setHost);
  }, [roomCode, nickname]);

  // Poll room status and player list every second
  useEffect(() => {
    const interval = setInterval(async () => {
      const status = await getRoomStatus(roomCode);
      setPlayerCount(status.playerCount);
      setCountdown(status.hasTimer ? status.secondsLeft : null);


      try {
        const playerList = await getPlayers(roomCode);
        setPlayers(playerList);
      } catch { /* empty */ }

      // Host auto-starts countdown if enough players
      if (host && status.playerCount >= 2 && !status.hasTimer) {
        await startGameCountdown(roomCode);
      }

      // Move to game screen if started
      if (status.started && status.hasTimer) {
        onGameStart();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [roomCode, onGameStart, host]);

  // Host can force start the game
  const handleForceStart = async () => {
    await forceStartGame(roomCode, nickname);
  };

  return (
    <div className="form-container-GameScreen waiting-room-bg">
      <h2 className="waiting-room-title">Waiting Room: {roomCode}</h2>
      <div className="waiting-room-info">
        Players: <span className="waiting-room-players">{playerCount}</span> (2+ required)
      </div>
      {/* Show message if not enough players */}
      {playerCount < 2 && (
        <div className="waiting-room-info">Waiting for more players to join...</div>
      )}
      {/* Show countdown and progress bar if timer is running */}
      {countdown !== null && (
        <>
          <div className="waiting-room-countdown">
            Game starts in <strong>{countdown}s</strong>
          </div>
          <div className="waiting-room-bar">
            <CountdownBar secondsLeft={countdown} totalSeconds={60} />
          </div>
        </>
      )}
      {/* List of player names */}
      <ul className="waiting-room-player-list">
        {players.map(name => (
          <li key={name}>{name}</li>
        ))}
      </ul>
      {/* Host-only force start button */}
      {host && playerCount >= 2 && (
        <button className="waiting-room-force-btn" onClick={handleForceStart}>
          Start Game Now (Host)
        </button>
      )}
      <div className="waiting-room-invite">
        Share this code to invite friends!
      </div>
    </div>
  );
};

export default WaitingRoom;