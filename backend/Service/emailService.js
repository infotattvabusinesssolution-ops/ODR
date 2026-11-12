const transporter = require("../config/smtp");
const CaseNotification = require("../models/caseNotification");
const { resolveAbsoluteFileUrl } = require("../utils/fileStorage");
const {
  assignNeutralTemplate,
  disputeFilerAcknowledgmentTemplate,
  adminDisputeAlertTemplate,
  disputeNoticeRespondentTemplate,
  partyNeutralAssignedTemplate,
  evidenceUploadedTemplate,
  awardPublishedTemplate,
} = require("../utils/emailTemplates");

function getSenderAddress() {
  return (
    process.env.SMTP_FROM ||
    `"Utkal ODR" <${process.env.SMTP_USER || process.env.EMAIL || "contact@utkalodr.com"}>`
  );
}

function getAdminEmail() {
  return process.env.SMTP_USER || process.env.EMAIL || "contact@utkalodr.com";
}

function isValidEmail(value) {
  return typeof value === "string" && value.trim().includes("@");
}

function formatIstDateTime(dateInput) {
  const dateObj = dateInput ? new Date(dateInput) : new Date();
  return dateObj.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
}

function resolveCaseContacts(caseData = {}) {
  return {
    claimantEmail: (caseData.CustomersEmail || caseData.claimant?.email || "").trim(),
    claimantName: caseData.CustomersName || caseData.claimant?.name || "Claimant",
    respondentEmail: (caseData.oppositePartyEmail || caseData.respondent?.email || "").trim(),
    respondentName: caseData.oppositePartyName || caseData.respondent?.name || "Respondent",
    neutralEmail: (caseData.neutral?.email || "").trim(),
    neutralName: caseData.neutral?.name || "Mediator",
  };
}

/**
 * Send one email via Hostinger SMTP and persist an audit row in caseNotification.
 */
async function sendTrackedMail({ to, subject, html, role = "party", logData = null }) {
  if (!isValidEmail(to)) {
    return { recipient: role, skipped: true };
  }

  const trimmedTo = to.trim();
  try {
    const info = await transporter.sendMail({
      from: getSenderAddress(),
      to: trimmedTo,
      subject,
      html,
    });
    console.log(`✅ Email sent to ${role} (${trimmedTo}) [ID: ${info.messageId}]`);

    if (logData) {
      await CaseNotification.create({
        ...logData,
        type: logData.type || "email",
        status: "sent",
      }).catch((dbErr) => {
        console.warn("CaseNotification save note:", dbErr.message);
      });
    }

    return { recipient: role, to: trimmedTo, success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`❌ Failed to send email to ${role} (${trimmedTo}):`, err.message);

    if (logData) {
      await CaseNotification.create({
        ...logData,
        type: "email",
        status: "failed",
        error: `Email to ${trimmedTo} failed: ${err.message}`,
      }).catch(() => {});
    }

    return { recipient: role, to: trimmedTo, success: false, error: err.message };
  }
}

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

  return await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.EMAIL,
    to,
    subject: `Neutral Assigned - Case ${caseNumber}`,
    html,
  });
}

/**
 * Step 1: Landing Page guest submission — emails Guest (confirmation) & Admin (alert).
 * Holds Respondent email until Admin reviews/assigns the case.
 */
async function sendDisputeEmails(caseData) {
  const formattedDate = formatIstDateTime(caseData.createdAt);
  const emailPayload = {
    ...caseData,
    fileUrl: resolveAbsoluteFileUrl(caseData.fileUrl || ""),
    createdAt: formattedDate,
  };

  const tasks = [
    sendTrackedMail({
      to: caseData.customerEmail,
      role: "customer",
      subject: `Dispute Submission Confirmation - ${caseData.caseId} | Utkal ODR`,
      html: disputeFilerAcknowledgmentTemplate(emailPayload),
    }),
    sendTrackedMail({
      to: getAdminEmail(),
      role: "admin",
      subject: `🚨 New Dispute Filed: ${caseData.caseId} - ${caseData.customerName || "Applicant"}`,
      html: adminDisputeAlertTemplate(emailPayload),
    }),
  ];

  return await Promise.allSettled(tasks);
}

