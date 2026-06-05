const express    = require('express');
const cors       = require('cors');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json());

const SMTP_USER = 'doc@saikatchowdhury.com';
const SMTP_PASS = 'Doc#123&@##';

const transporter = nodemailer.createTransport({
  host:   'smtp.hostinger.com',
  port:   465,
  secure: true,   // SSL on port 465
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,  // Required for Hostinger SSL compatibility
  },
  connectionTimeout: 10000,
  greetingTimeout:   5000,
});

transporter.verify((err, success) => {
  if (err) {
    console.error('❌ SMTP Connection Failed:', err.message);
    console.error('   Check credentials and that smtp.hostinger.com:465 is reachable.');
  } else {
    console.log('✅ SMTP ready — sending from', SMTP_USER);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/send-otp
// Body: { email, otp }
// ─────────────────────────────────────────────────────────────────────────────
app.post('/api/send-otp', async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and OTP required' });
  }

  try {
    await transporter.sendMail({
      from:    `"DocOclock" <${SMTP_USER}>`,
      to:      email,
      subject: `DocOclock Verification Code: ${otp}`,
      html: `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:480px;margin:0 auto;padding:40px 20px;background:#ffffff;">
          <div style="text-align:center;margin-bottom:32px;">
            <div style="display:inline-block;background:linear-gradient(135deg,#3B82F6,#1D4ED8);color:white;width:64px;height:64px;border-radius:20px;line-height:64px;font-size:28px;font-weight:900;">D</div>
            <h1 style="margin:16px 0 4px;font-size:28px;font-weight:900;color:#0F172A;letter-spacing:-0.5px;">DocOclock</h1>
            <p style="color:#64748B;font-size:13px;margin:0;font-weight:600;">Healthcare Platform</p>
          </div>
          <div style="background:linear-gradient(145deg,#F8FAFC,#F1F5F9);border:1px solid #E2E8F0;border-radius:24px;padding:40px 32px;text-align:center;">
            <p style="color:#475569;font-size:15px;margin:0 0 24px;font-weight:600;">Your verification code is:</p>
            <div style="background:#0F172A;color:white;font-size:40px;font-weight:900;letter-spacing:14px;padding:24px 40px;border-radius:16px;font-family:'SF Mono','Fira Code',monospace;display:inline-block;box-shadow:0 8px 32px rgba(15,23,42,0.3);">${otp}</div>
            <p style="color:#94A3B8;font-size:12px;margin:28px 0 0;font-weight:600;">This code expires in <strong style="color:#475569;">10 minutes</strong></p>
          </div>
          <div style="margin-top:32px;padding:20px;background:#FFFBEB;border:1px solid #FEF3C7;border-radius:16px;">
            <p style="color:#92400E;font-size:12px;margin:0;font-weight:600;line-height:1.6;">⚠️ Do not share this code with anyone. DocOclock staff will never ask for your verification code.</p>
          </div>
          <p style="color:#CBD5E1;font-size:11px;text-align:center;margin-top:32px;font-weight:500;">© ${new Date().getFullYear()} DocOclock Healthcare Platform<br/>If you didn't request this code, please ignore this email.</p>
        </div>
      `,
    });

    console.log(`📧 OTP sent to ${email}`);
    res.json({ success: true });
  } catch (error) {
    console.error('❌ OTP send failed:', error.message);
    res.status(500).json({ error: 'Failed to send OTP: ' + error.message });
  }
});


// ─────────────────────────────────────────────────────────────────────────────
// POST /api/send-doctor-status
// Body: { email, doctorName, status: 'approved' | 'rejected' }
// Sent by Super Admin when approving or rejecting a doctor application.
// ─────────────────────────────────────────────────────────────────────────────
app.post('/api/send-doctor-status', async (req, res) => {
  const { email, doctorName, status } = req.body;
  if (!email || !doctorName || !status) {
    return res.status(400).json({ error: 'email, doctorName and status are required' });
  }

  const isApproved = status === 'approved';

  const subject = isApproved
    ? '🎉 Your DocOclock Doctor Account Has Been Approved'
    : 'Update on Your DocOclock Doctor Application';

  const headerColor  = isApproved ? '#10B981' : '#EF4444';
  const headerText   = isApproved ? '✅ Application Approved' : '❌ Application Not Approved';
  const bodyMessage  = isApproved
    ? `Congratulations, <strong>${doctorName}</strong>! Your doctor account on DocOclock has been reviewed and <strong>approved</strong> by our administration team. You can now log in to your account and start managing your appointments.`
    : `Dear <strong>${doctorName}</strong>, after careful review, your doctor application on DocOclock could not be approved at this time. If you believe this is an error or would like more information, please contact our support team.`;

  const ctaButton = isApproved
    ? `<a href="https://dococlock.com" style="display:inline-block;background:#10B981;color:white;padding:14px 32px;border-radius:12px;font-weight:700;font-size:15px;text-decoration:none;margin-top:24px;">Log In to DocOclock →</a>`
    : `<a href="mailto:support@dococlock.com" style="display:inline-block;background:#64748B;color:white;padding:14px 32px;border-radius:12px;font-weight:700;font-size:15px;text-decoration:none;margin-top:24px;">Contact Support</a>`;

  try {
    await transporter.sendMail({
      from:    `"DocOclock Admin" <${SMTP_USER}>`,
      to:      email,
      subject,
      html: `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:520px;margin:0 auto;padding:40px 20px;background:#ffffff;">
          <div style="text-align:center;margin-bottom:32px;">
            <div style="display:inline-block;background:linear-gradient(135deg,#3B82F6,#1D4ED8);color:white;width:64px;height:64px;border-radius:20px;line-height:64px;font-size:28px;font-weight:900;">D</div>
            <h1 style="margin:16px 0 4px;font-size:26px;font-weight:900;color:#0F172A;">DocOclock</h1>
            <p style="color:#64748B;font-size:13px;margin:0;font-weight:600;">Healthcare Platform</p>
          </div>

          <div style="background:${headerColor};border-radius:20px 20px 0 0;padding:28px 32px;text-align:center;">
            <h2 style="color:white;margin:0;font-size:22px;font-weight:800;">${headerText}</h2>
          </div>

          <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-top:none;border-radius:0 0 20px 20px;padding:32px;text-align:center;">
            <p style="color:#334155;font-size:15px;line-height:1.7;margin:0 0 8px;">${bodyMessage}</p>
            ${ctaButton}
          </div>

          <p style="color:#CBD5E1;font-size:11px;text-align:center;margin-top:32px;">© ${new Date().getFullYear()} DocOclock Healthcare Platform</p>
        </div>
      `,
    });

    console.log(`📧 Doctor status email (${status}) sent to ${email}`);
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Doctor status email failed:', error.message);
    res.status(500).json({ error: 'Failed to send email: ' + error.message });
  }
});


// ─────────────────────────────────────────────────────────────────────────────
// GET /api/health
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', smtp: SMTP_USER });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`📬 DocOclock Email Server running on http://localhost:${PORT}`);
});
