// Bot definitions — realistic people spread across US cities.
// Posts are templated with city-local flavor so they feel genuine.

export interface BotCity {
  city: string;
  state: string;
  lat: number;
  lon: number;
  foods: string[];
  places: string[];
  sports: string[];
  weather: string[];
  vibes: string[]; // local culture descriptors
}

export interface BotUser {
  username: string;
  displayName: string;
  email: string;
  passwordHash: string; // fixed bcrypt hash of "botpass123" — never used to log in
  cityKey: string;
}

// bcrypt hash of "botpass_chatterfall_never_login" — 12 rounds
export const BOT_PASSWORD_HASH =
  "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TgxKX3HuMXEIJDRFpqYCzT9a0Gq2";

export const BOT_CITIES: Record<string, BotCity> = {
  chicago: {
    city: "Chicago", state: "IL", lat: 41.8781, lon: -87.6298,
    foods: ["deep dish", "an italian beef", "a chicago dog", "jibarito", "garrett popcorn"],
    places: ["the loop", "wicker park", "logan square", "pilsen", "andersonville", "the 606", "navy pier", "millennium park"],
    sports: ["Cubs", "Sox", "Bears", "Bulls", "Blackhawks"],
    weather: ["freezing", "windy as hell", "actually nice out", "gross and humid", "snowing sideways"],
    vibes: ["honestly this city", "classic chicago", "midwest realness"],
  },
  nyc: {
    city: "New York", state: "NY", lat: 40.7128, lon: -74.0060,
    foods: ["a bagel", "a slice", "halal cart", "a bodega sandwich", "dollar pizza"],
    places: ["the subway", "prospect park", "astoria", "the L train", "the G", "williamsburg", "queens", "the bronx", "midtown"],
    sports: ["Mets", "Yankees", "Knicks", "Giants", "Jets"],
    weather: ["humid as hell", "freezing", "actually gorgeous", "gross out", "weirdly warm"],
    vibes: ["only in new york", "this city man", "nyc never sleeps"],
  },
  la: {
    city: "Los Angeles", state: "CA", lat: 34.0522, lon: -118.2437,
    foods: ["a breakfast burrito", "tacos", "in-n-out", "some ramen", "a açaí bowl"],
    places: ["silver lake", "echo park", "los feliz", "the valley", "koreatown", "dtla", "the westside", "santa monica"],
    sports: ["Dodgers", "Lakers", "Rams", "Kings", "Angels"],
    weather: ["perfect as usual", "weirdly foggy", "actually chilly", "hot af", "june gloom vibes"],
    vibes: ["only in LA", "this city", "so cal life"],
  },
  austin: {
    city: "Austin", state: "TX", lat: 30.2672, lon: -97.7431,
    foods: ["brisket", "breakfast tacos", "franklin bbq (worth the wait)", "some kolaches", "a breakfast taco"],
    places: ["south congress", "6th street", "east austin", "barton springs", "rainey street", "the greenbelt", "zilker park"],
    sports: ["Longhorns", "Spurs (by way of SA)", "FC Dallas"],
    weather: ["hot as hell", "actually pretty nice", "random thunderstorm", "weirdly cold", "perfect patio weather"],
    vibes: ["keeping austin weird", "atx life", "this city is growing too fast but whatever"],
  },
  seattle: {
    city: "Seattle", state: "WA", lat: 47.6062, lon: -122.3321,
    foods: ["a salmon thing", "teriyaki", "pho", "dungeness crab", "a really good coffee"],
    places: ["capitol hill", "fremont", "ballard", "pike place", "the cd", "west seattle", "queen anne", "u-district"],
    sports: ["Seahawks", "Mariners", "Sounders", "Kraken"],
    weather: ["drizzly as usual", "actually sunny (rare)", "that pacific northwest gray", "surprisingly warm", "classic seattle"],
    vibes: ["pnw life", "seattle rain season", "only in seattle"],
  },
  nashville: {
    city: "Nashville", state: "TN", lat: 36.1627, lon: -86.7816,
    foods: ["hot chicken", "meat and three", "biscuits", "some bbq", "a hot chicken sandwich"],
    places: ["east nashville", "the gulch", "12 south", "germantown", "broadway (avoiding)", "belmont", "hillsboro village"],
    sports: ["Titans", "Predators", "Nashville SC"],
    weather: ["actually really nice", "humid and gross", "random tornado warning", "surprisingly cold", "perfect fall day"],
    vibes: ["nash life", "this city is changing", "everyone moving here lol"],
  },
  denver: {
    city: "Denver", state: "CO", lat: 39.7392, lon: -104.9903,
    foods: ["a green chile smothered thing", "some really good tacos", "a craft beer (obviously)", "bison burger", "a breakfast burrito"],
    places: ["rino", "capitol hill", "highland", "cheesman park", "five points", "colfax", "wash park"],
    sports: ["Broncos", "Rockies", "Nuggets", "Avalanche", "Rapids"],
    weather: ["300 days of sunshine not a lie", "random snowstorm", "60 and sunny in february somehow", "that thin air", "perfect hiking weather"],
    vibes: ["mile high life", "colorado living", "so many transplants"],
  },
  atlanta: {
    city: "Atlanta", state: "GA", lat: 33.7490, lon: -84.3880,
    foods: ["some soul food", "chick-fil-a (it hits different here)", "wings", "a real sweet tea", "some good ramen actually"],
    places: ["little five points", "ponce city market", "beltline", "east atlanta", "old fourth ward", "decatur", "west end"],
    sports: ["Braves", "Falcons", "Hawks", "Atlanta United"],
    weather: ["humid and hot", "actually gorgeous spring weather", "random thunderstorm", "mild winter (mostly)", "pollen season is real"],
    vibes: ["atl life", "a-town", "this city never sleeps"],
  },
  portland: {
    city: "Portland", state: "OR", lat: 45.5051, lon: -122.6750,
    foods: ["some voodoo doughnut (overrated but fun)", "amazing thai food", "food cart pod meal", "really good ramen", "a fancy coffee"],
    places: ["alberta arts district", "mississippi ave", "division", "hawthorne", "pearl district", "se portland", "ne portland"],
    sports: ["Trail Blazers", "Thorns", "Timbers"],
    weather: ["raining (obviously)", "surprisingly sunny", "that oregon gray", "weirdly warm", "classic pdx weather"],
    vibes: ["keep portland weird", "pdx life", "pacific northwest"],
  },
  miami: {
    city: "Miami", state: "FL", lat: 25.7617, lon: -80.1918,
    foods: ["a cubano", "some ceviche", "a pastelito", "amazing haitian food", "stone crab (when in season)"],
    places: ["wynwood", "little havana", "brickell", "design district", "coconut grove", "little haiti", "south beach (but like, not really)"],
    sports: ["Marlins", "Heat", "Dolphins", "Inter Miami"],
    weather: ["hot and humid", "hurricane season anxiety", "actually perfect winter", "thunderstorm every afternoon", "feels like actual paradise"],
    vibes: ["305 life", "magic city", "miami never changes and somehow always does"],
  },
  minneapolis: {
    city: "Minneapolis", state: "MN", lat: 44.9778, lon: -93.2650,
    foods: ["a juicy lucy", "some walleye", "tater tot hotdish", "really good somali food", "a craft beer"],
    places: ["uptown", "northeast mpls", "north loop", "longfellow", "seward", "the lakes", "st paul (technically different but same)"],
    sports: ["Twins", "Vikings", "Timberwolves", "Wild", "United"],
    weather: ["cold as hell", "polar vortex szn", "actually gorgeous summer", "those 10 perfect fall days", "somehow people live here"],
    vibes: ["twin cities life", "minnesota nice", "it's really not that cold (it is)"],
  },
  newOrleans: {
    city: "New Orleans", state: "LA", lat: 29.9511, lon: -90.0715,
    foods: ["a po'boy", "some gumbo", "a muffuletta", "beignets (obviously)", "red beans and rice (monday tradition)"],
    places: ["bywater", "marigny", "magazine street", "mid-city", "uptown", "tremé", "the quarter (barely)"],
    sports: ["Saints", "Pelicans", "Zephyrs"],
    weather: ["humid as a sauna", "actually gorgeous in fall", "random flash flood", "surprisingly chilly january", "mosquito season is real"],
    vibes: ["nola life", "this city is unlike anywhere", "laissez les bons temps rouler"],
  },
  sanFrancisco: {
    city: "San Francisco", state: "CA", lat: 37.7749, lon: -122.4194,
    foods: ["a mission burrito", "some dim sum", "sourdough obviously", "an amazing bowl of pho", "a california burrito"],
    places: ["the mission", "castro", "haight", "richmond", "sunset", "noe valley", "dogpatch", "soma"],
    sports: ["Giants", "Warriors", "Niners (technically sj)", "Sharks"],
    weather: ["foggy (classic)", "actually cold in july", "random warm day in october", "that sf microclimate thing", "karl the fog is back"],
    vibes: ["bay area life", "sf is weird and i love it", "tech people pls go home (affectionate)"],
  },
  phoenix: {
    city: "Phoenix", state: "AZ", lat: 33.4484, lon: -112.0740,
    foods: ["some sonoran hot dog", "amazing birria tacos", "a chimichanga", "green chile everything", "a carne asada burrito"],
    places: ["old town scottsdale", "tempe", "downtown phoenix", "melrose district", "camelback", "gilbert", "mesa"],
    sports: ["Suns", "Cardinals", "Diamondbacks", "Coyotes"],
    weather: ["110 today absolutely normal", "dry heat so it's fine (it's not)", "perfect november weather", "monsoon season thunderstorms", "winter is paradise here honestly"],
    vibes: ["az life", "phoenix is underrated", "snowbird season upon us"],
  },
  dc: {
    city: "Washington", state: "DC", lat: 38.9072, lon: -77.0369,
    foods: ["a half smoke", "ethiopian food (best in the country)", "a mumbo sauce thing", "some great vietnamese", "a crab cake (maryland style)"],
    places: ["u street", "h street", "columbia heights", "petworth", "navy yard", "shaw", "adams morgan", "capitol hill (the neighborhood)"],
    sports: ["Capitals", "Wizards", "Nationals", "Commanders"],
    weather: ["humidity is a war crime", "cherry blossoms are real and beautiful", "random snowstorm that shuts everything down", "perfect fall", "brutal august"],
    vibes: ["dmv life", "this city is underrated", "everyone works in policy here it seems"],
  },
};