/**
 * Step 2: Case Registration from Admin (`+ New Case`) or Claimant (`File Case`).
 * - Claimant/Guest always receives registration confirmation.
 * - Claimant-filed cases alert Admin.
 * - Admin-filed cases send a formal Notice of Dispute directly to Respondent.
 */
async function sendCaseRegistrationEmails(caseData, { isAdminFiled = false, fileUrl = "" } = {}) {
  const contacts = resolveCaseContacts(caseData);
  const formattedDate = formatIstDateTime(caseData.createdAt);
  const absFileUrl = resolveAbsoluteFileUrl(fileUrl || caseData.file || "");

  const basePayload = {
    caseId: caseData.caseId,
    customerName: contacts.claimantName,
    customerEmail: contacts.claimantEmail,
    customerMobile: caseData.CustomersMobileNumber || "",
    customerAadhar: caseData.CustomersAadharNumber || "",
    disputeType: caseData.DisputeType || "Other",
    disputeName: caseData.DisputeName || "General Dispute",
    disputeAmount: caseData.DisputeAmount || "Not Specified",
    oppositePartyName: contacts.respondentName,
    oppositePartyEmail: contacts.respondentEmail,
    oppositeMobile: caseData.oppositeMobile || "",
    fileUrl: absFileUrl,
    createdAt: formattedDate,
  };

  const tasks = [
    sendTrackedMail({
      to: contacts.claimantEmail,
      role: "claimant",
      subject: `Case Registered - ${caseData.caseId} | Utkal ODR`,
      html: disputeFilerAcknowledgmentTemplate(basePayload),
      logData: {
        caseId: caseData._id,
        claimant: caseData.claimant || undefined,
        claimantEmail: contacts.claimantEmail,
        CaseMessage: {
          title: "Case Registration Confirmation",
          caseId: caseData.caseId,
          caseName: caseData.DisputeName,
          sentAt: new Date(),
        },
      },
    }),
  ];

  if (!isAdminFiled) {
    tasks.push(
      sendTrackedMail({
        to: getAdminEmail(),
        role: "admin",
        subject: `🚨 New Case Filed by Claimant: ${caseData.caseId} - ${contacts.claimantName}`,
        html: adminDisputeAlertTemplate(basePayload),
        logData: {
          caseId: caseData._id,
          claimantEmail: contacts.claimantEmail,
          CaseMessage: {
            title: "New Claimant Case Filing Alert",
            caseId: caseData.caseId,
            caseName: caseData.DisputeName,
            sentAt: new Date(),
          },
        },
      })
    );
  }

  if (isAdminFiled && isValidEmail(contacts.respondentEmail)) {
    tasks.push(
      sendTrackedMail({
        to: contacts.respondentEmail,
        role: "respondent",
        subject: `Official Notice of Dispute - Case ${caseData.caseId} | Utkal ODR`,
        html: disputeNoticeRespondentTemplate(basePayload),
        logData: {
          caseId: caseData._id,
          respondentEmail: contacts.respondentEmail,
          CaseMessage: {
            title: "Notice of Dispute Dispatched",
            caseId: caseData.caseId,
            caseName: caseData.DisputeName,
            sentAt: new Date(),
          },
        },
      })
    );
  }

  return await Promise.allSettled(tasks);
}

/**
 * Step 3: Admin assigns Mediator — emails Mediator, Claimant, and Respondent.
 */
