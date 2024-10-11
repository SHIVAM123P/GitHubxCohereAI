import React, { useState, useEffect } from "react";
import axios from "axios";
import { GraphQLClient, gql } from "graphql-request";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Banner from "./Banner";
import Share from "./Share";
import OpenSourceProjects from "./OpenSourceProjects";
import Spinner from "./Spinner";
import Leaderboard from "./Leaderboard";
import "./App.css";
import "./OpenSourceProjects.css";

const GITHUB_TOKEN = process.env.REACT_APP_GITHUB_TOKEN;
// const API_BASE_URL = 'https://gitstatsserver.onrender.com';
const API_BASE_URL = "http://localhost:5000";
const graphQLClient = new GraphQLClient("https://api.github.com/graphql", {
  headers: { authorization: `Bearer ${GITHUB_TOKEN}` },
});

function App() {
  const [gitHubURL, setGitHubURL] = useState("");
  const [userData, setUserData] = useState(null);
  const [totalUsers, setTotalUsers] = useState(0);
  const [leaderboard, setLeaderboard] = useState({
    topContributions: { username: "N/A", contributions: 0 },
    topFollowers: { username: "N/A", followers: 0 },
  });
  const [error, setError] = useState("");
  const [showOpenSourceProjects, setShowOpenSourceProjects] = useState(false);
  const [loading, setLoading] = useState(false);

  const cache = {};

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [userCountResponse, leaderboardResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/user-count`),
        // axios.get(`${API_BASE_URL}/leaderboard`)
      ]);
      setTotalUsers(userCountResponse.data.totalUsers);
      // setLeaderboard(leaderboardResponse.data);
    } catch (error) {
      console.error("Error fetching initial data:", error);
    }
  };

  const handleInputChange = (e) => setGitHubURL(e.target.value);

  const handleFetchData = async () => {
    const username = gitHubURL;
    if (!username) {
      setError("Invalid GitHub Username");
      return;
    }
    setLoading(true);
    setError("");
    setUserData(null);

    try {
      const userData = await fetchUserData(username);
      const reposData = await fetchAllRepositories(username);
      const eventsData = await fetchEvents(username);
      const totalContributions = await fetchLifetimeContributions(username);
      const streak = await fetchStreakForCurrentYear(username);

      const { skills, languageUsage, openSourceContributions } =
        await extractTechnologies(reposData, username);

      const completeUserData = {
        ...userData,
        skills,
        languageUsage: Object.entries(languageUsage).sort(
          ([, a], [, b]) => b - a
        ),
        contributions: totalContributions,
        streak,
        openSourceContributions,
        repos: reposData.length,
        email: userData.email || null,
        twitter: userData.twitter_username
          ? `https://twitter.com/${userData.twitter_username}`
          : null,
        gitHub: userData.html_url || null,
      };

      setUserData(completeUserData);
      cache[`user_${username}`] = completeUserData;

      await updateLeaderboard(completeUserData);
      await incrementUserCount();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserData = async (username) => {
    if (cache[`user_${username}`]) return cache[`user_${username}`];

    const response = await fetch(`https://api.github.com/users/${username}`, {
      headers: { Authorization: `token ${GITHUB_TOKEN}` },
    });

    if (!response.ok) {
      throw new Error(
        response.status === 403
          ? "GitHub rate limit exceeded. Please authenticate."
          : "User not found"
      );
    }

    return await response.json();
  };

  const fetchAllRepositories = async (username) => {
    if (cache[`repos_${username}`]) return cache[`repos_${username}`];

    let reposData = [];
    let page = 1;
    const perPage = 100;

    while (true) {
      const response = await fetch(
        `https://api.github.com/users/${username}/repos?per_page=${perPage}&page=${page}`,
        { headers: { Authorization: `token ${GITHUB_TOKEN}` } }
      );

      const data = await response.json();
      reposData = reposData.concat(data);

      if (data.length < perPage) break;
      page++;
    }

    cache[`repos_${username}`] = reposData;
    return reposData;
  };

  const fetchEvents = async (username) => {
    if (cache[`events_${username}`]) return cache[`events_${username}`];

    const response = await fetch(
      `https://api.github.com/users/${username}/events`,
      {
        headers: { Authorization: `token ${GITHUB_TOKEN}` },
      }
    );

    if (!response.ok) throw new Error("Failed to fetch events");

    const eventsData = await response.json();
    cache[`events_${username}`] = eventsData;
    return eventsData;
  };

  const fetchLifetimeContributions = async (username) => {
    let totalContributions = 0;
    const currentYear = new Date().getFullYear();

    for (let year = 2008; year <= currentYear; year++) {
      const from = `${year}-01-01T00:00:00Z`;
      const to = `${year}-12-31T23:59:59Z`;

      const query = gql`
        {
          user(login: "${username}") {
            contributionsCollection(from: "${from}", to: "${to}") {
              contributionCalendar {
                totalContributions
              }
            }
          }
        }
      `;

      const graphQLData = await graphQLClient.request(query);
      totalContributions +=
        graphQLData.user.contributionsCollection.contributionCalendar
          .totalContributions;
    }

    return totalContributions;
  };

  const fetchStreakForCurrentYear = async (username) => {
    const currentYear = new Date().getFullYear();
    const today = new Date().toISOString().split("T")[0];
    let streak = 0;
    let streakActive = true;

    const query = gql`
      {
        user(login: "${username}") {
          contributionsCollection(from: "${currentYear}-01-01T00:00:00Z", to: "${today}T23:59:59Z") {
            contributionCalendar {
              weeks {
                contributionDays {
                  contributionCount
                  date
                }
              }
            }
          }
        }
      }
    `;

    const graphQLData = await graphQLClient.request(query);
    const contributionCalendar =
      graphQLData.user.contributionsCollection.contributionCalendar;

    if (contributionCalendar.weeks) {
      for (let week of contributionCalendar.weeks.reverse()) {
        for (let day of week.contributionDays.reverse()) {
          if (streakActive) {
            if (day.contributionCount > 0) {
              streak++;
            } else {
              streakActive = false;
            }
          }
        }
      }
    }

    return streak;
  };

  const extractTechnologies = async (repos, username) => {
    const techSet = new Set();
    const languageUsage = {};
    let openSourceContributions = 0;
    const currentYear = new Date().getFullYear();

    repos.forEach((repo) => {
      if (repo.language) {
        techSet.add(repo.language);
        languageUsage[repo.language] = (languageUsage[repo.language] || 0) + 1;
      }
    });

    for (let year = 2008; year <= currentYear; year++) {
      const events = await fetchEventsForYear(username, year);
      openSourceContributions += events.filter(
        (event) =>
          event.repo &&
          !event.repo.private &&
          event.type === "PullRequestEvent" &&
          event.payload.action === "closed" &&
          event.payload.pull_request.merged
      ).length;
    }

    return {
      skills: Array.from(techSet),
      languageUsage,
      openSourceContributions,
    };
  };

  const fetchEventsForYear = async (username, year) => {
    const from = `${year}-01-01T00:00:00Z`;
    const to = `${year}-12-31T23:59:59Z`;

    const response = await fetch(
      `https://api.github.com/users/${username}/events?per_page=1000&since=${from}&until=${to}`,
      { headers: { Authorization: `token ${GITHUB_TOKEN}` } }
    );

    if (!response.ok) throw new Error("Failed to fetch events");

    return await response.json();
  };

  const updateLeaderboard = async (userData) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/update-leaderboard`,
        {
          username: userData.login,
          contributions: userData.contributions,
          followers: userData.followers,
        }
      );
      console.log("in frontend", response.data);
      setLeaderboard(response.data);
    } catch (error) {
      console.error("Error updating leaderboard:", error);
    }
  };

  const incrementUserCount = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/increment-user`);
      setTotalUsers(response.data.totalUsers);
    } catch (error) {
      console.error("Error incrementing user count:", error);
    }
  };

  return (
    <>
    <Router>
      <Routes>
      <Route path="/" exact component={Banner} />
      <Route path="/share/:username?imageurl" component={Share} />
      </Routes>
    </Router>
    <div className="App min-h-screen text-cyan-300 p-4 flex flex-col items-center">
      <h1 className="cyber-glitch text-4xl mb-8">Git-Stats</h1>
      <p className="mb-4">
        Total Users: <span className="text-pink-500">{totalUsers}</span>
      </p>
      <div className="input-container mb-8 flex flex-col sm:flex-row items-center">
        <label className="mr-2 mb-2 sm:mb-0">GitHub username:</label>
        <input
          type="text"
          value={gitHubURL}
          onChange={handleInputChange}
          placeholder="Enter your GitHub username here"
          className="cyber-input bg-gray-800 text-cyan-300 px-4 py-2 border border-cyan-500 sm:mb-0 w-[55%] sm:w-auto"
        />
        <button
          className="cyber-button bg-cyan-500 text-black px-4 py-2 hover:bg-cyan-400 sm:mb-0 w-[50%] sm:w-auto"
          onClick={handleFetchData}
        >
          Fetch GitHub Data
        </button>
      </div>
      {loading && <Spinner />}
      {error && <p className="cyber-error text-pink-500">{error}</p>}
      <div className="flex flex-col md:flex-row gap-8 w-full">
        <div className="md:w-2/3">
          {!loading && !userData && (
            <div className="banner-placeholder bg-black/50 border border-cyan-500 rounded-lg p-4 shadow-lg shadow-cyan-500/50 flex flex-col items-center justify-center h-64">
              <h2 className="text-2xl font-bold mb-4 text-cyan-400 neon-text">
                User Profile
              </h2>
              <p className="text-center">
                Fetch GitHub data to see user information.
              </p>
            </div>
          )}
          {userData && <Banner userData={userData} />}
          {showOpenSourceProjects && userData && (
            <OpenSourceProjects repos={userData.repos} />
          )}
        </div>
        <div className="md:w-1/3">
          {!loading && !userData && (
            <div className="leaderboard-placeholder bg-black/50 border border-cyan-500 rounded-lg p-4 shadow-lg shadow-cyan-500/50 flex flex-col items-center justify-center h-64">
              <h2 className="text-2xl font-bold mb-4 text-cyan-400 neon-text">
                Leaderboard
              </h2>
              <p className="text-center">
                Fetch GitHub data to view the leaderboard.
              </p>
            </div>
          )}
          {userData && (
            <Leaderboard
              leaderboardData={leaderboard}
              totalUsers={totalUsers}
            />
          )}
        </div>
      </div>
    </div>
    </>
  );
  
}

export default App;
