import React, { useState, useEffect } from "react";
import Banner from "./Banner";
import OpenSourceProjects from "./OpenSourceProjects";
import "./App.css";
import "./OpenSourceProjects.css";
import { GraphQLClient, gql } from "graphql-request";
import Spinner from "./Spinner";
import Leaderboard from './Leaderboard';

function App() {
  const [gitHubURL, setGitHubURL] = useState("");
  const [userData, setUserData] = useState(null);
  const [totalUsers, setTotalUsers] = useState(0);
  const [leaderboardData, setLeaderboardData] = useState({
    topContributions: { username: "", contributions: 0 },
    topFollowers: { username: "", followers: 0 }
  });
  const [error, setError] = useState("");
  const [showOpenSourceProjects, setShowOpenSourceProjects] = useState(false);
  const [loading, setLoading] = useState(false);
  const GITHUB_TOKEN = process.env.REACT_APP_GITHUB_TOKEN;
  const cache = {};

  const handleInputChange = (e) => {
    setGitHubURL(e.target.value);
  };

  const updateLeaderboard = (newUserData) => {
    setLeaderboardData(prevData => {
      const newData = { ...prevData };
      if (newUserData.contributions > prevData.topContributions.contributions) {
        newData.topContributions = {
          username: newUserData.login,
          contributions: newUserData.contributions
        };
      }
      if (newUserData.followers > prevData.topFollowers.followers) {
        newData.topFollowers = {
          username: newUserData.login,
          followers: newUserData.followers
        };
      }
      console.log('Updated leaderboard data:', newData);
      return newData;
    });
  };

  useEffect(() => {
    if (userData) {
      updateLeaderboard(userData);
    }
  }, [userData]);

  
  // const renderContent = () => {
  //   switch (currentTab) {
  //     case 'profile':
  //       return <Banner userData={userData} />;
  //     case 'codeChallenge':
  //       return <CodeChallenge />;
  //     default:
  //       return <Banner userData={userData} />;
  //   }
  // };

  // const extractUsername = (url) => {
  //   const match = url.match(/github\.com\/([^\/]+)/);
  //   return match ? match[1] : null;
  // };

  const graphQLClient = new GraphQLClient("https://api.github.com/graphql", {
    headers: {
      authorization: `Bearer ${GITHUB_TOKEN}`,
    },
  });

  const fetchAllRepositories = async (username) => {
    // Check if data is cached
    console.log("cache", cache);
    if (cache[`repos_${username}`]) {
      return cache[`repos_${username}`];
    }

    let reposData = [];
    let page = 1;
    const perPage = 100;

    while (true) {
      const response = await fetch(
        `https://api.github.com/users/${username}/repos?per_page=${perPage}&page=${page}`,
        {
          headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
          },
        }
      );

      const data = await response.json();
      reposData = reposData.concat(data);

      if (data.length < perPage) {
        break;
      }
      page++;
    }

    // Cache the result
    cache[`repos_${username}`] = reposData;
    return reposData;
  };

  const handleFetchData = async () => {
    const username = gitHubURL;
    if (!username) {
      setError("Invalid GitHub Username");
      return;
    }
    setLoading(true); // Set loading state
    setError("");

    try {
      // Fetch User Data (Rest API)
      if (cache[`user_${username}`]) {
        setUserData(cache[`user_${username}`]);
        setLoading(false); // Remove loading state
        return; // Use cached user data
      }

      const userResponse = await fetch(
        `https://api.github.com/users/${username}`,
        {
          headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
          },
        }
      );

      // Update total users count
      setTotalUsers(prevCount => prevCount + 1);

      // Set fetched user data (cached or from API)
      

      if (!userResponse.ok) {
        throw new Error(
          userResponse.status === 403
            ? "GitHub rate limit exceeded. Please authenticate."
            : "User not found"
        );
      }

      const userData = await userResponse.json();
      
      // Fetch All Repositories (Handling Pagination)
      const reposData = await fetchAllRepositories(username);

      // Fetch events (commits and other contributions)
      if (cache[`events_${username}`]) {
        var eventsData = cache[`events_${username}`];
      } else {
        const eventsResponse = await fetch(
          `https://api.github.com/users/${username}/events`,
          {
            headers: {
              Authorization: `token ${GITHUB_TOKEN}`,
            },
          }
        );

        if (!eventsResponse.ok) {
          throw new Error("Failed to fetch events");
        }

        eventsData = await eventsResponse.json();
        // Cache the events data
        cache[`events_${username}`] = eventsData;
      }
      

      // Fetch Total Contributions (GraphQL)
      const fetchLifetimeContributions = async (username) => {
        let totalContributions = 0;
        const currentYear = new Date().getFullYear();

        // Loop through each year from the start of the user's GitHub activity until the current year
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
          const yearlyContributions =
            graphQLData.user.contributionsCollection.contributionCalendar
              .totalContributions;

          totalContributions += yearlyContributions;
        }

        return totalContributions;
      };

      // Fetch the contribution streak for the current year only
      const fetchStreakForCurrentYear = async (username) => {
        const currentYear = new Date().getFullYear();
        const today = new Date().toISOString().split("T")[0];
        let streak = 0;
        let streakActive = true;

        const from = `${currentYear}-01-01T00:00:00Z`;
        const to = `${today}T23:59:59Z`;

        const query = gql`
    {
      user(login: "${username}") {
        contributionsCollection(from: "${from}", to: "${to}") {
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

        // Ensure weeks exist in the contribution calendar
        if (contributionCalendar.weeks) {
          for (let week of contributionCalendar.weeks.reverse()) {
            for (let day of week.contributionDays.reverse()) {
              if (streakActive) {
                if (day.contributionCount > 0) {
                  streak++;
                } else {
                  streakActive = false; // Stop counting when no contribution is found
                }
              }
            }
          }
        }

        return streak;
      };
      
      const streak = await fetchStreakForCurrentYear(username);
      // Call this function inside your handleFetchData function and set the total contributions.
      const totalContributions = await fetchLifetimeContributions(username);

      const followers = userData.followers;
      const following = userData.following;

      // Extract skills, language usage, and open source contributions
      const { skills, languageUsage, openSourceContributions } =
        await extractTechnologies(reposData, username);

      // Sort languages by usage
      const sortedLanguageUsage = Object.entries(languageUsage).sort(
        ([, a], [, b]) => b - a
      );

      // Set user data and cache it
      const completeUserData = {
        ...userData,
        skills,
        languageUsage: sortedLanguageUsage, // Sorted languages
        contributions: totalContributions,
        streak,
        openSourceContributions, // Calculated open source contributions
        repos: reposData.length,
        followers: followers,
        following: following,
      };

      // Extract additional social links
      const email = userData.email ? userData.email : null;
      const twitter = userData.twitter_username
        ? `https://twitter.com/${userData.twitter_username}`
        : null;
      const gitHub = userData.html_url ? userData.html_url : null; 

      completeUserData.email = email;
      completeUserData.twitter = twitter;
      completeUserData.gitHub = gitHub;

      setUserData(completeUserData);

      cache[`user_${username}`] = completeUserData; // Cache user data
      setUserData(completeUserData);
      setLoading(false); // Remove loading state
    } catch (error) {
      setError(error.message);
      setLoading(false); // Remove loading state
    }
  };
  // useEffect(() => {
  //   if (userData) {
  //     updateLeaderboard(userData);
  //   }
  // }, [userData]);

  const fetchEventsForYear = async (username, year) => {
    const from = `${year}-01-01T00:00:00Z`;
    const to = `${year}-12-31T23:59:59Z`;

    const eventsResponse = await fetch(
      `https://api.github.com/users/${username}/events?per_page=1000&since=${from}&until=${to}`,
      {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
        },
      }
    );

    if (!eventsResponse.ok) {
      throw new Error("Failed to fetch events");
    }

    const eventsData = await eventsResponse.json();
    return eventsData;
  };

  const extractTechnologies = async (repos, username) => {
    const techSet = new Set();
    const languageUsage = {};
    let openSourceContributions = 0; // Initialize contributions count
    const currentYear = new Date().getFullYear();

    // Process language usage from repositories
    repos.forEach((repo) => {
      if (repo.language) {
        techSet.add(repo.language);
        languageUsage[repo.language] = (languageUsage[repo.language] || 0) + 1;
      }
    });

    // Fetch open-source contributions from events across multiple years
    for (let year = 2008; year <= currentYear; year++) {
      const events = await fetchEventsForYear(username, year);

      // Count open-source contributions using a separate count variable for clarity
      let contributionsInYear = 0; // Initialize a yearly contributions counter

      events.forEach((event) => {
        // console.log('event',event); // Log the event to check what you're getting
        if (event.repo && !event.repo.private) {
          if (
            event.type === "PullRequestEvent" &&
            event.payload.action === "closed" &&
            event.payload.pull_request.merged
          ) {
            console.log("Merged PR found:", event); // Log when a merged PR is found
            contributionsInYear++;
          }
        }
      });
      

      // Add yearly contributions to the overall count
      openSourceContributions += contributionsInYear;
    }

    return {
      skills: Array.from(techSet),
      languageUsage,
      openSourceContributions,
    };
  };

 
  return (
    <div className="App bg-gray-900 min-h-screen text-cyan-300 p-4">
      <h1 className="cyber-glitch text-4xl mb-8">Git-Stats</h1>
      <p className="mb-4">Total Users: <span className="text-pink-500">{totalUsers}</span></p>
      <div className="input-container mb-8">
        <label className="mr-2">GitHub username:</label>
        <input
          type="text"
          value={gitHubURL}
          onChange={handleInputChange}
          placeholder="Enter your GitHub username here"
          className="cyber-input mr-2 bg-gray-800 text-cyan-300 border border-cyan-500 p-2"
        />
        <button className="cyber-button bg-cyan-500 text-black px-4 py-2 hover:bg-cyan-400" onClick={handleFetchData}>
          Fetch GitHub Data
        </button>
      </div>
      {loading && <Spinner />}
      {error && <p className="cyber-error text-pink-500">{error}</p>}
      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-2/3">
          {userData ? (
            <Banner userData={userData} />
          ) : (
            <div className="banner-placeholder bg-black/50 border border-cyan-500 rounded-lg p-4 shadow-lg shadow-cyan-500/50">
              <h2 className="text-2xl font-bold mb-4 text-cyan-400 neon-text">User Profile</h2>
              <p>Fetch GitHub data to see user information here.</p>
            </div>
          )}
          {showOpenSourceProjects && userData && (
            <OpenSourceProjects repos={userData.repos} />
          )}
        </div>
        <div className="md:w-1/3">
          {userData && (
            <Leaderboard 
              leaderboardData={leaderboardData}
              totalUsers={totalUsers}
            />
          )}
        </div>
      </div>
      {userData && (
        <button
          className="cyber-button mt-8 bg-cyan-500 text-black px-4 py-2 hover:bg-cyan-400"
          onClick={() => setShowOpenSourceProjects(!showOpenSourceProjects)}
        >
          {showOpenSourceProjects ? "Hide Open Source Projects" : "Show Open Source Projects"}
        </button>
      )}
    </div>
  );
}

export default App;