// 22 bots mapped to cities
export const BOT_DEFINITIONS: BotUser[] = [
  { username: "jakemcc", displayName: "Jake M", email: "jake.m.bot@cf.internal", passwordHash: BOT_PASSWORD_HASH, cityKey: "chicago" },
  { username: "sarahktz", displayName: "Sarah K", email: "sarah.k.bot@cf.internal", passwordHash: BOT_PASSWORD_HASH, cityKey: "nyc" },
  { username: "marcustw", displayName: "Marcus T", email: "marcus.t.bot@cf.internal", passwordHash: BOT_PASSWORD_HASH, cityKey: "atlanta" },
  { username: "rileycc", displayName: "Riley C", email: "riley.c.bot@cf.internal", passwordHash: BOT_PASSWORD_HASH, cityKey: "portland" },
  { username: "devonwatx", displayName: "Devon W", email: "devon.w.bot@cf.internal", passwordHash: BOT_PASSWORD_HASH, cityKey: "austin" },
  { username: "priyanv", displayName: "Priya N", email: "priya.n.bot@cf.internal", passwordHash: BOT_PASSWORD_HASH, cityKey: "sanFrancisco" },
  { username: "carlosrsa", displayName: "Carlos R", email: "carlos.r.bot@cf.internal", passwordHash: BOT_PASSWORD_HASH, cityKey: "austin" },
  { username: "meganhdnv", displayName: "Megan H", email: "megan.h.bot@cf.internal", passwordHash: BOT_PASSWORD_HASH, cityKey: "denver" },
  { username: "tylerbnash", displayName: "Tyler B", email: "tyler.b.bot@cf.internal", passwordHash: BOT_PASSWORD_HASH, cityKey: "nashville" },
  { username: "aishajdc", displayName: "Aisha J", email: "aisha.j.bot@cf.internal", passwordHash: BOT_PASSWORD_HASH, cityKey: "dc" },
  { username: "brandonlsea", displayName: "Brandon L", email: "brandon.l.bot@cf.internal", passwordHash: BOT_PASSWORD_HASH, cityKey: "seattle" },
  { username: "chloefla", displayName: "Chloe F", email: "chloe.f.bot@cf.internal", passwordHash: BOT_PASSWORD_HASH, cityKey: "la" },
  { username: "kevinmphx", displayName: "Kevin M", email: "kevin.m.bot@cf.internal", passwordHash: BOT_PASSWORD_HASH, cityKey: "phoenix" },
  { username: "jasminehou", displayName: "Jasmine W", email: "jasmine.w.bot@cf.internal", passwordHash: BOT_PASSWORD_HASH, cityKey: "miami" },
  { username: "nickpchi", displayName: "Nick P", email: "nick.p.bot@cf.internal", passwordHash: BOT_PASSWORD_HASH, cityKey: "chicago" },
  { username: "emilyrmnpls", displayName: "Emily R", email: "emily.r.bot@cf.internal", passwordHash: BOT_PASSWORD_HASH, cityKey: "minneapolis" },
  { username: "jordancnola", displayName: "Jordan C", email: "jordan.c.bot@cf.internal", passwordHash: BOT_PASSWORD_HASH, cityKey: "newOrleans" },
  { username: "mayasfsf", displayName: "Maya S", email: "maya.s.bot@cf.internal", passwordHash: BOT_PASSWORD_HASH, cityKey: "sanFrancisco" },
  { username: "chrisdlv", displayName: "Chris D", email: "chris.d.bot@cf.internal", passwordHash: BOT_PASSWORD_HASH, cityKey: "phoenix" },
  { username: "tiffanyatl", displayName: "Tiffany A", email: "tiffany.a.bot@cf.internal", passwordHash: BOT_PASSWORD_HASH, cityKey: "atlanta" },
  { username: "connorpdx", displayName: "Connor O", email: "connor.o.bot@cf.internal", passwordHash: BOT_PASSWORD_HASH, cityKey: "portland" },
  { username: "lauraenyc", displayName: "Laura E", email: "laura.e.bot@cf.internal", passwordHash: BOT_PASSWORD_HASH, cityKey: "nyc" },
];

