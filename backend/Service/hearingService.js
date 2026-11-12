const transporter = require("../config/smtp");
const { assignHearingTemplate } = require("../utils/hearingEmailTemplate");
const { sendHearingWhatsAppMessage } = require("./whatsappHearingService");
const CaseNotification = require("../models/caseNotification");

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
    from: process.env.SMTP_FROM || `"Utkal ODR" <${process.env.SMTP_USER || process.env.EMAIL}>`,
    to,
    subject: `Hearing Scheduled - Case ${caseId}: ${caseName}`,
    html,
  });
}

/**
 * Notifies Claimant, Respondent, and Neutral via Email & WhatsApp for a scheduled Joint Hearing
 */
async function notifyAllHearingParties(hearing, caseData = null) {
  const results = {
    emails: [],
    whatsapps: [],
  };

  const caseName = hearing.caseName || caseData?.DisputeName || "Dispute Hearing";
  const caseId = hearing.caseId || caseData?.caseId || "ODR-CASE";
  const createdAt = hearing.date || hearing.createdAt || new Date();
  const hearingType = hearing.hearingType || "Joint Session Mediation";
  const duration = hearing.duration || "45";
  const time = hearing.time || "11:00 AM";
  const location = hearing.location || "Virtual Hearing Chamber";
  const meetLink = hearing.meetLink || `https://utkalodr.com/chamber/${caseId}`;

  // 1. Determine Recipients
  const claimantEmail = caseData?.CustomersEmail || caseData?.claimant?.email || hearing.claimant?.email;
  const claimantPhone = caseData?.CustomersMobileNumber || caseData?.claimant?.phone || hearing.claimant?.phone;

  const respondentEmail = caseData?.oppositePartyEmail || caseData?.respondent?.email || hearing.respondentEmail;
  const respondentPhone = caseData?.oppositeMobile || caseData?.respondent?.phone || hearing.respondentPhone;

  const neutralEmail = caseData?.neutral?.email || hearing.neutral?.email;

  // 2. Send Emails
  const emailRecipients = [
    { role: "claimant", email: claimantEmail },
    { role: "respondent", email: respondentEmail },
    { role: "neutral", email: neutralEmail },
  ];

  for (const recipient of emailRecipients) {
    if (recipient.email) {
      try {
        const mailRes = await sendAssignHearingEmail(
          recipient.email,
          caseName,
          caseId,
          createdAt,
          hearingType,
          duration,
          time,
          location,
          meetLink
        );
        results.emails.push({ recipient: recipient.email, role: recipient.role, status: "sent", messageId: mailRes.messageId });

        await CaseNotification.create({
          caseId: caseData?._id || hearing._id,
          claimantEmail: recipient.role === "claimant" ? recipient.email : undefined,
          respondentEmail: recipient.role === "respondent" ? recipient.email : undefined,
          neutralEmail: recipient.role === "neutral" ? recipient.email : undefined,
          type: "email",
          status: "sent",
          HearingMessage: {
            caseName,
            caseId,
            hearingType,
            duration,
            time,
            location,
            meetLink,
            recipientRole: recipient.role,
            recipientEmail: recipient.email,
            sentAt: new Date(),
          },
        });
      } catch (err) {
        console.error(`Failed to send hearing email to ${recipient.role} (${recipient.email}):`, err.message);
        results.emails.push({ recipient: recipient.email, role: recipient.role, status: "failed", error: err.message });
        await CaseNotification.create({
          caseId: caseData?._id || hearing._id,
          type: "email",
          status: "failed",
          error: `Email to ${recipient.email} failed: ${err.message}`,
        });
      }
    }
  }

  // 3. Send WhatsApp Messages
  const whatsappRecipients = [
    { role: "claimant", phone: claimantPhone, email: claimantEmail },
    { role: "respondent", phone: respondentPhone, email: respondentEmail },
  ];

  for (const recipient of whatsappRecipients) {
    if (recipient.phone) {
      try {
        const waRes = await sendHearingWhatsAppMessage(
          recipient.phone,
          caseName,
          caseId,
          createdAt,
          hearingType,
          duration,
          time,
          location,
          meetLink
        );
        results.whatsapps.push({ recipient: recipient.phone, role: recipient.role, status: "sent", sid: waRes.sid });

        await CaseNotification.create({
          caseId: caseData?._id || hearing._id,
          type: "whatsapp",
          status: "sent",
          claimantEmail: recipient.role === "claimant" ? recipient.email : undefined,
          respondentEmail: recipient.role === "respondent" ? recipient.email : undefined,
          HearingMessage: {
            caseName,
            caseId,
            hearingType,
            duration,
            time,
            location,
            meetLink,
            phone: recipient.phone,
            recipientRole: recipient.role,
            sid: waRes.sid,
            sentAt: new Date(),
          },
        });
      } catch (err) {
        console.warn(`Twilio WhatsApp to ${recipient.role} (${recipient.phone}) status:`, err.message);
        results.whatsapps.push({ recipient: recipient.phone, role: recipient.role, status: "failed", error: err.message });

        await CaseNotification.create({
          caseId: caseData?._id || hearing._id,
          type: "whatsapp",
          status: "failed",
          error: `WhatsApp to ${recipient.phone} failed: ${err.message}`,
        });
      }
    }
  }

  return results;
}

module.exports = { sendAssignHearingEmail, notifyAllHearingParties };
