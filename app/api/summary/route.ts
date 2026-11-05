import { generateSummary } from "@/lib/summary/gemini";
import { isEmptySummaryInput } from "@/lib/summary/input";
import type { SummaryApiResponse } from "@/lib/summary/types";
import { parseSummaryInput } from "@/lib/summary/validate";

const MAX_BODY_CHARS = 20_000;

function respond(body: SummaryApiResponse, status: number): Response {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

// 入力内容や要約の中身はログに出さない。失敗したときに、エラーの種類だけを出す
export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    const text = await request.text();
    if (text.length > MAX_BODY_CHARS) return respond({ ok: false }, 413);
    body = JSON.parse(text);
  } catch {
    return respond({ ok: false }, 400);
  }

  const input = parseSummaryInput(body);
  if (!input || isEmptySummaryInput(input)) return respond({ ok: false }, 400);

  const result = await generateSummary(input);
  if (!result.ok) {
    console.error(
      `[summary] failed: ${result.kind}${
        result.status === undefined ? "" : ` (status ${result.status})`
      }`,
    );
    return respond({ ok: false }, 502);
  }

  return respond({ ok: true, summary: result.summary }, 200);
}
