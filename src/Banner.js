import React from 'react';
import GitHubCalendar from 'react-github-calendar';
import './Banner.css';

const Banner = ({ userData }) => {
  const { 
    avatar_url, 
    login, 
    skills, 
    languageUsage, 
    contributions, 
    repos, 
    streak,
    openSourceContributions, 
    followers, 
    following,
    email,
    twitter,
    gitHub 
  } = userData;

  const topLanguages = languageUsage.slice(0, 3).map(lang => lang[0]); // Adjusted to get top languages

  return (
    <div className="banner">
      <div className="cyber-grid"></div>
      <div className="neon-glow"></div>
      <div className="banner-content">
        <div className="profile-pic-container">
          <img src={avatar_url} alt="Profile" className="profile-pic" />
          <div className="profile-pic-glow"></div>
        </div>
        <div className="info">
          <h2 className="cyber-glitch">{login}</h2>
          <p className="repos-contributions">
            <span className="cyber-neon">Repos: {repos}</span> | 
            <span className="cyber-neon">Lifetime Contributions: {contributions}</span> 
            
          </p>
          <p className="cyber-neon">Open Source Contributions: {openSourceContributions}</p>
          <p className="cyber-neon">Streak: {streak}</p>
          <p className="cyber-text">Top Languages: {topLanguages.join(', ')}</p>
          <p className="cyber-text">Followers: {followers} | Following: {following}</p>
        </div>
      </div>

      <div className="contribution-heatmap">
        <h3 className="cyber-glitch">Recent Contributions</h3>
        <GitHubCalendar username={login} theme={{
          background: 'transparent',
          text: '#00ff00',
          grade4: '#39d353',
          grade3: '#26a641',
          grade2: '#006d32',
          grade1: '#0e4429',
          grade0: '#161b22'
        }} />
      </div>

      <div className="social-links">
        {twitter && <a href={twitter} target="_blank" rel="noopener noreferrer" className="cyber-button">Twitter</a>}
        {gitHub && <a href={gitHub} target="_blank" rel="noopener noreferrer" className="cyber-button">GitHub</a>}
        {email && <a href={`mailto:${email}`} className="cyber-button">Email</a>}
        {/* <a href={`https://github.com/${login}`} target="_blank" rel="noopener noreferrer" className="cyber-button">GitHub</a> */}
      </div>
    </div>
  );
};

export default Banner;
