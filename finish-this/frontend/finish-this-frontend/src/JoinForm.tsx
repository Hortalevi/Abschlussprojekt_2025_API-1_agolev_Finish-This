import { useState } from 'react';
import { joinRoom, createRoom } from './api';

interface Props {
  readonly onJoin: (nickname: string, roomCode: string) => void;
}

export default function JoinForm({ onJoin }: Props) {
  const [nickname, setNickname] = useState('');
  const [roomCode, setRoomCode] = useState('');

  const handleSubmitJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const roomCodePattern = /^\d{4}$/;

    if (!nickname || !roomCode) {
      return alert("Please fill in both fields");
    }

    if (!roomCodePattern.test(roomCode)) {
      return alert("Room code must be exactly 4 digits");
    }

    try {
      await joinRoom(roomCode, nickname);
      onJoin(nickname, roomCode);
    } catch {
      alert("Failed to join room");
    }
  };

  const handleCreateRoom = async () => {
    if (!nickname) {
      return alert("Please enter a nickname first");
    }

    try {
      const generatedRoomCode = await createRoom(nickname);
      alert(`Room created! Code: ${generatedRoomCode}`);
      onJoin(nickname, generatedRoomCode);
    } catch {
      alert("Failed to create room");
    }
  };

  return (
    <form className="form-container" onSubmit={handleSubmitJoin}>
      <h2>Join a Game</h2>

      <input
        className="input-field"
        type="text"
        placeholder="Your Nickname"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
      />
      <br />

      <input
        className="input-field"
        type="text"
        placeholder="Room Code (4 digits)"
        value={roomCode}
        onChange={(e) => {
          const value = e.target.value;
          if (/^\d{0,4}$/.test(value)) {
            setRoomCode(value);
          }
        }}
        maxLength={4}
      />
      <br />

      <button className="button-join" type="submit">
        Join Room
      </button>

      <button
        className="button-join"
        type="button"
        onClick={handleCreateRoom}
        style={{ marginTop: "10px" }}
      >
        Create New Room
      </button>
    </form>
  );
}
