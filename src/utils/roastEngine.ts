export function generateRoast(walletBalance: number, ballIqPoints: number, pastDuels: any[]): string {
  // 1. Calculate Recent Form (Last 3 matches)
  const recentDuels = pastDuels.slice(0, 3);
  const recentLosses = recentDuels.filter(d => d.result !== 'won').length;
  const recentWins = recentDuels.filter(d => d.result === 'won').length;

  // 2. Sapa (Broke) Roasts
  if (walletBalance < 1000) {
    const brokeRoasts = [
      "Wallet looking like a temperature reading. Fund your account, boss.",
      "₦" + walletBalance + " balance? Hope you know how to trek home.",
      "You are one bad prediction away from asking for urgent 2k.",
      "Your escrow is fighting for its life right now."
    ];
    return brokeRoasts[Math.floor(Math.random() * brokeRoasts.length)];
  }

  // 3. Losing Streak Roasts
  if (recentLosses === 3) {
    const formRoasts = [
      "3 Ls in a row. Have you considered watching tennis instead?",
      "Your predictions belong in the trenches. Do better.",
      "You are funding other people's lifestyles at this point.",
      "Even a broken clock is right twice a day. What's your excuse?"
    ];
    return formRoasts[Math.floor(Math.random() * formRoasts.length)];
  }

  // 4. Winning Streak / Odogwu Roasts
  if (recentWins >= 2 || ballIqPoints > 500) {
    const winRoasts = [
      "Okay, Senior Man. Don't let two lucky guesses get to your head.",
      "The vault is heavy today. Try not to donate it all back tomorrow.",
      "Odogwu! You are cooking, but we know it's pure luck.",
      "Enjoy the green while it lasts. The trenches are always calling."
    ];
    return winRoasts[Math.floor(Math.random() * winRoasts.length)];
  }

  // 5. Default Banter (Mid-tier)
  const defaultRoasts = [
    "Put your money where your mouth is. Or keep quiet.",
    "Football is not played on paper, and clearly not in your head either.",
    "Stop analyzing stats and just trust your gut. (Your gut is usually wrong though).",
    "Welcome back to the Arena. Ready to donate to the community?"
  ];
  return defaultRoasts[Math.floor(Math.random() * defaultRoasts.length)];
}