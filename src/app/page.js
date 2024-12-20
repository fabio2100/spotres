"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";
import axios from "axios";
import Head from "next/head";
import ListCustomItem from "./components/ListCustomItem";
import List from "@mui/material/List";
import { CircularProgress } from "@mui/material";

export default function HomePage() {
  const [hasCode, setHasCode] = useState(false);
  const [userData, setUserData] = useState({
    tracksMedium: [],
    tracksShort: [],
    tracksLong: [],
    artistsMedium: [],
    artistsShort: [],
    artistsLong: [],
    userEmail: null,
  });
  const [selectedList, setSelectedList] = useState("tracksShort");
  const [isUserDataUpdated, setIsUserDataUpdated] = useState(false);
  const [userDataOld, setUserDataOld] = useState(null);
  const [positionChanges, setPositionChanges] = useState({});
  const [mustUpdateDB, setMustUpdateDB] = useState(false);
  const [isNewUser,setIsNewUser] = useState(false);

  const updateUserData = (key, value) => {
    setUserData((prevState) => ({
      ...prevState,
      [key]: value,
    }));
  };

  const processUserData = (userData) => {
    const { userEmail, ...restUserData } = userData;
    const filteredUserData = Object.keys(restUserData).reduce((acc, key) => {
      acc[key] = restUserData[key].map((item) => item.id);
      return acc;
    }, {});
    return { userEmail, filteredUserData };
  };

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
          url: `https://api.spotify.com/v1/me/top/tracks?limit=${process.env.NEXT_PUBLIC_CANTIDAD_SEARCH}`,
        },
        {
          id: "tracksLong",
          url: `https://api.spotify.com/v1/me/top/tracks?time_range=long_term&limit=${process.env.NEXT_PUBLIC_CANTIDAD_SEARCH}`,
        },
        {
          id: "tracksShort",
          url: `https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=${process.env.NEXT_PUBLIC_CANTIDAD_SEARCH}`,
        },
        {
          id: "artistsMedium",
          url: `https://api.spotify.com/v1/me/top/artists?limit=${process.env.NEXT_PUBLIC_CANTIDAD_SEARCH}`,
        },
        {
          id: "artistsLong",
          url: `https://api.spotify.com/v1/me/top/artists?time_range=long_term&limit=${process.env.NEXT_PUBLIC_CANTIDAD_SEARCH}`,
        },
        {
          id: "artistsShort",
          url: `https://api.spotify.com/v1/me/top/artists?time_range=short_term&limit=${process.env.NEXT_PUBLIC_CANTIDAD_SEARCH}`,
        },
        {
          id: "userEmail",
          url: "https://api.spotify.com/v1/me",
        },
      ];

      const fetchPromises = promises.map((p) =>
        axios
          .get(p.url, { headers })
          .then((response) => ({ id: p.id, data: response.data }))
      );

      const results = await Promise.allSettled(fetchPromises);

      results.forEach((result) => {
        if (result.status === "fulfilled") {
          const { id, data } = result.value;
          updateUserData(id, id === "userEmail" ? data.email : data.items);
        } else if (result.status === "rejected") {
          console.error(
            `Promise ${result.reason.config.url} rejected:`,
            result.reason
          );
        }
      });

      setIsUserDataUpdated(true);
    } catch (error) {
      console.error("Error fetching the top tracks", error);
    }
  };

  const comparePositions = (oldArray, newArray) => {
    return newArray.map((id) => {
      const oldIndex = oldArray.indexOf(id);
      if (oldIndex === -1) return { id, change: "Nuevo" };
      const newIndex = newArray.indexOf(id);
      return { id, change: oldIndex - newIndex };
    });
  };

  const compareAllPositions = (userDataOld, filteredUserData) => {
    return Object.keys(filteredUserData).reduce((acc, key) => {
      if (userDataOld[key]) {
        acc[key] = comparePositions(userDataOld[key], filteredUserData[key]);
      }
      return acc;
    }, {});
  };

  const updateDB = async (userData) => {
    const { userEmail, filteredUserData } = processUserData(userData);
    try {
      await axios.post("/api/updateDB", {
        userEmail,
        userData: filteredUserData,
      });
      console.log("Database updated successfully");
    } catch (error) {
      console.error("Error updating the database", error);
    }
  };

  useEffect(() => {
    if (isUserDataUpdated) {
      const { userEmail } = userData;
      axios
        .get(`/api/getUserTracks?email=${userEmail}`)
        .then((response) => {
          setUserDataOld(response.data.userData);
          setMustUpdateDB(response.data.actualizar);
        })
        .catch(() => {
          updateDB(userData);
          setIsNewUser(true);
        });
    }
  }, [isUserDataUpdated, userData]);

  useEffect(() => {
    if (userDataOld && isUserDataUpdated) {
      const { filteredUserData } = processUserData(userData);
      const positionChangesA = compareAllPositions(
        userDataOld,
        filteredUserData
      );
      setPositionChanges(positionChangesA);
      if (mustUpdateDB) {
        updateDB(userData);
      }
    }
  }, [userDataOld, isUserDataUpdated]);

  const handleLogin = () => {
    window.location.href = `https://accounts.spotify.com/authorize?client_id=${process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID}&response_type=code&redirect_uri=${process.env.NEXT_PUBLIC_REDIRECT_URI}&scope=user-top-read%20user-read-email`;
  };

  const handleLogout = () => {
    window.location.href = process.env.NEXT_PUBLIC_REDIRECT_URI;
  };

  const handleButtonClick = (list) => {
    setSelectedList(list);
  };

  const renderList = (title, data, isTrack = true, positionChanges = {}) => {
    return (
      <>
        <div className="title-section">{title}</div>
        <List dense={true}>
          {(positionChanges.length > 0 || isNewUser) &&
            data.map((item,index) => {
              const found = positionChanges.length > 0 ? positionChanges.find(
                (element) => element.id === item.id
              ):false;
              const change = found.change;
              return (
                <ListCustomItem
                  key={item.id}
                  title={item.name}
                  content={
                    isTrack
                      ? item.artists.map((artist) => artist.name).join(", ")
                      : ""
                  }
                  image={item.image}
                  change={change}
                  index={index}
                />
              );
            })}
        </List>
      </>
    );
  };

  const renderSelectedList = () => {
    switch (selectedList) {
      case "tracksShort":
        return renderList(
          "Canciones - Últimas 4 semanas",
          userData.tracksShort,
          true,
          positionChanges.tracksShort
        );
      case "tracksMedium":
        return renderList(
          "Canciones - Últimos 6 meses",
          userData.tracksMedium,
          true,
          positionChanges.tracksMedium
        );
      case "tracksLong":
        return renderList(
          "Canciones - Último año",
          userData.tracksLong,
          true,
          positionChanges.tracksLong
        );
      case "artistsShort":
        return renderList(
          "Artistas - Últimas 4 semanas",
          userData.artistsShort,
          false,
          positionChanges.artistsShort
        );
      case "artistsMedium":
        return renderList(
          "Artistas - Últimos 6 meses",
          userData.artistsMedium,
          false,
          positionChanges.artistsMedium
        );
      case "artistsLong":
        return renderList(
          "Artistas - Último año",
          userData.artistsLong,
          false,
          positionChanges.artistsLong
        );
      default:
        return null;
    }
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    if (code) {
      setHasCode(true);
      fetchToken(code);
    }
  }, []);

  return (
    <>
      <Head>
        <title>Spotres</title>
      </Head>
      <div className={styles.page}>
        <div className="header">
          <h1 className="title">Spotres</h1>
          {hasCode && (
            <p className="logout" onClick={handleLogout}>
              Logout
            </p>
          )}
        </div>
        {hasCode ? (
          userData.tracksMedium.length > 0 ? (
            <>
              <div className="button-group">
                {[
                  { id: "tracksShort", label: "Canciones - Últimas 4 semanas" },
                  { id: "tracksMedium", label: "Canciones - Últimos 6 meses" },
                  { id: "tracksLong", label: "Canciones - Último año" },
                  { id: "artistsShort", label: "Artistas - Últimas 4 semanas" },
                  { id: "artistsMedium", label: "Artistas - Últimos 6 meses" },
                  { id: "artistsLong", label: "Artistas - Último año" },
                ].map(({ id, label }) => (
                  <button
                    key={id}
                    className="btn-custom"
                    onClick={() => handleButtonClick(id)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="list-content">{renderSelectedList()}</div>
            </>
          ) : (
            <CircularProgress color="success" size="4rem"/>
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
        )}
      </div>
    </>
  );
}
