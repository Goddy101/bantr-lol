// src/app/api/banks/route.ts
import { NextResponse } from "next/server";

export const revalidate = 86400; // Cache on server for 24 hours

export async function GET() {
  try {
    // 1. Follow Bachs Agent Instructions: Sandbox vs Production
    const baseUrl = process.env.NODE_ENV === "production" 
      ? "https://api.bachs.io" 
      : "https://sandbox-api.bachs.io";

    // 2. Call the exact OpenAPI path
    const res = await fetch(`${baseUrl}/v1/reference/banks?country=NG`, {
      headers: {
        Authorization: `Bearer ${process.env.BACHS_SECRET_KEY}`,
      },
      next: { revalidate: 86400 } // Next.js fetch cache
    });

    // 3. Handle strict Bachs error schemas { detail, error_code, doc_url }
    if (!res.ok) {
      const errorData = await res.json();
      console.error("Bachs API Error:", errorData.error_code, errorData.detail);
      return NextResponse.json(
        { success: false, error: errorData.detail || "Failed to fetch banks from Bachs" }, 
        { status: res.status }
      );
    }

    const data = await res.json();

    // 4. Parse the exact schema: TaskBankListResponse
    // data = { country: "NG", banks: [ { name: "Providus Bank", code: "101" }, ... ] }
    const banks = data.banks.sort((a: any, b: any) => a.name.localeCompare(b.name));

    return NextResponse.json({ success: true, banks });
  } catch (error) {
    console.error("Network Error:", error);
    return NextResponse.json({ success: false, error: "Network error" }, { status: 500 });
  }
}