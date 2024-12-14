"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";
import axios from "axios";
import Head from "next/head";

export default function HomePage() {
  const [hasCode, setHasCode] = useState(false);
  const [token, setToken] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [artists, setArtists] = useState([]);

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
      const response = await axios.get(`/api/getToken?code=${code}`);
      const accessToken = response.data.access_token;
      setToken(accessToken);
      fetchUserData(accessToken);
    } catch (error) {
      if (error.response && error.response.status === 403) {
        window.location.href = process.env.NEXT_PUBLIC_REDIRECT_URI;
      } else {
        console.error("Error fetching the token", error);
      }
    }
  };

  const fetchUserData = async (accessToken) => {
    try {
      const headers = {
        Authorization: `Bearer ${accessToken}`,
      };
      const [responseTracks, responseArtists] = await Promise.all([
        axios.get("https://api.spotify.com/v1/me/top/tracks", { headers }),
        axios.get("https://api.spotify.com/v1/me/top/artists", { headers }),
      ]);

      setTracks(responseTracks.data.items);
      setArtists(responseArtists.data.items);
      console.log(responseTracks.data.items);
    } catch (error) {
      console.error("Error fetching the top tracks", error);
    }
  };

  const handleLogin = () => {
    window.location.href = `https://accounts.spotify.com/authorize?client_id=${process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID}&response_type=code&redirect_uri=${process.env.NEXT_PUBLIC_REDIRECT_URI}&scope=user-top-read`;
  };

  return (
    <>
      <Head>
        <title>Spotres</title>
      </Head>
      <div className={styles.page}>
        <h1>Spotres</h1> {}
        {hasCode ? (
          tracks.length > 0 ? (
            <div>
              <ol>
                {" "}
                {tracks.map((track) => (
                  <li key={track.id}>
                    <span>{track.name}</span>
                    <span>
                      {track.artists.map((artist) => artist.name).join(", ")}
                    </span>
                    <span>{'Popularity: '+track.popularity}</span>
                  </li>
                ))}{" "}
              </ol>
              <ol>
                {" "}
                {artists.map((artist) => (
                  <li key={artist.id}>
                    {" "}
                    <span>{artist.name}</span>{" "}
                    <span>{"Popularity: " + artist.popularity}</span>{" "}
                  </li>
                ))}{" "}
              </ol>
            </div>
          ) : (
            <p>Validando código y obteniendo canciones...</p>
          )
        ) : (
          <button onClick={handleLogin}>Login</button>
        )}{" "}
      </div>
    </>
  );
}
