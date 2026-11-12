function assignNeutralTemplate(
  caseNumber,
  name,
  DisputeType,
  DisputeName,
  oppositePartyName,
  createdAt
) {
  return `
  <div style="font-family: Arial, Helvetica, sans-serif; padding: 20px; background:#f7f7f7;">
    <div style="max-width:600px; margin:auto; background:white; padding:20px; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.1);">

      <h2 style="color:#2b7a78; margin-bottom:10px;">Neutral Assigned</h2>

      <p style="font-size:15px; color:#333;">Hello,</p>

      <p style="font-size:15px; color:#333;">
        A neutral has been <strong>successfully assigned</strong> to your case. Below are the details:
      </p>

      <table style="border-collapse: collapse; width: 100%; margin-top: 15px;">
        <tr>
          <td style="border:1px solid #ddd; padding:10px; background:#fafafa;"><b>Case Number</b></td>
          <td style="border:1px solid #ddd; padding:10px;">${caseNumber}</td>
        </tr>

        <tr>
          <td style="border:1px solid #ddd; padding:10px; background:#fafafa;"><b>Assigned Neutral</b></td>
          <td style="border:1px solid #ddd; padding:10px;">${name}</td>
        </tr>

        <tr>
          <td style="border:1px solid #ddd; padding:10px; background:#fafafa;"><b>Title</b></td>
          <td style="border:1px solid #ddd; padding:10px;">${DisputeName} vs ${oppositePartyName}</td>
        </tr>

        <tr>
          <td style="border:1px solid #ddd; padding:10px; background:#fafafa;"><b>Dispute Type</b></td>
          <td style="border:1px solid #ddd; padding:10px;">${DisputeType}</td>
        </tr>

        <tr>
          <td style="border:1px solid #ddd; padding:10px; background:#fafafa;"><b>Assigned Date</b></td>
          <td style="border:1px solid #ddd; padding:10px;">${createdAt}</td>
        </tr>
      </table>

      <p style="margin-top:20px; font-size:14px; color:#555;">
        Regards,<br/> <strong>ODR Team</strong>
      </p>

    </div>
  </div>
  `;
}

