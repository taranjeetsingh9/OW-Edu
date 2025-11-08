// send otp
// curl -X POST http://localhost:4000/auth/send-otp -H "Content-Type: application/json" -d '{"mobileNumber":"+16471234567"}' 
// verify otp
// curl -X POST http://localhost:4000/auth/verify-otp -H "Content-Type: application/json" -d '{"mobileNumber":"+16471234567", "otp":"Put_Your_OTP_Here"}' 

const AuthSession = require('../../../../models/shared/AuthSession');
const crypto = require('crypto');
const logger = require('../../../../shared/logger');

module.exports = {

  async sendOTP(req, res) {
    try {
      const { mobileNumber } = req.body;

      if (!mobileNumber || !/^\+\d{1,3}\d{7,15}$/.test(mobileNumber)) {
        return res.status(400).json({ error: "Invalid mobile number format. Use E.164 (+1234567890)" });
      }
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + (process.env.OTP_TTL_SECONDS * 1000));

      const deviceInfo = {
        userAgent: req.headers['user-agent'] || 'unknown',
        ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
        deviceId: crypto.randomUUID(),
        deviceType: 'unknown',
        browser: 'unknown',
        operatingSystem: 'unknown'
      };

      await AuthSession.create({
        mobileNumber,
        otp: {
          code: otpCode,
          expiresAt,
          attempts: 0,
          purpose: "login"
        },
        deviceInfo,
        status: "pending",
        isActive: true
      });

      if (process.env.SMS_PROVIDER === "console") {
        console.log(`📲 OTP for ${mobileNumber}: ${otpCode}`);
      }

      return res.status(200).json({ 
        message: "OTP sent successfully",
        debugOTP: process.env.NODE_ENV === "development" ? otpCode : undefined
      });

    } catch (err) {
      logger.error(err);
      res.status(500).json({ error: "Server error" });
    }
  },

  async verifyOTP(req, res) {
    try {
      const { mobileNumber, otp } = req.body;

      if (!mobileNumber || !otp) {
        return res.status(400).json({ error: "Mobile number and OTP are required" });
      }

      const session = await AuthSession.findOne({
        mobileNumber,
        status: "pending",
        isActive: true
      }).sort({ createdAt: -1 });

      if (!session) {
        return res.status(400).json({ error: "No active OTP session found" });
      }

      if (Date.now() > session.otp.expiresAt) {
        session.status = "success";
        session.isActive = false;
        await session.save();
        return res.status(400).json({ error: "OTP expired" });
      }

      if (session.otp.code !== otp) {
        session.otp.attempts += 1;
        session.security.failedAttempts += 1;
        session.security.lastAttempt = new Date();

        await session.save();
        return res.status(400).json({ error: "Invalid OTP" });
      }

      session.status = "verified";
      session.security.verifiedAt = new Date();
      session.isActive = true;

      session.sessionToken = crypto.randomBytes(30).toString("hex");
      session.refreshToken = crypto.randomBytes(40).toString("hex");

      await session.save();

      return res.status(200).json({
        message: "OTP verified",
        sessionToken: session.sessionToken,
        refreshToken: session.refreshToken
      });

    } catch (err) {
      logger.error(err);
      res.status(500).json({ error: "Server error" });
    }
  },

  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({ error: "Refresh token required" });
      }

      const session = await AuthSession.findOne({
        refreshToken,
        status: "verified",
        isActive: true
      });

      if (!session) {
        return res.status(400).json({ error: "Invalid refresh token" });
      }

      const newToken = crypto.randomBytes(30).toString("hex");
      session.sessionToken = newToken;
      await session.save();

      return res.status(200).json({ token: newToken });

    } catch (err) {
      logger.error(err);
      res.status(500).json({ error: "Server error" });
    }
  }
};
