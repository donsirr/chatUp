import React, { useState } from "react";

export default function LandingPage({ onAgree }) {
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [termsConfirmed, setTermsConfirmed] = useState(false);

  const ready = ageConfirmed && termsConfirmed;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#bdbdbd",
        padding: 16,
        fontFamily: "Tahoma, Verdana, Geneva, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 600,
          border: "3px solid #000",
          background: "#fff",
          boxShadow: "8px 8px 0 #000",
          padding: 24,
          boxSizing: "border-box",
        }}
      >
        {/* Title */}
        <h1
          style={{
            fontSize: 36,
            fontWeight: 800,
            textAlign: "center",
            marginBottom: 20,
            borderBottom: "3px solid #000",
            paddingBottom: 10,
            color: "#000",
          }}
        >
          chatUp!
        </h1>

        {/* About */}
        <p style={{ fontSize: 14, color: "#111", marginBottom: 20, lineHeight: 1.5 }}>
          <strong>chatUp!</strong> is an anonymous chat platform built for
          university students. Connect with peers from other institutions,
          collaborate on studies, and share ideas in a safe, simple, and private
          environment.
        </p>

        {/* Terms */}
        <div style={{ fontSize: 13, color: "#000", marginBottom: 24 }}>
          <h2
            style={{
              fontSize: 16,
              fontWeight: 700,
              marginBottom: 6,
              borderBottom: "2px solid #000",
            }}
          >
            Terms & Conditions
          </h2>
          <p style={{ marginBottom: 16 }}>
            • By using chatUp, you agree to communicate respectfully and responsibly.
            <br></br>
            • Harassment, hate speech, threats, spamming, sexual content, and sharing of illegal or inappropriate material are strictly prohibited.
            <br></br>
            • Do not share personal or sensitive information. chatUp is designed for anonymity and your safety.
            <br></br>
            • Violations may result in suspension, permanent ban, or reporting to relevant university or legal authorities.
            <br></br>
            • You are solely responsible for the content you post and your conduct while using the platform.
          </p>

          <h2
            style={{
              fontSize: 16,
              fontWeight: 700,
              marginBottom: 6,
              borderBottom: "2px solid #000",
            }}
          >
            Disclaimer of Liability
          </h2>
          <p>
            • chatUp is provided “as is” with no guarantees of uninterrupted access, accuracy, or security.
            <br></br>
            • The platform does not moderate conversations in real time. Users are responsible for their own interactions.
            <br></br>
            • We do not verify the identity of participants and cannot guarantee the authenticity of any information shared.
            <br></br>
            • chatUp, its developers, assume no liability for damages, disputes, or consequences arising from use of the service.
            <br></br>
            • Always exercise caution when interacting with others online. If you feel unsafe, disconnect immediately.
          </p>
        </div>

        {/* Checkboxes */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
            <input
              type="checkbox"
              checked={ageConfirmed}
              onChange={(e) => setAgeConfirmed(e.target.checked)}
              style={{
                width: 18,
                height: 18,
                marginRight: 10,
                border: "2px solid #000",
              }}
            />
            <span style={{ fontSize: 14, color: "#000" }}>I confirm that I am 18 years of age or older.</span>
          </label>

          <label style={{ display: "flex", alignItems: "center" }}>
            <input
              type="checkbox"
              checked={termsConfirmed}
              onChange={(e) => setTermsConfirmed(e.target.checked)}
              style={{
                width: 18,
                height: 18,
                marginRight: 10,
                border: "2px solid #000",
              }}
            />
            <span style={{ fontSize: 14, color: "#000" }}>I have read and agree to the Terms & Conditions.</span>
          </label>
        </div>

        {/* Button */}
        <button
          disabled={!ready}
          onClick={onAgree}
          style={{
            width: "100%",
            padding: "12px 0",
            fontWeight: 700,
            fontSize: 16,
            border: "3px solid #000",
            background: ready ? "#123366" : "#ccc",
            color: "#fff",
            cursor: ready ? "pointer" : "not-allowed",
            boxShadow: "4px 4px 0 #000",
          }}
        >
          Enter Chat
        </button>
      </div>
    </div>
  );
}
