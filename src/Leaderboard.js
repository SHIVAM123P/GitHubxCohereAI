import React from "react";
// import './Leaderboard.css'
const Leaderboard = ({ leaderboardData, totalUsers }) => {
  console.log('Leaderboard data:', leaderboardData);

  return (
    <div className="flex justify-center items-center min-h-screen p-6">
      <div className="leaderboard bg-black/80 border-2 border-cyan-500 rounded-xl p-8 shadow-2xl shadow-cyan-500/50 max-w-2xl w-full">
        <h2 className="text-3xl font-bold mb-6 text-cyan-400 text-center ">Leaderboard</h2>

        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-cyan-500/50">
              <th className="text-left py-3 px-4 text-cyan-300">Category</th>
              <th className="text-left py-3 px-4 text-cyan-300">User</th>
              <th className="text-left py-3 px-4 text-cyan-300">Score</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-cyan-500/30 hover:bg-cyan-900/30 transition-colors duration-200">
              <td className="py-4 px-4 text-cyan-100">Most Contributions</td>
              <td className="py-4 px-4 text-pink-500 font-semibold">{leaderboardData.topContributions?.username || "N/A"}</td>
              <td className="py-4 px-4 text-pink-500 font-semibold">{leaderboardData.topContributions?.contributions || "N/A"}</td>
            </tr>
            <tr className="hover:bg-cyan-900/30 transition-colors duration-200">
              <td className="py-4 px-4 text-cyan-100">Most Followers</td>
              <td className="py-4 px-4 text-pink-500 font-semibold">{leaderboardData.topFollowers?.username || "N/A"}</td>
              <td className="py-4 px-4 text-pink-500 font-semibold">{leaderboardData.topFollowers?.followers || "N/A"}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Leaderboard;



// import React from "react";
// import "./Leaderboard.css"; // Make sure to import the CSS file

// const Leaderboard = ({ leaderboardData, totalUsers }) => {
//   console.log('Leaderboard data:', leaderboardData);

//   return (
//     <div className="leaderboard-container">
//       <div className="leaderboard">
//         <h2>Leaderboard</h2>

//         <table>
//           <thead>
//             <tr>
//               <th>Category</th>
//               <th>Username</th>
//               <th>Count</th>
//             </tr>
//           </thead>
//           <tbody>
//             <tr>
//               <td>Most Contributions</td>
//               <td className="username">{leaderboardData.topContributions?.username || "N/A"}</td>
//               <td className="score">{leaderboardData.topContributions?.contributions || "N/A"}</td>
//             </tr>
//             <tr>
//               <td>Most Followers</td>
//               <td className="username">{leaderboardData.topFollowers?.username || "N/A"}</td>
//               <td className="score">{leaderboardData.topFollowers?.followers || "N/A"}</td>
//             </tr>
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// };

// export default Leaderboard;