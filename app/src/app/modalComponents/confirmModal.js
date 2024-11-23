"use client";

export default function ConfirmModal({ display, message, onClose, onConfirm, title }) {
  if (!display) return null;

  return (
    <div className="modal show d-block" tabIndex="-1">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border border-2 border-warning shadow-lg">
          <div className="modal-header">
            <h5 className="modal-title">{title}</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            {message}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Cancel</button>
            <button type="button" className="btn btn-warning text-white" onClick={onConfirm}>Confirm</button>
          </div>
        </div>
      </div>
    </div>
  );
}
