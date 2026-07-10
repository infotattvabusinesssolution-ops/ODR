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
  return `
  <div style="font-family: Arial, sans-serif; padding: 20px; background:#f7f7f7;">
    <div style="max-width:600px; margin:auto; background:white; padding:20px; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.1);">

      <h2 style="color:#0066cc;">Hearing Scheduled</h2>

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
          <td style="background:#fafafa; padding:10px;"><b>createdAt</b></td>
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
          <td style="padding:10px;">${duration} min</td>
        </tr>

        <tr>
          <td style="background:#fafafa; padding:10px;"><b>Location</b></td>
          <td style="padding:10px;">${location}</td>
        </tr>

       

        <tr>
          <td style="background:#fafafa; padding:10px;"><b>Google Meet</b></td>
          <td style="padding:10px;">
            <a href="${meetLink}" style="color:#0066cc; font-weight:bold;">Join Meeting</a>
          </td>
        </tr>

      </table>

      <p style="margin-top:20px; font-size:14px; color:#555;">
        Regards,<br/> <strong>ODR Team</strong>
      </p>

    </div>
  </div>
  `;
}

module.exports = { assignHearingTemplate };
