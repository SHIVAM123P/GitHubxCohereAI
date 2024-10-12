import React, { useState, useRef, useEffect } from "react";
import GitHubCalendar from "react-github-calendar";
import html2canvas from "html2canvas";
import { Twitter } from "lucide-react";
import "./Banner.css";
import axios from "axios";

import { BrowserRouter as Router, Route, Switch } from "react-router-dom";

// Custom Alert Component
const CustomAlert = ({ message }) => (
  <div className="custom-alert">
    <p>{message}</p>
  </div>
);

const Banner = ({ userData, isSharedPage = false }) => {
  const {
    avatar_url,
    login,
    languageUsage,
    contributions,
    repos,
    streak,
    openSourceContributions,
    followers,
    following,
    email,
    twitter,
    gitHub,
  } = userData;

  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const bannerRef = useRef(null);
  const topLanguages = languageUsage.slice(0, 3).map((lang) => lang[0]);
  const [imageDeleteHash, setImageDeleteHash] = useState(null);
  const [isShared, setIsShared] = useState(false);

  const imgbb = process.env.REACT_APP_IMAGE_BB;
  // Modify the handleShare function in Banner.js
  // In your Banner.js or wherever your handleShare function is located
  

const handleShare = async () => {
  if (bannerRef.current) {
    setIsSharing(true);
    try {
      const canvas = await html2canvas(bannerRef.current);
      const imageDataUrl = canvas.toDataURL("image/png");

      const blob = await (await fetch(imageDataUrl)).blob();
      const formData = new FormData();
      formData.append("image", blob, "git-stats.png");

      const imgbbResponse = await fetch(
        `https://api.imgbb.com/1/upload?key=${imgbb}`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!imgbbResponse.ok) {
        throw new Error(`ImgBB API error: ${imgbbResponse.statusText}`);
      }

      const imgbbData = await imgbbResponse.json();
      const imageUrl = imgbbData.data.url;

      await fetch("http://localhost:5000/api/save-shared-banner", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: login, imageUrl, userData }),
      });

      const functionUrl = `${window.location.origin}/.netlify/functions/twitter-card?username=${login}&imageUrl=${encodeURIComponent(imageUrl)}`;
      const tweetText = `Check out my GitHub stats! 🏅 Streak: ${streak} days, Lifetime Contributions: ${contributions} 🚀. What's your Git-Stats? #GitStatsChallenge`;

      // Check if Web Share API is supported
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'My GitHub Stats',
            text: tweetText,
            url: functionUrl,
          });
          setShowSuccessMessage(true);
        } catch (error) {
          if (error.name !== 'AbortError') {
            throw error;
          }
          // User cancelled the share, do nothing
        }
      } else {
        // Fallback for desktop or unsupported browsers
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText + ' ' + functionUrl)}`;
        window.open(twitterUrl, "_blank");
        setShowSuccessMessage(true);
      }
    } catch (error) {
      console.error("Error generating or sharing image:", error);
      alert(`There was an error sharing your stats: ${error.message}. Please try again.`);
    } finally {
      setIsSharing(false);
    }
  }
};
  useEffect(() => {
    if (isShared && imageDeleteHash) {
      const deleteImage = async () => {
        try {
          await axios.get(`https://api.imgbb.com/1/delete/${imageDeleteHash}`);
          console.log("Image deleted successfully");
        } catch (error) {
          console.error("Error deleting image:", error);
        }
        setImageDeleteHash(null);
        setIsShared(false);
      };

      deleteImage();
    }
  }, [isShared, imageDeleteHash]);

  useEffect(() => {
    if (showSuccessMessage) {
      const timer = setTimeout(() => setShowSuccessMessage(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessMessage]);

  return (
    <>
      <div className="banner" ref={bannerRef}>
        <div className="cyber-grid"></div>
        <div className="neon-glow"></div>
        <div className="banner-content">
          <div className="profile-pic-container">
            <img src={avatar_url} alt="Profile" className="profile-pic" />
            <div className="profile-pic-glow"></div>
          </div>
          <div className="info">
            <h2 className="cyber-glitch">{login}</h2>
            <p className="repos-contributions">
              <span className="cyber-neon">Repos: {repos}</span> |
              <span className="cyber-neon">
                Lifetime Contributions: {contributions}
              </span>
            </p>
            <p className="cyber-neon">
              Open Source Contributions: {openSourceContributions}
            </p>
            <p className="cyber-neon">Streak: {streak}</p>
            <p className="cyber-text">
              Top Languages: {topLanguages.join(", ")}
            </p>
            <p className="cyber-text">
              Followers: {followers} | Following: {following}
            </p>
          </div>
        </div>

        <div className="contribution-heatmap">
          <h3 className="cyber-glitch">Recent Contributions</h3>
          <GitHubCalendar
            username={login}
            theme={{
              background: "transparent",
              text: "#00ff00",
              grade4: "#39d353",
              grade3: "#26a641",
              grade2: "#006d32",
              grade1: "#0e4429",
              grade0: "#161b22",
            }}
          />
        </div>

        <div className="social-links">
          {twitter && (
            <a
              href={twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="cyber-button"
            >
              Twitter
            </a>
          )}
          {gitHub && (
            <a
              href={gitHub}
              target="_blank"
              rel="noopener noreferrer"
              className="cyber-button"
            >
              GitHub
            </a>
          )}
          {email && (
            <a href={`mailto:${email}`} className="cyber-button">
              Email
            </a>
          )}
        </div>
      </div>
      {!isSharedPage && (
        <button
          onClick={handleShare}
          className="cyber-button share-button"
          disabled={isSharing}
        >
          <Twitter size={18} />
          {isSharing ? "Sharing..." : "Share My Git-Stats"}
        </button>
      )}
      {showSuccessMessage && (
        <CustomAlert message="Your Git-Stats have been shared on Twitter!" />
      )}
    </>
  );
};

export default Banner;
