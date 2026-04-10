import { NextResponse } from "next/server";

/**
 * GET /api/health
 * Health check endpoint for Docker and monitoring.
 */
export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "0.1.0",
    },
    { status: 200 }
  );
}
