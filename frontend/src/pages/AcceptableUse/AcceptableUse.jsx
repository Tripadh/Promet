import React from "react";
import { useNavigate } from "react-router-dom";
import "../Terms/Terms.css";

const AcceptableUse = () => {
  const navigate = useNavigate();

  const handleBackToApp = () => {
    const hasSameOriginReferrer =
      typeof document !== "undefined" &&
      document.referrer &&
      document.referrer.startsWith(window.location.origin);

    if (hasSameOriginReferrer) {
      navigate(-1);
      return;
    }

    navigate("/dashboard");
  };

  return (
    <div className="terms-page">
      <div className="terms-header-wrapper">
        <header className="terms-header">
          <button className="back-button" onClick={handleBackToApp}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            Back to App
          </button>
          <h1 className="terms-title">Acceptable Use Policy</h1>
          <p className="terms-date">Last Updated: March 22, 2026</p>
        </header>
      </div>
      
      <div className="terms-content-wrapper">
        <div className="terms-content">
          <section className="terms-section">
            <h2>1. General Principles</h2>
            <p>
              The Promet application is built to empower creators and engineers by optimizing prompt inputs. As a user, you agree to utilize this service responsibly, legally, and in a manner that respects the rights of others and the operational integrity of our infrastructure.
            </p>
          </section>

          <section className="terms-section">
            <h2>2. Prohibited Uses</h2>
            <p>
              You agree not to use the Service under any circumstances to:
            </p>
            <ul className="terms-list">
              <li>Submit inputs intended to assist in illegal acts, cybersecurity attacks, or financial fraud.</li>
              <li>Generate violent, explicit, defamatory, or hate-speech material.</li>
              <li>Exploit, harm, or attempt to exploit or harm minors in any way.</li>
              <li>Infringe upon the intellectual property, copyright, or privacy rights of any third party.</li>
            </ul>
          </section>

          <section className="terms-section">
            <h2>3. Service Integrety</h2>
            <p>
              You are strictly prohibited from attempting to bypass our rate limits, reverse-engineer our platform architecture, decompile our client applications, or execute automated scraping arrays / bot-nets against our backend API endpoints. Any disruption of our service will result in an immediate and permanent account suspension.
            </p>
          </section>

          <section className="terms-section">
            <h2>4. Enforcement</h2>
            <p>
              We reserve the right (but have no ongoing obligation) to monitor accounts for violations of this Acceptable Use Policy. We maintain the absolute discretion to suspend, ban, or report accounts mapping to severe violations to appropriate law enforcement authorities without prior notice.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AcceptableUse;
