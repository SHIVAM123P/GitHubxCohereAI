import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';

const Share = () => {
  const { username } = useParams();
  const location = useLocation();
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    // Extract the image URL from the query parameter
    const queryParams = new URLSearchParams(location.search);
    const imageUrlParam = queryParams.get('imageUrl'); // Correctly getting the query parameter
    if (imageUrlParam) {
      setImageUrl(decodeURIComponent(imageUrlParam));
    }
  }, [location.search]);

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-900 text-cyan-300 p-4">
      <h2 className="text-4xl mb-4">Git-Stats for {username}</h2>
      {imageUrl ? (
        <div className="flex flex-col items-center">
          <img src={imageUrl} alt={`Git-Stats of ${username}`} className="max-w-full rounded-lg shadow-lg" />
          <p className="mt-4">Check out my GitHub stats! #GitStatsChallenge</p>
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default Share;
