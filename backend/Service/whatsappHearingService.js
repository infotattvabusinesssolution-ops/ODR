const twilio = require("twilio");
const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);

async function sendHearingWhatsAppMessage(
  phone,
  caseName,
  caseId,
  createdAt,
  hearingType,
  duration,
  time,
  location,
  meetLink
) {
  let to = phone.startsWith("+") ? phone : `+91${phone}`;
  const toWhats = `whatsapp:${to}`;

  const formattedDate = new Date(createdAt).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const message = `
📌 *Hearing Scheduled*
----------------------------------
📂 *Case Name:* ${caseName}
🆔 *Case ID:* ${caseId}
📅 *Created On:* ${formattedDate}

⚖️ *Hearing Type:* ${hearingType}
⏱️ *Duration:* ${duration} min
🕒 *Time:* ${time}
📍 *Location:* ${location}

🔗 *Google Meet:* ${meetLink}

— ODR System
`;

  const res = await client.messages.create({
    from: process.env.TWILIO_WHATSAPP_FROM,
    to: toWhats,
    body: message,
  });

  return { sid: res.sid };
}

module.exports = { sendHearingWhatsAppMessage };
