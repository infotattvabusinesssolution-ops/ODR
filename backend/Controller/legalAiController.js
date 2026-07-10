const Groq = require("groq-sdk");
const axios = require("axios");
const HistoricalCase = require("../models/historicalCases");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Helper to call Gemini REST API without external libraries
const callGemini = async (prompt, isJson = false) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing in env configurations");
  }

  const payload = {
    contents: [
      {
        parts: [
          {
            text: prompt
          }
        ]
      }
    ],
    generationConfig: {
      maxOutputTokens: 2048
    }
  };

  if (isJson) {
    payload.generationConfig.responseMimeType = "application/json";
  }

  // Define endpoints to try in order (current model names, both v1 and v1beta APIs)
  const endpoints = [
    `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
    `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=${apiKey}`,
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`
  ];

  let lastError = null;
  for (const url of endpoints) {
    try {
      const response = await axios.post(url, payload, {
        headers: {
          "Content-Type": "application/json"
        }
      });
      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        return text;
      }
    } catch (err) {
      lastError = err;
      const status = err.response?.status;
      const errorMsg = err.response ? JSON.stringify(err.response.data) : err.message;
      console.warn(`Gemini endpoint failed (${url}) with status ${status}:`, errorMsg);
    }
  }

  throw lastError || new Error("All Gemini endpoints failed");
};

// Automatic seeder for historical precedents if empty
const seedPrecedentsIfEmpty = async () => {
  try {
    const count = await HistoricalCase.countDocuments();
    if (count === 0) {
      const sampleCases = [
        {
          caseTitle: "A.K. Builders v. Utkal Logistics",
          disputeType: "Commercial Contract",
          judgmentYear: 2024,
          judgmentSummary: "Dispute over unpaid cargo handling invoices. The court ruled that logistics companies must pay for services rendered under bilateral trade agreements.",
          winningParty: "Claimant",
          damagesAwarded: "₹18,50,000",
          citations: "2024 SCC Online SC 542",
          keyArguments: "Invoices were signed, delivery receipts confirmed cargo transfer, interest clause is enforceable.",
          costsEstimated: "₹85,000",
          durationMonths: 8
        },
        {
          caseTitle: "Ranjan Kumar v. TechSolutions Ltd",
          disputeType: "Employment Agreement",
          judgmentYear: 2023,
          winningParty: "Claimant",
          judgmentSummary: "Wrongful termination of software engineer without paying contractually mandated 3-month severance and accrued bonuses.",
          damagesAwarded: "₹4,50,000",
          citations: "2023 LLR 194",
          keyArguments: "Termination notice violated Clause 12 of Employment Deed, performance metrics did not justify immediate dismissal.",
          costsEstimated: "₹30,000",
          durationMonths: 5
        },
        {
          caseTitle: "S.S. Developers v. Odisha Housing Board",
          disputeType: "Real Estate",
          judgmentYear: 2022,
          winningParty: "Claimant",
          judgmentSummary: "Delay of 18 months in the possession handover of a commercial retail space. Developer ordered to refund booking amount with interest.",
          damagesAwarded: "₹42,00,000",
          citations: "2022 CPJ 339",
          keyArguments: "Force Majeure clause does not cover standard administrative delays or labor shortage under RERA rules.",
          costsEstimated: "₹2,10,000",
          durationMonths: 15
        },
        {
          caseTitle: "Priya Sharma v. Apex Retailers",
          disputeType: "Consumer Dispute",
          judgmentYear: 2024,
          winningParty: "Claimant",
          judgmentSummary: "Supply of malfunctioning industrial manufacturing machinery causing commercial business shutdown for 3 weeks.",
          damagesAwarded: "₹6,00,000",
          citations: "2024 NCDRC 12",
          keyArguments: "Implied warranty of merchantable quality breached, seller liability cannot be excluded for manufacturing flaws.",
          costsEstimated: "₹45,000",
          durationMonths: 6
        },
        {
          caseTitle: "Digital Solutions LLC v. Cyberspace Corp",
          disputeType: "NDA / IP",
          judgmentYear: 2023,
          winningParty: "Respondent",
          judgmentSummary: "Claim of trade secret leakage and source code breach under non-disclosure terms. Claim dismissed due to lack of evidence proving code was proprietary.",
          damagesAwarded: "Nil",
          citations: "2023 MIPR 89",
          keyArguments: "Open-source software snippets used in code do not constitute trade secrets protected by the NDA.",
          costsEstimated: "₹1,50,000",
          durationMonths: 11
        }
      ];
      await HistoricalCase.insertMany(sampleCases);
      console.log("✅ Seeded sample legal precedents successfully.");
    }
  } catch (err) {
    console.error("Failed to seed precedents:", err);
  }
};

