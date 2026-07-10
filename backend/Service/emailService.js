const nodemailer = require("nodemailer");
const { assignNeutralTemplate } = require("../utils/emailTemplates");

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

async function sendAssignEmail(
  to,
  caseNumber,
  name,
  disputeType,
  disputeName,
  oppositePartyName,
  createdAt
) {
  if (!to) throw new Error("No recipient email provided");

  const html = assignNeutralTemplate(
    caseNumber,
    name,
    disputeType,
    disputeName,
    oppositePartyName,
    createdAt
  );

  const info = await transporter.sendMail({
    from: process.env.EMAIL,
    to,
    subject: `Neutral Assigned - Case ${caseNumber}`,
    html,
  });

  return info;
}

module.exports = { sendAssignEmail };
