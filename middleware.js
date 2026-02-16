// import { NextResponse } from "next/server";
// export function middleware(request) {
//   return NextResponse.redirect(new URL("/about", request.url));
// }

import { auth } from "@/app/_lib/auth";

export default auth((req) => {
  // Middleware logic runs here
  // The auth object will be available in req.auth
});

export const config = {
  matcher: ["/account/:path*"],
};