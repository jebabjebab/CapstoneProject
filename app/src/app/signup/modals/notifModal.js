import { useEffect } from 'react';

export default function NotifModal({ display, message, onClose, title }) {
    useEffect(() => {
        if (display) {
            const timer = setTimeout(() => {
                onClose();
            }, 5000);

            return () => clearTimeout(timer);
        }
    }, [display, onClose]);

    if (!display) return null;

    return (
        <div 
            className="position-fixed bottom-0 end-0 p-3" 
            style={{ zIndex: 1050 }}
            onClick={onClose}
        >
            <div className="toast show border border-2 border-success shadow-lg" role="alert" aria-live="assertive" aria-atomic="true" data-bs-autohide="true" data-bs-delay="5000">
                <div className="toast-header">
                    <strong className="me-auto">{title}</strong>
                    <button type="button" className="btn-close" onClick={onClose}></button>
                </div>
                <div className="toast-body">
                    {message}
                </div>
            </div>
        </div>
    );
}