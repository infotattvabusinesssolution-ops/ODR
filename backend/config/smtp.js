const nodemailer = require("nodemailer");

const host = process.env.SMTP_HOST || "smtp.hostinger.com";
const port = parseInt(process.env.SMTP_PORT || "465", 10);
const secure = process.env.SMTP_SECURE === "false" ? false : port === 465;

// Authenticate with Hostinger SMTP credentials
const user = process.env.SMTP_USER || "contact@utkalodr.com";
const pass = process.env.SMTP_PASS || "Utkalodr272829@30$";

const transporter = nodemailer.createTransport({
  host: host,
  port: port,
  secure: secure,
  auth: {
    user,
    pass,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

module.exports = transporter;
