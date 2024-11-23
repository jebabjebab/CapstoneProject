"use client";
import Link from "next/link";
import { useState } from "react";
import axiosRes from "../lib/axios";
import ErrorModal from "../modalComponents/errorModal";
import NotifModal from "../modalComponents/notifModal";
import { useRouter } from 'next/navigation';

export default function Signup() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

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

  const handleNotifClose = () => {
    setNotifModal({ display: false });
  };

  const handleErrorClose = () => {
    setErrorModal({ display: false });
  };

  const handleChange = (e) => {
    const { name, value } = e.target; 
    setFormData({ ...formData, [name]: value }); 
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axiosRes.post('/signup', formData);
      setNotifModal({
        display: true,
        message: "You have successfully signed up! You can now log in. Please wait for a moment.",
        title: "Welcome, " + formData.username + "!",
      });

      sessionStorage.setItem("email", formData.email);

      setTimeout(() => {
        router.push('/');
        setNotifModal({ display: false });
      }, 3000);
    } catch (error) {
      // console.error('Error signing up:', error.response?.data);
      let errorMessage = "Oops! Something went wrong. Please try again.";

      if (error.response) {
        if (error.response.status === 400) {
          if (error.response.data && error.response.data.password) {
            errorMessage = error.response.data.password[0];
          } else {
            errorMessage = error.response?.data?.message || "Invalid input. Please check your information and try again.";
          }
        } else if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.request) {
        errorMessage = "No response received from the server. Please check your internet connection and try again.";
      } else {
        errorMessage = error.message || errorMessage;
      }

      setErrorModal({
        display: true,
        message: errorMessage,
        title: "Hello " + formData.username + "!",
      });
    }
  };

  const router = useRouter();

  // Signup
  return (
    <main className="container-lg d-flex justify-content-center align-items-center vh-100">
      <div className="login-card card px-4 border-3 border-warning rounded-5 shadow-lg bg-white">
        <div className="card-body text-center">
          <div className="mb-3">
            <img
              src="/Materials/DermaServTech Logo/logo4.png"
              alt="Logo"
              className="card-img img-fluid logo"
            />
            <small className="fw-normal fs-5">Clinic Recommendation</small>
          </div>
          <form className="form" onSubmit={handleSubmit}>
            <div className="mb-3">
              <input
                type="text"
                className="input-wd form-control border-1 border-warning rounded-4 text-muted"
                name="username"
                placeholder="Username"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-3">
              <input
                type="email"
                className="input-wd form-control border-1 border-warning rounded-4 text-muted"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-3 input-group">
              <input
                type="password"
                className="input-wd form-control border-1 border-warning rounded-4 text-muted"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-3">
              <small className="text-muted">
                Already have an account?
                <Link className="link-warning" href="/">
                  Login
                </Link>
              </small>
            </div>
            <button
              type="submit"
              className="input-wd btn btn-warning text-white rounded-4 border shadow"
            >
              Sign Up
            </button>
          </form>
        </div>
      </div>
      {/* modal */}
      {/* {showModal && (
        <div
          className="modal fade show"
          style={{ display: 'block' }}
          aria-labelledby="staticBackdropLabel"
          aria-hidden="true"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content text-center">
              <div className="modal-header">
                <h5 className="modal-title" id="staticBackdropLabel">
                  Status
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
                <Link className="text-decoratio-none text-white" href="/">
                  <button
                    type="button"
                    className="btn btn-warning text-white"
                    onClick={() => setShowModal(false)}
                  >
                    Okay
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )} */}

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
}
