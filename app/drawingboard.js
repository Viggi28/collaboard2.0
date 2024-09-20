import React, { useRef, useState, useEffect } from 'react';
import io from 'socket.io-client';
import styles from '../styles'

const DrawingBoard = () => {
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [userColor, setUserColor] = useState('#000000');
  const [penSize, setPenSize] = useState(5);
  const [username, setUsername] = useState('');
  const [users, setUsers] = useState([]);
  const [roomId, setRoomId] = useState('');
  const [prevPosition, setPrevPosition] = useState(null);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const room = query.get('roomId');
    const user = query.get('username');
    setRoomId(room);
    setUsername(user);

    const socket = io();

    socket.emit('setUsername', { username: user, roomId: room });

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!canvas || !ctx) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    resizeCanvas();

    socket.on('updateUsers', (users) => {
      setUsers(users);
    });

    socket.on('draw', (data) => {
      const { prevX, prevY, x, y, color, size } = data;
      ctx.strokeStyle = color;
      ctx.lineWidth = size;
      ctx.beginPath();
      ctx.moveTo(prevX, prevY);
      ctx.lineTo(x, y);
      ctx.stroke();
    });

    socket.on('clearCanvas', () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    socket.on('init', (data) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      data.forEach(({ prevX, prevY, x, y, color, size }) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = size;
        ctx.beginPath();
        ctx.moveTo(prevX, prevY);
        ctx.lineTo(x, y);
        ctx.stroke();
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const getMousePos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleMouseDown = (e) => {
    setDrawing(true);
    const { x, y } = getMousePos(e);
    setPrevPosition({ x, y });
  };

  const handleMouseMove = (e) => {
    if (drawing) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const { x, y } = getMousePos(e);
      const { x: prevX, y: prevY } = prevPosition;

      ctx.lineTo(x, y);
      ctx.strokeStyle = userColor;
      ctx.lineWidth = penSize;
      ctx.stroke();

      const socket = io();
      socket.emit('draw', { prevX, prevY, x, y, color: userColor, size: penSize, roomId });

      setPrevPosition({ x, y });
    }
  };

  const handleMouseUp = () => {
    setDrawing(false);
  };

  const handleColorChange = (color) => {
    setUserColor(color);
    const socket = io();
    socket.emit('updatePen', { color, size: penSize, roomId });
  };

  const handleSizeChange = (size) => {
    setPenSize(size);
    const socket = io();
    socket.emit('updatePen', { color: userColor, size, roomId });
  };

  const handleClearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const socket = io();
    socket.emit('clearCanvas', roomId);
  };

  const handleEraser = () => {
    setUserColor('#FFFFFF');
    const socket = io();
    socket.emit('updatePen', { color: '#FFFFFF', size: penSize, roomId });
  };

  return (
    <div className={styles.container}>
      <div className={styles.sidebar}>
        <button
          className={styles.hideButton}
          onClick={() => document.querySelector(`.${styles.sidebar}`).classList.toggle(styles.hidden)}
        >
          &lt;
        </button>
        <h3>Drawing Board</h3>
        <h4>Users</h4>
        <ul>
          {users.map((user, index) => (
            <li key={index}>
              {user.username} - Pen Size: {user.size}
            </li>
          ))}
        </ul>
        <div className={styles.tools}>
          <h4>Tools</h4>
          <div>
            <label>Color: </label>
            <input
              type="color"
              value={userColor}
              onChange={(e) => handleColorChange(e.target.value)}
              className={styles.inputColor}
            />
          </div>
          <div>
            <label>Pen Size: </label>
            <input
              type="range"
              min="1"
              max="20"
              value={penSize}
              onChange={(e) => handleSizeChange(e.target.value)}
              className={styles.inputRange}
            />
          </div>
          <button onClick={handleEraser} className={styles.button}>Eraser</button>
          <button onClick={handleClearCanvas} className={styles.button}>Clear Canvas</button>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className={styles.canvas}
      />
    </div>
  );
};

export default DrawingBoard;
