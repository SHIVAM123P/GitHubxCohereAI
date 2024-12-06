import React, { useState, useRef, useEffect } from "react";
import GitHubCalendar from "react-github-calendar";
import html2canvas from "html2canvas";
import { Twitter } from "lucide-react";
import "./Banner.css";
import axios from "axios";
import {
  FaBaby,
  FaCode,
  FaLaptopCode,
  FaRocket,
  FaDragon,
  FaTwitter,
} from "react-icons/fa";
import { FiUsers, FiUserPlus, FiTrendingUp, FiAward } from "react-icons/fi";

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
  const [hoveredBadge, setHoveredBadge] = useState(null);
  const imgbb = process.env.REACT_APP_IMAGE_BB;
  const [isMobile, setIsMobile] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [tooltipStyle, setTooltipStyle] = useState({});
  const badgeRefs = useRef({});

  const [showTwinPopup, setShowTwinPopup] = useState(false);
  const [twinData, setTwinData] = useState(null);
  const [twinModalContent, setTwinModalContent] = useState(null);
  const twinModalRef = useRef(null);
  // const API_BASE_URL = 'https://gitstatsserver.onrender.com';
  const API_BASE_URL = "http://localhost:5000";
  const [theme, setTheme] = useState("default");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const downloadBanner = () => {
    const bannerElement = bannerRef.current;
    if (!bannerElement) return;
  
    // Add "no-gradient" class to remove gradients temporarily
    bannerElement.classList.add("no-gradient");
  
    html2canvas(bannerElement, { useCORS: true,  scale: 2, }).then((canvas) => {
      const link = document.createElement("a");
      link.download = `${login}-git-stats-banner.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
  
      // Remove "no-gradient" class after download
      bannerElement.classList.remove("no-gradient");
    });
  };
  
  const handleFindTwin = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/github-twin/${userData.login}`
      );
      setTwinData(response.data);
      setShowTwinPopup(true);
      console.log("data in twin", response.data);
    } catch (error) {
      console.error("Error finding GitHub twin:", error);
    }
  };

  const handleShareTwin = async () => {
    if (!twinData) return;

    setIsSharing(true);
    let imageUrl, tweetText, functionUrl;

    try {
      setTwinModalContent(
        <div className="twin-popup-content">
          <h2>Your GitHub Twin</h2>
          <div className="twin-profiles">
            <div className="profile">
              <img src={userData.avatar_url} alt={userData.login} />
              <p>{userData.login}</p>
            </div>
            <div className="profile">
              <img
                src={twinData.twin.avatar_url}
                alt={twinData.twin.username}
              />
              <p>{twinData.twin.username}</p>
            </div>
          </div>
          <p>{twinData.message}</p>
        </div>
      );

      // Wait for the next render cycle to ensure the content is in the DOM
      await new Promise((resolve) => setTimeout(resolve, 0));
      // Generate and upload image of the twin modal
      imageUrl = await generateAndUploadTwinImage();

      // Save twin banner (optional, if you want to keep track of shared twin banners)
      await saveBanner(imageUrl);

      const isLocal = window.location.hostname === "localhost";

      // Prepare the function URL for the share
      if (isLocal) {
        functionUrl = `${
          window.location.origin
        }/share-twin/${login}?imageUrl=${encodeURIComponent(imageUrl)}`;
      } else {
        functionUrl = `${
          window.location.origin
        }/share-twin/${login}?imageUrl=${encodeURIComponent(imageUrl)}`;
      }

      // Prepare the tweet text
      tweetText = `I found my GitHub twin! It's ${twinData.twin.username}. We both have around ${userData.contributions} contributions. Find your twin on Git-Stats! #GitHubTwin`;

      // Determine if the user is on a mobile device
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      // Use Web Share API on mobile and Twitter intent on desktop
      if (isMobile && navigator.share) {
        try {
          await navigator.share({
            title: "My GitHub Twin",
            text: tweetText,
            url: functionUrl,
          });
          setShowSuccessMessage(true);
        } catch (error) {
          if (error.name === "AbortError") {
            console.log("Share cancelled");
          } else {
            // Fall back to Twitter intent if Web Share fails
            openTwitterShare(tweetText, functionUrl);
          }
        }
      } else {
        // Use Twitter intent URL directly for desktop sharing
        openTwitterShare(tweetText, functionUrl);
      }
    } catch (error) {
      console.error("Error in sharing twin data:", error);
      alert(
        `There was an error preparing your twin stats for sharing: ${error.message}. Please try again.`
      );
    } finally {
      setIsSharing(false);
    }
  };

  const generateAndUploadTwinImage = async () => {
    if (!twinModalRef.current)
      throw new Error("Twin modal reference not found");

    const canvas = await html2canvas(twinModalRef.current, {
      logging: false,
      useCORS: true,
      scale: 2, // Increase quality of the image
    });
    const imageDataUrl = canvas.toDataURL("image/png");

    const blob = await (await fetch(imageDataUrl)).blob();
    const formData = new FormData();
    formData.append("image", blob, "github-twin.png");

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

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  // Modify the handleShare function in Banner.js
  useEffect(() => {
    const newBadges = determineBadges();
    setSelectedBadges(newBadges);

    // Generate badge descriptions
    const descriptions = newBadges
      .map((badgeInfo) => `${badgeInfo[0]} ${badgeInfo[1]}`)
      .join(" | ");
    setBadgeDescriptions(descriptions);

    // If user qualifies for a badge, show the popup
    if (newBadges.length > 0) {
      setShowBadgePopup(true);
    }
  }, [contributions, followers]);

  const handleShare = async () => {
    console.log("handle share clicked");
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
        functionUrl = `${
          window.location.origin
        }/api/share/${login}?imageUrl=${encodeURIComponent(imageUrl)}`;
      } else {
        // Use production URL
        functionUrl = `${
          window.location.origin
        }/.netlify/functions/twitter-card?username=${login}&imageUrl=${encodeURIComponent(
          imageUrl
        )}`;
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
      alert(
        `There was an error preparing your stats for sharing: ${error.message}. Please try again.`
      );
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
      badges.push("Code Tadpole");
    } else if (contributions < 1000) {
      badges.push("Byte Bender");
    } else if (contributions < 5000) {
      badges.push("Syntax Sorcerer");
    } else if (contributions < 10000) {
      badges.push("Algorithm Alchemist");
    } else {
      badges.push("Binary Behemoth");
    }

    // Followers badges
    if (followers < 50) {
      badges.push("Lone Wolf Coder");
    } else if (followers < 250) {
      badges.push("Pack Leader");
    } else if (followers < 1000) {
      badges.push("Code Influencer");
    } else {
      badges.push("Git Guru");
    }

    return badges;
  };

  const badgeInfo = {
    "Code Tadpole": {
      icon: FaBaby,
      description: "Just getting started (< 100 contributions)",
      color: "#FFD700",
    },
    "Byte Bender": {
      icon: FaCode,
      description: "Making waves (100+ contributions)",
      color: "#C0C0C0",
    },
    "Syntax Sorcerer": {
      icon: FaLaptopCode,
      description: "Casting powerful code spells (1000+ contributions)",
      color: "#FF4500",
    },
    "Algorithm Alchemist": {
      icon: FaRocket,
      description: "Transmuting code into gold (5000+ contributions)",
      color: "#7CFC00",
    },
    "Binary Behemoth": {
      icon: FaDragon,
      description: "A true coding legend (10000+ contributions)",
      color: "#FF1493",
    },
    "Lone Wolf Coder": {
      icon: FiUsers,
      description: "Coding in solitude (< 50 followers)",
      color: "#4169E1",
    },
    "Pack Leader": {
      icon: FiUserPlus,
      description: "Building a coding wolfpack (50+ followers)",
      color: "#9932CC",
    },
    "Code Influencer": {
      icon: FiTrendingUp,
      description: "Your code speaks volumes (250+ followers)",
      color: "#00CED1",
    },
    "Git Guru": {
      icon: FiAward,
      description: "Your reputation precedes you (1000+ followers)",
      color: "#FF8C00",
    },
  };

  const calculateTooltipPosition = (badgeRect) => {
    const tooltipWidth = 300; // This should match the max-width in CSS
    const screenPadding = 10; // Padding from screen edges

    let left = badgeRect.left + badgeRect.width / 2 - tooltipWidth / 2;
    let top = badgeRect.top - 10; // 10px above the badge

    // Adjust horizontal position if too close to screen edges
    if (left < screenPadding) {
      left = screenPadding;
    } else if (left + tooltipWidth > window.innerWidth - screenPadding) {
      left = window.innerWidth - tooltipWidth - screenPadding;
    }

    // If tooltip would appear above the viewport, position it below the badge instead
    if (top < screenPadding) {
      top = badgeRect.bottom + 10; // 10px below the badge
    }

    return {
      left: `${left}px`,
      top: `${top}px`,
      position: "fixed",
    };
  };

  const handleBadgeInteraction = (badge, event) => {
    if (isMobile) {
      setSelectedBadge(badge);
    } else {
      setHoveredBadge(badge);
      if (event) {
        const badgeRect = badgeRefs.current[badge].getBoundingClientRect();
        const tooltipStyle = calculateTooltipPosition(badgeRect);
        setTooltipStyle(tooltipStyle);
      }
    }
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
      <div className="theme-selector-container">
        <h3 className="theme-title">Select Your Theme:</h3>
        <span>
        <button className="theme-button" onClick={() => setTheme("default")}>
          Default
        </button>
        <button className="theme-button" onClick={() => setTheme("dark")}>
          Dark
        </button>
        <button className="theme-button" onClick={() => setTheme("cyberpunk")}>
          Cyberpunk
        </button>
        <button className="theme-button" onClick={() => setTheme("aurora")}>
          Aurora
        </button>
        </span>
      </div>
      <div className="banner" ref={bannerRef}>
        <div className="cyber-grid"></div>
        <div className="neon-glow"></div>
        <div className="banner-content">
          <div className="profile-section">
            <div className="profile-pic-container">
              <img src={avatar_url} alt="Profile" className="profile-pic" />
              <div className="profile-pic-glow"></div>
            </div>
            <div className="badges-container">
              {selectedBadges.map((badge, index) => (
                <div
                  key={index}
                  className="badge-item"
                  style={{ color: badgeInfo[badge].color }}
                  onMouseEnter={(e) => handleBadgeInteraction(badge, e)}
                  onMouseLeave={() => setHoveredBadge(null)}
                  onClick={(e) => handleBadgeInteraction(badge, e)}
                  ref={(el) => (badgeRefs.current[badge] = el)}
                >
                  {React.createElement(badgeInfo[badge].icon, { size: 32 })}
                </div>
              ))}
            </div>
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
          {/* <FaTwitter  size={18}/> */}
          {isSharing ? "Sharing..." : "Share My Git-Stats"}
        </button>
      )}
      {!isSharedPage && (
        <button
          onClick={handleFindTwin}
          className="cyber-button find-twin-button"
        >
          Find My GitHub Twin
        </button>
      )}
      {!isSharedPage && (
        <button
          className="cyber-button download-button"
          onClick={downloadBanner}
        >
          Download My Banner
        </button>
      )}
      {showSuccessMessage && (
        <CustomAlert message="Your Git-Stats have been shared on Twitter!" />
      )}
      {/* Badge Popup */}
      {!isSharedPage && showBadgePopup && (
        <div
          className={`badge-popup ${showBadgePopup ? "visible" : "hidden"}`}
          style={{
            pointerEvents: showBadgePopup ? "auto" : "none",
            zIndex: showBadgePopup ? 11 : -1,
          }}
        >
          <div className="popup-content">
            <h2>You've earned the {selectedBadges[0]} badge!</h2>
            <p>{badgeInfo[selectedBadges[0]].description} 🎉</p>

            <button className="cyber-button" onClick={handleShare}>
              {isSharing ? "Sharing Git-Stats..." : "Share My Git-Stats"}
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

      {!isMobile && hoveredBadge && (
        <div className="badge-tooltip" style={tooltipStyle}>
          <strong>{hoveredBadge}</strong>: {badgeInfo[hoveredBadge].description}
        </div>
      )}
      {isMobile && selectedBadge && (
        <div className="badge-modal" onClick={() => setSelectedBadge(null)}>
          <div
            className="badge-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>{selectedBadge}</h3>
            <p>{badgeInfo[selectedBadge].description}</p>
            <button onClick={() => setSelectedBadge(null)}>Close</button>
          </div>
        </div>
      )}
      {twinModalContent && (
        <div
          ref={twinModalRef}
          style={{
            position: "absolute",
            left: "-9999px",
            top: "-9999px",
            width: "600px", // Set a fixed width for consistency
            background: "#1a1a1a", // Dark background
            color: "#00ff00", // Neon green text
            padding: "20px",
            borderRadius: "10px",
            boxShadow: "0 0 10px #00ff00", // Neon glow effect
          }}
        >
          {twinModalContent}
        </div>
      )}
      {showTwinPopup && (
        <div className="twin-popup">
          <div className="popup-content">
            <h2>Your GitHub Twin</h2>
            <div className="twin-profiles">
              <div className="profile">
                <img src={userData.avatar_url} alt={userData.login} />
                <p>{userData.login}</p>
              </div>

              {twinData?.twin ? (
                <div className="profile">
                  <img
                    src={twinData.twin.avatar_url}
                    alt={twinData.twin.username}
                  />
                  <p>{twinData.twin.username}</p>
                </div>
              ) : (
                <div className="no-twin-message">
                  <p>No GitHub Twin found for you at this time.</p>
                </div>
              )}
            </div>

            <p>{twinData?.message || "Try again later to find your twin."}</p>

            {twinData?.twin && (
              <button className="cyber-button" onClick={handleShareTwin}>
                Share My GitHub Twin
              </button>
            )}
            <button
              className="cyber-button close-button"
              onClick={() => setShowTwinPopup(false)}
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