// Seed database on compile
seedPrecedentsIfEmpty();

const listModels = async () => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const response = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    console.log("AVAILABLE GEMINI MODELS:", response.data.models.map(m => m.name));
  } catch (e) {
    console.error("Failed to list Gemini models:", e.response ? JSON.stringify(e.response.data) : e.message);
  }
};
listModels();

// Helper helper to clean JSON response from LLM
const cleanJsonResponse = (content) => {
  try {
    let cleaned = content.trim();
    if (cleaned.startsWith("```json")) {
      cleaned = cleaned.substring(7);
    }
    if (cleaned.endsWith("```")) {
      cleaned = cleaned.substring(0, cleaned.length - 3);
    }
    return JSON.parse(cleaned.trim());
  } catch (e) {
    console.warn("Raw parse failed, attempting regex extraction...", e);
    const match = content.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (innerErr) {
        throw new Error("Invalid JSON structure returned by model");
      }
    }
    throw e;
  }
};

// 1. Legal Research
exports.legalResearch = async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ success: false, message: "Query is required" });
    }

    // Look for matching precedents in db
    const precedents = await HistoricalCase.find({
      $or: [
        { disputeType: { $regex: query, $options: "i" } },
        { judgmentSummary: { $regex: query, $options: "i" } },
        { keyArguments: { $regex: query, $options: "i" } }
      ]
    }).lean();

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: "You are a senior legal researcher. Analyze the research query and return a clean, structured research outline. Use the provided database precedents to support your arguments with citations."
        },
        {
          role: "user",
          content: `Query: ${query}\n\nPrecedents: ${JSON.stringify(precedents)}\n\nFormat your output cleanly in markdown with sections: Overview, Applicable Statutes, Precedent Citations (citing the provided cases if relevant), and Key Arguments.`
        }
      ],
      temperature: 0.3,
      max_tokens: 1000
    });

    return res.json({
      success: true,
      analysis: completion.choices[0].message.content,
      precedents
    });
  } catch (error) {
    console.error("Legal Research Error:", error);
    return res.status(500).json({ success: false, message: "Failed to perform legal research" });
  }
};

// 2. Contract Review & Drafting
exports.contractReview = async (req, res) => {
  try {
    const { contractText } = req.body;
    if (!contractText) {
      return res.status(400).json({ success: false, message: "Contract text is required" });
    }

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: `You are an expert contract auditor. Analyze the contract text and return a JSON object with:
1. "summary" (string)
2. "risks" (array of objects: { "clause": string, "riskLevel": "High"|"Medium"|"Low", "explanation": string })
3. "missingClauses" (array of objects: { "clause": string, "recommendation": string })

Respond ONLY with valid JSON. Do not write any markdown code block indicators or extra conversational text.`
        },
        {
          role: "user",
          content: `Analyze this contract:\n\n${contractText}`
        }
      ],
      temperature: 0.2
    });

    const parsed = cleanJsonResponse(completion.choices[0].message.content);
    return res.json({ success: true, ...parsed });
  } catch (error) {
    console.error("Contract Review Error:", error);
    return res.status(500).json({ success: false, message: "Failed to audit contract" });
  }
};

// 3. Document Summarization
exports.summarizeDoc = async (req, res) => {
  try {
    const { documentText } = req.body;
    if (!documentText) {
      return res.status(400).json({ success: false, message: "Document text is required" });
    }

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: `You are a legal document summarizer. Analyze the text and output a JSON object containing:
1. "parties" (array of strings)
2. "obligations" (array of strings)
3. "dates" (array of objects: { "date": string, "event": string })
4. "summary" (array of key point strings)

Respond ONLY with valid JSON.`
        },
        {
          role: "user",
          content: `Summarize this text:\n\n${documentText}`
        }
      ],
      temperature: 0.2
    });

    const parsed = cleanJsonResponse(completion.choices[0].message.content);
    return res.json({ success: true, ...parsed });
  } catch (error) {
    console.error("Summarization Error:", error);
    return res.status(500).json({ success: false, message: "Failed to summarize document" });
  }
};

