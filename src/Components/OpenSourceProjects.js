import React, { useState, useEffect } from "react";
import "./OpenSourceProjects.css";

function OpenSourceProjects({ language, userSkills }) {
  const [repos, setRepos] = useState([]);
  const [filteredRepos, setFilteredRepos] = useState([]);
  const [issues, setIssues] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [issuesFetched, setIssuesFetched] = useState(false);
  const API_BASE_URL = 'https://gitstatsserver.onrender.com';
  const GITHUB_TOKEN = process.env.REACT_APP_GITHUB_TOKEN;

  const fetchTrendingRepos = async (language) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `https://api.github.com/search/repositories?q=language:${language}&sort=stars&order=desc&per_page=3`,
        {
          headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch repositories");
      }
      const data = await response.json();
      console.log("helloin fetch", GITHUB_TOKEN);

      setRepos(data.items);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchIssuesForRepo = async (repoFullName) => {
    try {
      const response = await fetch(
        `https://api.github.com/repos/${repoFullName}/issues?per_page=10`,
        {
          headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch issues");
      }

      const data = await response.json();

      // Set all fetched issues (no filtering)
      setIssues((prevIssues) => ({ ...prevIssues, [repoFullName]: data }));
      return data;
    } catch (err) {
      setError(err.message);
      return [];
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

  // const fetchRecommendedIssues = async (repoFullName, userSkills, issues) => {
  //   setAiLoading(true); // Start loading before making the request
  //   try {
  //     const response = await fetch(`${API_BASE_URL}/analyze`, {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({
  //         skills: userSkills,
  //         repoFullName: repoFullName,
  //         issues: issues,
  //       }),
  //     });
  //     setAiLoading(false);

  //     const data = await response.json();

  //     if (!response.ok) {
  //       setError(data.error || 'Failed to get AI recommendations');
  //     } else if (data.delayed) {
  //       // Handle delayed recommendations
  //       console.warn('AI recommendations may be delayed due to rate limiting. Please check back shortly.');
  //       // You can choose to display a message or handle this as needed
  //     }

  //     return data.classifiedIssues; // Assuming classifiedIssues is returned correctly
  //   } catch (err) {
  //     console.error('Error fetching AI recommendations:', err.message);
  //     setError(err.message);
  //     return [];
  //   }
  // };

  const filterReposBySkills = (repos, skills) => {
    console.log("User skills: ", userSkills);
    console.log(
      "Repository topics: ",
      repos.map((repo) => repo.topics)
    );

    return repos.filter((repo) => {
      const repoTopics = repo.topics || [];
      const repoDescription = repo.description || "";
      return skills.some(
        (skill) =>
          repoTopics.includes(skill.toLowerCase()) ||
          repoDescription.toLowerCase().includes(skill.toLowerCase())
      );
    });
  };
  const categorizeIssueDifficulty = (issue) => {
    const title = issue.title.toLowerCase();
    const body = issue.body ? issue.body.toLowerCase() : "";
    const labels = issue.labels.map(label => label.name.toLowerCase());

    // Keywords that might indicate difficulty
    const beginnerKeywords = ['easy', 'beginner', 'good first issue', 'documentation', 'typo', 'css', 'v5'];
    const intermediateKeywords = ['enhancement', 'feature request', 'improvement', 'needs-example', 'awaiting-reply'];
    const advancedKeywords = ['bug', 'security', 'performance', 'refactor', 'react core team', 'cla signed'];

    if (beginnerKeywords.some(keyword => title.includes(keyword) || body.includes(keyword) || labels.includes(keyword))) {
        return 'Beginner';
    } else if (intermediateKeywords.some(keyword => title.includes(keyword) || body.includes(keyword) || labels.includes(keyword))) {
        return 'Intermediate';
    } else if (advancedKeywords.some(keyword => title.includes(keyword) || body.includes(keyword) || labels.includes(keyword))) {
        return 'Advanced';
    } else {
        return 'Uncategorized';
    }
};


  const getLabelColor = (labelName) => {
    // Generate a consistent color based on the label name
    let hash = 0;
    for (let i = 0; i < labelName.length; i++) {
      hash = labelName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color = `hsl(${hash % 360}, 70%, 70%)`;
    return color;
  };

  useEffect(() => {
    if (language) {
      fetchTrendingRepos(language);
    }
  }, [language]);

  useEffect(() => {
    if (repos.length > 0 && userSkills) {
      const matchingRepos = filterReposBySkills(repos, userSkills);
      setFilteredRepos(matchingRepos);
    }
  }, [repos, userSkills]);

  useEffect(() => {
    const fetchAllIssues = async () => {
      const newIssues = {};
      for (const repo of filteredRepos) {
        if (!issues[repo.full_name]) {
          const repoIssues = await fetchIssuesForRepo(repo.full_name);
          if (repoIssues.length > 0) {
            newIssues[repo.full_name] = repoIssues;
          }
        }
      }
      setIssues((prev) => ({ ...prev, ...newIssues }));
    };

    if (filteredRepos.length > 0 && !issuesFetched) {
      fetchAllIssues();
      setIssuesFetched(true);
    }
  }, [filteredRepos, issuesFetched]);

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
                <a
                  href={repo.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="repo-name"
                >
                  {repo.name}
                </a>
                <span className="repo-stars">{repo.stargazers_count}</span>
              </div>
              <p className="repo-description">{repo.description}</p>
              <button
                onClick={() => toggleIssues(repo.full_name)}
                className="toggle-issues-btn"
              >
                {issues[repo.full_name] ? "Hide Issues" : "Show Issues"}
              </button>

              {issues[repo.full_name] && (
                <ul className="issues-list">
                  {issues[repo.full_name].map((issue) => (
                    <li key={issue.id} className="issue-item">
                      <a href={issue.html_url} target="_blank" rel="noopener noreferrer" className="issue-title">
                        {issue.title}
                      </a>
                      <div className="issue-details">
                        <div className="issue-labels">
                          {issue.labels.map((label) => (
                            <span 
                              key={label.id} 
                              className="label"
                              style={{ backgroundColor: getLabelColor(label.name) }}
                            >
                              {label.name}
                            </span>
                          ))}
                        </div>
                        <div className={`difficulty ${categorizeIssueDifficulty(issue).toLowerCase()}`}>
                          {categorizeIssueDifficulty(issue)}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
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