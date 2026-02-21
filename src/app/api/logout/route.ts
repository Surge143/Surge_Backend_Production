import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const response = NextResponse.json({
        success: true,
        message: "Logged out successfully",
    }, { status: 200 });

    // Get all cookies from the current request
    const allCookies = req.cookies.getAll();

    // Clear every cookie found in the request
    allCookies.forEach(cookie => {
        response.cookies.set(cookie.name, '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
            maxAge: 0,
        });
    });

    return response;
}

// Support GET for simple links/redirects if necessary, but POST is preferred for state changes
export async function GET(req: NextRequest) {
    return POST(req);
}