async function sendCaseAssignmentEmails(caseData) {
  const contacts = resolveCaseContacts(caseData);
  const assignedDate = new Date().toISOString().substring(0, 10);
  const formattedCreatedAt = formatIstDateTime(caseData.createdAt);

  const summaryPayload = {
    caseId: caseData.caseId,
    assignedNeutral: contacts.neutralName,
    title: `${caseData.DisputeName || "Dispute"} vs ${contacts.respondentName}`,
    disputeType: caseData.DisputeType || "General",
    assignedDate,
  };

  const tasks = [];

  if (isValidEmail(contacts.neutralEmail)) {
    tasks.push(
      sendTrackedMail({
        to: contacts.neutralEmail,
        role: "neutral",
        subject: `Neutral Assigned - Case ${caseData.caseId}`,
        html: assignNeutralTemplate(
          caseData.caseId,
          contacts.neutralName,
          caseData.DisputeType,
          caseData.DisputeName,
          contacts.respondentName,
          formattedCreatedAt
        ),
        logData: {
          caseId: caseData._id,
          neutral: caseData.neutral?._id || undefined,
          type: "assignment-summary",
          neutralEmail: contacts.neutralEmail,
          claimantEmail: contacts.claimantEmail,
          respondentEmail: contacts.respondentEmail,
          CaseMessage: summaryPayload,
        },
      })
    );
  }

  if (isValidEmail(contacts.claimantEmail)) {
    tasks.push(
      sendTrackedMail({
        to: contacts.claimantEmail,
        role: "claimant",
        subject: `Mediator Appointed - Case ${caseData.caseId} | Utkal ODR`,
        html: partyNeutralAssignedTemplate({
          recipientRole: "claimant",
          recipientName: contacts.claimantName,
          caseId: caseData.caseId,
          disputeType: caseData.DisputeType,
          disputeName: caseData.DisputeName,
          claimantName: contacts.claimantName,
          oppositePartyName: contacts.respondentName,
          neutralName: contacts.neutralName,
          neutralEmail: contacts.neutralEmail,
          assignedDate,
        }),
        logData: {
          caseId: caseData._id,
          claimant: caseData.claimant?._id || undefined,
          claimantEmail: contacts.claimantEmail,
          CaseMessage: { ...summaryPayload, recipientRole: "claimant" },
        },
      })
    );
  }

  if (isValidEmail(contacts.respondentEmail)) {
    tasks.push(
      sendTrackedMail({
        to: contacts.respondentEmail,
        role: "respondent",
        subject: `Notice of Dispute & Mediator Appointed - Case ${caseData.caseId} | Utkal ODR`,
        html: partyNeutralAssignedTemplate({
          recipientRole: "respondent",
          recipientName: contacts.respondentName,
          caseId: caseData.caseId,
          disputeType: caseData.DisputeType,
          disputeName: caseData.DisputeName,
          claimantName: contacts.claimantName,
          oppositePartyName: contacts.respondentName,
          neutralName: contacts.neutralName,
          neutralEmail: contacts.neutralEmail,
          assignedDate,
        }),
        logData: {
          caseId: caseData._id,
          respondentEmail: contacts.respondentEmail,
          CaseMessage: { ...summaryPayload, recipientRole: "respondent" },
        },
      })
    );
  }

  return await Promise.allSettled(tasks);
}

/**
 * Step 5: Evidence uploaded by Claimant, Respondent, or Admin.
 * Notifies Opposite Party + Mediator (or both parties + Mediator for Admin uploads).
 */
