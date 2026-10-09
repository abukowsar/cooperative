import { fail, ok, readJson, str } from "@/lib/api";
import { clearModerator, isModerator, moderatorKeyMatches, setModerator } from "@/lib/auth";

export async function GET() {
  return ok({ moderator: await isModerator() });
}

export async function POST(req: Request) {
  const key = str((await readJson(req)).key, 200);
  if (!key || !moderatorKeyMatches(key)) return fail("ভুল মডারেটর কী", 401);
  await setModerator();
  return ok({ moderator: true });
}

export async function DELETE() {
  await clearModerator();
  return ok({ moderator: false });
}
