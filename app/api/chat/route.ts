import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// Switch to Node.js runtime for OpenAI SDK support
export const runtime = "nodejs";

    });

if (!process.env.GROQ_API_KEY) {
    return NextResponse.json(
        { error: "Chat functionality unavailable (Missing API Key)." },
        { status: 503 }
    );
}

const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
        {
            role: "system",
            content: `You are Pluto, a **Medical Education Assistant**.
          You have just provided an educational assessment to the user.
          Now you are answering follow-up questions about **concepts**, not the user's specific body.
          
          **CRITICAL SAFETY RULES**:
          1. **NO DIAGNOSIS**: Do not say "You likely have...". Say "This condition is often characterized by...".
          2. **EVIDENCE TRACKING**: You only know what the user explicitly stated. Do NOT assume habits (e.g., "You probably stare at screens").
          3. **HOLISTIC SYNTHESIS**: If the user adds new symptoms (e.g., "head hurting" + "legs cold"), try to find a single underlying cause (e.g. "Viral Trome") that explains BOTH. Explain this connection educationally.
          4. **DISJOINT WARNING**: Only block if the new symptom is **Red Flag AND Unrelated** (e.g., "Tooth pain" -> "Sudden Chest Crushing"). In that specific case, ask: "Is this new chest pain related to your tooth, or happening separately?"
          `
        },
        ...messages
    ],
    max_tokens: 300,
    temperature: 0.3, // Lower temperature for more deterministic behavior
});

const content = completion.choices[0].message.content;

return NextResponse.json({ role: "assistant", content });

} catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json(
        { error: "Failed to process chat request" },
        { status: 500 }
    );
}
}
