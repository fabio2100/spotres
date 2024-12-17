"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";
import axios from "axios";
import Head from "next/head";

export default function HomePage() {
  const [hasCode, setHasCode] = useState(false);
  const [userData, setUserData] = useState({
    tracksMedium: [],
    tracksShort: [],
    tracksLong: [],
    artistsMedium: [],
    artistsShort: [],
    artistsLong: [],
  });

  const updateUserData = (key, value) => {
    setUserData((prevState) => ({
      ...prevState,
      [key]: value,
    }));
  };

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
      const promises = [
        {
          id: "tracksMedium",
          promise: axios.get(
            "https://api.spotify.com/v1/me/top/tracks?limit=50",
            {
              headers,
            }
          ),
        },
        {
          id: "tracksLong",
          promise: axios.get(
            "https://api.spotify.com/v1/me/top/tracks?time_range=long_term&limit=50",
            { headers }
          ),
        },
        {
          id: "tracksShort",
          promise: axios.get(
            "https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=50",
            { headers }
          ),
        },
        {
          id: "artistsMedium",
          promise: axios.get(
            "https://api.spotify.com/v1/me/top/artists?limit=50",
            {
              headers,
            }
          ),
        },
        {
          id: "artistsLong",
          promise: axios.get(
            "https://api.spotify.com/v1/me/top/artists?time_range=long_term&limit=50",
            { headers }
          ),
        },
        {
          id: "artistsShort",
          promise: axios.get(
            "https://api.spotify.com/v1/me/top/artists?time_range=short_term&limit=50",
            { headers }
          ),
        },
      ];

      const promisesArray = promises.map((p) => p.promise);

      Promise.allSettled(promisesArray).then((results) => {
        results.forEach((result, index) => {
          const promiseId = promises[index].id;

          if (result.status === "fulfilled") {
            updateUserData(promiseId, result.value.data.items);
          } else if (result.status === "rejected") {
            console.error(`Promesa ${promiseId} rechazada:`, result.reason);
          }
        });
      });
    } catch (error) {
      console.error("Error fetching the top tracks", error);
    }
  };

  const handleLogin = () => {
    window.location.href = `https://accounts.spotify.com/authorize?client_id=${process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID}&response_type=code&redirect_uri=${process.env.NEXT_PUBLIC_REDIRECT_URI}&scope=user-top-read`;
  };

  const renderList = (title, data, isTrack = true) => (
    <div>
      <div className="title-section">{title}</div>
      <ol>
        {data.map((item) => (
          <li key={item.id}>
            <span>{item.name}</span>
            {isTrack ? (
              <span>
                {item.artists.map((artist) => artist.name).join(", ")}
              </span>
            ) : null}
            <span>{"Popularity: " + item.popularity}</span>
          </li>
        ))}
      </ol>
    </div>
  );

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
              {renderList(
                "Canciones - Últimas 4 semanas",
                userData.tracksShort
              )}{" "}
              {renderList("Canciones - Últimos 6 meses", userData.tracksMedium)}{" "}
              {renderList("Canciones - Último año", userData.tracksLong)}{" "}
              {renderList(
                "Artistas - Últimas 4 semanas",
                userData.artistsShort,
                false
              )}{" "}
              {renderList(
                "Artistas - Últimos 6 meses",
                userData.artistsMedium,
                false
              )}{" "}
              {renderList("Artistas - Último año", userData.artistsLong, false)}
            </div>
          ) : (
            <p>Validando código y obteniendo canciones...</p>
          )
        ) : (
          <button onClick={handleLogin} className="custom-button">
            <span className="button-text">SIGN WITH </span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 496 512">
              <path
                fill="#1ed760"
                d="M248 8C111.1 8 0 119.1 0 256s111.1 248 248 248 248-111.1 248-248S384.9 8 248 8Z"
              />
              <path d="M406.6 231.1c-5.2 0-8.4-1.3-12.9-3.9-71.2-42.5-198.5-52.7-280.9-29.7-3.6 1-8.1 2.6-12.9 2.6-13.2 0-23.3-10.3-23.3-23.6 0-13.6 8.4-21.3 17.4-23.9 35.2-10.3 74.6-15.2 117.5-15.2 73 0 149.5 15.2 205.4 47.8 7.8 4.5 12.9 10.7 12.9 22.6 0 13.6-11 23.3-23.2 23.3zm-31 76.2c-5.2 0-8.7-2.3-12.3-4.2-62.5-37-155.7-51.9-238.6-29.4-4.8 1.3-7.4 2.6-11.9 2.6-10.7 0-19.4-8.7-19.4-19.4s5.2-17.8 15.5-20.7c27.8-7.8 56.2-13.6 97.8-13.6 64.9 0 127.6 16.1 177 45.5 8.1 4.8 11.3 11 11.3 19.7-.1 10.8-8.5 19.5-19.4 19.5zm-26.9 65.6c-4.2 0-6.8-1.3-10.7-3.6-62.4-37.6-135-39.2-206.7-24.5-3.9 1-9 2.6-11.9 2.6-9.7 0-15.8-7.7-15.8-15.8 0-10.3 6.1-15.2 13.6-16.8 81.9-18.1 165.6-16.5 237 26.2 6.1 3.9 9.7 7.4 9.7 16.5s-7.1 15.4-15.2 15.4z" />
            </svg>
          </button>
        )}{" "}
      </div>
    </>
  );
}
