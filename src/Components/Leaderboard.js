import React from "react";

const Leaderboard = ({ leaderboardData, totalUsers }) => {
  console.log('Leaderboard data:', leaderboardData);

  return (
    <div className="flex justify-center items-center p-4 sm:p-6">
      <div className="leaderboard bg-black/80 border-2 border-cyan-500 rounded-xl p-4 sm:p-8 shadow-2xl shadow-cyan-500/50 w-full max-w-2xl overflow-x-auto">
        <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-cyan-400 text-center">Leaderboard</h2>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[300px]">
            <thead>
              <tr className="border-b-2 border-cyan-500/50">
                <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-cyan-300 whitespace-nowrap">Category</th>
                <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-cyan-300 whitespace-nowrap">User</th>
                <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-cyan-300 whitespace-nowrap">Score</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-cyan-500/30 hover:bg-cyan-900/30 transition-colors duration-200">
                <td className="py-2 sm:py-4 px-2 sm:px-4 text-cyan-100 whitespace-nowrap">Most Contributions</td>
                <td className="py-2 sm:py-4 px-2 sm:px-4 text-pink-500 font-semibold whitespace-nowrap">{leaderboardData.topContributions?.username || "N/A"}</td>
                <td className="py-2 sm:py-4 px-2 sm:px-4 text-pink-500 font-semibold whitespace-nowrap">{leaderboardData.topContributions?.contributions || "N/A"}</td>
              </tr>
              <tr className="hover:bg-cyan-900/30 transition-colors duration-200">
                <td className="py-2 sm:py-4 px-2 sm:px-4 text-cyan-100 whitespace-nowrap">Most Followers</td>
                <td className="py-2 sm:py-4 px-2 sm:px-4 text-pink-500 font-semibold whitespace-nowrap">{leaderboardData.topFollowers?.username || "N/A"}</td>
                <td className="py-2 sm:py-4 px-2 sm:px-4 text-pink-500 font-semibold whitespace-nowrap">{leaderboardData.topFollowers?.followers || "N/A"}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;