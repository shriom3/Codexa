import React, { useState } from 'react';
import { v4 as uuidV4 } from 'uuid';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  const [roomId, setRoomId] = useState('');
  const [username, setUsername] = useState('');
  const createNewRoom = (e) => {
    e.preventDefault();
    const id = uuidV4();
    setRoomId(id);
    toast.success('Created a new room');
  };

  const joinRoom = () => {
    if (!roomId || !username) {
      toast.error('ROOM ID & username is required');
      return;
    }

    // Redirect
    navigate(`/editor/${roomId}`, {
      state: {
        username,
      },
    });
  };

  const handleInputEnter = (e) => {
    if (e.code === 'Enter') {
      joinRoom();
    }
  };
  return (
    <div className="homePageWrapper">
      <main className="homePageContent">
        <section className="homePageIntro">
          <span className="homePageEyebrow">
            <span className="statusDot" />
            REAL-TIME COLLABORATION
          </span>
          <h1>
            Build together.
            <br />
            <span>In real time.</span>
          </h1>
          <p>One shared space for ideas, code, and better teamwork.</p>
        </section>
        <div className="formWrapper">
          <img
            className="homePageLogo"
            src="/codexa.svg"
            alt="Codexa"
          />
          <h2 className="mainLabel">Join your team</h2>
          <p className="formDescription">Enter a room ID to start collaborating.</p>
          <div className="inputGroup">
            <input
              type="text"
              className="inputBox"
              placeholder="ROOM ID"
              aria-label="Room ID"
              onChange={(e) => setRoomId(e.target.value)}
              value={roomId}
              onKeyUp={handleInputEnter}
            />
            <input
              type="text"
              className="inputBox"
              placeholder="USERNAME"
              aria-label="Username"
              onChange={(e) => setUsername(e.target.value)}
              value={username}
              onKeyUp={handleInputEnter}
            />
            <button className="btn joinBtn" onClick={joinRoom}>
              Join room
            </button>
            <span className="createInfo">
              New to Codexa?{' '}
              <a
                onClick={createNewRoom}
                href=""
                className="createNewBtn"
              >
                Create a room
              </a>
            </span>
          </div>
        </div>
      </main>
      <footer>
        <h4>
          Built and developed by Shriom &nbsp;
          <a href="https://github.com/shriom3" target="_blank" rel="noopener noreferrer">
            Codexa
          </a>
        </h4>
      </footer>
    </div>
  );
};

export default Home;
