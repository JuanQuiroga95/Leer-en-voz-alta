import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from '@/lib/session';

export async function proxy(request: NextRequest) {
  const sessionCookie = request.cookies.get('session')?.value;
  
  const publicRoutes = ['/', '/login', '/api/auth/login'];
  const isPublicRoute = publicRoutes.includes(request.nextUrl.pathname);

  if (!sessionCookie && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (sessionCookie) {
    try {
      const session = await decrypt(sessionCookie);
      
      // Si está en /login y ya tiene sesión, redirigir según el rol
      if (isPublicRoute && request.nextUrl.pathname !== '/api/auth/login') {
        const roleStr = session.role as string;
        if (roleStr === 'ADMIN') return NextResponse.redirect(new URL('/admin', request.url));
        if (roleStr === 'PROFESOR') return NextResponse.redirect(new URL('/profesor', request.url));
        return NextResponse.redirect(new URL('/alumno', request.url));
      }

      // Proteger las rutas por rol
      if (request.nextUrl.pathname.startsWith('/admin') && session.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/login', request.url));
      }
      if (request.nextUrl.pathname.startsWith('/profesor') && session.role !== 'PROFESOR') {
        return NextResponse.redirect(new URL('/login', request.url));
      }
      if (request.nextUrl.pathname.startsWith('/alumno') && session.role !== 'ALUMNO') {
        return NextResponse.redirect(new URL('/login', request.url));
      }

    } catch (e) {
      // Cookie inválida
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
