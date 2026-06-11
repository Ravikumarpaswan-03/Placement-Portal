const nodemailer = require("nodemailer");

const sendOtpEmail = async (email, otp) => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailUser || !emailPass) {
    console.log("-----------------------------------------");
    console.log(`[Mailer] Mailer credentials missing in env.`);
    console.log(`[Mailer] OTP for ${email}: ${otp}`);
    console.log("-----------------------------------------");
    return { success: true, logged: true };
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });

    const mailOptions = {
      from: `"Placement Portal" <${emailUser}>`,
      to: email,
      subject: "Placement Portal - Email Verification OTP",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #fafafa;">
          <h2 style="color: #4A90E2; text-align: center;">Verify Your Email Address</h2>
          <p>Thank you for registering on the Placement Portal. To complete your registration, please use the following One-Time Password (OTP):</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #333; padding: 10px 20px; background-color: #eaeaea; border-radius: 5px;">${otp}</span>
          </div>
          <p style="color: #666; font-size: 14px;">This OTP is valid for 10 minutes. Please do not share this code with anyone.</p>
          <hr style="border: 0; border-top: 1px solid #e0e0e0;" />
          <p style="font-size: 12px; color: #999; text-align: center;">If you did not request this verification, you can safely ignore this email.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Mailer] Verification email sent to ${email}: ${info.messageId}`);
    return { success: true, logged: false };
  } catch (error) {
    console.error(`[Mailer] Failed to send email to ${email}:`, error.message);
    console.log(`[Mailer Fallback] OTP for ${email}: ${otp}`);
    return { success: false, error: error.message };
  }
};

module.exports = { sendOtpEmail };
