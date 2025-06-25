/**
 * @ Author: Levi Agostinho Horta
 * @ Create Time: 2025-06-02 13:23:59
 * @ Modified by: Your name
 * @ Modified time: 2025-06-25 14:39:52
 * @ Description: Displays all of the Components for the App
 * @ Sources: Chatgpt and Claude AI, for Problems and Questions.
 */

import { useState } from "react";
import JoinForm from "./pages/JoinForm/JoinForm";
import WaitingRoom from "./pages/WaitingRoom/WaitingRoom";
import GameScreen from "./pages/GameScreen/GameScreen";
import "./App.css";

function App() {
  // State for the user's nickname
  const [nickname, setNickname] = useState("");
  // State for the current room code
  const [roomCode, setRoomCode] = useState("");
  // Tracks if the user has joined a room
  const [joined, setJoined] = useState(false);
  // Tracks if the game has started
  const [gameStarted, setGameStarted] = useState(false);

  // Handles the join event from JoinForm
  const handleJoin = (name: string, room: string) => {
    setNickname(name);
    setRoomCode(room);
    setJoined(true);
  };

  return (
    <div className="main-container">
      {/* Show JoinForm until user joins a room */}
      {!joined ? (
        <JoinForm onJoin={handleJoin} />
      ) : !gameStarted ? (
        // Show WaitingRoom until the game starts
        <WaitingRoom
          nickname={nickname}
          roomCode={roomCode}
          onGameStart={() => setGameStarted(true)}
        />
      ) : (
        // Show GameScreen when the game has started
        <GameScreen nickname={nickname} roomCode={roomCode} />
      )}
    </div>
  );
}

export default App;
