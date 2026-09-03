import { createClient } from '@supabase/supabase-js';

// Initialize the browser client (Safe for client-side)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const AuthService = {
  /**
   * Step 1: Send the 6-digit OTP to the user's phone
   */
  async sendOtp(phone: string) {
    const { data, error } = await supabase.auth.signInWithOtp({
      phone,
    });
    
    if (error) throw new Error(error.message);
    return data;
  },

  /**
   * Step 2: Verify the OTP and establish the session
   */
  async verifyOtp(phone: string, token: string) {
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    });
    
    if (error) throw new Error('Invalid or expired code.');
    return data;
  },

  /**
   * Log the user out
   */
  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }
};