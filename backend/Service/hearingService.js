const nodemailer = require("nodemailer");
const { assignHearingTemplate } = require("../utils/hearingEmailTemplate");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

async function sendAssignHearingEmail(
  to,
  caseName,
  caseId,
  createdAt,
  hearingType,
  duration,
  time,
  location,
  meetLink
) {
  if (!to) throw new Error("No recipient email provided");

  const html = assignHearingTemplate(
    caseName,
    caseId,
    createdAt,
    hearingType,
    duration,
    time,
    location,
    meetLink
  );

  return await transporter.sendMail({
    from: process.env.EMAIL,
    to,
    subject: `Hearing Scheduled - Case ${caseId}`,
    html,
  });
}

module.exports = { sendAssignHearingEmail };
