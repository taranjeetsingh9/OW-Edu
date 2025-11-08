const AuthSession = require('../../../models/shared/AuthSession');
const logger = require('../../../shared/logger');

module.exports = {
  async sendOTP(req, res) {
    try {
      const { mobileNumber } = req.body;
      if (!mobileNumber) return res.status(400).json({ error: "Mobile is required" });

      // TODO: generate OTP + store in AuthSession + SMS send
      return res.json({ message: "OTP sent" });
    } catch (err) {
      logger.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  },

  async verifyOTP(req, res) {
    try {
      const { mobileNumber, otp } = req.body;
      if (!mobileNumber || !otp) return res.status(400).json({ error: "Missing fields" });

      // TODO: find session, verify code, issue tokens

      return res.json({ token: "fakeToken", refresh: "fakeRefresh" });
    } catch (err) {
      logger.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  },

  async refreshToken(req, res) {
    return res.json({ token: "newToken" });
  }
};
