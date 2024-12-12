"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import axios from "axios";

export default function HomePage() {
  const router = useRouter();
  const [hasCode, setHasCode] = useState(false);
  const [token, setToken] = useState(null);
  const [tracks, setTracks] = useState([]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    if (code) {
      setHasCode(true);
      fetchToken(code);
    }
  }, []);

  const fetchToken = async (code) => {
    try {
      const response = await axios.post(
        "https://accounts.spotify.com/api/token",
        null,
        {
          params: {
            grant_type: "authorization_code",
            code: code,
            redirect_uri: "http://localhost:3000",
            client_id: "72a784c03ba44304b249998a5ac3e899",
            client_secret: "92b7aeeb47d0474ba73d5a186451358b",
          },
        }
      );
      setToken(response.data.access_token);
      fetchTopTracks(response.data.access_token);
    } catch (error) {
      console.log("Error fetching token", error);
    }
  };

  const fetchTopTracks = async (accessToken) => {
    try {
      const response = await axios.get(
        "https://api.spotify.com/v1/me/top/tracks",
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setTracks(response.data.items);
    } catch (error) {
      console.error("Error fetching the top tracks", error);
    }
  };

  const handleLogin = () => {
    window.location.href =
      "https://accounts.spotify.com/authorize?client_id=72a784c03ba44304b249998a5ac3e899&response_type=code&redirect_uri=http://localhost:3000&scope=user-top-read";
  };

  return (
    <div>
      {" "}
      <h1>Bienvenido a mi aplicación Next.js</h1>{" "}
      {hasCode ? (
        tracks.length > 0 ? (
          <ul>
            {" "}
            {tracks.map((track) => (
              <li key={track.id}>
                {" "}
                {track.name} by{" "}
                {track.artists.map((artist) => artist.name).join(", ")}{" "}
              </li>
            ))}{" "}
          </ul>
        ) : (
          <p>Validando código y obteniendo canciones...</p>
        )
      ) : (
        <button onClick={handleLogin}>Login</button>
      )}{" "}
    </div>
  );
}