// 4. Compliance & Risk
exports.complianceCheck = async (req, res) => {
  try {
    const { documentText, complianceType } = req.body;
    if (!documentText) {
      return res.status(400).json({ success: false, message: "Document text is required" });
    }

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: `You are a corporate compliance auditor. Audit the document against the regulation: "${complianceType || 'General Corporate Standards'}".
Return a JSON object containing:
1. "score" (number from 0 to 100)
2. "violations" (array of objects: { "clause": string, "issue": string, "severity": "Critical"|"Major"|"Minor" })
3. "recommendations" (array of strings)

Respond ONLY with valid JSON.`
        },
        {
          role: "user",
          content: `Audit the following text:\n\n${documentText}`
        }
      ],
      temperature: 0.2
    });

    const parsed = cleanJsonResponse(completion.choices[0].message.content);
    return res.json({ success: true, ...parsed });
  } catch (error) {
    console.error("Compliance Error:", error);
    return res.status(500).json({ success: false, message: "Failed to perform compliance audit" });
  }
};

// 5. Litigation Support
exports.litigationStrategy = async (req, res) => {
  try {
    const { caseDetails } = req.body;
    if (!caseDetails) {
      return res.status(400).json({ success: false, message: "Case details are required" });
    }

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: "You are a chief litigation strategist. Formulate a comprehensive litigation blueprint, including preparation steps, key legal arguments, potential counter-arguments, and evidence catalog recommendations."
        },
        {
          role: "user",
          content: `Case description:\n${caseDetails}\n\nOutline the optimal strategy in clean markdown.`
        }
      ],
      temperature: 0.4
    });

    return res.json({ success: true, strategy: completion.choices[0].message.content });
  } catch (error) {
    console.error("Strategy Prep Error:", error);
    return res.status(500).json({ success: false, message: "Failed to generate strategy blueprint" });
  }
};

// 6. Predictive Analytics
exports.predictiveAnalytics = async (req, res) => {
  try {
    const { disputeType, claimAmount } = req.body;
    if (!disputeType) {
      return res.status(400).json({ success: false, message: "Dispute type is required" });
    }

    // Query average stats from matching precedents
    const matchingCases = await HistoricalCase.find({
      disputeType: { $regex: disputeType, $options: "i" }
    }).lean();

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: `You are an actuarial legal analyst. Predict win probability and timeline/cost ranges.
Return a JSON object containing:
1. "winProbability" (number, e.g. 75)
2. "estimatedDuration" (string, e.g. "6-9 months")
3. "estimatedCost" (string, e.g. "₹50,000 - ₹80,000")
4. "justification" (string explaining stats)

Respond ONLY with valid JSON.`
        },
        {
          role: "user",
          content: `Dispute Type: ${disputeType}\nClaim Amount: ${claimAmount || "Not specified"}\nHistorical Precedent stats: ${JSON.stringify(matchingCases)}`
        }
      ],
      temperature: 0.3
    });

    const parsed = cleanJsonResponse(completion.choices[0].message.content);
    return res.json({ success: true, ...parsed });
  } catch (error) {
    console.error("Predictive Analytics Error:", error);
    return res.status(500).json({ success: false, message: "Failed to compile predictions" });
  }
};

// 7. Legal Document Automation
exports.generateDocument = async (req, res) => {
  try {
    const { docType, parameters } = req.body;
    if (!docType || !parameters) {
      return res.status(400).json({ success: false, message: "Document type and parameters are required" });
    }

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: "You are a professional legal draftsperson. Draft a high-fidelity, complete, and binding legal document draft based on the parameters. Do not write explanations or meta statements—just output the formal text of the document."
        },
        {
          role: "user",
          content: `Draft a formal "${docType}" using these values:\n${JSON.stringify(parameters, null, 2)}`
        }
      ],
      temperature: 0.3
    });

    return res.json({ success: true, draftText: completion.choices[0].message.content });
  } catch (error) {
    console.error("Document Automation Error:", error);
    return res.status(500).json({ success: false, message: "Failed to generate legal draft" });
  }
};

