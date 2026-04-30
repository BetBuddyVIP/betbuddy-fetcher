const axios = require("axios");
const { createClient } = require("@supabase/supabase-js");

// 🔑 REPLACE THESE
const SUPABASE_URL = "https://excbtqktxealwjiesiup.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4Y2J0cWt0eGVhbHdqaWVzaXVwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTk0MTY5MSwiZXhwIjoyMDkxNTE3NjkxfQ.F-T-1SOAD7haGk7EgNIJd6IE33xmEXJRET8Mj1KoXzU";
const API_KEY = "f6189a1c3ffc19ac60eb8928d432ef98";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fetchMatches() {
  try {
    const res = await axios.get(
      "https://api.the-odds-api.com/v4/sports/aussierules_afl/odds/",
      {
        params: {
          apiKey: API_KEY,
          regions: "au",
          markets: "h2h",
        },
      }
    );

    const games = res.data;

    for (const game of games) {
      const externalId = game.id;

      // 🚫 CHECK IF MATCH EXISTS
      const { data: existing } = await supabase
		  .from("matches")
		  .select("id")
		  .eq("external_id", externalId)
		  .single();

		const home = game.home_team;
		const away = game.away_team;
		const start = game.commence_time;

		const market = game.bookmakers?.[0]?.markets?.[0];

		const homeOdds = market?.outcomes?.find(o => o.name === home)?.price;
		const awayOdds = market?.outcomes?.find(o => o.name === away)?.price;

		// ✅ IF MATCH EXISTS → UPDATE ODDS
		if (existing) {
		  await supabase
			.from("matches")
			.update({
			  odds_team_a: homeOdds,
			  odds_team_b: awayOdds,
			})
			.eq("id", existing.id);

		  console.log("Updated odds:", home, "vs", away);
		  continue;
		}

		// ✅ IF NEW MATCH → INSERT
		await supabase.from("matches").insert({
		  team_a: home,
		  team_b: away,
		  start_time: start,
		  odds_team_a: homeOdds,
		  odds_team_b: awayOdds,
		  sport: "AFL",
		  external_id: externalId,
		});

		console.log("Inserted:", home, "vs", away);
    }

    console.log("✅ Done");
  } catch (err) {
    console.log("❌ Error:", err.message);
  }
}

fetchMatches();