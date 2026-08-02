module.exports = {
  port: process.env.PORT || 5000,
  jwtSecret: process.env.JWT_SECRET,
  defaultChurchId: process.env.DEFAULT_CHURCH_ID,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
};
