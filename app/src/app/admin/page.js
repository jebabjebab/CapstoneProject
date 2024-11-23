"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminContent from "./admin";

export default function Admin() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const ModalDisplay = () => {
    return (
      <div className="modal show d-block" tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-3 border-warning rounded-3 shadow-lg">
            <div className="modal-header d-flex flex-column justify-content-center align-items-center">
              <h5 className="modal-title text-center mb-3">Admin Access Required</h5>
              <p className="text-center mb-0">Please login with admin credentials to access this page</p>
            </div>
            <div className="modal-footer d-flex justify-content-center">
              <button type="button" className="btn btn-warning btn-md text-white" onClick={() => router.push("/")}>Login</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    if (sessionStorage.getItem("isAdmin") === "true") {
      setIsAdmin(true);
      setShowModal(false);
    } else {
      setIsAdmin(false);
      setShowModal(true);
    }
  }, [router]);

  return (
    <>
      {showModal && <ModalDisplay />}
      {isAdmin && <AdminContent />}
    </>
  );
}
