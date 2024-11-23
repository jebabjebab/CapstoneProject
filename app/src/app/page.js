"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import axiosRes from "./lib/axios";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./styles/custom.scss";
import ErrorModal from "./modalComponents/errorModal";
import NotifModal from "./modalComponents/notifModal";
import { useRouter } from "next/navigation";

//client-side only component
const ClientSideHome = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [errorModal, setErrorModal] = useState({
    display: false,
    message: "",
    title: "",
  });
  const [notifModal, setNotifModal] = useState({
    display: false,
    message: "",
    title: "",
  });

  const [isEnable, setIsEnable] = useState(false);

  const emailValueSet = (event) => {
    setEmail(event.target.value);
  };

  const passValueSet = (event) => {
    setPass(event.target.value);
  };

  const handleNotifClose = () => {
    setNotifModal({ display: false });
  };

  const handleErrorClose = () => {
    setErrorModal({ display: false });
  };

  const handleLogin = async () => {
    try {
      const response = await axiosRes.post("/login", {
        email: email,
        password: pass,
      });

      // Fetch user data from the API
      const { id, username, email: userEmail } = response.data.user;

      sessionStorage.setItem("userId", id);
      sessionStorage.setItem("username", username);
      sessionStorage.setItem("email", userEmail);

      setNotifModal({
        display: true,
        message: "You have successfully logged in!. Please wait for a moment.",
        title: "Welcome, " + username + "!",
      });

      setIsEnable(true);

      setTimeout(() => {
        // Check if the user input ay para sa admin
        if (email == "admin@mail.com" && pass == "$admin123") {
          sessionStorage.setItem("isAdmin", true);
          router.push("/admin");
        } else {
          sessionStorage.setItem("isAdmin", false);
          router.push("/mainDash");
        }
        setNotifModal({ display: false });
      }, 10000);
    } catch (error) {
      // console.error("Error logging in:", error.response?.data || error.message);
      setErrorModal({
        display: true,
        message: "Email and Password did not match. Please try again.",
        title: "Login Failed",
      });
    }
  };

  useEffect(() => {
    const email = sessionStorage.getItem("email");
    if (email) {
      setEmail(email);
    }
  }, []);

  return (
    <main className="container-lg d-flex justify-content-center align-items-center vh-100">
      <div className="container d-flex justify-content-center align-items-center">
        <div className="login-card card px-4 border-3 border-warning rounded-5 shadow-lg bg-white">
          <div className="card-body text-center">
            <form
              className="form"
              onSubmit={(e) => {
                e.preventDefault();
                handleLogin();
              }}
            >
              <div className="mb-3">
                <img
                  src="/Materials/DermaServTech Logo/logo4.png"
                  alt="Logo"
                  className="card-img img-fluid logo"
                />
                <small className="fw-normal fs-5">Clinic Recommendation</small>
              </div>
              <div className="mb-3">
                <input
                  type="email"
                  className="input-wd form-control border-1 border-warning rounded-4 text-muted"
                  id="email"
                  placeholder="Email"
                  value={email}
                  onChange={emailValueSet}
                  required
                />
              </div>
              <div className="mb-3 input-group">
                <input
                  type="password"
                  className="input-wd form-control border-1 border-warning rounded-4 text-muted"
                  id="password"
                  placeholder="Password"
                  value={pass}
                  onChange={passValueSet}
                  required
                />
              </div>
              <div className="mb-3">
                <small className="text-muted">
                  Don't have an account?
                  {!isEnable ? (
                    <Link className="link-warning" href="/signup">
                      Sign Up
                    </Link>
                  ) : (
                    <span className="link-warning text-muted">Sign Up</span>
                  )}
                </small>
              </div>
              <div>
                <button
                  type="submit"
                  className="input-wd btn btn-warning text-white rounded-4 border shadow"
                  id="loginButton"
                  disabled={isEnable}
                >
                  Login
                </button>

                <small className="text-muted mt-1">
                  {!isEnable ? (
                    <Link
                      className="link-warning"
                      href="/signup/confirm"
                      passHref
                    >
                      Forgot password?
                    </Link>
                  ) : (
                    <span className="link-warning text-muted">
                      Forgot password?
                    </span>
                  )}
                </small>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* Modal */}
      {/* <div
        className={`modal fade ${showModal ? "show" : ""}`}
        style={{ display: showModal ? "block" : "none" }}
        aria-labelledby="staticBackdropLabel"
        aria-hidden={!showModal}
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content text-center">
            <div className="modal-header">
              <h5 className="modal-title" id="staticBackdropLabel">
                Login Status
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowModal(false)}
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">{modalMessage}</div>
            <div className="modal-footer justify-content-center align-items-center">
              <button
                type="button"
                className="btn btn-warning text-white"
                onClick={() => {
                  setShowModal(false);
                }}
              >
                Okay
              </button>
            </div>
          </div>
        </div>
      </div> */}

      <ErrorModal
        display={errorModal.display}
        message={errorModal.message}
        title={errorModal.title}
        onClose={handleErrorClose}
      />
      <NotifModal
        display={notifModal.display}
        message={notifModal.message}
        title={notifModal.title}
        onClose={handleNotifClose}
      />
    </main>
  );
};

// Main component
export default function Home() {
  return <ClientSideHome />;
}
