const twilio = require("twilio");
const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);

async function sendWhatsAppMessage(
  phone,
  caseNumber,
  DisputeType,
  DisputeName,
  oppositePartyName,
  createdAt,
  neutralName
) {
  let to = phone.startsWith("+") ? phone : `+91${phone}`;
  const toWhats = `whatsapp:${to}`;

  const formattedDate = new Date(createdAt).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const message = `
📌 *Neutral Assigned*
----------------------------------
🆔 *Case Number:* ${caseNumber}
👤 *Neutral:* ${neutralName}

⚖️ *Title:* ${DisputeName} vs ${oppositePartyName}
📂 *Type:* ${DisputeType}
📅 *Assigned Date:* ${formattedDate}

— ODR System
`;

  const res = await client.messages.create({
    from: process.env.TWILIO_WHATSAPP_FROM,
    to: toWhats,
    body: message,
  });

  return { sid: res.sid };
}

module.exports = { sendWhatsAppMessage };
