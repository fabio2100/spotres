"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";
import axios from "axios";
import Head from "next/head";

export default function HomePage() {
  const [hasCode, setHasCode] = useState(false);
  const [userData,setUserData] = useState({
    tracksMedium : [],
    tracksShort : [],
    tracksLong : [],
    artistsMedium : [],
    artistsShort : [],
    artistsLong : [],
  });

  const updateUserData = (key,value) => {
    setUserData((prevState)=>({
      ...prevState,
      [key]: value
    }))
  }

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
      const [
        responseTracks,
        responseTracksLongTerm,
        responseTracksShortTerm,
        responseArtists,
        responseArtistsLongTerm,
        responseArtistsShortTerm
      ] = await Promise.all([
        axios.get("https://api.spotify.com/v1/me/top/tracks?limit=50", { headers }),
        axios.get(
          "https://api.spotify.com/v1/me/top/tracks?time_range=long_term&limit=50",
          { headers }
        ),
        axios.get(
          "https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=50",
          { headers }
        ),
        axios.get("https://api.spotify.com/v1/me/top/artists?limit=50", { headers }),
        axios.get(
          "https://api.spotify.com/v1/me/top/artists?time_range=long_term&limit=50",
          { headers }
        ),
        axios.get(
          "https://api.spotify.com/v1/me/top/artists?time_range=short_term&limit=50",
          { headers }
        ),
      ]);

      setUserData({
        tracksMedium : responseTracks.data.items,
        tracksShort : responseTracksShortTerm.data.items,
        tracksLong : responseTracksLongTerm.data.items,
        artistsMedium : responseArtists.data.items,
        artistsShort : responseArtistsShortTerm.data.items,
        artistsLong : responseArtistsLongTerm.data.items,
      })
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
          userData.tracksMedium.length > 0 ? (
            <div>
              <div className="title-section">Canciones - Últimas 4 semanas</div>
              <ol>
                {" "}
                {userData.tracksShort.map((track) => (
                  <li key={track.id}>
                    <span>{track.name}</span>
                    <span>
                      {track.artists.map((artist) => artist.name).join(", ")}
                    </span>
                    <span>{"Popularity: " + track.popularity}</span>
                  </li>
                ))}{" "}
              </ol>
              <div className="title-section">Canciones - Últimos 6 meses</div>
              <ol>
                {" "}
                {userData.tracksMedium.map((track) => (
                  <li key={track.id}>
                    <span>{track.name}</span>
                    <span>
                      {track.artists.map((artist) => artist.name).join(", ")}
                    </span>
                    <span>{"Popularity: " + track.popularity}</span>
                  </li>
                ))}{" "}
              </ol>

              <div className="title-section">Canciones - Último año</div>
              <ol>
                {" "}
                {userData.tracksLong.map((track) => (
                  <li key={track.id}>
                    <span>{track.name}</span>
                    <span>
                      {track.artists.map((artist) => artist.name).join(", ")}
                    </span>
                    <span>{"Popularity: " + track.popularity}</span>
                  </li>
                ))}{" "}
              </ol>
              <div className="title-section">Artistas - Últimas 4 semanas</div>
              <ol>
                {" "}
                {userData.artistsShort.map((artist) => (
                  <li key={artist.id}>
                    {" "}
                    <span>{artist.name}</span>{" "}
                    <span>{"Popularity: " + artist.popularity}</span>{" "}
                  </li>
                ))}{" "}
              </ol>
              <div className="title-section">Artistas - Últimos 6 meses</div>
              <ol>
                {" "}
                {userData.artistsMedium.map((artist) => (
                  <li key={artist.id}>
                    {" "}
                    <span>{artist.name}</span>{" "}
                    <span>{"Popularity: " + artist.popularity}</span>{" "}
                  </li>
                ))}{" "}
              </ol>
              <div className="title-section">Artistas - Último año</div>
              <ol>
                {" "}
                {userData.artistsLong.map((artist) => (
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
