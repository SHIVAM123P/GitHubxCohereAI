import React from "react";

const Leaderboard = ({ leaderboardData, totalUsers }) => {
  console.log('Leaderboard data:', leaderboardData);

  return (
    <div className="leaderboard bg-black/50 border border-cyan-500 rounded-lg p-4 shadow-lg shadow-cyan-500/50">
      <h2 className="text-2xl font-bold mb-4 text-cyan-400">Leaderboard</h2>

      <table className="w-full">
        <thead>
          <tr className="border-b border-cyan-500/50">
            <th className="text-left py-2">Category</th>
            <th className="text-left py-2">User</th>
            <th className="text-left py-2">Score</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-cyan-500/30">
            <td className="py-2">Most Contributions</td>
            <td className="py-2 text-pink-500">{leaderboardData.topContributions.username || "N/A"}</td>
            <td className="py-2 text-pink-500">{leaderboardData.topContributions.contributions || "N/A"}</td>
          </tr>
          <tr>
            <td className="py-2">Most Followers</td>
            <td className="py-2 text-pink-500">{leaderboardData.topFollowers.username || "N/A"}</td>
            <td className="py-2 text-pink-500">{leaderboardData.topFollowers.followers || "N/A"}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default Leaderboard;