import { useState } from "react";
import JoinForm from "./JoinForm";
import WaitingRoom from "./WaitingRoom";
import GameScreen from "./GameScreen";
import "./App.css";

function App() {
  const [nickname, setNickname] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [joined, setJoined] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  const handleJoin = (name: string, room: string) => {
    setNickname(name);
    setRoomCode(room);
    setJoined(true);
  };

  return (
    <div className="main-container">
      {!joined ? (
        <JoinForm onJoin={handleJoin} />
      ) : !gameStarted ? (
        <WaitingRoom
          nickname={nickname}
          roomCode={roomCode}
          onGameStart={() => setGameStarted(true)}
        />
      ) : (
        <GameScreen nickname={nickname} roomCode={roomCode} />
      )}
    </div>
  );
}

export default App;
