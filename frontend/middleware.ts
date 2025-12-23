import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const ADMIN_EMAIL = 'kuttyxodev@gmail.com';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Obtenemos el usuario
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // --- LOGS DE DEPURACIÓN (Míralos en la terminal de VS Code) ---
  if (request.nextUrl.pathname.startsWith('/admin')) {
      console.log("------------------------------------------------");
      console.log("🕵️ MIDDLEWARE CHECK (/admin)");
      console.log("📧 Email detectado:", user?.email || "Nínguno (Null)");
      console.log("🔑 Es Admin?", user?.email === ADMIN_EMAIL ? "SÍ" : "NO");
      console.log("------------------------------------------------");
  }

  // A. PROTECCIÓN DE RUTA /ADMIN
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!user || user.email !== ADMIN_EMAIL) {
      console.log("⛔ Acceso denegado. Redirigiendo a Dashboard...");
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // B. PROTECCIÓN DE RUTA /DASHBOARD
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!user) {
      return NextResponse.redirect(new URL('/auth?mode=login', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*'],
};