function disputeFilerAcknowledgmentTemplate({
  caseId,
  customerName,
  disputeType,
  disputeName,
  disputeAmount,
  oppositePartyName,
  createdAt,
}) {
  return `
  <div style="font-family: Arial, Helvetica, sans-serif; padding: 20px; background:#f4f6f9;">
    <div style="max-width:620px; margin:auto; background:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;">
      
      <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 24px 30px; text-align: left;">
        <h1 style="color:#ffffff; margin:0; font-size:20px; font-weight:700; letter-spacing: 0.5px;">UTKAL ODR PLATFORM</h1>
        <p style="color:#94a3b8; margin:6px 0 0; font-size:13px;">Online Dispute Resolution & Legal Mediation</p>
      </div>

      <div style="padding: 30px;">
        <div style="display:inline-block; background:#ecfdf5; color:#047857; font-size:12px; font-weight:700; padding:4px 10px; border-radius:20px; margin-bottom:15px; border:1px solid #a7f3d0;">
          DISPUTE REGISTERED SUCCESSFULLY
        </div>

        <h2 style="color:#1e293b; font-size:18px; margin: 0 0 12px;">Hello ${customerName || "Claimant"},</h2>
        
        <p style="font-size:14px; line-height:1.6; color:#475569; margin: 0 0 20px;">
          Your dispute intake submission has been received by the Utkal Online Dispute Resolution platform. Our legal administration team is currently reviewing your case details.
        </p>

        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:16px; margin-bottom:24px;">
          <h3 style="margin:0 0 12px; font-size:14px; text-transform:uppercase; color:#64748b; letter-spacing:0.5px;">Case Summary</h3>
          <table style="border-collapse: collapse; width: 100%; font-size: 14px;">
            <tr>
              <td style="padding:8px 0; color:#64748b; width:40%;"><b>Case Reference ID:</b></td>
              <td style="padding:8px 0; color:#0f172a; font-weight:700; font-family:monospace; font-size:15px;">${caseId}</td>
            </tr>
            <tr>
              <td style="padding:8px 0; color:#64748b; border-top:1px solid #f1f5f9;"><b>Dispute Category:</b></td>
              <td style="padding:8px 0; color:#334155; border-top:1px solid #f1f5f9;">${disputeType || "N/A"}</td>
            </tr>
            <tr>
              <td style="padding:8px 0; color:#64748b; border-top:1px solid #f1f5f9;"><b>Dispute Title:</b></td>
              <td style="padding:8px 0; color:#334155; border-top:1px solid #f1f5f9;">${disputeName || "General Dispute"}</td>
            </tr>
            <tr>
              <td style="padding:8px 0; color:#64748b; border-top:1px solid #f1f5f9;"><b>Claim Amount:</b></td>
              <td style="padding:8px 0; color:#334155; border-top:1px solid #f1f5f9;">₹${disputeAmount || "Not specified"}</td>
            </tr>
            <tr>
              <td style="padding:8px 0; color:#64748b; border-top:1px solid #f1f5f9;"><b>Opposite Party:</b></td>
              <td style="padding:8px 0; color:#334155; border-top:1px solid #f1f5f9;">${oppositePartyName || "N/A"}</td>
            </tr>
            <tr>
              <td style="padding:8px 0; color:#64748b; border-top:1px solid #f1f5f9;"><b>Submitted On:</b></td>
              <td style="padding:8px 0; color:#334155; border-top:1px solid #f1f5f9;">${createdAt}</td>
            </tr>
          </table>
        </div>

        <div style="background:#fffbeb; border-left:4px solid #f59e0b; padding:14px; border-radius:4px; margin-bottom:24px;">
          <p style="margin:0; font-size:13px; color:#92400e; line-height:1.5;">
            <b>Next Steps:</b> Once the initial review is complete, our administrators will assign an accredited Neutral (Mediator/Arbitrator) to this matter and notify both parties with scheduled chamber hearing details.
          </p>
        </div>

        <p style="font-size:13px; color:#64748b; line-height:1.5; margin:0;">
          If you have questions or supplementary documents to provide, reply directly to this email or reach us at <a href="mailto:contact@utkalodr.com" style="color:#2563eb; text-decoration:none;">contact@utkalodr.com</a> citing your Case ID: <b>${caseId}</b>.
        </p>
      </div>

      <div style="background:#f8fafc; padding:18px 30px; border-top:1px solid #e2e8f0; font-size:12px; color:#94a3b8; text-align:center;">
        Utkal Online Dispute Resolution • Official Dispute Intake System • Odisha, India
      </div>

    </div>
  </div>
  `;
}