// Templates — {food}, {place}, {sport}, {weather}, {vibe}, {city} get substituted.
// Pool is intentionally large so repeats don't happen within a reasonable window.
export const POST_TEMPLATES = [
  // food — varied sentence structures
  "just had {food} and honestly it fixed everything that was wrong with my day",
  "reminder that {food} exists and it's perfect",
  "{food} for lunch again. no notes.",
  "if you haven't tried {food} around here you're doing it wrong",
  "craving {food} at an unreasonable hour",
  "found the best {food} at this tiny spot near {place}. not sharing the name",
  "okay the {food} was not it today. bad batch. happens to everyone.",
  "the {food} here genuinely goes hard",
  "got {food} and immediately felt better about everything",
  "telling everyone i know about this {food} spot near {place}",
  "{food} twice this week and not even a little sorry about it",
  "my whole afternoon improved because of {food}. that's the post.",
  "why does {food} taste better when someone else makes it. asking for me.",
  "the {food} near {place} is genuinely underrated",
  "i think about {food} more than i should",
  "had {food} for dinner and honestly that's the review",

  // place — varied structures
  "spent the afternoon at {place} and remembered why i actually like living here",
  "{place} was packed today but still worth it",
  "anyone else always end up at {place} when they have nothing going on",
  "the vibe at {place} lately has been immaculate",
  "that walk through {place} really reset my whole brain",
  "first time back at {place} in months and it's still the same. comforting.",
  "{place} on a weekday hits different",
  "somehow ended up at {place} again. this keeps happening.",
  "ran into three people i know at {place}. this city is a village.",
  "{place} in the {season} is genuinely one of the better things in life",
  "never get tired of {place} honestly",
  "the walk from {place} to literally anywhere is always an adventure",
  "had a whole moment at {place} today. hard to explain.",
  "if you haven't been to {place} recently you're missing out",
  "{place} was giving today. that's all.",
  "took a detour through {place} and it was worth every minute",
  "the people at {place} are always exactly the people you'd expect",

  // weather — varied reactions
  "it is {weather} right now and that is simply the situation we're in",
  "{weather} out here and people are still acting surprised. it's {city}.",
  "woke up to {weather} and honestly could not be less shocked",
  "{weather} so naturally everyone forgot how to drive",
  "the forecast said {weather} and fully delivered. respect.",
  "it's {weather} and somehow the city is still going. as it should.",
  "{weather} again. we adapt. we survive. we complain.",
  "dressed for {weather} for the first time this year. feels right.",
  "this {weather} is exactly what i needed today actually",
  "the {weather} is doing a lot right now",
  "{weather} but {place} still somehow has a line outside",
  "only in {city} would {weather} feel completely normal",
  "woke up to {weather} and decided that was fine",
  "{weather} out here. sending strength to everyone.",
  "the nerve of this city to be {weather} on a day i have plans",

  // sports — varied
  "can't focus on anything right now with the {sport} game on",
  "{sport} fans in {city} are genuinely built different",
  "watching the {sport} game at a spot near {place}. classic {city} evening",
  "the city has a completely different energy when the {sport}s are doing well",
  "not saying anything about the {sport}s game but i'm saying something",
  "{sport} game tonight and the whole neighborhood knows it",
  "okay the {sport}s pulled through. faith restored. briefly.",
  "every bar near {place} is packed for the {sport} game. great night to stay in.",

  // commute / errands / routines
  "the commute through {place} this morning was a journey",
  "running errands near {place} and somehow it took three hours",
  "that specific kind of tired you get from doing normal {city} things all day",
  "another day of doing things and being places in {city}",
  "the errands near {place} somehow took twice as long as planned",
  "got everything done and only slightly lost near {place}. win.",
  "the morning routine in {city} hits a little different",

  // strangers / city observations
  "overheard the wildest conversation near {place} today",
  "saw something at {place} that i can't explain but i respect it",
  "the people near {place} are always doing something interesting",
  "this city has a way of surprising you near {place} even after years",
  "the randomness of running into someone you know at {place}",
  "only in {city} does this kind of thing happen and nobody blinks",
  "had one of those only-in-{city} conversations today",
  "the character of the people near {place} is unmatched",
  "watched someone near {place} do something impressive and say nothing about it",

  // mood / general city love
  "one of those perfect {city} {timeofday}s. genuinely no complaints.",
  "being in {city} does something to your sense of what's normal",
  "love this city. also it's {weather}. both things are true simultaneously.",
  "{vibe} and honestly i'm here for it",
  "doing my best out here in {city} and it's going okay",
  "had one of those unexpectedly good {city} days today",
  "the {city} energy today was real",
  "this city is a lot but it's home at this point and i wouldn't trade it",
  "can't explain what makes {city} different but something definitely does",
  "still finding new things to like about this place after all this time",
  "unpopular opinion: {city} in the {season} is genuinely the move",
  "{city} on a {timeofday} like this is hard to beat",
  "the {season} in {city} is something else. in a good way.",
  "took the long way home through {place} and did not regret it",
  "the {city} skyline never gets old. that's the whole post.",
  "just a regular {city} {timeofday} and it's kind of perfect",
  "running a little late but {city} looks too good to rush",
  "something about {place} in the {season} just makes sense",
  "you either love {city} or you've never spent a real {season} here",
  "the {timeofday} energy in {city} is always exactly what it is",
  "some days {city} just does its thing and you go with it",
  "{city} in the {timeofday} light hits different",
  "checked in on {place} today. still itself. reassuring.",
  "the amount of life happening near {place} at any given moment",
  "had a completely normal {city} day and it was great",
  "this city keeps delivering. no notes.",
  "another good one in {city}. grateful honestly.",
  "the {season} air near {place} is something i look forward to every year",
  "feeling good about {city} today. it happens.",
  "the texture of a {city} {timeofday} is hard to put into words but you know it",
  "walked past {place} today for the hundredth time and it still feels right",
];

