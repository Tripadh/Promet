import React from "react";
import { useNavigate } from "react-router-dom";
import "../Terms/Terms.css";

const Privacy = () => {
  const navigate = useNavigate();

  return (
    <div className="terms-page">
      <div className="terms-header-wrapper">
        <header className="terms-header">
          <button className="back-button" onClick={() => navigate(-1)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            Back to App
          </button>
          <h1 className="terms-title">Privacy Policy</h1>
          <p className="terms-date">Last Updated: March 22, 2026</p>
        </header>
      </div>
      
      <div className="terms-content-wrapper">
        <div className="terms-content">
          <section className="terms-section">
            <h2>1. Information We Collect</h2>
            <p>
              We strictly minimize data collection. When you register, we collect your name, email address, and optionally your phone number for authentication purposes. When you use the system, we temporarily process and permanently store the prompt text you input so you can view your prompt history in the dashboard.
            </p>
          </section>

          <section className="terms-section">
            <h2>2. How We Use Information</h2>
            <p>
              Your data is exclusively used to provide the AI prompt enhancement service. We use authentication data to secure your account. We transmit your prompt text safely to third-party Large Language Model providers (like OpenAI or Anthropic) solely to generate the structural improvements you request.
            </p>
          </section>

          <section className="terms-section">
            <h2>3. Third-Party Sharing</h2>
            <p>
              We do not sell, rent, or trade your personal data to any external parties for marketing. We only share necessary data with our immediate operational sub-processors (like database hosts and the LLM API providers) which are bound by strict data processing agreements.
            </p>
          </section>

          <section className="terms-section">
            <h2>4. Cookies & Tracking</h2>
            <p>
              We use strictly necessary cookies (like JWT authentication tokens) to keep you logged into the application. We may also use anonymous, aggregate telemetry to monitor server health. We do not use cross-site tracking cookies for advertising.
            </p>
          </section>

          <section className="terms-section">
            <h2>5. Contact Us</h2>
            <p>
              For inquiries regarding data removal, GDPR access requests, or specific privacy questions, please email support@promet.ai.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