function adminDisputeAlertTemplate({
  caseId,
  customerName,
  customerEmail,
  customerMobile,
  customerAadhar,
  disputeType,
  disputeName,
  disputeAmount,
  oppositePartyName,
  oppositePartyEmail,
  oppositeMobile,
  fileUrl,
  createdAt,
}) {
  return `
  <div style="font-family: Arial, Helvetica, sans-serif; padding: 20px; background:#0f172a;">
    <div style="max-width:650px; margin:auto; background:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 6px 18px rgba(0,0,0,0.2);">
      
      <div style="background:#ea580c; padding: 20px 30px; color:#ffffff;">
        <span style="background:rgba(255,255,255,0.25); font-size:11px; font-weight:800; text-transform:uppercase; padding:3px 8px; border-radius:4px; letter-spacing:1px;">ACTION REQUIRED</span>
        <h1 style="margin:8px 0 0; font-size:18px; font-weight:700;">🚨 New Dispute Case Filed via Landing Page</h1>
      </div>

      <div style="padding: 26px 30px;">
        <p style="font-size:14px; color:#334155; margin:0 0 18px; line-height:1.5;">
          A new dispute submission was received on the Utkal ODR landing portal and saved to the database. Please review the case information and assign an appropriate neutral mediator.
        </p>

        <table style="border-collapse: collapse; width: 100%; font-size: 13px; margin-bottom:20px;">
          <tr style="background:#f1f5f9;">
            <th colspan="2" style="text-align:left; padding:8px 12px; color:#1e293b; font-size:13px;">CASE IDENTIFIERS</th>
          </tr>
          <tr>
            <td style="padding:8px 12px; color:#64748b; width:35%; border-bottom:1px solid #e2e8f0;"><b>Case ID:</b></td>
            <td style="padding:8px 12px; color:#0f172a; font-weight:bold; font-family:monospace; font-size:15px; border-bottom:1px solid #e2e8f0;">${caseId}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px; color:#64748b; border-bottom:1px solid #e2e8f0;"><b>Dispute Title:</b></td>
            <td style="padding:8px 12px; color:#334155; border-bottom:1px solid #e2e8f0;">${disputeName || "General Dispute"}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px; color:#64748b; border-bottom:1px solid #e2e8f0;"><b>Dispute Type:</b></td>
            <td style="padding:8px 12px; color:#334155; border-bottom:1px solid #e2e8f0;">${disputeType || "Other"}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px; color:#64748b; border-bottom:1px solid #e2e8f0;"><b>Claim Amount:</b></td>
            <td style="padding:8px 12px; color:#047857; font-weight:bold; border-bottom:1px solid #e2e8f0;">₹${disputeAmount || "Not Specified"}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px; color:#64748b; border-bottom:1px solid #e2e8f0;"><b>Filing Date:</b></td>
            <td style="padding:8px 12px; color:#334155; border-bottom:1px solid #e2e8f0;">${createdAt}</td>
          </tr>

          <tr style="background:#f1f5f9;">
            <th colspan="2" style="text-align:left; padding:8px 12px; color:#1e293b; font-size:13px;">CLAIMANT / APPLICANT</th>
          </tr>
          <tr>
            <td style="padding:8px 12px; color:#64748b; border-bottom:1px solid #e2e8f0;"><b>Full Name:</b></td>
            <td style="padding:8px 12px; color:#334155; border-bottom:1px solid #e2e8f0;">${customerName}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px; color:#64748b; border-bottom:1px solid #e2e8f0;"><b>Email Address:</b></td>
            <td style="padding:8px 12px; color:#2563eb; border-bottom:1px solid #e2e8f0;"><a href="mailto:${customerEmail}">${customerEmail}</a></td>
          </tr>
          <tr>
            <td style="padding:8px 12px; color:#64748b; border-bottom:1px solid #e2e8f0;"><b>Phone Number:</b></td>
            <td style="padding:8px 12px; color:#334155; border-bottom:1px solid #e2e8f0;">${customerMobile || "N/A"}</td>
          </tr>
          ${customerAadhar ? `
          <tr>
            <td style="padding:8px 12px; color:#64748b; border-bottom:1px solid #e2e8f0;"><b>Aadhar Number:</b></td>
            <td style="padding:8px 12px; color:#334155; border-bottom:1px solid #e2e8f0;">${customerAadhar}</td>
          </tr>` : ""}

          <tr style="background:#f1f5f9;">
            <th colspan="2" style="text-align:left; padding:8px 12px; color:#1e293b; font-size:13px;">OPPOSITE PARTY / RESPONDENT</th>
          </tr>
          <tr>
            <td style="padding:8px 12px; color:#64748b; border-bottom:1px solid #e2e8f0;"><b>Name:</b></td>
            <td style="padding:8px 12px; color:#334155; border-bottom:1px solid #e2e8f0;">${oppositePartyName || "N/A"}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px; color:#64748b; border-bottom:1px solid #e2e8f0;"><b>Email:</b></td>
            <td style="padding:8px 12px; color:#334155; border-bottom:1px solid #e2e8f0;">${oppositePartyEmail || "N/A"}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px; color:#64748b; border-bottom:1px solid #e2e8f0;"><b>Mobile:</b></td>
            <td style="padding:8px 12px; color:#334155; border-bottom:1px solid #e2e8f0;">${oppositeMobile || "N/A"}</td>
          </tr>

          ${fileUrl ? `
          <tr style="background:#f1f5f9;">
            <th colspan="2" style="text-align:left; padding:8px 12px; color:#1e293b; font-size:13px;">ATTACHED EVIDENCE</th>
          </tr>
          <tr>
            <td style="padding:8px 12px; color:#64748b; border-bottom:1px solid #e2e8f0;"><b>Document URL:</b></td>
            <td style="padding:8px 12px; border-bottom:1px solid #e2e8f0;"><a href="${fileUrl}" target="_blank" style="color:#2563eb; font-weight:bold;">View Uploaded Document</a></td>
          </tr>` : ""}
        </table>

        <div style="text-align:center; margin-top:24px;">
          <a href="https://odr.gokulanandachaudhurifoundation.com/admin/disputes" style="display:inline-block; background:#0f172a; color:#ffffff; padding:12px 24px; text-decoration:none; border-radius:6px; font-weight:bold; font-size:14px;">Open Admin Panel & Assign Neutral</a>
        </div>
      </div>

      <div style="background:#f8fafc; padding:14px 30px; border-top:1px solid #e2e8f0; font-size:11px; color:#94a3b8; text-align:center;">
        Utkal ODR Automated Dispatch Notification • Hostinger SMTP Server
      </div>

    </div>
  </div>
  `;
}

