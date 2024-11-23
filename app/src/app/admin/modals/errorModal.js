"use client";

export default function ErrorModal({ display, message, onClose, title }) {
  if (!display) return null;

  return (
    <div className="modal show d-block" tabIndex="-1">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border border-2 border-danger shadow-lg">
          <div className="modal-header">
            <h5 className="modal-title">{title}</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            {message}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-danger text-white" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}
