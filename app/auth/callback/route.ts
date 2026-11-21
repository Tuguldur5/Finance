import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Google OAuth landing point. Exchanges the PKCE code for a session and
 * either enters the app or sends the user back to /login with a safe error.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(`${origin}/login?error=auth`);
    }

    return NextResponse.redirect(`${origin}/app`);
  } catch {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }
}