function buildOdrEmailShell({
  headerBg = "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
  badgeText,
  badgeBg = "#ecfdf5",
  badgeColor = "#047857",
  badgeBorder = "#a7f3d0",
  heading = "UTKAL ODR PLATFORM",
  subheading = "Online Dispute Resolution & Legal Mediation",
  greetingName,
  introHtml,
  sectionTitle = "Case Summary",
  rows = [],
  highlightBoxHtml = "",
  ctaUrl = "",
  ctaLabel = "",
  ctaColor = "#2563eb",
  footerText = "Utkal Online Dispute Resolution • Official Case Notification • Odisha, India",
}) {
  const rowsHtml = rows
    .filter((r) => r && r.value !== undefined && r.value !== null && r.value !== "")
    .map(
      (r, idx) => `
      <tr>
        <td style="padding:8px 0; color:#64748b; width:40%;${idx > 0 ? " border-top:1px solid #f1f5f9;" : ""}"><b>${r.label}:</b></td>
        <td style="padding:8px 0; color:#334155;${idx > 0 ? " border-top:1px solid #f1f5f9;" : ""}${r.mono ? " font-family:monospace; font-weight:700; color:#0f172a; font-size:15px;" : ""}">${r.value}</td>
      </tr>`
    )
    .join("");

  return `
  <div style="font-family: Arial, Helvetica, sans-serif; padding: 20px; background:#f4f6f9;">
    <div style="max-width:620px; margin:auto; background:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;">
      <div style="background: ${headerBg}; padding: 24px 30px; text-align: left;">
        <h1 style="color:#ffffff; margin:0; font-size:20px; font-weight:700; letter-spacing: 0.5px;">${heading}</h1>
        <p style="color:#cbd5e1; margin:6px 0 0; font-size:13px;">${subheading}</p>
      </div>
      <div style="padding: 30px;">
        ${badgeText ? `<div style="display:inline-block; background:${badgeBg}; color:${badgeColor}; font-size:12px; font-weight:700; padding:4px 10px; border-radius:20px; margin-bottom:15px; border:1px solid ${badgeBorder};">${badgeText}</div>` : ""}
        <h2 style="color:#1e293b; font-size:18px; margin: 0 0 12px;">Hello ${greetingName || "Participant"},</h2>
        <div style="font-size:14px; line-height:1.6; color:#475569; margin: 0 0 20px;">${introHtml}</div>
        ${rowsHtml ? `
        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:16px; margin-bottom:24px;">
          <h3 style="margin:0 0 12px; font-size:14px; text-transform:uppercase; color:#64748b; letter-spacing:0.5px;">${sectionTitle}</h3>
          <table style="border-collapse: collapse; width: 100%; font-size: 14px;">${rowsHtml}</table>
        </div>` : ""}
        ${highlightBoxHtml || ""}
        ${ctaUrl && ctaLabel ? `
        <div style="text-align:center; margin: 22px 0;">
          <a href="${ctaUrl}" target="_blank" style="display:inline-block; background:${ctaColor}; color:#ffffff; padding:12px 24px; text-decoration:none; border-radius:6px; font-weight:bold; font-size:14px;">${ctaLabel}</a>
        </div>` : ""}
        <p style="font-size:13px; color:#64748b; line-height:1.5; margin:0;">
          For assistance, contact <a href="mailto:contact@utkalodr.com" style="color:#2563eb; text-decoration:none;">contact@utkalodr.com</a>.
        </p>
      </div>
      <div style="background:#f8fafc; padding:18px 30px; border-top:1px solid #e2e8f0; font-size:12px; color:#94a3b8; text-align:center;">
        ${footerText}
      </div>
    </div>
  </div>
  `;
}

