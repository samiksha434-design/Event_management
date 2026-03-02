import React, { useState } from 'react';
import { paymentService } from '../../services/paymentService';

const PaymentButton = ({ email, amount, buttonText = "Pay Now", className = "", eventId, registrationData }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handlePayment = async () => {
        setLoading(true);
        setError(null);
        try {
            const callbackUrl = `${window.location.origin}/payment/success`;
            const response = await paymentService.initializePayment(email, amount, callbackUrl, eventId, registrationData);

            if (response.success && response.data?.authorization_url) {
                // Redirect user to Paystack checkout page
                window.location.href = response.data.authorization_url;
            } else {
                setError('Failed to retrieve payment link. Please try again.');
            }
        } catch (err) {
            console.error('Payment Error:', err);
            setError(err.message || 'Payment initialization failed.');
            alert(err.message || 'Payment initialization failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <button
                onClick={handlePayment}
                className={`bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded ${className} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={loading}
            >
                {loading ? 'Processing...' : buttonText}
            </button>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>
    );
};

export default PaymentButton;
