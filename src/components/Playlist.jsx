// eslint-disable-next-line no-unused-vars
import React, { useState, useRef, useEffect } from "react";
import defaultCoverImage from "../assets/default-cover.png";
import PropTypes from 'prop-types'; 

const Playlist = ({ playlist, onPlay, currentTrackIndex, setCurrentTrack }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
  };

  const removeFileExtension = (fileName) => {
    return fileName.replace(/\.[^/.]+$/, "");
  };

  const handleItemClick = (item, index) => {
    if (index === currentTrackIndex) {
      // Toggle play/pause for the currently active track
      setIsPlaying(!isPlaying);
    } else {
      onPlay(item);
      setCurrentTrack(index); // Update the current track index
      setIsPlaying(true); // Ensure isPlaying is true when starting a new track
      // Set the audio source to the clicked track
      audioRef.current.src = playlist[index].src;
      localStorage.setItem("lastPlayedItemIndex", index); // Store the selected item index in local storage
      localStorage.setItem("lastPlayedPosition", "0"); // Reset last played position to start from the beginning
    }
  };

  const handleAudioEnded = () => {
    // Play the next track when the current track ends
    if (currentTrackIndex < playlist.length - 1) {
      setCurrentTrack(currentTrackIndex + 1);
      audioRef.current.src = playlist[currentTrackIndex + 1]?.src;
      audioRef.current.addEventListener('canplay', () => {
        audioRef.current.play();
      }, { once: true });
      localStorage.setItem("lastPlayedItemIndex", currentTrackIndex + 1);
    } else {
      setCurrentTrack(0); // Start from the beginning of the playlist
      audioRef.current.src = playlist[0]?.src;
      audioRef.current.addEventListener('canplay', () => {
        audioRef.current.play();
      }, { once: true });
      localStorage.setItem("lastPlayedItemIndex", 0);
    }
  };

  useEffect(() => {
    const storedIndex = localStorage.getItem("lastPlayedItemIndex");
    const lastPlayedIndex = storedIndex ? parseInt(storedIndex, 10) : 0;

    const storedPosition = localStorage.getItem("lastPlayedPosition");
    if (storedPosition) {
      const lastPlayedPosition = parseFloat(storedPosition);
      audioRef.current.currentTime = lastPlayedPosition;
    }
    
      if(lastPlayedIndex) {
        setCurrentTrack(lastPlayedIndex)
        audioRef.current.src = playlist[currentTrackIndex]?.src;
   
      }
      else {
      // Set the audio source
      audioRef.current.src = playlist[0]?.src;
      }


    // Listen for events
    audioRef.current.addEventListener('canplaythrough', () => {
      if (isPlaying) {
        audioRef.current.play();
      }
    });


    // Periodically update last played position
  const updateLastPlayedPosition = setInterval(() => {
    localStorage.setItem("lastPlayedPosition", audioRef.current.currentTime.toString());
  }, 1000);

    // Cleanup event listeners
    return () => {
      audioRef.current.removeEventListener('canplaythrough', () => {
        if (isPlaying) {
          audioRef.current.play();
        }
      });
      clearInterval(updateLastPlayedPosition); 
      localStorage.setItem("lastPlayedPosition", audioRef.current.currentTime.toString());
    };
  }, [isPlaying, playlist]);  

  return (
    <div className="screen">
      <div className="playlist">
        {playlist.map((item, index) => (
          <div
            key={index}
            className={`playlist-item ${currentTrackIndex === index ? "active" : ""}`}
            onClick={() => currentTrackIndex !== index && handleItemClick(item, index)}
          >
            <div className="playlist-item-info">
              <div className="playlist-item-title">
                {item.coverImage ? (
                  <img
                    src={item.coverImage}
                    alt={`Cover for ${item.name}`}
                    className="playlist-item-cover"
                    onError={(e) => {
                      // Handle error in loading cover image, show defaultCoverImage
                      e.target.src = defaultCoverImage;
                    }}
                  />
                ) : (
                  <img
                    src={defaultCoverImage}
                    alt={`Default Cover for ${item.name}`}
                    className="playlist-item-cover"
                  />
                )}
                <div className="title">{removeFileExtension(item.name)}</div>
              </div>
              <div className="playlist-duration">
                {formatTime(item.metadata.duration)}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="audio-controls">

      {playlist[currentTrackIndex] && (
  <div className="crt-playing">
    <div className="crt-item-info">
      {playlist[currentTrackIndex].coverImage ? (
        <img
          src={playlist[currentTrackIndex].coverImage}
          alt={`Cover for ${playlist[currentTrackIndex].name}`}
          className="crt-item-cover"
          onError={(e) => {
            // Handle error in loading cover image, show defaultCoverImage
            e.target.src = defaultCoverImage;
          }}
        />
      ) : (
        <img
          src={defaultCoverImage}
          alt={`Default Cover for ${playlist[currentTrackIndex].name}`}
          className="playlist-item-cover"
        />
      )}
      <div className="title">{removeFileExtension(playlist[currentTrackIndex].name)}</div>
    </div>
  </div>
)}
        <audio ref={audioRef} controls onEnded={handleAudioEnded} />
      </div>
    </div>
  );
};

Playlist.propTypes = {
  playlist: PropTypes.array.isRequired, 
  onPlay: PropTypes.func.isRequired,
  currentTrackIndex: PropTypes.number.isRequired,
  setCurrentTrack: PropTypes.func.isRequired,
};


export default Playlist;
