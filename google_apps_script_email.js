// ================================================
// GOOGLE APPS SCRIPT - Password Reset Email Sender
// Krishna Classes - Keep You Step Ahead
// ================================================
// 
// HOW TO USE:
// 1. Go to https://script.google.com
// 2. Create New Project → Paste this code
// 3. Deploy → New Deployment → Web App
//    - Execute as: Me
//    - Who has access: Anyone
// 4. Copy the deployment URL to your backend .env as GOOGLE_SCRIPT_URL
// ================================================

function doGet(e) {
  try {
    const to = e.parameter.to;
    const name = e.parameter.name || 'Student';
    const resetLink = e.parameter.resetLink;
    const app = e.parameter.app || 'Krishna Classes';

    if (!to || !resetLink) {
      return ContentService.createTextOutput(JSON.stringify({ error: 'Missing parameters' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const subject = `🔑 ${app} - Password Reset Request`;
    
    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; background: #f8f4e8; margin: 0; padding: 20px; }
    .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #0d1b4b, #1a237e); color: white; padding: 32px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; color: #b8860b; }
    .header p { margin: 8px 0 0; font-size: 14px; opacity: 0.8; }
    .body { padding: 32px; }
    .body p { color: #444; line-height: 1.6; }
    .btn { display: inline-block; background: linear-gradient(135deg, #b8860b, #8b6508); color: white !important; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; margin: 20px 0; }
    .footer { background: #f8f4e8; padding: 20px; text-align: center; font-size: 12px; color: #888; }
    .warning { background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 12px; margin-top: 16px; font-size: 13px; color: #856404; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎓 ${app}</h1>
      <p>Keep You Step Ahead</p>
    </div>
    <div class="body">
      <p>Dear <strong>${name}</strong>,</p>
      <p>We received a request to reset your password for your <strong>${app}</strong> account.</p>
      <p>Click the button below to reset your password:</p>
      <p style="text-align: center;">
        <a href="${resetLink}" class="btn">🔑 Reset My Password</a>
      </p>
      <div class="warning">
        ⚠️ This link will expire in <strong>1 hour</strong>. If you didn't request a password reset, please ignore this email — your account is safe.
      </div>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} ${app}. All rights reserved.</p>
      <p>This is an automated email. Please do not reply.</p>
    </div>
  </div>
</body>
</html>`;

    GmailApp.sendEmail(to, subject, 
      `Dear ${name},\n\nReset your ${app} password here: ${resetLink}\n\nThis link expires in 1 hour.\n\n— ${app} Team`, 
      { htmlBody }
    );

    return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
