import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { accountNumber, bankCode } = await req.json();

    // Basic format validation before making external network call
    if (!accountNumber || accountNumber.length !== 10 || !bankCode) {
      return NextResponse.json(
        { success: false, error: "Invalid account number or bank code." },
        { status: 400 }
      );
    }

    const apiKey = process.env.BACHS_SECRET_KEY || "";
    if (!apiKey) {
      console.error("Missing BACHS_SECRET_KEY environment variable.");
      return NextResponse.json(
        { success: false, error: "Payment service configuration error." },
        { status: 500 }
      );
    }

    // // Determine sandbox vs production dynamically from the key prefix
    // const baseUrl = apiKey.startsWith("sk_live_")
    //   ? "https://api.bachs.io"
    //   : "https://sandbox-api.bachs.io";


    // Determine sandbox vs production dynamically from the key prefix
    const isSandbox = apiKey.startsWith("sk_sandbox_");
    const baseUrl = isSandbox
      ? "https://sandbox-api.bachs.io"
      : "https://api.bachs.io";

    // 1. Send resolution request to Bachs
    const res = await fetch(`${baseUrl}/v1/misc/bank-accounts/resolve`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        account_number: String(accountNumber).trim(),
        bank_code: String(bankCode).trim(),
        country: "NG",
      }),
      cache: "no-store",
    });

    // 2. Handle API errors (e.g. 400 validation error, 401 unauthorized)
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      console.error("Bachs resolve error:", errData);
      return NextResponse.json(
        {
          success: false,
          error: errData.detail || "Unable to reach account lookup service.",
        },
        { status: res.status }
      );
    }

    // 3. Parse ResolveTaskBankAccountResponse
    const data = await res.json();

    // Per documentation: inspect `resolved` before trusting `account_name`
    if (!data.resolved || !data.account_name) {
      return NextResponse.json(
        {
          success: false,
          error: data.message || "Account could not be verified. Check details.",
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      success: true,
      accountName: data.account_name,
      accountNumber: data.account_number,
    });
  } catch (error) {
    console.error("Error resolving bank account:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error during account lookup." },
      { status: 500 }
    );
  }
}