// 8. Client Communication & Plain Translation
exports.translateExplain = async (req, res) => {
  try {
    const { text, action, language } = req.body;
    console.log("translateExplain request received:", { action, language, textLength: text?.length });
    
    if (!text || !action) {
      return res.status(400).json({ success: false, message: "Text and action are required" });
    }

    let systemPrompt = "";
    if (action === "translate") {
      // Map 'Odia' to be more explicit for LLMs that might confuse it or fail to output Odia script
      let targetLanguage = language || 'Hindi';
      if (targetLanguage.toLowerCase() === 'odia') {
        targetLanguage = 'Odia (Oriya) language in native Odia script';
      }
      systemPrompt = `You are a legal translator. Translate the following text into "${targetLanguage}" accurately and professionally. Maintain legal terminology but make it readable in the target language. Do not output anything else except the translated text in the target language script:`;
    } else if (action === "explain") {
      systemPrompt = "Explain the following complex legalese text simply, in plain English that a client can understand:";
    } else {
      systemPrompt = "Draft a professional response email based on the following legal context:";
    }

    // Try Gemini first (superb multilingual translation)
    try {
      const prompt = `${systemPrompt}\n\n${text}`;
      const processedText = await callGemini(prompt);
      if (processedText) {
        return res.json({ success: true, processedText });
      }
    } catch (geminiErr) {
      console.warn("Gemini translation failed, falling back to Groq Llama:", geminiErr.message);
    }

    // Fallback to Groq Llama (Try Llama 3.3 70B for quality multilingual translation first, then fallback to Llama 3.1 8B if rate limited)
    let completion;
    try {
      completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: text
          }
        ],
        temperature: 0.3
      });
    } catch (groq70bErr) {
      console.warn("Groq Llama 3.3 70B failed, falling back to Llama 3.1 8B:", groq70bErr.message);
      completion = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: text
          }
        ],
        temperature: 0.3
      });
    }

    return res.json({ success: true, processedText: completion.choices[0].message.content });
  } catch (error) {
    console.error("Translation Error:", error);
    return res.status(500).json({ success: false, message: "Failed to process text" });
  }
};

// 9. Contract Comparison
exports.compareContracts = async (req, res) => {
  try {
    const { contractA, contractB } = req.body;
    if (!contractA || !contractB) {
      return res.status(400).json({ success: false, message: "Both contract texts are required" });
    }

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: `You are an expert contract comparison analyst. Compare Contract Version A and Contract Version B.
Analyze the differences and return a JSON object containing:
1. "summary" (string summarizing the main changes)
2. "additions" (array of strings showing key clauses added in B)
3. "deletions" (array of strings showing key clauses removed from A)
4. "modifications" (array of objects: { "clause": string, "change": string })

Respond ONLY with valid JSON.`
        },
        {
          role: "user",
          content: `Contract Version A:\n${contractA}\n\nContract Version B:\n${contractB}`
        }
      ],
      temperature: 0.2
    });

    const parsed = cleanJsonResponse(completion.choices[0].message.content);
    return res.json({ success: true, ...parsed });
  } catch (error) {
    console.error("Contract Comparison Error:", error);
    return res.status(500).json({ success: false, message: "Failed to compare contracts" });
  }
};

// 10. AI Legal Chatbot Advisor
exports.legalChat = async (req, res) => {
  try {
    const { message, chatHistory } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, message: "Message is required" });
    }

    const formattedHistory = (chatHistory || []).map(h => `${h.sender === "user" ? "User" : "Assistant"}: ${h.text}`).join("\n");

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: `You are a professional legal procedure advisor and chatbot assistant.
Your job is to:
1. Answer frequently asked legal questions.
2. Guide clients through ODR, mediation, and arbitration procedures.
3. Help users understand how to schedule appointments and collect client dispute information.
Provide clear, conversational, helpful, and highly readable answers. Cite laws and standards if helpful.`
        },
        {
          role: "user",
          content: `Chat History:\n${formattedHistory}\n\nUser Question: ${message}`
        }
      ],
      temperature: 0.4
    });

    return res.json({
      success: true,
      answer: completion.choices[0].message.content
    });
  } catch (error) {
    console.error("Legal Chat Error:", error);
    return res.status(500).json({ success: false, message: "Failed to process chat query" });
  }
};

// 11. E-Discovery Evidence Scanner
exports.eDiscovery = async (req, res) => {
  try {
    const { documentPool, searchTarget } = req.body;
    if (!documentPool || !searchTarget) {
      return res.status(400).json({ success: false, message: "Document pool and search query are required" });
    }

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: `You are an E-Discovery investigator. Scan the provided document logs, emails, or text dump for evidence relevant to: "${searchTarget}".
Identify matching excerpts and analyze their evidentiary value.
Return a JSON object containing:
1. "relevanceScore" (number from 0 to 100 based on overall match)
2. "excerpts" (array of objects: { "source": string, "text": string, "relevanceReason": string })
3. "summary" (string summarizing findings)

Respond ONLY with valid JSON.`
        },
        {
          role: "user",
          content: `Document text pool:\n${documentPool}\n\nSearch Target:\n${searchTarget}`
        }
      ],
      temperature: 0.2
    });

    const parsed = cleanJsonResponse(completion.choices[0].message.content);
    return res.json({ success: true, ...parsed });
  } catch (error) {
    console.error("E-Discovery Error:", error);
    return res.status(500).json({ success: false, message: "Failed to execute E-Discovery scan" });
  }
};
