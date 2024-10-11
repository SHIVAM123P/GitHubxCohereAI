const TrendingRepos = ({ repos }) => {
    return (
      <div className="trending-repos">
        <h3>Trending Repositories</h3>
        <ul>
          {repos.map((repo) => (
            <li key={repo.id}>
              <a href={repo.html_url} target="_blank" rel="noopener noreferrer">
                {repo.name}
              </a>
              <p>{repo.description}</p>
              <span>★ {repo.stargazers_count}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  };
  