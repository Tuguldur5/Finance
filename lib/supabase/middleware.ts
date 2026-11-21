import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getSupabaseEnv, hasSupabaseEnv } from "./env";

const AUTH_ROUTES = ["/login"];
const PROTECTED_PREFIX = "/app";

function matchesRoute(pathname: string, route: string): boolean {
  return pathname === route || pathname.startsWith(`${route}/`);
}

/**
 * Refreshes the Supabase session cookie on every request and guards the
 * protected /app routes.
 *
 * - No session + /app/*  -> /login?next=<path>
 * - Session + /login     -> /app
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Until Supabase env vars are configured the app stays in guest mode
  // instead of crashing every request in local development.
  if (!hasSupabaseEnv()) {
    return response;
  }

  const { url, anonKey } = getSupabaseEnv();

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // Reading the cookie session is local and refreshes the token only when it
  // has expired. Calling getUser() here adds an Auth round-trip to every
  // client-side navigation. The app layout and server actions still verify the
  // user with getUser() before rendering or mutating data.
  let hasSession = false;
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    hasSession = Boolean(session?.user);
  } catch {
    // Network/Supabase outage: treat as anonymous, do not crash.
  }

  const { pathname, search } = request.nextUrl;
  const isProtected = matchesRoute(pathname, PROTECTED_PREFIX);
  const isAuthRoute = AUTH_ROUTES.some((route) => matchesRoute(pathname, route));

  if (!hasSession && isProtected) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.search = "";
    redirectUrl.searchParams.set("next", `${pathname}${search}`);

    const redirectResponse = NextResponse.redirect(redirectUrl);
    response.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
    return redirectResponse;
  }

  if (hasSession && isAuthRoute) {
    // Login is visited rarely; verify with Auth before redirecting so a stale
    // or forged cookie cannot create a /login -> /app -> /login loop.
    let verified = false;
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      verified = Boolean(user);
    } catch {
      // Treat an auth outage as anonymous.
    }

    if (!verified) return response;

    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/app";
    redirectUrl.search = "";

    const redirectResponse = NextResponse.redirect(redirectUrl);
    response.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
    return redirectResponse;
  }

  return response;
}
