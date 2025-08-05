// Email service for sending agent activation emails
import nodemailer from 'nodemailer';

// Email transporter configuration
const createTransporter = () => {
  // Use environment variables for email configuration
  const emailService = process.env.EMAIL_SERVICE || 'gmail';
  const emailUser = process.env.EMAIL_USER;
  const emailPassword = process.env.EMAIL_PASSWORD;

  if (!emailUser || !emailPassword) {
    console.warn('⚠️ Email configuration missing. Email sending will be simulated.');
    return null;
  }

  return nodemailer.createTransporter({
    service: emailService,
    auth: {
      user: emailUser,
      pass: emailPassword
    }
  });
};

// Send agent activation email
export async function sendAgentActivationEmail({ email, firstName, lastName, activationToken, createdBy }) {
  const transporter = createTransporter();
  
  if (!transporter) {
    // Simulate email sending for development
    console.log('📧 [SIMULATED] Agent activation email:', {
      to: email,
      subject: 'Welcome to CCSA - Activate Your Agent Account',
      activationLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/activate-agent?token=${activationToken}`
    });
    return { success: true, simulated: true };
  }

  const activationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/activate-agent?token=${activationToken}`;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Activate Your CCSA Agent Account</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #007AFF; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #007AFF; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 10px; border-radius: 4px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to CCSA!</h1>
          <p>Comprehensive Crop Survey and Analysis</p>
        </div>
        <div class="content">
          <h2>Hello ${firstName} ${lastName},</h2>
          
          <p>Congratulations! Your agent account has been created by <strong>${createdBy?.firstName} ${createdBy?.lastName}</strong> (${createdBy?.email}).</p>
          
          <p>You are now part of the CCSA team and can start helping farmers register and manage their agricultural data.</p>
          
          <h3>Next Steps:</h3>
          <ol>
            <li>Click the activation button below to set up your password</li>
            <li>Download the CCSA Mobile App on your device</li>
            <li>Log in with your credentials</li>
            <li>Start registering farmers in your assigned area</li>
          </ol>
          
          <div style="text-align: center;">
            <a href="${activationLink}" class="button">Activate Your Account</a>
          </div>
          
          <div class="warning">
            <strong>Important:</strong> This activation link will expire in 7 days. If you don't activate your account within this time, please contact your administrator.
          </div>
          
          <h3>Your Account Details:</h3>
          <ul>
            <li><strong>Email:</strong> ${email}</li>
            <li><strong>Role:</strong> Field Agent</li>
            <li><strong>Status:</strong> Pending Activation</li>
          </ul>
          
          <h3>What You Can Do As An Agent:</h3>
          <ul>
            <li>Register farmers and collect their information</li>
            <li>Validate farmer data with NIN verification</li>
            <li>Take photos and record GPS coordinates</li>
            <li>Generate farmer certificates</li>
            <li>Track your registration performance</li>
          </ul>
          
          <p>If you have any questions or need assistance, please contact your administrator or the CCSA support team.</p>
          
          <p>Welcome aboard!</p>
          
          <p><strong>The CCSA Team</strong></p>
        </div>
        <div class="footer">
          <p>If you cannot click the button above, copy and paste this link into your browser:</p>
          <p><a href="${activationLink}">${activationLink}</a></p>
          <p>This email was sent to ${email}. If you believe you received this email in error, please ignore it.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
Welcome to CCSA - Comprehensive Crop Survey and Analysis

Hello ${firstName} ${lastName},

Congratulations! Your agent account has been created by ${createdBy?.firstName} ${createdBy?.lastName} (${createdBy?.email}).

To activate your account, please visit: ${activationLink}

Your account details:
- Email: ${email}
- Role: Field Agent
- Status: Pending Activation

This activation link will expire in 7 days.

If you have any questions, please contact your administrator.

Welcome aboard!
The CCSA Team
  `;

  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Welcome to CCSA - Activate Your Agent Account',
      text: textContent,
      html: htmlContent
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Agent activation email sent successfully:', result.messageId);
    
    return { 
      success: true, 
      messageId: result.messageId,
      activationLink 
    };
  } catch (error) {
    console.error('❌ Failed to send agent activation email:', error);
    throw error;
  }
}

// Send password reset email
export async function sendAgentPasswordResetEmail({ email, firstName, lastName, resetToken }) {
  const transporter = createTransporter();
  
  if (!transporter) {
    console.log('📧 [SIMULATED] Password reset email:', {
      to: email,
      subject: 'CCSA - Reset Your Password',
      resetLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`
    });
    return { success: true, simulated: true };
  }

  const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your CCSA Password</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #FF3B30; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #FF3B30; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 10px; border-radius: 4px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Request</h1>
          <p>CCSA Agent Portal</p>
        </div>
        <div class="content">
          <h2>Hello ${firstName} ${lastName},</h2>
          
          <p>We received a request to reset your CCSA agent account password.</p>
          
          <div style="text-align: center;">
            <a href="${resetLink}" class="button">Reset Your Password</a>
          </div>
          
          <div class="warning">
            <strong>Important:</strong> This password reset link will expire in 1 hour. If you don't reset your password within this time, you'll need to request a new reset link.
          </div>
          
          <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
          
          <p>For security reasons, please make sure to:</p>
          <ul>
            <li>Use a strong password with at least 8 characters</li>
            <li>Include a mix of letters, numbers, and symbols</li>
            <li>Don't share your password with anyone</li>
          </ul>
          
          <p>If you have any questions or need assistance, please contact your administrator.</p>
          
          <p><strong>The CCSA Team</strong></p>
        </div>
        <div class="footer">
          <p>If you cannot click the button above, copy and paste this link into your browser:</p>
          <p><a href="${resetLink}">${resetLink}</a></p>
          <p>This email was sent to ${email}.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'CCSA - Reset Your Password',
      html: htmlContent
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Password reset email sent successfully:', result.messageId);
    
    return { 
      success: true, 
      messageId: result.messageId,
      resetLink 
    };
  } catch (error) {
    console.error('❌ Failed to send password reset email:', error);
    throw error;
  }
}

export default {
  sendAgentActivationEmail,
  sendAgentPasswordResetEmail
};
