import React, { useState, useEffect } from 'react';
// import './CodeChallenge.css';

const CodeChallenge = () => {
  const [score, setScore] = useState(0);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    // Fetch questions or challenges from an API or predefined set
    fetchNextQuestion();
    loadLeaderboard();
  }, []);

  const fetchNextQuestion = () => {
    // Fetch a new challenge question
    setIsLoading(true);
    // Simulating fetch delay
    setTimeout(() => {
      setQuestion("What is the output of 2 + 2 in JavaScript?");
      setIsLoading(false);
    }, 1000);
  };

  const handleSubmitAnswer = () => {
    if (answer === '4') {
      setScore(score + 10); // Increment score
      updateLeaderboard();
    }
    fetchNextQuestion();
  };

  const updateLeaderboard = () => {
    const currentUser = { username: 'Player1', score: score + 10 };
    setLeaderboard([...leaderboard, currentUser]);
  };

  const loadLeaderboard = () => {
    // Fetch leaderboard from local storage or API
    const storedLeaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];
    setLeaderboard(storedLeaderboard);
  };

  return (
    <div className="code-challenge">
      <h2>Code Challenge</h2>
      {isLoading ? (
        <p>Loading next challenge...</p>
      ) : (
        <>
          <p>{question}</p>
          <input
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Your Answer"
          />
          <button onClick={handleSubmitAnswer}>Submit Answer</button>
        </>
      )}

      <div className="leaderboard">
        <h3>Leaderboard</h3>
        <ul>
          {leaderboard.map((player, index) => (
            <li key={index}>{player.username}: {player.score} points</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default CodeChallenge;
