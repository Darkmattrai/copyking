import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";

import { getUserRole } from "@/lib/auth/get-role";
import {
  IG_AUDIT_SYSTEM_PROMPT,
  IgAuditSchema,
  buildAuditUserPrompt,
  type AuditInput,
} from "@/lib/instagram/audit";

export const maxDuration = 120;

// Audits an Instagram profile against the agency's criteria. Accepts pasted
// fields now; the same shape is fed automatically from the connected profile
// once the Meta app is live. Admin-gated until the integration opens to clients.
export async function POST(req: Request) {
  const role = await getUserRole();
  if (role !== "admin") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: AuditInput;
  try {
    body = (await req.json()) as AuditInput;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.bio || !body.bio.trim()) {
    return Response.json({ error: "A bio is required to audit." }, { status: 400 });
  }

  try {
    const { object } = await generateObject({
      model: openai("gpt-4o"),
      system: IG_AUDIT_SYSTEM_PROMPT,
      prompt: buildAuditUserPrompt(body),
      schema: IgAuditSchema,
    });
    return Response.json({ audit: object });
  } catch (err) {
    console.error("[instagram/audit] error:", err);
    return Response.json(
      { error: "Audit failed — please try again." },
      { status: 502 },
    );
  }
}
