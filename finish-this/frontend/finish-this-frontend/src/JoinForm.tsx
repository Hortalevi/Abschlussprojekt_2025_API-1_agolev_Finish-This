import { useState } from 'react';

interface Props {
  onJoin: (nickname: string, roomCode: string) => void;
}

export default function JoinForm({ onJoin }: Props) {
  const [nickname, setNickname] = useState('');
  const [roomCode, setRoomCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname || !roomCode) return alert("Please fill in both fields");
    onJoin(nickname.trim(), roomCode.trim());
  };

  return (
    <form className="form-container" onSubmit={handleSubmit}>
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
        placeholder="Room Code"
        value={roomCode}
        onChange={(e) => setRoomCode(e.target.value)}
      />
      <br />

      <button className="button-join" type="submit">
        Join
      </button>
    </form>
  );
}
