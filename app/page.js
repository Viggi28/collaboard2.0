import React, { useState } from 'react';
import Link from 'next/link';

const Index = () => {
  const [username, setUsername] = useState('');
  const [roomId, setRoomId] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username && roomId) {
      // Redirect to the drawing board page with roomId
      window.location.href = `/drawing-board?roomId=${roomId}&username=${username}`;
    }
  };

  return (
    <div className="container">
      <h1>Join a Drawing Room</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Username:</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Room ID:</label>
          <input
            type="text"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            required
          />
        </div>
        <button type="submit">Join Room</button>
      </form>
    </div>
  );
};

export default Index;