function disputeNoticeRespondentTemplate({
  caseId,
  customerName,
  oppositePartyName,
  disputeType,
  disputeName,
  disputeAmount,
  createdAt,
  fileUrl,
}) {
  return buildOdrEmailShell({
    headerBg: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
    badgeText: "OFFICIAL NOTICE OF DISPUTE",
    badgeBg: "#eff6ff",
    badgeColor: "#1d4ed8",
    badgeBorder: "#bfdbfe",
    greetingName: oppositePartyName || "Respondent",
    introHtml: `A formal dispute proceeding has been registered against you by <strong>${customerName || "the Claimant"}</strong> on the <strong>Utkal Online Dispute Resolution (ODR)</strong> platform.`,
    rows: [
      { label: "Case Reference ID", value: caseId, mono: true },
      { label: "Claimant", value: customerName || "N/A" },
      { label: "Dispute Category", value: disputeType || "General" },
      { label: "Dispute Title", value: disputeName || "Dispute Filing" },
      { label: "Claim Amount", value: disputeAmount ? `₹${disputeAmount}` : "Not specified" },
      { label: "Registered On", value: createdAt },
    ],
    highlightBoxHtml: `
      <div style="background:#fffbeb; border-left:4px solid #f59e0b; padding:14px; border-radius:4px; margin-bottom:20px;">
        <p style="margin:0; font-size:13px; color:#92400e; line-height:1.5;">
          <b>Action Required:</b> Please log in to your Respondent Portal to inspect the claim filing, upload supporting evidence, and submit your response.
        </p>
      </div>`,
    ctaUrl: fileUrl || "https://odr.gokulanandachaudhurifoundation.com",
    ctaLabel: fileUrl ? "View Filed Document" : "Open ODR Portal",
  });
}

