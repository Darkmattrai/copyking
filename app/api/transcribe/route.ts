import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 120;

// Transcribes a recorded voice note via OpenAI Whisper. Accepts multipart
// form-data with an "audio" file. Available to any logged-in user.
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return Response.json(
      { error: "Transcription isn't configured (missing OpenAI key)." },
      { status: 503 },
    );
  }

  let file: File | null = null;
  try {
    const form = await req.formData();
    const f = form.get("audio");
    if (f instanceof File) file = f;
  } catch {
    return Response.json({ error: "Invalid form data" }, { status: 400 });
  }
  if (!file) {
    return Response.json({ error: "No audio file provided" }, { status: 400 });
  }

  try {
    const oa = new FormData();
    oa.append("file", file, file.name || "voice.webm");
    oa.append("model", "whisper-1");
    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}` },
      body: oa,
    });
    const data = await res.json();
    if (!res.ok) {
      console.error("[transcribe] OpenAI error:", data);
      return Response.json(
        { error: data?.error?.message || "Transcription failed." },
        { status: 502 },
      );
    }
    return Response.json({ text: (data.text as string) ?? "" });
  } catch (err) {
    console.error("[transcribe] error:", err);
    return Response.json({ error: "Transcription failed." }, { status: 502 });
  }
}
