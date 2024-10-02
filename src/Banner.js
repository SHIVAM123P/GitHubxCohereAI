import React from 'react';
import GitHubCalendar from 'react-github-calendar';
import './Banner.css';

const Banner = ({ userData }) => {
  const { avatar_url, login, skills, languageUsage, contributions, repos, openSourceContributions, followers,following } = userData;
  console.log('userdata', userData);

  const topLanguages = Object.keys(languageUsage).slice(0, 3);

  return (
    <div className="banner">
      <div className="banner-content">
        <img src={avatar_url} alt="Profile" className="profile-pic" />
        <div className="info">
          <h2>{login}</h2>
          {/* Ensure repos and contributions are correctly shown */}
          <p className="repos-contributions">Repos: {repos} | Total Contributions: {contributions} | Open Source Contributions: {openSourceContributions}</p>
     
          <p>Top Languages: {languageUsage.slice(0,6).map(lang => lang[0]).join(', ')}</p>

          {/* <p>Skills: {skills.join(', ')}</p> */}
          <p>Followers: {followers} | Following:{following}</p>
        </div>
      </div>

      <div className="contribution-heatmap">
        <h3>Recent Contributions</h3>
        <GitHubCalendar username={login} />
      </div>

      <div className="social-links">
        <a href={`https://github.com/${login}`} target="_blank" rel="noopener noreferrer">GitHub</a>
        <a href={`https://www.linkedin.com/in/${login}`} target="_blank" rel="noopener noreferrer">LinkedIn</a>
      </div>
    </div>
  );
};


export default Banner;