function partyNeutralAssignedTemplate({
  recipientRole,
  recipientName,
  caseId,
  disputeType,
  disputeName,
  claimantName,
  oppositePartyName,
  neutralName,
  neutralEmail,
  assignedDate,
}) {
  const isRespondent = recipientRole === "respondent";
  return buildOdrEmailShell({
    badgeText: isRespondent ? "NOTICE OF DISPUTE & MEDIATOR ASSIGNED" : "MEDIATOR ASSIGNED TO YOUR CASE",
    badgeBg: isRespondent ? "#eff6ff" : "#ecfdf5",
    badgeColor: isRespondent ? "#1d4ed8" : "#047857",
    badgeBorder: isRespondent ? "#bfdbfe" : "#a7f3d0",
    greetingName: recipientName || (isRespondent ? oppositePartyName : claimantName) || "Party",
    introHtml: isRespondent
      ? `Formal ODR proceedings have been initiated for <strong>${caseId}</strong> filed by <strong>${claimantName || "Claimant"}</strong>, and <strong>${neutralName || "an accredited Mediator"}</strong> has been appointed to conduct the resolution.`
      : `An accredited Mediator (<strong>${neutralName || "Neutral"}</strong>) has been appointed to your dispute case <strong>${caseId}</strong>.`,
    sectionTitle: "Assignment Details",
    rows: [
      { label: "Case Reference ID", value: caseId, mono: true },
      { label: "Dispute Title", value: disputeName || "Dispute Case" },
      { label: "Dispute Type", value: disputeType || "General" },
      { label: "Claimant", value: claimantName || "N/A" },
      { label: "Opposite Party", value: oppositePartyName || "N/A" },
      { label: "Assigned Mediator", value: `${neutralName || "Mediator"}${neutralEmail ? ` (${neutralEmail})` : ""}` },
      { label: "Assigned Date", value: assignedDate },
    ],
    ctaUrl: "https://odr.gokulanandachaudhurifoundation.com",
    ctaLabel: "Open ODR Portal",
  });
}

function evidenceUploadedTemplate({
  recipientName,
  caseId,
  disputeName,
  documentName,
  uploadedByLabel,
  statusLabel,
  fileUrl,
  uploadedAt,
}) {
  return buildOdrEmailShell({
    badgeText: "NEW CASE EVIDENCE SUBMITTED",
    badgeBg: "#eff6ff",
    badgeColor: "#1d4ed8",
    badgeBorder: "#bfdbfe",
    greetingName: recipientName || "Participant",
    introHtml: `A new document has been uploaded to the case record for <strong>${caseId}</strong> by <strong>${uploadedByLabel}</strong>.`,
    sectionTitle: "Document Details",
    rows: [
      { label: "Case Reference ID", value: caseId, mono: true },
      { label: "Dispute Title", value: disputeName || "Dispute Case" },
      { label: "Document Name", value: documentName || "Submitted Document" },
      { label: "Submitted By", value: uploadedByLabel },
      { label: "Status", value: statusLabel || "Pending" },
      { label: "Uploaded On", value: uploadedAt },
    ],
    ctaUrl: fileUrl || "https://odr.gokulanandachaudhurifoundation.com",
    ctaLabel: fileUrl ? "View Submitted Document" : "Open ODR Portal",
  });
}

function awardPublishedTemplate({
  recipientName,
  caseId,
  caseTitle,
  documentType,
  fileName,
  summary,
  fileUrl,
  publishedAt,
}) {
  return buildOdrEmailShell({
    headerBg: "linear-gradient(135deg, #065f46 0%, #047857 100%)",
    badgeText: "FINAL ORDER / AWARD PUBLISHED",
    badgeBg: "#ecfdf5",
    badgeColor: "#047857",
    badgeBorder: "#a7f3d0",
    greetingName: recipientName || "Party",
    introHtml: `The presiding Mediator/Arbitrator has formally published a <strong>${documentType || "Final Order / Award"}</strong> for case <strong>${caseId}</strong>.`,
    sectionTitle: "Award / Order Summary",
    rows: [
      { label: "Case Reference ID", value: caseId, mono: true },
      { label: "Case Title", value: caseTitle || "Dispute Proceeding" },
      { label: "Document Type", value: documentType || "Final Award" },
      { label: "Document File", value: fileName || "Award Document" },
      { label: "Summary", value: summary || "" },
      { label: "Published On", value: publishedAt },
    ],
    ctaUrl: fileUrl || "https://odr.gokulanandachaudhurifoundation.com",
    ctaLabel: fileUrl ? "View Published Award / Order" : "Open ODR Portal",
    ctaColor: "#047857",
  });
}

module.exports = {
  assignNeutralTemplate,
  disputeFilerAcknowledgmentTemplate,
  adminDisputeAlertTemplate,
  disputeNoticeRespondentTemplate,
  partyNeutralAssignedTemplate,
  evidenceUploadedTemplate,
  awardPublishedTemplate,
};
