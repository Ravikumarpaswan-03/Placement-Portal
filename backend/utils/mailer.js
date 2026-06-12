const nodemailer = require("nodemailer");

const sendOtpEmail = async (email, otp, type = "verification") => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  const resendApiKey = process.env.RESEND_API_KEY;

  const isReset = type === "reset";
  const subject = isReset 
    ? "Placement Portal - Password Reset OTP" 
    : "Placement Portal - Email Verification OTP";
  const title = isReset ? "Reset Your Password" : "Verify Your Email Address";
  const messageText = isReset 
    ? "We received a request to reset your account password. To set a new password, please use the following One-Time Password (OTP):" 
    : "Thank you for registering on the Placement Portal. To complete your registration, please use the following One-Time Password (OTP):";

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #fafafa;">
      <h2 style="color: #4A90E2; text-align: center;">${title}</h2>
      <p>${messageText}</p>
      <div style="text-align: center; margin: 30px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #333; padding: 10px 20px; background-color: #eaeaea; border-radius: 5px;">${otp}</span>
      </div>
      <p style="color: #666; font-size: 14px;">This OTP is valid for 10 minutes. Please do not share this code with anyone.</p>
      <hr style="border: 0; border-top: 1px solid #e0e0e0;" />
      <p style="font-size: 12px; color: #999; text-align: center;">If you did not request this, you can safely ignore this email.</p>
    </div>
  `;

  // 1. Resend API (HTTPS port 443 - 100% reliable on Render)
  if (resendApiKey) {
    try {
      console.log(`[Mailer] Dispatching email via Resend API to ${email}...`);
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: "Placement Portal <onboarding@resend.dev>",
          to: email,
          subject: subject,
          html: htmlContent
        })
      });

      const resData = await response.json();
      if (response.ok) {
        console.log(`[Mailer] Resend API email dispatched successfully. ID: ${resData.id}`);
        return { success: true, logged: false };
      } else {
        throw new Error(resData.message || JSON.stringify(resData));
      }
    } catch (error) {
      console.error(`[Mailer] Resend API delivery failed:`, error.message);
      return { success: false, error: `Resend API error: ${error.message}` };
    }
  }

  // 2. Gmail SMTP (SMTPS port 465)
  if (emailUser && emailPass) {
    try {
      console.log(`[Mailer] Dispatching email via Gmail SMTP to ${email}...`);
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
          user: emailUser,
          pass: emailPass,
        },
        family: 4,
        connectionTimeout: 10000
      });

      const mailOptions = {
        from: `"Placement Portal" <${emailUser}>`,
        to: email,
        subject: subject,
        html: htmlContent
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`[Mailer] Gmail SMTP email sent: ${info.messageId}`);
      return { success: true, logged: false };
    } catch (error) {
      console.error(`[Mailer] Gmail SMTP failed:`, error.message);
      console.log(`[Mailer Fallback] OTP for ${email}: ${otp}`);
      return { success: false, error: `SMTP error: ${error.message}` };
    }
  }

  // 3. Dev Fallback
  console.log("-----------------------------------------");
  console.log(`[Mailer] Mailer credentials missing in env.`);
  console.log(`[Mailer] OTP (${type}) for ${email}: ${otp}`);
  console.log("-----------------------------------------");
  return { success: true, logged: true };
};

module.exports = { sendOtpEmail };
