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

module.exports = { assignNeutralTemplate };
