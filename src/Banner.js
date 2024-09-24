import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import GitHubCalendar from 'react-github-calendar';
import './Banner.css';
import chroma from 'chroma-js';

Chart.register(...registerables);

const Banner = ({ userData }) => {
  const { avatar_url, login, skills, languageUsage } = userData;

  const languagesData = {
    labels: Object.keys(languageUsage),
    datasets: [
      {
        label: 'Languages Used',
        data: Object.values(languageUsage),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        barThickness: 15, // Make bars thinner
      },
    ],
  };
  
  const chartOptions = {
    responsive: true,
    indexAxis: 'y', // Make the chart horizontal
    scales: {
      x: {
        ticks: {
          beginAtZero: true,
        },
        grid: {
          display: false, // Optional: Hide grid lines
        },
      },
      y: {
        ticks: {
          // Increase maxTicksLimit or remove it to show all language labels
          maxTicksLimit: Object.keys(languageUsage).length, // Set to the number of languages
          autoSkip: false, // Prevent skipping any labels
        },
        grid: {
          display: false, // Optional: Hide grid lines
        },
      },
    },
    plugins: {
      legend: {
        display: false, // Hide legend to make it compact
      },
      tooltip: {
        enabled: true, // Enable tooltips for better UX
      },
    },
  };
  
  

  const transformData = contributions => {
    const today = new Date();
    const ninetyDaysAgo = new Date(today.getTime() - (180 * 24 * 60 * 60 * 1000));
    return contributions.filter(day => {
      const contributionDate = new Date(day.date);
      return contributionDate >= ninetyDaysAgo && contributionDate <= today;
    });
  };

  return (
    <div className="banner">
      <div className="banner-content">
        <img src={avatar_url} alt="Profile" className="profile-pic" />
        <div className="info">
          <h2>{login}</h2>
          <h3>Frequently Used Technologies:</h3>
          <p>{skills.join(', ')}</p>
        </div>
      </div>

      <div className="languages-chart">
  <h3>Languages Used</h3>
  <Bar data={languagesData} options={chartOptions} responsive={true}/>
</div>


      <div className="contribution-heatmap">
        <h3>Recent Contributions (Last 180 Days)</h3>
        <GitHubCalendar
          username={login}
          transformData={transformData}
          theme={{
            level0: '#ebedf0',
            level1: '#9be9a8',
            level2: '#40c463',
            level3: '#30a14e',
            level4: '#216e39',
          }}
          labels={{
            totalCount: '{{count}} contributions in the last 180 days'
          }}
        />
      </div>

      <div className="social-links">
        <a href={`https://github.com/${login}`} target="_blank" rel="noopener noreferrer">GitHub</a>
        <a href={`https://www.linkedin.com/in/${login}`} target="_blank" rel="noopener noreferrer">LinkedIn</a>
      </div>
    </div>
  );
};

export default Banner;