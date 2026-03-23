import nodemailer from "nodemailer";

export const sendOtpEmail = async (email, otp) => {
  try {
    const { EMAIL_USER, EMAIL_PASS } = process.env;

    if (!EMAIL_USER || !EMAIL_PASS) {
      console.warn("⚠️ EMAIL_USER or EMAIL_PASS missing in .env. Falling back to console log.");
      console.log(`[DEV MODE] OTP for ${email}: ${otp}`);
      return;
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"Promet" <${EMAIL_USER}>`,
      to: email,
      subject: "Your Password Recovery Code",
      text: `Hello,\n\nYour recovery code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nIf you did not request this, please ignore this email.`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #eaeaea; border-radius: 12px; background-color: #ffffff;">
          <h2 style="color: #111; margin-top: 0;">Password Recovery</h2>
          <p style="color: #555; font-size: 16px; line-height: 1.5;">You recently requested to reset your password for your Promet account. Use the secure verification code below to complete the process:</p>
          <div style="margin: 32px 0; padding: 24px; background-color: #f4f4f5; border-radius: 8px; text-align: center; border: 1px solid #e4e4e7;">
            <h1 style="margin: 0; color: #000; letter-spacing: 8px; font-size: 36px;">${otp}</h1>
          </div>
          <p style="color: #71717a; font-size: 14px;">This code will expire securely in 10 minutes.</p>
          <hr style="border: none; border-top: 1px solid #eaeaea; margin: 30px 0;" />
          <p style="color: #a1a1aa; font-size: 12px; margin-bottom: 0;">If you didn't request this password reset, you can safely ignore this email. Your account remains secure.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent securely: ", info.messageId);
  } catch (error) {
    console.error("Error sending OTP email:", error);
    throw new Error("Failed to send email");
  }
};
