// eslint-disable-next-line no-unused-vars
import React, { useState, useRef, useEffect } from "react";
import Playlist from "./components/Playlist";
import localforage from "localforage";

const App = () => {
  const [playlist, setPlaylist] = useState([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const fileInputRef = useRef(null);

  const handlePlaylistItemClick = (item) => {
    const newIndex = playlist.findIndex((track) => track === item);
    setCurrentTrackIndex(newIndex);
  };

  const handleFileChange = async (e) => {
    const files = e.target.files;
    const newPlaylist = await Promise.all(
      Array.from(files).map(async (file) => {
        // Save the ArrayBuffer to localforage
        const arrayBuffer = await readAsArrayBufferAsync(file);
        await localforage.setItem(file.name, {
          arrayBuffer: arrayBuffer,
        });

        const src = URL.createObjectURL(
          new Blob([arrayBuffer], { type: file.type })
        );

        // Extract metadata and cover image from the stored audio file
        const metadata = await extractMetadata(arrayBuffer);
        const coverImage = await extractCoverImage(arrayBuffer);

        return {
          name: file.name,
          src: src,
          metadata: metadata,
          coverImage: coverImage,
        };
      })
    );
    setPlaylist(newPlaylist);
  };

  const extractMetadata = async (arrayBuffer) => {
    return new Promise((resolve) => {
      const audio = new Audio();
      audio.src = URL.createObjectURL(
        new Blob([arrayBuffer], { type: "audio/mpeg" })
      );

      audio.addEventListener("loadedmetadata", () => {
        const metadata = {
          duration: audio.duration,
          artist: "", // You can add more metadata fields as needed
        };

        resolve(metadata);
      });
    });
  };

  const extractCoverImage = async (arrayBuffer) => {
    const view = new DataView(arrayBuffer);

    let offset = 0;
    while (offset < view.byteLength) {
      if (
        view.getUint8(offset) === 0xff &&
        view.getUint8(offset + 1) === 0xd8
      ) {
        // Found the start of the JPEG image
        const blob = new Blob(
          [view.buffer.slice(offset, offset + view.byteLength)],
          {
            type: "image/jpeg",
          }
        );
        const imageUrl = URL.createObjectURL(blob);
        return imageUrl;
      } else {
        offset += 1;
      }
    }

    return null; // No cover image found
  };

  const readAsArrayBufferAsync = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        resolve(event.target.result);
      };
      reader.readAsArrayBuffer(file);
    });
  };

  const handleClearSongs = async () => {
    // Clear all stored items from localforage
    await localforage.clear();
    setPlaylist([]); // Clear the playlist in the state
  };



  useEffect(() => {
    const loadPlaylist = async () => {
      const keys = await localforage.keys();
      const newPlaylist = await Promise.all(
        keys.map(async (key) => {
          const storedData = await localforage.getItem(key);

          // No need to create a Blob and URL for the ArrayBuffer,
          // it can be used directly in the audio source
          const src = URL.createObjectURL(
            new Blob([storedData.arrayBuffer], { type: "audio/mpeg" })
          );

          // Extract metadata and cover image from the stored audio file
          const metadata = await extractMetadata(storedData.arrayBuffer);
          const coverImage = await extractCoverImage(storedData.arrayBuffer);

          return {
            name: key,
            src: src,
            metadata: metadata,
            coverImage: coverImage,
          };
        })
      );
      setPlaylist(newPlaylist);
    };

    loadPlaylist();
  }, []);

  return (
    <div className="main">
      <h1>Audio Player</h1>
      <div className="upload-section">
        <input
          type="file"
          accept="audio/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple
        />
        <button onClick={handleClearSongs} className="button rounded close" >Clear All Songs</button>
      </div>
      <Playlist
        playlist={playlist}
        onPlay={handlePlaylistItemClick}
        currentTrackIndex={currentTrackIndex}
        setCurrentTrack={setCurrentTrackIndex}
      />
    </div>
  );
};

export default App;
