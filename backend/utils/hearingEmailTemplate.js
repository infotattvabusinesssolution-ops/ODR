function assignHearingTemplate(
  caseName,
  caseId,
  createdAt,
  hearingType,
  duration,
  time,
  location,
  meetLink
) {
  const safeDuration = duration
    ? (String(duration).toLowerCase().includes("min") || String(duration).toLowerCase().includes("hr")
        ? duration
        : `${duration} min`)
    : "45 min";
  const resolvedLink = meetLink || "";

  return `
  <div style="font-family: Arial, sans-serif; padding: 20px; background:#f7f7f7;">
    <div style="max-width:600px; margin:auto; background:white; padding:24px; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.1);">

      <h2 style="color:#0066cc; margin-top:0;">Video Meeting / Hearing Scheduled</h2>

      <table style="border-collapse: collapse; width: 100%; margin-top: 15px;">

        <tr>
          <td style="background:#fafafa; padding:10px;"><b>Case Name</b></td>
          <td style="padding:10px;">${caseName}</td>
        </tr>

        <tr>
          <td style="background:#fafafa; padding:10px;"><b>Case ID</b></td>
          <td style="padding:10px;">${caseId}</td>
        </tr>
         <tr>
          <td style="background:#fafafa; padding:10px;"><b>Hearing Date</b></td>
          <td style="padding:10px;">${createdAt}</td>
        </tr>

        <tr>
          <td style="background:#fafafa; padding:10px;"><b>Hearing Type</b></td>
          <td style="padding:10px;">${hearingType}</td>
        </tr>

        <tr>
          <td style="background:#fafafa; padding:10px;"><b>Time</b></td>
          <td style="padding:10px;">${time}</td>
        </tr>

        <tr>
          <td style="background:#fafafa; padding:10px;"><b>Duration</b></td>
          <td style="padding:10px;">${safeDuration}</td>
        </tr>

        <tr>
          <td style="background:#fafafa; padding:10px;"><b>Location / Room</b></td>
          <td style="padding:10px;">${location}</td>
        </tr>

        <tr>
          <td style="background:#fafafa; padding:10px;"><b>Video Chat Link</b></td>
          <td style="padding:10px; word-break:break-all;">
            ${
              resolvedLink
                ? `<a href="${resolvedLink}" target="_blank" style="color:#0066cc; font-weight:bold;">${resolvedLink}</a>`
                : "Will be shared shortly"
            }
          </td>
        </tr>

      </table>

      ${
        resolvedLink
          ? `<div style="margin-top:20px; text-align:center;">
              <a href="${resolvedLink}" target="_blank" style="display:inline-block; padding:12px 24px; background:#0066cc; color:#ffffff; text-decoration:none; border-radius:6px; font-weight:bold;">Join Video Meeting</a>
            </div>`
          : ""
      }

      <p style="margin-top:20px; font-size:14px; color:#555;">
        Regards,<br/> <strong>Utkal ODR Team</strong>
      </p>

    </div>
  </div>
  `;
}

module.exports = { assignHearingTemplate };
