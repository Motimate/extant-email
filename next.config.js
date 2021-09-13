const APP_URL = process.env.APP_URL || "http://localhost:8080";

module.exports = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/api/email_check",
        destination: `${APP_URL}/api/email_check`,
      },
    ];
  },
};
