"use client";
import { useState } from "react";
import axiosRes from "@/app/lib/axios";
import ErrorModal from "../modals/errorModal";
import NotifModal from "../modals/notifModal";
import Link from "next/link";

export default function Confirm() {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [otp, setOtp] = useState(new Array(4).fill(""));
  const [modalMessage, setModalMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);

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

  // Resend OTP
  const resendOtp = async () => {
    if (!email) {
      // setModalMessage("Email is required.");
      // setShowModal(true);

      setErrorModal({
        display: true,
        message: "Please enter your email first.",
        title: "Hello user!",
      });
      return;
    }

    try {
      const response = await axiosRes.post("/confirm-email", { email });
      setToken(response.data.token);
      // setModalMessage("OTP resent to your email.");
      // setShowModal(true);
      clearOtp(); // Reset OTP fields after resending

      setNotifModal({
        display: true,
        message: "The OTP has been sent to your email.",
        title: "Hello user!",
      });
    } catch (error) {
      // console.error("Error resending OTP:", error);
      // if (error.response) {
      //   setModalMessage(`Error resending OTP: ${error.response.data.error || error.response.data.message}`);
      // } else if (error.request) {
      //   setModalMessage("Error resending OTP: No response from server.");
      // } else {
      //   setModalMessage("Error resending OTP: " + error.message);
      // }
      // setShowModal(true);

      setErrorModal({
        display: true,
        message:
          "There was an error resending the OTP. Please try again later.",
        title: "Hello user!",
      });
    }
  };

  const clearOtp = () => {
    setOtp(new Array(4).fill("")); // Reset OTP input fields
  };

  const handleChange = (element, index) => {
    const value = element.value;

    let newOtp = [...otp];

    if (/^[0-9]$/.test(value) || value === "") {
      newOtp[index] = value;

      setOtp(newOtp);

      if (value && element.nextSibling) {
        element.nextSibling.focus();
      } else if (!value && element.previousSibling) {
        element.previousSibling.focus();
      }
    }
  };

  // Send OTP
  const sendOtp = async () => {
    if (!email) {
      // setModalMessage("Email is required.");
      // setShowModal(true);

      setErrorModal({
        display: true,
        message: "Please enter your email first.",
        title: "Hello user!",
      });
      return;
    }

    // console.log("Email being sent:", email);
    try {
      const response = await axiosRes.post("/confirm-email", { email });
      setToken(response.data.token);
      // setModalMessage("OTP sent to your email.");
      // setShowModal(true);

      setNotifModal({
        display: true,
        message: "The OTP has been sent to your email.",
        title: "Hello user!",
      });
    } catch (error) {
      // console.error("Error sending OTP:", error);
      if (error.response) {
        setModalMessage(
          `Error sending OTP: ${
            error.response.data.error || error.response.data.message
          }`
        );
      } else if (error.request) {
        setModalMessage("Error sending OTP: No response from server.");
      } else {
        setModalMessage("Error sending OTP: " + error.message);
      }
      // setShowModal(true);

      setErrorModal({
        display: true,
        message: "There was an error sending the OTP. Please try again later.",
        title: "Hello user!",
      });
    }
  };

  const fullOtp = otp.join(""); // nilabas ko para maipasa as props
  // Verify OTP
  const verifyOtp = async () => {
    // pwesto ng fullOtp
    // console.log("Verifying OTP:", fullOtp, "for email:", email, "with token:", token);

    // Check OTP
    if (otp.includes("") || !email) {
      // setModalMessage("Please enter the full OTP and email.");
      // setShowModal(true);

      setErrorModal({
        display: true,
        message: "Please enter the full OTP and email.",
        title: "Hello user!",
      });
      return;
    }

    // console.log("Verifying OTP:", fullOtp, "for email:", email);
    try {
      const response = await axiosRes.post("/verify-otp", {
        otp: fullOtp,
        email,
        token,
      });
      // console.log("Verification response:", response.data);
      // setModalMessage(response.data.message || "OTP verification failed. Please try again.");
      // setShowModal(true);

      if (response.data.success) {
        setNotifModal({
          display: true,
          message:
            "The OTP has been verified. You can now reset your password. Please wait a moment.",
          title: "Hello user!",
        });

        setTimeout(() => {
          sessionStorage.setItem("email", email);
          sessionStorage.setItem("otp", fullOtp);
          window.location.href = `/signup/reset`;
        }, 3000);
      } else {
        setErrorModal({
          display: true,
          message:
            "There was an error verifying the OTP. Please try again later.",
          title: "Hello user!",
        });
      }

      setVerificationSuccess(response.data.success);
    } catch (error) {
      let errorMessage =
        "There was an error verifying the OTP. Please try again later.";

      if (error.response) {
        if (error.response.status === 422) {
          errorMessage =
            error.response.data.message ||
            "Invalid input. Please check your information and try again.";
        } else {
          errorMessage = error.response.data.message || errorMessage;
        }
      }

      setErrorModal({
        display: true,
        message: errorMessage,
        title: "Hello user!",
      });
      setVerificationSuccess(false);
    }
  };

  return (
    <main className="container d-flex justify-content-center align-items-center vh-100">
      <div className="login-card card px-3 border-3 border-warning rounded-5 shadow-lg bg-white">
        <div className="card-body text-center">
          <h5 className="card-text p-2 my-1 fw-bold text-warning mb-3">
            Confirm Email
          </h5>
          <form className="form">
            <div className="mb-3">
              <input
                type="text"
                className="input-wd form-control border-1 border-warning rounded-4 text-muted"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="mb-3">
              <button
                type="button"
                className="input-wd btn btn-warning text-white rounded-4 border shadow"
                onClick={sendOtp}
              >
                Send OTP
              </button>
            </div>

            <div className="mb-3">
              <h5 className="card-text p-2 mt-1 mb-1 fw-bold text-warning">
                Enter Verification Code
              </h5>
            </div>

            <div className="row justify-content-center mb-4">
              <div className="col-md-8 text-center">
                <div className="d-flex justify-content-between">
                  {otp.map((data, index) => (
                    <input
                      key={index}
                      type="text"
                      className="form-control text-center mx-1 otp-input border-0 border-bottom border-2 border-warning rounded-0 fw-bolder text-warning"
                      maxLength="1"
                      value={data}
                      onChange={(e) => handleChange(e.target, index)}
                      required
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="mb-3">
              <button
                type="button"
                className="input-wd btn btn-warning text-white rounded-4 border shadow"
                onClick={verifyOtp}
              >
                Verify
              </button>
            </div>

            <small className="text-muted">
              Didn't receive the OTP code?
              <span
                className="link-warning"
                style={{ cursor: "pointer" }}
                onClick={resendOtp}
              >
                Resend OTP
              </span>
            </small>

            <div className="mt-2">
              <Link
                href="/"
                className="text-decoration-none fw-medium btn btn-sm btn-outline-warning rounded-4 w-50 text-center"
              >
                Back
              </Link>
            </div>
          </form>
        </div>
      </div>

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
              <button
                type="button"
                className="btn btn-warning text-white"
                onClick={() => {
                  setShowModal(false);
                  if (verificationSuccess) {
                    window.location.href = `/signup/reset?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(fullOtp)}`;
                  }
                }}
              >
                Okay
              </button>
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
