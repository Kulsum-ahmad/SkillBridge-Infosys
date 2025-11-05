import nodemailer from "nodemailer";

/**
 * Create and configure nodemailer transporter
 * Uses environment variables from .env file
 */
const createTransporter = () => {
  // For Gmail, use these environment variables:
  // EMAIL_HOST=smtp.gmail.com
  // EMAIL_PORT=587
  // EMAIL_USER=your-email@gmail.com
  // EMAIL_PASS=your-app-password
  
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: parseInt(process.env.EMAIL_PORT || "587"),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // App-specific password for Gmail
    },
  });

  return transporter;
};

/**
 * Send password reset email
 * @param {String} email - Recipient email address
 * @param {String} resetToken - Password reset token
 * @param {String} userName - User's name for personalization
 */
export const sendPasswordResetEmail = async (email, resetToken, userName = "User") => {
  try {
    const transporter = createTransporter();

    // Frontend URL for password reset page
    const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password/${resetToken}`;

    const mailOptions = {
      from: `"SkillBridge" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Password Reset Request - SkillBridge",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .button:hover { background: #5568d3; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            .warning { background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hello ${userName},</p>
              <p>We received a request to reset your password for your SkillBridge account.</p>
              <p>Click the button below to reset your password:</p>
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </div>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
              <div class="warning">
                <strong>⚠️ Important:</strong>
                <ul>
                  <li>This link will expire in 1 hour</li>
                  <li>If you didn't request this, please ignore this email</li>
                  <li>For security reasons, never share this link with anyone</li>
                </ul>
              </div>
              <p>If you continue to have problems, please contact our support team.</p>
              <p>Best regards,<br>The SkillBridge Team</p>
            </div>
            <div class="footer">
              <p>© 2025 SkillBridge. All rights reserved.</p>
              <p>This is an automated message, please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Password Reset Request - SkillBridge
        
        Hello ${userName},
        
        We received a request to reset your password for your SkillBridge account.
        
        Click the following link to reset your password:
        ${resetUrl}
        
        This link will expire in 1 hour.
        
        If you didn't request this, please ignore this email.
        
        Best regards,
        The SkillBridge Team
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Password reset email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Error sending password reset email:", error);
    throw error;
  }
};

/**
 * Send password reset success confirmation email
 */
export const sendPasswordResetSuccessEmail = async (email, userName = "User") => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"SkillBridge" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Password Successfully Reset - SkillBridge",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .warning { background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Password Successfully Reset</h1>
            </div>
            <div class="content">
              <p>Hello ${userName},</p>
              <p>Your password has been successfully reset.</p>
              <div class="warning">
                <strong>⚠️ Security Notice:</strong>
                <p>If you did not reset your password, please contact our support team immediately.</p>
              </div>
              <p>You can now log in to your SkillBridge account with your new password.</p>
              <p>Best regards,<br>The SkillBridge Team</p>
            </div>
            <div class="footer">
              <p>© 2025 SkillBridge. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log("✅ Password reset confirmation email sent");
  } catch (error) {
    console.error("❌ Error sending confirmation email:", error);
    // Don't throw error for confirmation email
  }
};

