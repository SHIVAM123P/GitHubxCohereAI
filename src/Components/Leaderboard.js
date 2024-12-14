import React from "react";

const Leaderboard = ({ leaderboardData }) => {
  // Ensure we're working with an array of top contributors
  const topContributors = Array.isArray(leaderboardData) 
    ? leaderboardData 
    : (leaderboardData.topContributors || []);

  return (
    <div className="flex justify-center items-center p-4 sm:p-6 mt-20">
      <div className="leaderboard bg-black/80 border-2 border-cyan-500 rounded-xl p-4 sm:p-8 shadow-2xl shadow-cyan-500/50 w-full max-w-2xl">
        <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-cyan-400 text-center">Leaderboard</h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-cyan-500/50">
                <th className="text-left py-2 sm:py-3 px-2 sm:px-4 text-cyan-300">Contributor</th>
                <th className="text-right py-2 sm:py-3 px-2 sm:px-4 text-cyan-300">Contributions</th>
              </tr>
            </thead>
            <tbody>
              {topContributors.slice(0, 5).map((contributor, index) => (
                <tr 
                  key={contributor.username} 
                  className="border-b border-cyan-500/30 hover:bg-cyan-900/30 transition-colors duration-200"
                >
                  <td className="py-2 sm:py-4 px-2 sm:px-4 text-pink-500 font-semibold">
                    {contributor.username}
                  </td>
                  <td className="py-2 sm:py-4 px-2 sm:px-4 text-right text-cyan-100">
                    {contributor.contributions}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;