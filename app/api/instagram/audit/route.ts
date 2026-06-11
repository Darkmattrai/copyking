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

// Audits an Instagram profile against the agency's criteria. Available to any
// logged-in user (admins + clients); accepts pasted fields or the connected
// profile + an optional screenshot.
export async function POST(req: Request) {
  const role = await getUserRole();
  if (!role) {
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
    const text = buildAuditUserPrompt(body);
    // Vision input: the connected profile photo (to assess the profile image).
    const content: Array<
      | { type: "text"; text: string }
      | { type: "image"; image: URL | string }
    > = [{ type: "text", text }];
    if (body.profileImageUrl) {
      content.push({ type: "image", image: new URL(body.profileImageUrl) });
    }

    const { object } = await generateObject({
      model: openai("gpt-4o"),
      system: IG_AUDIT_SYSTEM_PROMPT,
      schema: IgAuditSchema,
      messages: [{ role: "user", content }],
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
