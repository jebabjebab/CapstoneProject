"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import axiosRes from "@/app/lib/axios";
import ErrorModal from "../modals/errorModal";
import NotifModal from "../modals/notifModal";

export default function Reset() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");

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

  useEffect(() => {
    setEmail(sessionStorage.getItem("email"));
    setOtp(sessionStorage.getItem("otp"));

    // console.log("Email:", setEmail);
    // console.log("OTP:", setOtp);
  }, []);

  const handleSubmit = async () => {
    if (password !== confirmPassword) {
      // setModalMessage("Passwords do not match.");
      // setShowModal(true);
      setErrorModal({
        display: true,
        message: "The passwords you entered do not match.",
        title: "Hello user!",
      });
      return;
    }

    try {
      const response = await axiosRes.post(
        "/reset-password",
        {
          email,
          otp,
          password,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      // setModalMessage(response.data.message || "Password reset successfully.");
      // setShowModal(true);
      setNotifModal({
        display: true,
        message:
          "Your password has been reset successfully. You can now login. Please wait a moment.",
        title: "Hello user!",
      });

      setTimeout(() => {
        window.location.href = "/";
      }, 3000);
    } catch (error) {
      let errorMessage = "There was an error resetting your password. Please try again later.";
      let errorTitle = "Error";

      if (error.response) {
        if (error.response.status === 422) {
          errorMessage = error.response.data.message || "Invalid input. Please check your information and try again.";
        } else {
          errorMessage = error.response.data.message || errorMessage;
        }
      }

      setErrorModal({
        display: true,
        message: errorMessage,
        title: "Hello user!",
      });
    }
  };

  return (
    <main className="container-lg d-flex justify-content-center align-items-center vh-100">
      <div className="login-card card px-4 border-3 border-warning rounded-5 shadow-lg bg-white">
        <div className="card-body text-center">
          <form className="form" onSubmit={(e) => e.preventDefault()}>
            <div className="mb-3">
              <img
                src="/Materials/DermaServTech Logo/logo4.png"
                alt="Logo"
                className="card-img img-fluid logo"
              />
            </div>
            <p className="card-text p-2 mb-1 fw-bold text-warning">
              Reset Password
            </p>
            <div className="mb-3">
              <input
                type="password"
                className="input-wd form-control border-1 border-warning rounded-4 text-muted"
                id="password"
                placeholder="New Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="mb-3 input-group">
              <input
                type="password"
                className="input-wd form-control border-1 border-warning rounded-4 text-muted"
                id="confirm-password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <div className="mb-3">
              <small className="text-muted">
                Enter the same password in both fields
              </small>
            </div>
            <div className="mb-3">
              <button
                type="button"
                className="input-wd btn btn-warning text-white rounded-4 border shadow"
                onClick={handleSubmit}
              >
                Submit
              </button>
            </div>
          </form>
        </div>
      </div>
      {/* Modal for displaying messages */}
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
                <h5 className="modal-title" id="staticBackdropLabel">Message</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">{modalMessage}</div>
              <div className="modal-footer justify-content-center align-items-center">
                <Link className="text-decoration-none text-white" href="/">
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
