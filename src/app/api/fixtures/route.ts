// 1. Force Vercel to NEVER cache this route during build time
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 2. THE DOCS WERE RIGHT: season is mandatory when league is present!
    const apiUrl = `https://v3.football.api-sports.io/fixtures?league=39&season=2026&next=10`;

    const res = await fetch(apiUrl, {
      headers: {
        'x-apisports-key': process.env.API_FOOTBALL_KEY!,
      },
      next: { revalidate: 60 },
    });

    const data = await res.json();

    // 3. THE UNMASKING: Actually check for API-Football's hidden errors
    // (API-Football returns an empty array [] when there are no errors)
    if (data.errors && Object.keys(data.errors).length > 0 && !Array.isArray(data.errors)) {
      console.error('API-Football Error:', data.errors);
      return NextResponse.json({ 
        success: false, 
        error_details: data.errors, 
        fixtures: [] 
      }, { status: 200 });
    }

    if (!data.response || !Array.isArray(data.response)) {
      return NextResponse.json({ success: false, fixtures: [] }, { status: 200 });
    }

    const mappedFixtures = data.response.map((match: any) => ({
      id: match.fixture.id.toString(),
      home: match.teams.home.name,
      away: match.teams.away.name,
      homeLogo: match.teams.home.logo,
      awayLogo: match.teams.away.logo,
      league: match.league.name,
      time: new Intl.DateTimeFormat('en-NG', {
        weekday: 'short',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
        timeZone: 'Africa/Lagos'
      }).format(new Date(match.fixture.date)),
    }));

    return NextResponse.json({ success: true, fixtures: mappedFixtures }, { status: 200 });
  } catch (error: any) {
    console.error('Failed to fetch fixtures:', error.message);
    return NextResponse.json({ error: 'Failed to load live fixtures' }, { status: 500 });
  }
}







// import { NextResponse } from 'next/server';

// export async function GET() {
//   try {
//     // We use the 'next=10' parameter to grab the next 10 upcoming matches automatically.
//     // League 39 is the English Premier League. Season 2026.
//     const apiUrl = `https://v3.football.api-sports.io/fixtures?league=39&season=2026&next=10`;

//     const res = await fetch(apiUrl, {
//       headers: {
//         'x-apisports-key': process.env.API_FOOTBALL_KEY!,
//       },
//       // THIS IS THE MAGIC: Next.js caches this response for 3600 seconds (1 hour).
//       // Subsequent requests read from the server cache, costing zero API limits.
//       next: { revalidate: 3600 },
//     });

//     if (!res.ok) {
//       throw new Error(`API returned ${res.status}`);
//     }

//     const data = await res.json();

//     // if (!data.response || !Array.isArray(data.response)) {
//     //   console.error('API-Football Error:', data.errors || 'Unknown error');
//     //   return NextResponse.json({ success: false, fixtures: [] }, { status: 200 });
//     // }

//     if (!data.response || !Array.isArray(data.response)) {
//       // Temporarily print the exact error to the actual website screen
//       return NextResponse.json({ 
//         success: false, 
//         error_details: data.errors || data.message || 'Unknown API Error',
//         fixtures: [] 
//       }, { status: 200 });
//     }

//   // Map the massive, messy API response into a clean, lightweight array for your UI
//     const mappedFixtures = data.response.map((match: any) => ({
//       id: match.fixture.id.toString(),
//       home: match.teams.home.name,
//       away: match.teams.away.name,
//       homeLogo: match.teams.home.logo, 
//       awayLogo: match.teams.away.logo,
//       league: match.league.name,
//       time: new Intl.DateTimeFormat('en-NG', {
//         weekday: 'short',
//         hour: 'numeric',
//         minute: 'numeric',
//         hour12: true,
//         timeZone: 'Africa/Lagos'
//       }).format(new Date(match.fixture.date)),
//     }));

//     return NextResponse.json({ success: true, fixtures: mappedFixtures }, { status: 200 });
//   } catch (error: any) {
//     console.error('Failed to fetch fixtures:', error.message);
//     return NextResponse.json({ error: 'Failed to load live fixtures' }, { status: 500 });
//   }
// }