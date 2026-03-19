import transporter from "../config/mailer.js";

const buildOtpHtml = (otp) => `
  <div style="font-family:Arial,sans-serif;background:#f6f8fb;padding:24px;color:#1f2937;">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:24px;">
      <h2 style="margin:0 0 12px;">Your Login OTP</h2>
      <p style="margin:0 0 16px;line-height:1.5;">Use the OTP below to complete your sign-in. This OTP expires in <strong>5 minutes</strong>.</p>
      <div style="font-size:32px;letter-spacing:8px;font-weight:700;background:#f3f4f6;border-radius:8px;padding:16px;text-align:center;">
        ${otp}
      </div>
      <p style="margin:16px 0 0;line-height:1.5;color:#4b5563;">For security, do not share this OTP with anyone.</p>
    </div>
  </div>
`;

export const sendOtpEmail = async (email, otp) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error("EMAIL_USER and EMAIL_PASS must be configured");
  }

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Your OTP for Authentication",
    html: buildOtpHtml(otp)
  });
};
