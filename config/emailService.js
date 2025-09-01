// config/emailService.js - SMTP Version
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();
// Create transporter with Brevo SMTP
const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.BREVO_SMTP_LOGIN, // Your Brevo login email
    pass: process.env.BREVO_SMTP_KEY,   // Your Brevo SMTP key
  },
});

// Verify transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('SMTP Configuration Error:', error);
  } else {
    console.log('SMTP Server is ready to send emails');
  }
});

export const sendPasswordResetEmail = async (email, resetToken, userName) => {
  try {
    const resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: {
        name: 'Chanre Veena',
        address: process.env.SENDER_EMAIL || 'noreply@chanreveena.com'
      },
      to: {
        name: userName,
        address: email
      },
      subject: 'Password Reset Request - Chanre Veena',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              margin: 0; 
              padding: 0;
              background-color: #f4f4f4;
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              background-color: #ffffff;
              box-shadow: 0 0 20px rgba(0,0,0,0.1);
            }
            .header { 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
              color: white; 
              padding: 40px 30px; 
              text-align: center; 
              border-radius: 0;
            }
            .header h1 {
              margin: 0 0 10px 0;
              font-size: 28px;
              font-weight: bold;
            }
            .header p {
              margin: 0;
              font-size: 16px;
              opacity: 0.9;
            }
            .content { 
              background: #ffffff; 
              padding: 40px 30px; 
            }
            .content h2 {
              color: #333;
              margin-top: 0;
              margin-bottom: 20px;
              font-size: 24px;
            }
            .content p {
              margin-bottom: 15px;
              font-size: 16px;
              line-height: 1.6;
            }
            .button { 
              display: inline-block; 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
              color: white !important; 
              padding: 15px 30px; 
              text-decoration: none; 
              border-radius: 8px; 
              margin: 25px 0; 
              font-weight: bold;
              font-size: 16px;
              box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
              transition: all 0.3s ease;
            }
            .button:hover {
              transform: translateY(-2px);
              box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
            }
            .link-text {
              word-break: break-all; 
              color: #667eea;
              background-color: #f8f9ff;
              padding: 10px;
              border-radius: 4px;
              border-left: 4px solid #667eea;
              font-family: monospace;
              font-size: 14px;
            }
            .footer { 
              text-align: center; 
              padding: 30px; 
              color: #666; 
              font-size: 14px;
              background-color: #f8f9fa;
              border-top: 1px solid #e9ecef;
            }
            .warning {
              background-color: #fff3cd;
              border: 1px solid #ffeaa7;
              border-radius: 6px;
              padding: 15px;
              margin: 20px 0;
              color: #856404;
            }
            .warning strong {
              color: #856404;
            }
            @media only screen and (max-width: 600px) {
              .container {
                margin: 0;
                box-shadow: none;
              }
              .header, .content {
                padding: 20px;
              }
              .button {
                display: block;
                text-align: center;
                margin: 20px 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>CHANRE VEENA</h1>
              <p>Rheumatology & Immunology Center</p>
            </div>
            <div class="content">
              <h2>Password Reset Request</h2>
              <p>Hello <strong>${userName}</strong>,</p>
              <p>We received a request to reset your password for your Chanre Veena account. If you didn't make this request, please ignore this email and your password will remain unchanged.</p>
              
              <p>To reset your password, click the button below:</p>
              
              <div style="text-align: center; margin: 30px 0; ">
                <a href="${resetUrl}" class="button">Reset My Password</a>
              </div>
              
              <p>If the button above doesn't work, you can copy and paste this link into your browser:</p>
              <div class="link-text">${resetUrl}</div>
              
              <div class="warning">
                <strong>⏰ Important Security Notice:</strong><br>
                This password reset link will expire in <strong>1 hour</strong> for your account security. 
                If you need a new link after it expires, please request another password reset from the login page.
              </div>
              
              <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
              
              <p>Best regards,<br>
              <strong>Chanre Veena Support Team</strong><br>
              Rheumatology & Immunology Center</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Chanre Veena. All rights reserved.</p>
              <p>This is an automated message, please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      // Text version for email clients that don't support HTML
      text: `
        CHANRE VEENA - Password Reset Request
        
        Hello ${userName},
        
        We received a request to reset your password for your Chanre Veena account.
        
        To reset your password, please visit this link:
        ${resetUrl}
        
        Important: This link will expire in 1 hour for security reasons.
        
        If you didn't request this password reset, please ignore this email.
        
        Best regards,
        Chanre Veena Support Team
        
        © ${new Date().getFullYear()} Chanre Veena. All rights reserved.
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent successfully:', info.messageId);
    return { 
      success: true, 
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected 
    };
    
  } catch (error) {
    console.error('Error sending email via SMTP:', error);
    
    // More detailed error handling
    if (error.code === 'EAUTH') {
      throw new Error('SMTP Authentication failed. Please check your Brevo credentials.');
    } else if (error.code === 'ECONNECTION') {
      throw new Error('Failed to connect to SMTP server. Please check your network connection.');
    } else if (error.responseCode === 550) {
      throw new Error('Email rejected by recipient server. Please check the email address.');
    } else {
      throw new Error(`Failed to send password reset email: ${error.message}`);
    }
  }
};

// Test email function (optional - for testing your SMTP configuration)
export const testEmailConnection = async () => {
  try {
    await transporter.verify();
    console.log('✅ SMTP connection test successful');
    return { success: true, message: 'SMTP connection is working' };
  } catch (error) {
    console.error('❌ SMTP connection test failed:', error);
    return { success: false, error: error.message };
  }
};