import React from "react";
import { useNavigate } from "react-router-dom";
import "./Terms.css";

const Terms = () => {
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
          <h1 className="terms-title">Terms & Policies</h1>
          <p className="terms-date">Last Updated: March 22, 2026</p>
        </header>
      </div>
      
      <div className="terms-content-wrapper">
        <div className="terms-content">
          <section className="terms-section">
            <h2>1. Agreement to Terms</h2>
            <p>
              Welcome to AI Prompt Improver ("we," "our," or "us"). By accessing or using our application, website, and associated services 
              (collectively the "Service"), you agree to be bound by these Terms and Policies. If you disagree with any part of the terms, 
              you may not access or use the Service.
            </p>
          </section>

          <section className="terms-section">
            <h2>2. Description of Service</h2>
            <p>
              AI Prompt Improver provides AI-powered natural language processing tools to rewrite, optimize, and elevate user-provided 
              prompts. The service relies on third-party large language models (LLMs) to generate recommendations. Because AI outputs are 
              probabilistic, we cannot guarantee the accuracy, reliability, or objective "correctness" of the improved prompts.
            </p>
          </section>

          <section className="terms-section">
            <h2>3. Account Registration & Security</h2>
            <p>
              You must be at least 13 years of age to create an account. Accounts may be created via One-Time Password (OTP) or third-party 
              authentication providers (e.g., Google). You are entirely responsible for maintaining the confidentiality of your account 
              credentials and for any activities that occur under your account. You agree to notify us immediately of any unauthorized use 
              of your account.
            </p>
          </section>

          <section className="terms-section">
            <h2>4. User Content & Intellectual Property</h2>
            <p>
              <strong>Your Content:</strong> You retain full ownership and all intellectual property rights to any text, prompts, or data 
              you submit into the Service. We claim no ownership over your inputs or the direct outputs specifically generated for you.
            </p>
            <p style={{ marginTop: "12px" }}>
              <strong>License to Us:</strong> By using the Service, you grant us a worldwide, non-exclusive license to temporarily process, 
              store, and transmit your prompts strictly for the purpose of operating the Service, displaying your prompt history, and generating 
              improved results.
            </p>
          </section>

          <section className="terms-section">
            <h2>5. Disclaimer of Warranties</h2>
            <p>
              THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS. WE EXPRESSLY DISCLAIM ALL WARRANTIES OF ANY KIND, WHETHER EXPRESS OR 
              IMPLIED, INCLUDING BUT NOT LIMITED TO THE IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
              We make no warranty that the AI-generated outputs will meet your requirements or be free from errors or biases.
            </p>
          </section>

          <section className="terms-section">
            <h2>6. Limitations of Liability</h2>
            <p>
              In no event shall AI Prompt Improver, its developers, or its affiliates be liable for any indirect, incidental, special, consequential, 
              or punitive damages arising out of your reliance on the AI-generated prompts, loss of data, or inability to use the Service, even if we 
              have been advised of the possibility of such damages.
            </p>
          </section>

          <section className="terms-section">
            <h2>7. Modifications to Terms & Service</h2>
            <p>
              We reserve the right to modify or replace these Terms at any time. Material changes will be communicated through the Service or via email 
              prior to becoming effective. Your continued use of the Service following any changes constitutes acceptance of those changes.
            </p>
          </section>
          
          <section className="terms-section">
            <h2>8. Contact Us</h2>
            <p>
              If you have any questions or concerns about these Terms, the Privacy Policy, or the Service, please contact us at support@promet.ai 
              or open an issue on our GitHub repository.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Terms;
