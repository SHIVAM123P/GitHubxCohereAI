import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';

const SharedTwinBanner = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const [twinData, setTwinData] = useState(null);
  const [error, setError] = useState(null);
  const location = useLocation();
  const [userData, setUserData] = useState(null);
  const API_BASE_URL = 'https://gitstatsserver.onrender.com';
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/user/${username}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setUserData(data);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError(error.message);
      }
    };

    fetchUserData();
  }, [username]);

  useEffect(() => {
    const fetchTwinData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/github-twin/${username}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setTwinData(data);
      } catch (error) {
        console.error('Error fetching twin data:', error);
        setError(error.message);
      }
    };

    fetchTwinData();
  }, [username]);

  const imageUrl = new URLSearchParams(location.search).get('imageUrl');

  const handleGenerateOwnTwin = () => {
    navigate('/');
  };

  if (error) {
    return <div className="text-pink-500 font-bold text-center mt-4">{error}</div>;
  }

  if (!twinData) {
    return <div className="text-cyan-500 text-center mt-4">Loading...</div>;
  }

  return (
    <div className="shared-twin-banner-container p-4 flex flex-col items-center min-h-screen bg-gradient-to-b from-black via-gray-900 to-black">
      <Helmet>
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${username} found their GitHub Twin!`} />
        <meta name="twitter:description" content={`${username}'s GitHub Twin is ${twinData.twin.username}. They both have around ${twinData.contributions} contributions.`} />
        <meta name="twitter:image" content={imageUrl} />
        <meta name="twitter:image:alt" content={`${username}'s GitHub Twin`} />
        <title>{`${username}'s GitHub Twin`}</title>
      </Helmet>
      <div className="twin-profiles flex gap-8 mb-8 mt-6">
        <div className="profile flex flex-col items-center">
          <img src={userData.avatar_url} alt={username} className="w-24 h-24 rounded-full border-4 border-cyan-500 shadow-neon" />
          
          <p className="text-cyan-300 mt-2"><a target='_blank' rel="noreferrer" href={userData.html_url}>{username}</a></p>
        </div>
        <div className="profile flex flex-col items-center">
          <img src={twinData.twin.avatar_url} alt={twinData.twin.username} className="w-24 h-24 rounded-full border-4 border-pink-500 shadow-neon-pink" />
          <p className="text-pink-300 mt-2"><a target='_blank' rel="noreferrer" href={twinData.twin.html_url}>{twinData.twin.username}</a></p>
        </div>
      </div>
      <p className="text-cyan-400 text-lg mb-4">{twinData.message}</p>
      <div className="flex justify-center mt-4">
        <button onClick={handleGenerateOwnTwin} className="cyber-button hover:bg-cyan-500 hover:text-black transition-colors">
          Find Your Own GitHub Twin
        </button>
      </div>
    </div>
  );
};

export default SharedTwinBanner;
