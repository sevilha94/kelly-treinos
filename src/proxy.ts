import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const COOKIE_DISPOSITIVO = "kj_dispositivo";

export async function proxy(request: NextRequest) {
  // Paginas do aluno: sem login. So garantimos que o navegador dele carrega um
  // identificador anonimo, para a Kelly conseguir ver quantos aparelhos
  // diferentes abriram o mesmo link.
  if (request.nextUrl.pathname.startsWith("/aluno/")) {
    const response = NextResponse.next({ request });
    if (!request.cookies.get(COOKIE_DISPOSITIVO)) {
      const id = crypto.randomUUID();
      request.cookies.set(COOKIE_DISPOSITIVO, id);
      response.cookies.set(COOKIE_DISPOSITIVO, id, {
        httpOnly: true,
        sameSite: "lax",
        secure: request.nextUrl.protocol === "https:",
        maxAge: 60 * 60 * 24 * 365,
        path: "/",
      });
    }
    return response;
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && request.nextUrl.pathname.startsWith("/painel")) {
    const url = request.nextUrl.clone();
    url.pathname = "/entrar";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/painel/:path*", "/entrar", "/aluno/:path*"],
};
