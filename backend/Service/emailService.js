const transporter = require("../config/smtp");
const {
  assignNeutralTemplate,
  disputeFilerAcknowledgmentTemplate,
  adminDisputeAlertTemplate,
} = require("../utils/emailTemplates");

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
    from: process.env.SMTP_FROM || process.env.EMAIL,
    to,
    subject: `Neutral Assigned - Case ${caseNumber}`,
    html,
  });

  return info;
}

async function sendDisputeEmails(caseData) {
  const from = process.env.SMTP_FROM || `"Utkal ODR" <${process.env.SMTP_USER || process.env.EMAIL || "contact@utkalodr.com"}>`;
  const adminEmail = process.env.SMTP_USER || process.env.EMAIL || "contact@utkalodr.com";

  const formattedDate = caseData.createdAt
    ? new Date(caseData.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
    : new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

  const emailPayload = {
    ...caseData,
    createdAt: formattedDate,
  };

  const tasks = [];

  // 1. Acknowledgment email to customer/claimant
  if (caseData.customerEmail && typeof caseData.customerEmail === "string" && caseData.customerEmail.includes("@")) {
    const customerHtml = disputeFilerAcknowledgmentTemplate(emailPayload);
    tasks.push(
      transporter
        .sendMail({
          from,
          to: caseData.customerEmail.trim(),
          subject: `Dispute Submission Confirmation - ${caseData.caseId} | Utkal ODR`,
          html: customerHtml,
        })
        .then((info) => {
          console.log(`✅ Dispute acknowledgment email sent to claimant: ${caseData.customerEmail} (ID: ${info.messageId})`);
          return { recipient: "customer", success: true, messageId: info.messageId };
        })
        .catch((err) => {
          console.error(`❌ Failed to send claimant acknowledgment email to ${caseData.customerEmail}:`, err.message);
          return { recipient: "customer", success: false, error: err.message };
        })
    );
  }

  // 2. Alert email to Utkal ODR Admin
  if (adminEmail) {
    const adminHtml = adminDisputeAlertTemplate(emailPayload);
    tasks.push(
      transporter
        .sendMail({
          from,
          to: adminEmail.trim(),
          subject: `🚨 New Dispute Filed: ${caseData.caseId} - ${caseData.customerName || "Applicant"}`,
          html: adminHtml,
        })
        .then((info) => {
          console.log(`✅ Dispute alert email sent to admin: ${adminEmail} (ID: ${info.messageId})`);
          return { recipient: "admin", success: true, messageId: info.messageId };
        })
        .catch((err) => {
          console.error(`❌ Failed to send admin dispute alert to ${adminEmail}:`, err.message);
          return { recipient: "admin", success: false, error: err.message };
        })
    );
  }

  return await Promise.allSettled(tasks);
}

module.exports = { sendAssignEmail, sendDisputeEmails };
