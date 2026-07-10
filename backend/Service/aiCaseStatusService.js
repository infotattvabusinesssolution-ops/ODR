const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

async function generateCaseStatusAnswer({ question, caseData }) {
  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",

      messages: [
        {
          role: "system",
          content: `
You are Saya-AI, an ODR Case Status Assistant.

You only answer questions about:
- case status
- verification status
- rejection reason
- assigned neutral
- hearing date, time, and link
- document upload status
- award/status progress
- next step in the case process

Rules:
- Do not give legal advice.
- Do not predict case results.
- Do not summarize legal documents.
- Do not create fake data.
- Only use the JSON case data provided.
- If information is missing, say it is not available yet.
- If the question is unrelated, say:
"I can only help with your ODR case status and related progress."
`,
        },

        {
          role: "user",
          content: `
User question:
${question}

Case data:
${JSON.stringify(caseData, null, 2)}

Give a clear, short, professional, user-friendly answer.
`,
        },
      ],

      temperature: 0.3,
      max_tokens: 400,
    });

    return (
      completion.choices?.[0]?.message?.content ||
      "Sorry, I could not process your request."
    );
  } catch (error) {
    console.error("Groq AI Error:", error);

    return "AI assistant encountered an error while processing your request.";
  }
}

module.exports = {
  generateCaseStatusAnswer,
};