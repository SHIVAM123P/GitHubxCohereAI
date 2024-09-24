import React, { useState, useEffect } from 'react';
import './OpenSourceProjects.css';

function OpenSourceProjects({ language, userSkills }) {
  const [repos, setRepos] = useState([]);
  const [filteredRepos, setFilteredRepos] = useState([]);
  const [issues, setIssues] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [recommendedIssues, setRecommendedIssues] = useState([]);
  const GITHUB_TOKEN = process.env.REACT_APP_GITHUB_TOKEN; // Replace with your actual token
  console.log("hello",process.env.REACT_APP_GITHUB_TOKEN);

  const fetchTrendingRepos = async (language) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        `https://api.github.com/search/repositories?q=language:${language}&sort=stars&order=desc?per_page=1`,
        {
          headers: {
            Authorization: `token ${GITHUB_TOKEN}`
          }
        });
      if (!response.ok) {
        throw new Error('Failed to fetch repositories');
      }
      const data = await response.json();
      setRepos(data.items);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchIssuesForRepo = async (repoFullName) => {
    try {
      const response = await fetch(`https://api.github.com/repos/${repoFullName}/issues?per_page=5`, {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch issues');
      }
      const data = await response.json();
      setIssues((prevIssues) => ({ ...prevIssues, [repoFullName]: data }));
      return data; // Return fetched issues
    } catch (err) {
      setError(err.message);
      return []; // Return an empty array in case of an error
    }
  };
  

  const toggleIssues = (repoFullName) => {
    if (issues[repoFullName]) {
      setIssues((prevIssues) => {
        const newIssues = { ...prevIssues };
        delete newIssues[repoFullName];
        return newIssues;
      });
    } else {
      fetchIssuesForRepo(repoFullName);
    }
  };

  const fetchRecommendedIssues = async (repoFullName, userSkills, issues) => {
    try {
      const response = await fetch('http://localhost:5000/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          skills: userSkills,
          repoFullName: repoFullName,
          issues: issues, // Ensure this contains the correct issue data
        }),
      });
  
      if (!response.ok) {
        throw new Error('Failed to get AI recommendations');
      }
  
      const data = await response.json();
      return data.classifiedIssues; // Assuming classifiedIssues is returned correctly
    } catch (err) {
      setError(err.message);
      return [];
    }
  };
  

  const filterReposBySkills = (repos, skills) => {
    return repos.filter(repo => {
      const repoTopics = repo.topics || [];
      const repoDescription = repo.description || '';
      return skills.some(skill =>
        repoTopics.includes(skill.toLowerCase()) || repoDescription.toLowerCase().includes(skill.toLowerCase())
      );
    });
  };

  useEffect(() => {
    if (language) {
      fetchTrendingRepos(language);
    }
  }, [language]);

  useEffect(() => {
    const fetchAllIssues = async () => {
      const newIssues = {};
      for (const repo of filteredRepos) {
        if (!issues[repo.full_name]) {
          const repoIssues = await fetchIssuesForRepo(repo.full_name);
          if (repoIssues.length > 0) {
            const classifiedIssues = await fetchRecommendedIssues(repo.full_name, userSkills, repoIssues);
            newIssues[repo.full_name] = classifiedIssues;
          }
        }
      }
      setIssues((prev) => ({ ...prev, ...newIssues })); // Update the state once after fetching all issues
    };
  
    if (filteredRepos.length > 0 && userSkills) {
      fetchAllIssues();
    }
  }, [filteredRepos, userSkills]); // Ensure these dependencies don't cause an infinite loop
  
  
  
  

  return (
    <div className="open-source-projects">
      <h4>Trending Open Source Projects matched to your skills</h4>

      {loading && <p>Loading...</p>}
      {error && <p className="error">{error}</p>}

      <ul className="repo-list">
        {filteredRepos.length > 0 ? (
          filteredRepos.map((repo) => (
            <li key={repo.id} className="repo-item">
              <div className="repo-header">
                <a href={repo.html_url} target="_blank" rel="noopener noreferrer" className="repo-name">
                  {repo.name}
                </a>
                <span className="repo-stars">{repo.stargazers_count} ⭐</span>
              </div>
              <p className="repo-description">{repo.description}</p>
              <button onClick={() => toggleIssues(repo.full_name)} className="toggle-issues-btn">
                {issues[repo.full_name] ? 'Hide Issues' : 'Show Issues'}
              </button>

              {issues[repo.full_name] && (
                <ul className="issues-list">
                  {issues[repo.full_name].length > 0 ? (
                    issues[repo.full_name].map((issue) => (
                      <li key={issue.id} className="issue-item">
                        <a href={issue.html_url} target="_blank" rel="noopener noreferrer" className="issue-title">
                          {issue.title}
                        </a>
                        <span className={`difficulty ${issue.difficulty}`}>{issue.difficulty}</span>
                      </li>
                    ))
                  ) : (
                    <li>No open issues found.</li>
                  )}
                </ul>
              )}

              {/* Display recommended issues for this repository */}
              {recommendedIssues
                .filter(rec => rec.repoFullName === repo.full_name)
                .map(rec => (
                  <div key={repo.id} className="recommended-issues">
                    <h5>Recommended Issues:</h5>
                    <ul>
                      {rec.recommendations.map((recIssue, index) => (
                        <li key={index}>{recIssue}</li>
                      ))}
                    </ul>
                  </div>
                ))}
            </li>
          ))
        ) : (
          <p>No matching repositories found for your skills.</p>
        )}
      </ul>
    </div>
  );
}

export default OpenSourceProjects;
