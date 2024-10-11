import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Banner from './Banner';
import { Helmet } from 'react-helmet';
const SharedBanner = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/user/${username}`);
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

  const imageUrl = new URLSearchParams(location.search).get('imageUrl');

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
        <Helmet>
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`Check out ${username}'s GitHub Stats!`} />
        <meta name="twitter:description" content={`Contributions: ${userData.contributions}+, Streak: ${userData.streak} days`} />
        <meta name="twitter:image" content={imageUrl} />
        <meta name="twitter:image:alt" content={`${username}'s GitHub stats`} />
        <title>{`${username}'s GitHub Stats`}</title>
      </Helmet>
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