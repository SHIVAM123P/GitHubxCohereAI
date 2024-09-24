import React, { useState } from 'react';
import Banner from './Banner';
import OpenSourceProjects from './OpenSourceProjects';
import './App.css';
import './OpenSourceProjects.css'; // Add this line to import the new CSS file

function App() {
  const [gitHubURL, setGitHubURL] = useState('');
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState('');
  const [showOpenSourceProjects, setShowOpenSourceProjects] = useState(false);

  const handleInputChange = (e) => {
    setGitHubURL(e.target.value);
  };

  const extractUsername = (url) => {
    const match = url.match(/github\.com\/([^\/]+)/);
    console.log('Extracted Username:', match ? match[1] : 'No match');
    return match ? match[1] : null;
  };
  
  const GITHUB_TOKEN = process.env.REACT_APP_GITHUB_TOKEN; // Replace with your actual token
  console.log('gothubb token', GITHUB_TOKEN);
const handleFetchData = async () => {
  const username = extractUsername(gitHubURL.trim());
  if (!username) {
    setError('Invalid GitHub URL');
    return;
  }
  setError('');

  try {
    const userResponse = await fetch(`https://api.github.com/users/${username}`, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`
      }
    });

    if (!userResponse.ok) {
      throw new Error(userResponse.status === 403 ? 'GitHub rate limit exceeded. Please authenticate.' : 'User not found');
    }

    const userData = await userResponse.json();

    const reposResponse = await fetch(`https://api.github.com/users/${username}/repos`, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`
      }
    });

    if (!reposResponse.ok) {
      throw new Error('Failed to fetch repositories');
    }

    const reposData = await reposResponse.json();
    const { skills, languageUsage } = extractTechnologies(reposData);
    setUserData({ ...userData, skills, languageUsage });
  } catch (error) {
    setError(error.message);
  }
};

  

  const extractTechnologies = (repos) => {
    const techSet = new Set();
    const languageUsage = {};

    repos.forEach((repo) => {
      if (repo.language) {
        techSet.add(repo.language);
        languageUsage[repo.language] = (languageUsage[repo.language] || 0) + 1;
      }
    });

    return { skills: Array.from(techSet), languageUsage };
  };

  return (
    <div className="App">
      <h1>Social Media Banner Generator</h1>
      <div className="input-container">
        <label>GitHub Profile URL:</label>
        <input
          type="text"
          value={gitHubURL}
          onChange={handleInputChange}
          placeholder="Paste your GitHub profile URL here"
        />
        <button onClick={handleFetchData}>Fetch GitHub Data</button>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {userData && (
        <div className="banner-container">
          <Banner userData={userData} />

          <button onClick={() => setShowOpenSourceProjects(!showOpenSourceProjects)}>
            {showOpenSourceProjects ? 'Hide' : 'Show'} Open Source Projects
          </button>

          {showOpenSourceProjects && (
            <OpenSourceProjects language={Object.keys(userData.languageUsage)[0]} userSkills={userData.skills} />
          )}
        </div>
      )}
    </div>
  );
}

export default App;
