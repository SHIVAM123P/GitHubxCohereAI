import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Banner from './Banner';

const SharedBanner = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch(`https://gitstatsserver.onrender.com/api/user/${username}`);
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

  const handleGenerateOwnBanner = () => {
    navigate('/');
  };

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!userData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="shared-banner-container">
      <Banner userData={userData} isSharedPage={true} />
      <div className="flex justify-center mt-4">
        <button onClick={handleGenerateOwnBanner} className="cyber-button">
          Generate Your Own Banner
        </button>
      </div>
    </div>
  );
};

export default SharedBanner;