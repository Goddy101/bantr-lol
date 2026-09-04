export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // PL = Premier League. status=SCHEDULED ensures we only get upcoming live matches.
    const apiUrl = `https://api.football-data.org/v4/competitions/PL/matches?status=SCHEDULED`;

    const res = await fetch(apiUrl, {
      headers: {
        'X-Auth-Token': process.env.FOOTBALL_DATA_KEY || '',
      },
      // Cache for 60 seconds
      next: { revalidate: 60 },
    });

    const data = await res.json();

    // Safety net for API errors
    if (data.errorCode || !data.matches) {
      console.error('Football-Data API Error:', data.message || 'Unknown Error');
      return NextResponse.json({ success: false, fixtures: [] }, { status: 200 });
    }

    // Map their data to match your exact Bantr UI requirements
    // We use .slice(0, 10) to only grab the next 10 upcoming games
    const mappedFixtures = data.matches.slice(0, 10).map((match: any) => ({
      id: match.id.toString(), // Their IDs are simple numbers like '123456'
      home: match.homeTeam.shortName || match.homeTeam.name,
      away: match.awayTeam.shortName || match.awayTeam.name,
      homeLogo: match.homeTeam.crest, // High-quality team logos
      awayLogo: match.awayTeam.crest,
      league: 'Premier League',
      time: new Intl.DateTimeFormat('en-NG', {
        weekday: 'short',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
        timeZone: 'Africa/Lagos'
      }).format(new Date(match.utcDate)),
    }));

    return NextResponse.json({ success: true, fixtures: mappedFixtures }, { status: 200 });
  } catch (error: any) {
    console.error('Failed to fetch fixtures:', error.message);
    return NextResponse.json({ error: 'Failed to load live fixtures' }, { status: 500 });
  }
}









// // 1. Force Vercel to NEVER cache this route during build time
// export const dynamic = 'force-dynamic';

// import { NextResponse } from 'next/server';

// export async function GET() {
//   try {
//     // 2. THE DOCS WERE RIGHT: season is mandatory when league is present!
//     //const apiUrl = `https://v3.football.api-sports.io/fixtures?league=39&season=2026&next=10`;

//     // Fetch the LAST 10 matches of the 2024 season instead of the "next" 10 
//     const apiUrl = `https://v3.football.api-sports.io/fixtures?league=39&season=2024&last=10`;
//     const res = await fetch(apiUrl, {
//       headers: {
//         'x-apisports-key': process.env.API_FOOTBALL_KEY!,
//       },
//       next: { revalidate: 60 },
//     });

//     const data = await res.json();

//     // 3. THE UNMASKING: Actually check for API-Football's hidden errors
//     // (API-Football returns an empty array [] when there are no errors)
//     if (data.errors && Object.keys(data.errors).length > 0 && !Array.isArray(data.errors)) {
//       console.error('API-Football Error:', data.errors);
//       return NextResponse.json({ 
//         success: false, 
//         error_details: data.errors, 
//         fixtures: [] 
//       }, { status: 200 });
//     }

//     if (!data.response || !Array.isArray(data.response)) {
//       return NextResponse.json({ success: false, fixtures: [] }, { status: 200 });
//     }

//     // const mappedFixtures = data.response.map((match: any) => ({
//     //   id: match.fixture.id.toString(),
//     //   home: match.teams.home.name,
//     //   away: match.teams.away.name,
//     //   homeLogo: match.teams.home.logo,
//     //   awayLogo: match.teams.away.logo,
//     //   league: match.league.name,
//     //   time: new Intl.DateTimeFormat('en-NG', {
//     //     weekday: 'short',
//     //     hour: 'numeric',
//     //     minute: 'numeric',
//     //     hour12: true,
//     //     timeZone: 'Africa/Lagos'
//     //   }).format(new Date(match.fixture.date)),
//     // }));


//     const mappedFixtures = data.response.map((match: any) => {
//       // Create a fake future date for the UI so it looks like it's happening tomorrow
//       const fakeFutureDate = new Date();
//       fakeFutureDate.setDate(fakeFutureDate.getDate() + 1);

//       return {
//         id: match.fixture.id.toString(),
//         home: match.teams.home.name,
//         away: match.teams.away.name,
//         homeLogo: match.teams.home.logo,
//         awayLogo: match.teams.away.logo,
//         league: match.league.name,
//         time: new Intl.DateTimeFormat('en-NG', {
//           weekday: 'short',
//           hour: 'numeric',
//           minute: 'numeric',
//           hour12: true,
//           timeZone: 'Africa/Lagos'
//         }).format(fakeFutureDate), // Use the fake date for the UI!
//       };
//     });

//     return NextResponse.json({ success: true, fixtures: mappedFixtures }, { status: 200 });
//   } catch (error: any) {
//     console.error('Failed to fetch fixtures:', error.message);
//     return NextResponse.json({ error: 'Failed to load live fixtures' }, { status: 500 });
//   }
// }





