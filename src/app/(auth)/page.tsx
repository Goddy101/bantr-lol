"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthService } from "@/services/auth.service";

export default function AuthPage() {
  const router = useRouter();
  
  const [step, setStep] = useState<1 | 2>(1);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Helper to format Nigerian phone numbers automatically
  const formatPhoneNumber = (rawPhone: string) => {
    let formatted = rawPhone.replace(/\D/g, ""); // Remove non-numeric chars
    if (formatted.startsWith("0")) {
      formatted = "234" + formatted.substring(1); // Replace leading 0 with 234
    } else if (!formatted.startsWith("234")) {
      formatted = "234" + formatted;
    }
    return "+" + formatted;
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const formattedPhone = formatPhoneNumber(phone);
      await AuthService.sendOtp(formattedPhone);
      setPhone(formattedPhone); // Save formatted version for step 2
      setStep(2);
    } catch (err: any) {
      setError(err.message || "Failed to send code. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await AuthService.verifyOtp(phone, otp);
      // Redirect to dashboard immediately on success
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Invalid code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col justify-center items-center p-4 text-white">
      <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black tracking-tight text-white mb-2">bantr.lol</h1>
          <p className="text-neutral-400">
            {step === 1 ? "Stop arguing for free. Enter your number to back your talk." : "Enter the code sent to your phone."}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg text-sm text-center mb-4">
            {error}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-medium text-neutral-400 mb-1 block">Phone Number</label>
              <input
                type="tel"
                placeholder="0801 234 5678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading || phone.length < 10}
              className="w-full bg-green-500 hover:bg-green-600 text-black font-bold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Sending..." : "Send Code"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-medium text-neutral-400 mb-1 block">6-Digit Code</label>
              <input
                type="text"
                placeholder="• • • • • •"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white text-center tracking-widest text-lg focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading || otp.length < 6}
              className="w-full bg-green-500 hover:bg-green-600 text-black font-bold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Verifying..." : "Enter the Arena"}
            </button>
            
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-sm text-neutral-500 hover:text-white transition-colors text-center mt-2"
            >
              Change phone number
            </button>
          </form>
        )}
      </div>
    </div>
  );
}