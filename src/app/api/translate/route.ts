import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { code, sourceLang, targetLang } = await request.json();

    if (!code || !sourceLang || !targetLang) {
      return Response.json(
        { error: "Missing required fields: code, sourceLang, targetLang" },
        { status: 400 }
      );
    }

    const truncated = code.slice(0, 6000);

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: "GROQ_API_KEY not configured" },
        { status: 500 }
      );
    }

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content:
              "You are an expert code translator. You translate code between programming languages while preserving logic and using idiomatic patterns for the target language.",
          },
          {
            role: "user",
            content: `Translate the following ${sourceLang} code to ${targetLang}. Preserve the logic, use idiomatic patterns for the target language, add brief comments where the translation differs significantly. Return ONLY the translated code, no explanations.\n\n\`\`\`${sourceLang}\n${truncated}\n\`\`\``,
          },
        ],
        temperature: 0.3,
        max_tokens: 4096,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error("Groq API error:", res.status, errBody);
      return Response.json(
        { error: `Groq API error: ${res.status}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    const translatedRaw =
      data.choices?.[0]?.message?.content ?? "// Translation failed";

    // Strip markdown code fences if present
    const translated = translatedRaw
      .replace(/^```[\w]*\n?/gm, "")
      .replace(/\n?```$/gm, "")
      .trim();

    // Now get translation notes
    const notesRes = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content:
                "You are an expert programmer. Provide brief, insightful notes about code translation differences.",
            },
            {
              role: "user",
              content: `I translated this ${sourceLang} code to ${targetLang}. In 2-4 bullet points, explain the KEY differences between the languages for this specific code (e.g., type system differences, memory management, syntax changes, idiomatic patterns). Be concise and specific.\n\nOriginal (${sourceLang}):\n\`\`\`\n${truncated.slice(0, 2000)}\n\`\`\`\n\nTranslated (${targetLang}):\n\`\`\`\n${translated.slice(0, 2000)}\n\`\`\``,
            },
          ],
          temperature: 0.5,
          max_tokens: 512,
        }),
      }
    );

    let notes = "";
    if (notesRes.ok) {
      const notesData = await notesRes.json();
      notes = notesData.choices?.[0]?.message?.content ?? "";
    }

    return Response.json({ translated, notes });
  } catch (err) {
    console.error("Translation error:", err);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
