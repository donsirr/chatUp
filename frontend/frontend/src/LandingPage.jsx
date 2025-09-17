import React, { useState } from "react";

export default function LandingPage({ onAgree }) {
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [termsConfirmed, setTermsConfirmed] = useState(false);

  const ready = ageConfirmed && termsConfirmed;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 to-purple-200 p-6">
      <div className="bg-white shadow-lg rounded-2xl p-10 max-w-2xl w-full space-y-6">
        {/* Title */}
        <h1 className="text-3xl font-bold text-center text-gray-800">
          chatUp
        </h1>

        {/* About */}
        <p className="text-gray-700 text-base leading-relaxed">
          <strong>chatUp</strong> is an anonymous chat platform built for
          university students. Connect with peers from other institution,
          collaborate on studies, and share ideas in a safe, simple,
          and private environment.
        </p>

        {/* Terms */}
        <div className="space-y-4 text-sm text-gray-600">
          <h2 className="font-semibold text-gray-800">Terms & Conditions</h2>
          <p>
            By accessing chatUp, you agree to behave respectfully, avoid
            harassment, and comply with applicable university and legal
            guidelines. Misuse may result in suspension or removal.
          </p>

          <h2 className="font-semibold text-gray-800">Disclaimer of Liability</h2>
          <p>
            chatUp is provided "as-is" without warranties of any kind. We are
            not responsible for the actions or consequences arising from user
            interactions. Always exercise caution when communicating online.
          </p>
        </div>

        {/* Checkboxes */}
        <div className="space-y-3 mt-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              className="w-4 h-4"
              checked={ageConfirmed}
              onChange={(e) => setAgeConfirmed(e.target.checked)}
            />
            <span className="text-sm text-gray-700">
              I confirm that I am 18 years of age or older.
            </span>
          </label>
          <br></br>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              className="w-4 h-4"
              checked={termsConfirmed}
              onChange={(e) => setTermsConfirmed(e.target.checked)}
            />
            <span className="text-sm text-gray-700">
              I have read and agree to the Terms & Conditions.
            </span>
          </label>
        </div>

        {/* Button */}
        <button
          disabled={!ready}
          onClick={onAgree}
          className={`w-full py-3 rounded-lg font-semibold text-white transition ${
            ready
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          Enter Chat
        </button>
      </div>
    </div>
  );
}
