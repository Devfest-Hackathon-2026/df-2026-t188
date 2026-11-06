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

// 入力内容や要約の中身はログに出さない。
// ログに出すのは、成功か失敗か（失敗のときはエラーの種類）、かかった秒数、やり直した回数、各回の秒数だけ
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

  // request.signal は、ブラウザが接続を切った（画面を離れた）ときに知らせる
  const result = await generateSummary(input, request.signal);
  // retried は、やり直した回数（0・1・2）。attempts は、各回にかかった秒数
  const toSeconds = (ms: number) => `${(ms / 1000).toFixed(1)}s`;
  const timing = `in ${toSeconds(result.elapsedMs)} (retried: ${result.retries}) attempts: ${result.attemptsMs.map(toSeconds).join(", ")}`;

  if (result.ok) {
    console.log(`[summary] ok ${timing}`);
    return respond({ ok: true, summary: result.summary }, 200);
  }

  if (result.kind === "client_gone") {
    console.log(`[summary] stopped: client disconnected ${timing}`);
    return respond({ ok: false }, 499);
  }

  console.error(
    `[summary] failed: ${result.kind}${
      result.status === undefined ? "" : ` (status ${result.status})`
    } ${timing}`,
  );
  return respond({ ok: false }, 502);
}
