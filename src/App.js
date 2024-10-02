import React, { useState } from "react";
import Banner from "./Banner";
import OpenSourceProjects from "./OpenSourceProjects";
import "./App.css";
import "./OpenSourceProjects.css";
import { GraphQLClient, gql } from "graphql-request";

function App() {
  const [gitHubURL, setGitHubURL] = useState("");
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState("");
  const [showOpenSourceProjects, setShowOpenSourceProjects] = useState(false);

  const GITHUB_TOKEN = process.env.REACT_APP_GITHUB_TOKEN; // Ensure you have this token in your .env
  const cache = {}; // Cache object to store API responses

  const handleInputChange = (e) => {
    setGitHubURL(e.target.value);
  };

  const extractUsername = (url) => {
    const match = url.match(/github\.com\/([^\/]+)/);
    return match ? match[1] : null;
  };

  const graphQLClient = new GraphQLClient("https://api.github.com/graphql", {
    headers: {
      authorization: `Bearer ${GITHUB_TOKEN}`,
    },
  });

  const fetchAllRepositories = async (username) => {
    // Check if data is cached
    console.log('cache', cache);
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
    const username = extractUsername(gitHubURL.trim());
    if (!username) {
      setError("Invalid GitHub URL");
      return;
    }
    setError("");

    try {
      // Fetch User Data (Rest API)
      if (cache[`user_${username}`]) {
        setUserData(cache[`user_${username}`]);
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
        openSourceContributions, // Calculated open source contributions
        repos: reposData.length,
        followers: followers,
        following: following,
      };
      cache[`user_${username}`] = completeUserData; // Cache user data
      setUserData(completeUserData);
    } catch (error) {
      setError(error.message);
    }
  };

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
    let openSourceContributions = 0;
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
      // Cache the events data per year to avoid redundant requests if needed
      cache[`events_${username}_${year}`] = events;

      // Calculate open-source contributions based on public repository events
      events.forEach((event) => {
        if (event.repo && !event.repo.private) {
          if (event.type === "PushEvent") {
            openSourceContributions += event.payload.commits.length;
          }
          if (
            event.type === "PullRequestEvent" &&
            event.payload.action === "closed" &&
            event.payload.pull_request.merged
          ) {
            openSourceContributions++;
          }
        }
      });
    }

    return {
      skills: Array.from(techSet),
      languageUsage,
      openSourceContributions,
    };
  };

  return (
    <div className="App">
      <h1>Minimalistic GitHub Banner</h1>
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

      {error && <p style={{ color: "red" }}>{error}</p>}

      {userData && (
        <div className="banner-container">
          <Banner userData={userData} />

          <button
            onClick={() => setShowOpenSourceProjects(!showOpenSourceProjects)}
          >
            {showOpenSourceProjects
              ? "Hide Open Source Projects"
              : "Show Open Source Projects"}
          </button>

          {showOpenSourceProjects && (
            <OpenSourceProjects repos={userData.repos} />
          )}
        </div>
      )}
    </div>
  );
}

export default App;
