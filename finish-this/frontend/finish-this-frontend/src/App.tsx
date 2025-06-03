import { useState } from 'react';
import JoinForm from './JoinForm';
import GameScreen from './GameScreen';
import './App.css';

function App() {
  const [nickname, setNickname] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [joined, setJoined] = useState(false);

  const handleJoin = (name: string, room: string) => {
    setNickname(name);
    setRoomCode(room);
    setJoined(true);
  };

  return (
    <div className={joined ? 'joined-screen' : 'landing-screen'}>
      <h1>Finish This!</h1>
      {!joined ? (
        <JoinForm onJoin={handleJoin} />
      ) : (
        <GameScreen nickname={nickname} roomCode={roomCode} />
      )}
    </div>
  );
}

export default App;
