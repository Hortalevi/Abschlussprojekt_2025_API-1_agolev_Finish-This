import { useState } from 'react';

interface Props {
  readonly onJoin: (nickname: string, roomCode: string) => void;
}

export default function JoinForm({ onJoin }: Props) {
  const [nickname, setNickname] = useState('');
  const [roomCode, setRoomCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  const roomCodePattern = /^\d{4}$/;

  if (!nickname || !roomCode) {
    return alert("Please fill in both fields");
  }

  if (!roomCodePattern.test(roomCode)) {
    return alert("Room code must be exactly 4 digits");
  }

  onJoin(nickname, roomCode);
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
        Join
      </button>
    </form>
  );
}