async function sendEvidenceNotificationEmails({
  caseData = null,
  caseId,
  documentName,
  fileUrl = "",
  uploadedBy = "CLAIMANT",
  status = "Pending",
}) {
  const contacts = resolveCaseContacts(caseData || {});
  const uploaderNorm = String(uploadedBy || "CLAIMANT").trim().toUpperCase();
  const absFileUrl = resolveAbsoluteFileUrl(fileUrl);
  const uploadedAt = formatIstDateTime(new Date());
  const resolvedCaseId = caseData?.caseId || caseId || "ODR-CASE";
  const disputeName = caseData?.DisputeName || "Dispute Case";

  const uploadedByLabel =
    uploaderNorm === "RESPONDENT"
      ? `Respondent (${contacts.respondentName})`
      : uploaderNorm === "ADMIN"
      ? "Utkal ODR Administration"
      : `Claimant (${contacts.claimantName})`;

  const recipients = [];
  if (uploaderNorm === "CLAIMANT") {
    recipients.push({ role: "neutral", email: contacts.neutralEmail, name: contacts.neutralName });
    recipients.push({ role: "respondent", email: contacts.respondentEmail, name: contacts.respondentName });
  } else if (uploaderNorm === "RESPONDENT") {
    recipients.push({ role: "neutral", email: contacts.neutralEmail, name: contacts.neutralName });
    recipients.push({ role: "claimant", email: contacts.claimantEmail, name: contacts.claimantName });
  } else {
    recipients.push({ role: "neutral", email: contacts.neutralEmail, name: contacts.neutralName });
    recipients.push({ role: "claimant", email: contacts.claimantEmail, name: contacts.claimantName });
    recipients.push({ role: "respondent", email: contacts.respondentEmail, name: contacts.respondentName });
  }

  const seenEmails = new Set();
  const tasks = [];

  for (const recipient of recipients) {
    if (!isValidEmail(recipient.email)) continue;
    const key = recipient.email.toLowerCase();
    if (seenEmails.has(key)) continue;
    seenEmails.add(key);

    tasks.push(
      sendTrackedMail({
        to: recipient.email,
        role: recipient.role,
        subject: `New Evidence Uploaded - Case ${resolvedCaseId} | Utkal ODR`,
        html: evidenceUploadedTemplate({
          recipientName: recipient.name,
          caseId: resolvedCaseId,
          disputeName,
          documentName,
          uploadedByLabel,
          statusLabel: status,
          fileUrl: absFileUrl,
          uploadedAt,
        }),
        logData: {
          caseId: caseData?._id || undefined,
          claimantEmail: recipient.role === "claimant" ? recipient.email : undefined,
          respondentEmail: recipient.role === "respondent" ? recipient.email : undefined,
          neutralEmail: recipient.role === "neutral" ? recipient.email : undefined,
          CaseMessage: {
            title: "New Evidence Uploaded",
            caseId: resolvedCaseId,
            caseName: disputeName,
            documentName,
            uploadedBy: uploadedByLabel,
            fileUrl: absFileUrl,
            recipientRole: recipient.role,
            sentAt: new Date(),
          },
        },
      })
    );
  }

  return await Promise.allSettled(tasks);
}

/**
 * Step 6: Award / Order published — notifies Claimant, Respondent, and Admin.
 */
async function sendAwardPublishedEmails({ award, caseData = null }) {
  const contacts = resolveCaseContacts(caseData || {});
  const resolvedCaseId = award.caseId || caseData?.caseId || "ODR-CASE";
  const caseTitle =
    caseData?.DisputeName || `${contacts.claimantName} vs ${contacts.respondentName}`;
  const absFileUrl = resolveAbsoluteFileUrl(award.fileUrl || "");
  const publishedAt = formatIstDateTime(new Date());

  const targets = [
    { role: "claimant", email: contacts.claimantEmail, name: contacts.claimantName },
    { role: "respondent", email: contacts.respondentEmail, name: contacts.respondentName },
    { role: "admin", email: getAdminEmail(), name: "Utkal ODR Admin" },
  ];

  const seenEmails = new Set();
  const tasks = [];

  for (const target of targets) {
    if (!isValidEmail(target.email)) continue;
    const key = target.email.toLowerCase();
    if (seenEmails.has(key)) continue;
    seenEmails.add(key);

    tasks.push(
      sendTrackedMail({
        to: target.email,
        role: target.role,
        subject: `${award.documentType || "Final Order / Award"} Published - Case ${resolvedCaseId} | Utkal ODR`,
        html: awardPublishedTemplate({
          recipientName: target.name,
          caseId: resolvedCaseId,
          caseTitle,
          documentType: award.documentType || "Final Award",
          fileName: award.fileName,
          summary: award.summary || "",
          fileUrl: absFileUrl,
          publishedAt,
        }),
        logData: {
          caseId: caseData?._id || undefined,
          claimantEmail: target.role === "claimant" ? target.email : undefined,
          respondentEmail: target.role === "respondent" ? target.email : undefined,
          CaseMessage: {
            title: `${award.documentType || "Final Award"} Published`,
            caseId: resolvedCaseId,
            caseName: caseTitle,
            fileName: award.fileName,
            fileUrl: absFileUrl,
            recipientRole: target.role,
            sentAt: new Date(),
          },
        },
      })
    );
  }

  return await Promise.allSettled(tasks);
}

module.exports = {
  sendAssignEmail,
  sendDisputeEmails,
  sendCaseRegistrationEmails,
  sendCaseAssignmentEmails,
  sendEvidenceNotificationEmails,
  sendAwardPublishedEmails,
};