// Time of day labels
export function getTimeOfDay(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 17) return "afternoon";
  if (h >= 17 && h < 21) return "evening";
  return "night";
}

// Current season
export function getSeason(): string {
  const m = new Date().getMonth();
  if (m >= 2 && m <= 4) return "spring";
  if (m >= 5 && m <= 7) return "summer";
  if (m >= 8 && m <= 10) return "fall";
  return "winter";
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateBotPost(cityKey: string, recentTemplates: Set<string> = new Set()): string {
  const city = BOT_CITIES[cityKey];
  if (!city) return "just a regular day out here";

  // Shuffle candidates excluding recently used templates
  const available = POST_TEMPLATES.filter((t) => !recentTemplates.has(t));
  // Fall back to full pool if somehow all are exhausted
  const pool = available.length >= 5 ? available : POST_TEMPLATES;

  const template = pick(pool);
  return template
    .replace("{food}", pick(city.foods))
    .replace("{place}", pick(city.places))
    .replace("{sport}", pick(city.sports))
    .replace("{weather}", pick(city.weather))
    .replace("{vibe}", pick(city.vibes))
    .replace("{city}", city.city.toLowerCase())
    .replace("{timeofday}", getTimeOfDay())
    .replace("{season}", getSeason());
}

export function getTemplateKey(content: string): string {
  // Extract the template "shape" by stripping city-specific words.
  // We store the raw template instead — see botRunner usage.
  return content;
}
