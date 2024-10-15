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
  const [showBadgePopup, setShowBadgePopup] = useState(false);
  const [badgeDescriptions, setBadgeDescriptions] = useState([]);

  const imgbb = process.env.REACT_APP_IMAGE_BB;
  // Modify the handleShare function in Banner.js
  useEffect(() => {
    const newBadges = determineBadges();
    setSelectedBadges(newBadges);
  
    // Generate badge descriptions
    const descriptions = newBadges.map(badgeInfo => `${badgeInfo[0]} ${badgeInfo[1]}`).join(" | ");
    setBadgeDescriptions(descriptions);
  
    // If user qualifies for a badge, show the popup
    if (newBadges.length > 0) {
      setShowBadgePopup(true);
    }
  }, [contributions, followers]);
  
  const handleShare = async () => {
    setIsSharing(true);
    let imageUrl, tweetText, functionUrl;
  
    try {
      // Generate and upload image
      imageUrl = await generateAndUploadImage();
  
      // Save banner
      await saveBanner(imageUrl);
      const isLocal = window.location.hostname === "localhost";
  
      // Prepare sharing content
      if (isLocal) {
        // Use local testing URL
        functionUrl = `${window.location.origin}/api/share/${login}?imageUrl=${encodeURIComponent(imageUrl)}`;
      } else {
        // Use production URL
        functionUrl = `${window.location.origin}/.netlify/functions/twitter-card?username=${login}&imageUrl=${encodeURIComponent(imageUrl)}`;
      }
  
      tweetText = `Check out my GitHub stats! Contributions: ${contributions}.\nBadges: ${badgeDescriptions}. What's your Git-Stats? #GitStatsChallenge`;
  
      // Determine if the user is on a mobile device
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
      // Use Twitter intent on desktop and Web Share API on mobile
      if (isMobile && navigator.share) {
        try {
          await navigator.share({
            title: "My GitHub Stats",
            text: tweetText,
            url: functionUrl,
          });
          setShowSuccessMessage(true);
        } catch (error) {
          if (error.name === "AbortError") {
            console.log("Share cancelled");
          } else {
            // If Web Share API fails, fall back to Twitter intent URL
            openTwitterShare(tweetText, functionUrl);
          }
        }
      } else {
        // If not on mobile, use Twitter intent URL directly
        openTwitterShare(tweetText, functionUrl);
      }
    } catch (error) {
      console.error("Error in sharing process:", error);
      alert(`There was an error preparing your stats for sharing: ${error.message}. Please try again.`);
    } finally {
      setIsSharing(false);
    }
  };
  
  

  // Helper function to open the Twitter intent URL
  const openTwitterShare = (tweetText, functionUrl) => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      tweetText
    )}&url=${encodeURIComponent(functionUrl)}`;
    window.open(twitterUrl, "_blank");
  };
  const closeBadgePopup = () => setShowBadgePopup(false);

  const generateAndUploadImage = async () => {
    if (!bannerRef.current) throw new Error("Banner reference not found");

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
    return imgbbData.data.url;
  };

  const saveBanner = async (imageUrl) => {
    const response = await fetch(
      "http://localhost:5000/api/save-shared-banner",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: login, imageUrl, userData }),
      }
    );

    if (!response.ok) {
      throw new Error(`Save banner error: ${response.statusText}`);
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

  ///////////////

  // In your determineBadges function, include reasons for each badge.
  const determineBadges = () => {
    const badges = [];

    // Contributions badges
    if (contributions < 100) {
      badges.push(["Newbie", "( approx 100 contributions)"]);
    } else if (contributions < 1000) {
      badges.push(["Contributor", "( 100+ contributions)"]);
    } else if (contributions < 5000) {
      badges.push(["Pro Coder", "( 1000+ contributions)"]);
    } else if (contributions < 10000) {
      badges.push(["Master Coder", "( 5000+ contributions)"]);
    } else {
      badges.push(["Code Legend", "( 10000+ contributions)"]);
    }

    // Followers badges
    if (followers < 50) {
      badges.push(["Emerging Star", "( approx 50 followers)"]);
    } else if (followers < 250) {
      badges.push(["Community Builder", "( 50+ followers)"]);
    } else if (followers < 1000) {
      badges.push(["Influencer", "( 250+ followers)"]);
    } else {
      badges.push(["Tech Guru", "( 1000+ followers)"]);
    }

    return badges;
  };

  // Modify the badges array and selectedBadges state to hold objects with name and reason.
  const badges = determineBadges();
  const [selectedBadges, setSelectedBadges] = useState(badges);
  // Populate badges on component mount
  useEffect(() => {
    const newBadges = determineBadges();
    setSelectedBadges(newBadges);

    // If user qualifies for a badge, show the popup
    if (newBadges.length > 0) {
      setShowBadgePopup(true);
    }
  }, [contributions, followers]);
  const toggleBadge = (badge) => {
    if (selectedBadges.includes(badge)) {
      setSelectedBadges(selectedBadges.filter((b) => b !== badge));
    } else {
      setSelectedBadges([...selectedBadges, badge]);
    }
  };
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
          <div className="badges-container">
            <h3 className="cyber-glitch">Your Badges:</h3>
            <div className="badges-list">
              {badges.map((badge, index) => (
                <div
                  key={index}
                  className={`badge-item ${
                    selectedBadges.includes(badge) ? "selected" : ""
                  }`}
                  onClick={() => toggleBadge(badge)}
                >
                  {badge}
                </div>
              ))}
            </div>
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
      {/* Badge Popup */}
      {!isSharedPage && showBadgePopup && (
        <div className="badge-popup">
          <div className="popup-content">
            <h2>You're a {badges[0][0]}!</h2>
            <p>{badges[0][1]} 🎉</p>
            <button className="cyber-button" onClick={handleShare}>
              Share Your Git-Stats
            </button>
            <button
              className="cyber-button close-button"
              onClick={closeBadgePopup}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Banner;
