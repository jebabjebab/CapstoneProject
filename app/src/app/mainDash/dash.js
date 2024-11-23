"use client";
import Link from "next/link";
import axiosRes from "../lib/axios";
import { useEffect, useState } from "react";
import NotifModal from "../admin/modals/notifModal";
import ConfirmModal from "../admin/modals/confirmModal";
import { useRouter } from "next/navigation";

export default function MainDash() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [userName, setUserName] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [address, setAddress] = useState("");
  const [selectedLocation, setSelectedLocation] = useState({
    lat: null,
    lon: null,
  });
  const [notifModal, setNotifModal] = useState({
    display: false,
    message: "",
    title: "",
  });

  const [confirmModal, setConfirmModal] = useState({
    display: false,
    message: "",
    title: "",
  });

  const [isUnknownAddress, setIsUnknownAddress] = useState(true);

  const closeConfirmModal = () => {
    setConfirmModal({ display: false });
  };

  const handleConfirmLogout = () => {
    sessionStorage.clear();
    router.push("/");
  };

  const getSuggestions = (query) => {
    setAddress(query.target.value);
    if (!query.target.value) {
      setSuggestions([]);
      return;
    }

    const metroManilaBounds = "120.9066,14.4051,121.1165,14.7730";
    const apiUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      query.target.value
    )}&format=json&limit=5&viewbox=${metroManilaBounds}&bounded=1`;

    fetch(apiUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.text();
      })
      .then((text) => {
        try {
          const data = JSON.parse(text);
          const validSuggestions = data
            .filter((location) => location.lat && location.lon)
            .map((location) => {
              const addressParts = location.display_name.split(", ");
              // Extract and combine relevant parts of the address
              const name = addressParts[0];
              const street = addressParts.find(
                (part) =>
                  part.includes("Street") ||
                  part.includes("Road") ||
                  part.includes("Avenue")
              );
              const barangay = addressParts.find((part) =>
                part.includes("Barangay")
              );
              const city = addressParts.find(
                (part) =>
                  !part.includes("Barangay") &&
                  !part.includes("Street") &&
                  !part.includes("Road") &&
                  !part.includes("Avenue") &&
                  part !== name
              );
              const province = addressParts[addressParts.length - 2];

              const relevantParts = [
                name,
                street,
                barangay,
                city,
                province,
              ].filter(Boolean);
              return {
                ...location,
                display_name: relevantParts.join(", "),
              };
            });

          // If no valid suggestions, add user input as a suggestion
          // if (validSuggestions.length === 0) {
          //   validSuggestions.push({
          //     display_name: query.target.value,
          //     lat: null,
          //     lon: null,
          //   });
          // }

          setSuggestions(validSuggestions);
        } catch (error) {
          // console.error("Error parsing JSON:", error);
          // console.log("Raw API response:", text);
          setSuggestions([]);
        }
      })
      .catch((error) => {
        // console.error("Error fetching location suggestions:", error);
        setSuggestions([]);
      });
  };

  const handleSuggestionSelect = (suggestion) => {
    setSuggestions([]);
    setSelectedLocation({
      lat: suggestion.lat,
      lon: suggestion.lon,
    });
    setIsUnknownAddress(false);
    // console.log(suggestion.display_name, suggestion.lat, suggestion.lon);
    updateUserAddress(suggestion.display_name, suggestion.lat, suggestion.lon);
    sessionStorage.setItem("address", suggestion.display_name);
    sessionStorage.setItem("latitude", suggestion.lat);
    sessionStorage.setItem("longitude", suggestion.lon);
    setAddress(sessionStorage.getItem("address"));
  };

  const closeNotifModal = () => {
    setNotifModal({
      display: false,
      message: "",
      title: "",
    });
  };

  const updateUserAddress = (newAddress, latitude, longitude) => {
    if (!userId) {
      // console.error("User ID is not available");
      return;
    }

    axiosRes
      .post(
        `/update-address/${userId}`,
        {
          address: newAddress,
          latitude: latitude,
          longitude: longitude,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
      .then((response) => {
        setNotifModal({
          display: true,
          message: "Your location has been updated successfully!",
          title: "Hello, " + userName + "!",
        });

        // Set a timeout to close the modal after 5 seconds
        setTimeout(() => {
          closeNotifModal();
        }, 5000);
      })
      .catch((error) => {
        // console.error(
        //   "Error updating address:",
        //   error.response?.data || error.message
        // );
      });
  };

  const handleLogout = () => {
    setConfirmModal({
      display: true,
      message: "Are you sure you want to logout?",
      title: "Hello, " + userName + "!",
    });
  };

  const getStarted = () => {
    if (address) {
      if (isUnknownAddress) {
        updateUserAddress(address, null, null);
        sessionStorage.setItem("address", address);
        router.push("/chatbot");
        // alert("Address is unknown!");
        return;
      }
      router.push("/chatbot");
    } else {
      setNotifModal({
        display: true,
        message: "Please set your location first!",
        title: "Hello, " + userName + "!",
      });
    }
  };

  useEffect(() => {
    // Get username
    const storedUserName = sessionStorage.getItem("username");
    if (storedUserName) {
      setUserId(sessionStorage.getItem("userId"));
      setUserName(storedUserName.toUpperCase());
    }

    if (sessionStorage.getItem("address")) {
      setAddress(sessionStorage.getItem("address"));
    }
  }, []);

  return (
    <main>
      <div
        className="container-xxl pb-2 d-flex flex-column"
        style={{ height: "100dvh", maxHeight: "100dvh" }}
      >
        {/* nav */}
        <nav className="navbar navbar-expand-md navbar-light">
          <div className="container-xxl">
            <Link href="/mainDash" className="navbar-brand mt-1">
              <img
                src="/Materials/DermaServTech Logo/logo4.png"
                alt="Derma Logo"
                width="50"
                height="50"
              />
              <span className="fw-bold ms-2">DermaServTech</span>
            </Link>

            {/* toggle button for mobile nav (burger menu) */}
            <button
              className="navbar-toggler bg-warning"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#main-nav"
              aria-controls="main-nav"
              aria-expanded="false"
              aria-label="Toggle Navigation"
            >
              <span className="navbar-toggler-icon icon-white"></span>
            </button>

            <div
              className="collapse navbar-collapse justify-content-end align-center"
              id="main-nav"
            >
              <ul className="navbar-nav mt-1 justify-content-end align-items-center">
                <li className="nav-item mb-1">
                  {/* Display the user's name */}
                  <span className="me-3 text-muted fw-medium">
                    Hello, <strong>{userName}</strong>!
                  </span>
                </li>
                <li className="nav-item mb-1">
                  <div className="me-3">
                    <div className="input-group border border-2 rounded-3 bg-white">
                      <span className="input-group-text bg-white border-0 rounded-3 text-muted">
                        <i className="bi bi-geo-alt"></i>
                      </span>
                      <div style={{ position: "relative" }}>
                        <input
                          type="text"
                          className="focus form-control border-0 no-outline text-muted rounded-3"
                          placeholder="Set your location here ..."
                          aria-label="Location"
                          aria-describedby="basic-addon1"
                          onChange={(e) => getSuggestions(e)}
                          autoComplete="off"
                          onPaste={(e) => e.preventDefault()}
                          value={address}
                        />
                        {suggestions.length > 0 && (
                          <ul
                            className="suggestions-list"
                            style={{
                              position: "absolute",
                              width: "100%",
                              maxHeight: "200px",
                              overflowY: "auto",
                              zIndex: 1000,
                              backgroundColor: "white",
                              border: "1px solid #ccc",
                              borderRadius: "0 0 4px 4px",
                              listStyleType: "none",
                              padding: 0,
                              margin: 0,
                            }}
                          >
                            {suggestions.map((suggestion, index) => (
                              <li
                                key={index}
                                onClick={() =>
                                  handleSuggestionSelect(suggestion)
                                }
                                style={{
                                  padding: "8px",
                                  cursor: "pointer",
                                  borderBottom: "1px solid #eee",
                                }}
                              >
                                {suggestion.display_name}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                </li>

                <li className="nav-item mb-1">
                  <button
                    className="btn btn-warning me-3 text-white fw-medium"
                    onClick={handleLogout}
                  >
                    <i className="bi bi-box-arrow-right"></i>
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </nav>

        {/* Intro text and image */}
        <div
          className="container-xl mt-5 mainContainer align-self-center mb-5 pb-5 d-flex align-items-center"
          style={{ flex: 1 }}
        >
          <div className="row justify-content-center align-items-center w-100">
            <div className="col-md-6">
              <h1 className="mt-4">
                <div className="display-2">Find Your</div>
                <div className="display-5 fw-bold">Perfect DermaClinic</div>
                <div
                  className="border border-2 border-warning mx-auto"
                  style={{ width: "50%" }}
                ></div>
              </h1>
              <p className="lead my-4 text-muted">
                Services aimed to help users find a guaranteed best clinic for
                their dermatology needs.
              </p>
              <button
                className="btn btn-warning btn-md text-white fw-medium"
                onClick={getStarted}
              >
                GET STARTED
              </button>
            </div>
            <div className="col-md-6 text-center d-none d-md-block">
              <img
                className="img-fluid mainImg rounded-circle "
                src="/Materials/lady.png"
                alt="doctor"
              />
            </div>
          </div>
        </div>
      </div>
      <NotifModal
        display={notifModal.display}
        message={notifModal.message}
        title={notifModal.title}
        onClose={closeNotifModal}
      />

      <ConfirmModal
        display={confirmModal.display}
        message={confirmModal.message}
        title={confirmModal.title}
        onClose={closeConfirmModal}
        onConfirm={handleConfirmLogout}
      />
    </main>
  );
}
