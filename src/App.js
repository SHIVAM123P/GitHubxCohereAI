import React, { useState, useEffect } from "react";
import axios from "axios";
import { GraphQLClient, gql } from "graphql-request";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Banner from "./Components/Banner";
import SharedBanner from "./Components/SharedBanner";
import OpenSourceProjects from "./Components/OpenSourceProjects";
import Spinner from "./Components/Spinner";
import Leaderboard from "./Components/Leaderboard";
import "./App.css";
import "./Components/OpenSourceProjects.css";
import SharedTwinBanner from './Components/SharedTwinBanner';

const GITHUB_TOKEN = process.env.REACT_APP_GITHUB_TOKEN;
const API_BASE_URL = 'https://gitstatsserver.onrender.com';
// const API_BASE_URL = "http://localhost:5000";
const graphQLClient = new GraphQLClient("https://api.github.com/graphql", {
  headers: { authorization: `Bearer ${GITHUB_TOKEN}` },
});

function MainApp() {
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
  const [loading1, setLoading1] = useState(false);
  const cache = {};
  const [last5Users, setLast5Users] = useState([]);

  // Fetch the last 5 users who interacted with the platform
  useEffect(() => {
    const fetchLast5Users = async () => {
        try {
          setLoading1(true); // Start loading
            const response = await fetch(`${API_BASE_URL}/api/last-5-users`);
            const data = await response.json();
            console.log("Fetched Last 5 Users:", data); // Debugging
            setLast5Users(data); // Update the state with fetched users
        } catch (error) {
            console.error("Error fetching last 5 users:", error);
        } finally {
          setLoading1(false); // Stop loading
        }
    };

    fetchLast5Users(); // Call the fetch function
}, []); // Run only once on component mount
  useEffect(() => {
    // console.log("githubbb tokennnnn", GITHUB_TOKEN);
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
  useEffect(() => {
    // console.log("Loading state changed:", loading);
  }, [loading]);

  useEffect(() => {
    // console.log("gitHubURL state:", gitHubURL);
  }, [gitHubURL]);
  useEffect(() => {
    if (!loading) {
      const inputElement = document.querySelector('input[type="text"]');
      if (inputElement) inputElement.focus();
    }
  }, [loading]);

  useEffect(() => {
    console.log("Last 5 Users:", last5Users);
}, [last5Users]);

    
  
  const handleFetchData = async () => {
    const username = gitHubURL; 
    if (!username) {
        setError("Invalid GitHub Username");
        return;
    }

    setLoading(true);
    setError(""); // Reset error message
    setUserData(null);

    try {
        // Attempt to fetch user data from the server
        const userData = await fetchUserData(username);
        if (!userData) {
            throw new Error(`No user found with the username '${username}'. Please check the spelling and try again.`);
        }

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
        await saveUserData(completeUserData);
        await updateLeaderboard(completeUserData);
        await incrementUserCount();
    } catch (error) {
        setError('Due to overload, I am changing the token please try again later!!'); // Set a user-friendly error message
    } finally {
        setLoading(false);
        
    }
};


const saveUserData = async (userData) => {
  try {
      await axios.post(`${API_BASE_URL}/api/save-github-user`, {
          username: userData.login,
          contributions: userData.contributions,
          streak: userData.streak,
          openSourceContributions: userData.openSourceContributions,
          joinedDate: userData.created_at,
          followers: userData.followers,
          following: userData.following,
          repositories: userData.public_repos,
          stars: userData.public_gists,
          avatar_url: userData.avatar_url,
          html_url: userData.html_url
      });
  } catch (error) {
      console.error("Error saving user data:", error);
      setError("There was an error saving your data. Please try again later."); // User-friendly error message
  }
};


  const fetchUserData = async (username) => {
    // console.log("github token", GITHUB_TOKEN);
    // console.log({
    //   Authorization: `Bearer ${GITHUB_TOKEN}`,
    // });
    
    if (cache[`user_${username}`]) return cache[`user_${username}`];

    const response = await fetch(`https://api.github.com/users/${username}`, {
      headers: { Authorization: `Bearer ${GITHUB_TOKEN}` },
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
          avatar_url: userData.avatar_url,
          username: userData.login,
          contributions: userData.contributions,
        }
      );
      // console.log("in frontend", response.data);
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

<div className="App min-h-screen text-cyan-300 p-4 flex flex-col items-center relative">
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
      placeholder="Enter your GitHub username"
      disabled={loading}
      className="placeholder:text-sm z-100 cyber-input bg-gray-800 text-cyan-300 px-4 py-2 border border-cyan-500 sm:mb-0 w-[55%] sm:w-auto"
    />
    <button
      className="cyber-button bg-cyan-500 text-black px-4 py-2 hover:bg-cyan-400 sm:mb-0 w-[50%] sm:w-auto"
      onClick={handleFetchData}
    >
      Fetch GitHub Data
    </button>
  </div>

  <div className="last-5-users">
    <h3 className="recent-users text-2xl text-center mb-4 text-cyan-300">Recent Users</h3>
    {loading1 ? (
        <p className="text-cyan-300">Loading recent users...</p> // Or a skeleton loader
    ) : (
        <div className="flex space-x-4 sm:space-x-6">
            {last5Users.map((user) => (
                <div key={user.username} className="relative">
                    <a
                        href={user.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                    >
                        <img
                            src={user.avatar_url}
                            alt={user.username}
                            className="w-16 h-16 rounded-full border-2 border-cyan-500"
                        />
                        <div className="absolute inset-0 flex items-center justify-center text-cyan-300 opacity-0 hover:opacity-100 transition-opacity">
                            {user.username}
                        </div>
                    </a>
                </div>
            ))}
        </div>
    )}
</div>




        {loading && <Spinner />}
        {error && <p className="cyber-error text-pink-500">{error}</p>}
        <div className="flex flex-col md:flex-row gap-8 w-full">
          <div className="md:w-2/3">
            {!loading && !userData && (
              <div className="banner-placeholder bg-black/50 border border-cyan-500 rounded-lg p-4 shadow-lg shadow-cyan-500/50 flex flex-col items-center justify-center h-64">
                <h2 className="text-2xl font-bold mb-4 text-cyan-400 neon-text">
                  Your Git-Stats
                </h2>
                <p className="text-center">
                  Fetch GitHub data to see your stats.
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
                Hall of Fame
                </h2>
                <p className="text-center">
                  Fetch GitHub data to view the Hall of Fame.
                </p>
              </div>
            )}
            {userData && (
              <Leaderboard
                leaderboardData={leaderboard}
                // totalUsers={totalUsers}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );

}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainApp />} />
        <Route path="/api/share/:username" element={<SharedBanner />} />
        <Route path="/share-twin/:username" element={<SharedTwinBanner />} />

      </Routes>
    </Router>
  );
}

export default App;
