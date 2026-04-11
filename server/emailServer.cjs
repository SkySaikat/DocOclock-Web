const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json());

// Hostinger SMTP Config
const transporter = nodemailer.createTransport({
  host: 'smtp.hostinger.com',
  port: 465,
  secure: true,
  auth: {
    user: 'doc@saikatchowdhury.com',
    pass: 'Doc#123&@##',
  },
});

// Verify SMTP connection on startup
transporter.verify((err, success) => {
  if (err) {
    console.error('❌ SMTP Connection Failed:', err.message);
  } else {
    console.log('✅ SMTP Server Ready — doc@saikatchowdhury.com');
  }
});

// Send OTP endpoint
app.post('/api/send-otp', async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and OTP required' });
  }

  try {
    await transporter.sendMail({
      from: '"DocOclock" <doc@saikatchowdhury.com>',
      to: email,
      subject: `DocOclock Verification Code: ${otp}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px; background: #ffffff;">
          <div style="text-align: center; margin-bottom: 32px;">
            <div style="display: inline-block; background: linear-gradient(135deg, #3B82F6, #1D4ED8); color: white; width: 64px; height: 64px; border-radius: 20px; line-height: 64px; font-size: 28px; font-weight: 900;">D</div>
            <h1 style="margin: 16px 0 4px; font-size: 28px; font-weight: 900; color: #0F172A; letter-spacing: -0.5px;">DocOclock</h1>
            <p style="color: #64748B; font-size: 13px; margin: 0; font-weight: 600;">Healthcare Platform</p>
          </div>
          
          <div style="background: linear-gradient(145deg, #F8FAFC, #F1F5F9); border: 1px solid #E2E8F0; border-radius: 24px; padding: 40px 32px; text-align: center;">
            <p style="color: #475569; font-size: 15px; margin: 0 0 24px; font-weight: 600;">Your verification code is:</p>
            <div style="background: #0F172A; color: white; font-size: 40px; font-weight: 900; letter-spacing: 14px; padding: 24px 40px; border-radius: 16px; font-family: 'SF Mono', 'Fira Code', monospace; display: inline-block; box-shadow: 0 8px 32px rgba(15, 23, 42, 0.3);">
              ${otp}
            </div>
            <p style="color: #94A3B8; font-size: 12px; margin: 28px 0 0; font-weight: 600;">This code expires in <strong style="color: #475569;">10 minutes</strong></p>
          </div>
          
          <div style="margin-top: 32px; padding: 20px; background: #FFFBEB; border: 1px solid #FEF3C7; border-radius: 16px;">
            <p style="color: #92400E; font-size: 12px; margin: 0; font-weight: 600; line-height: 1.6;">
              ⚠️ Do not share this code with anyone. DocOclock staff will never ask for your verification code.
            </p>
          </div>
          
          <p style="color: #CBD5E1; font-size: 11px; text-align: center; margin-top: 32px; font-weight: 500;">
            © ${new Date().getFullYear()} DocOclock Healthcare Platform<br/>
            If you didn't request this code, please ignore this email.
          </p>
        </div>
      `,
    });

    console.log(`📧 OTP sent to ${email}`);
    res.json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    console.error('❌ Email send failed:', error.message);
    res.status(500).json({ error: 'Failed to send email: ' + error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', smtp: 'doc@saikatchowdhury.com' });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`📬 DocOclock Email Server running on http://localhost:${PORT}`);
});
