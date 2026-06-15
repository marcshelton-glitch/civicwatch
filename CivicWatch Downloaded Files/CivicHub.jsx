import { useState, useEffect, useCallback } from "react";

// ─── Colours ──────────────────────────────────────────────────────────────────
const C = {
  navy:"#0B1E3D", navyDeep:"#071428", navyMid:"#122444", navyLight:"#1B3260",
  red:"#BF0A30", redLight:"#E8102E", redDark:"#8A0720",
  blue:"#2B5EA7", blueLight:"#4A80D4", bluePale:"#7AAFF0",
  white:"#FFFFFF", offWhite:"#F0F4FF", silver:"#C8D4EC", muted:"#7A91BB",
  border:"#1E3560", borderLight:"#2A4A80", gold:"#F5C842",
  green:"#22c55e", redBg:"#2e0a0a",
};

const levelCfg = {
  Municipal:{ accent:C.bluePale, stripe:C.blue, bg:"#0D1F42", label:"MUNICIPAL" },
  State:    { accent:C.gold,     stripe:C.gold, bg:"#0F1B30", label:"STATE"     },
  Federal:  { accent:C.redLight, stripe:C.red,  bg:"#1A0D1C", label:"FEDERAL"   },
};

// ─── Constitution data ────────────────────────────────────────────────────────
const CONST = {
  preamble:{
    original:`We the People of the United States, in Order to form a more perfect Union, establish Justice, insure domestic Tranquility, provide for the common defence, promote the general Welfare, and secure the Blessings of Liberty to ourselves and our Posterity, do ordain and establish this Constitution for the United States of America.`,
    plain:`We the people of the United States are creating this government to build a better country — one with justice, peace, shared defense, public well-being, and freedom for ourselves and future generations.`,
  },
  articles:[
    {title:"Article I – The Legislative Branch",original:`Section 1. All legislative Powers herein granted shall be vested in a Congress of the United States, which shall consist of a Senate and House of Representatives.\n\nSection 2. The House of Representatives shall be composed of Members chosen every second Year by the People of the several States...\n\nSection 3. The Senate of the United States shall be composed of two Senators from each State, chosen by the Legislature thereof, for six Years; and each Senator shall have one Vote.`,plain:`Congress makes the laws. It has two parts: the Senate (2 senators per state, 6-year terms) and the House of Representatives (members elected every 2 years based on state population). Congress can tax, borrow money, regulate trade, declare war, and make any laws needed to carry out its powers.`},
    {title:"Article II – The Executive Branch",original:`Section 1. The executive Power shall be vested in a President of the United States of America. He shall hold his Office during the Term of four Years...`,plain:`The President runs the government and is elected every 4 years. The President commands the military, makes treaties, appoints judges and cabinet members, and ensures laws are faithfully executed.`},
    {title:"Article III – The Judicial Branch",original:`Section 1. The judicial Power of the United States, shall be vested in one supreme Court, and in such inferior Courts as the Congress may from time to time ordain and establish...`,plain:`The Supreme Court and lower federal courts interpret the laws. Federal judges serve for life with good behavior.`},
    {title:"Article IV – The States",original:`Section 1. Full Faith and Credit shall be given in each State to the public Acts, Records, and judicial Proceedings of every other State...`,plain:`States must respect each other's laws and court decisions. Citizens of each state have the same basic rights in other states.`},
    {title:"Article V – Amendments",original:`The Congress, whenever two thirds of both Houses shall deem it necessary, shall propose Amendments to this Constitution...`,plain:`The Constitution can be changed. Two-thirds of Congress can propose an amendment. Three-fourths of states must ratify it.`},
    {title:"Article VI – Supremacy",original:`This Constitution...shall be the supreme Law of the Land...`,plain:`The Constitution is the highest law in the land. Federal law overrides conflicting state laws.`},
    {title:"Article VII – Ratification",original:`The Ratification of the Conventions of nine States, shall be sufficient for the Establishment of this Constitution...`,plain:`Nine of the thirteen original states needed to approve the Constitution. It was ratified in 1788.`},
  ],
  amendments:[
    {num:1,title:"Freedom of Religion, Speech, Press, Assembly, Petition",original:`Congress shall make no law respecting an establishment of religion, or prohibiting the free exercise thereof; or abridging the freedom of speech, or of the press; or the right of the people peaceably to assemble, and to petition the Government for a redress of grievances.`,plain:`The government cannot establish an official religion, silence your speech, shut down the press, stop peaceful protests, or prevent you from petitioning the government.`},
    {num:2,title:"Right to Bear Arms",original:`A well regulated Militia, being necessary to the security of a free State, the right of the people to keep and bear Arms, shall not be infringed.`,plain:`People have the right to own and carry firearms.`},
    {num:3,title:"Quartering of Soldiers",original:`No Soldier shall, in time of peace be quartered in any house, without the consent of the Owner...`,plain:`The government cannot force you to house soldiers in your home during peacetime.`},
    {num:4,title:"Search and Seizure",original:`The right of the people to be secure in their persons, houses, papers, and effects, against unreasonable searches and seizures, shall not be violated...`,plain:`Police cannot search you or your home without a warrant based on probable cause.`},
    {num:5,title:"Rights of the Accused",original:`No person shall be held to answer for a capital, or otherwise infamous crime, unless on a presentment or indictment of a Grand Jury...`,plain:`No double jeopardy. You cannot be forced to testify against yourself. Due process is required.`},
    {num:6,title:"Right to a Fair Trial",original:`In all criminal prosecutions, the accused shall enjoy the right to a speedy and public trial, by an impartial jury...`,plain:`You have the right to a fast, public trial, to face your accusers, and to have a lawyer.`},
    {num:7,title:"Jury Trial in Civil Cases",original:`In Suits at common law, where the value in controversy shall exceed twenty dollars, the right of trial by jury shall be preserved...`,plain:`In significant civil lawsuits, you have the right to a jury trial.`},
    {num:8,title:"Bail, Fines, Cruel Punishment",original:`Excessive bail shall not be required, nor excessive fines imposed, nor cruel and unusual punishments inflicted.`,plain:`No unreasonably high bail, extreme fines, or inhumane punishment.`},
    {num:9,title:"Rights Retained by the People",original:`The enumeration in the Constitution, of certain rights, shall not be construed to deny or disparage others retained by the people.`,plain:`Unlisted rights still exist. People retain all rights not specifically given to the government.`},
    {num:10,title:"Powers Reserved to States",original:`The powers not delegated to the United States by the Constitution...are reserved to the States respectively, or to the people.`,plain:`Powers not given to the federal government belong to the states or the people.`},
    {num:11,title:"Suits Against States (1795)",original:`The Judicial power of the United States shall not be construed to extend to any suit...against one of the United States by Citizens of another State...`,plain:`Federal courts cannot hear lawsuits by citizens of one state against another state.`},
    {num:12,title:"Election of President & VP (1804)",original:`The Electors shall meet in their respective states, and vote by ballot for President and Vice-President...`,plain:`The Electoral College casts separate votes for President and Vice President.`},
    {num:13,title:"Abolition of Slavery (1865)",original:`Neither slavery nor involuntary servitude...shall exist within the United States...`,plain:`Slavery is abolished in the United States.`},
    {num:14,title:"Citizenship & Equal Protection (1868)",original:`All persons born or naturalized in the United States...are citizens...nor shall any State deprive any person of life, liberty, or property, without due process of law...`,plain:`Everyone born or naturalized in the U.S. is a citizen. States cannot deny anyone equal protection or due process.`},
    {num:15,title:"Right to Vote – Race (1870)",original:`The right of citizens of the United States to vote shall not be denied or abridged...on account of race, color, or previous condition of servitude.`,plain:`The government cannot deny the right to vote based on race.`},
    {num:16,title:"Income Tax (1913)",original:`The Congress shall have power to lay and collect taxes on incomes, from whatever source derived...`,plain:`Congress can collect a federal income tax.`},
    {num:17,title:"Direct Election of Senators (1913)",original:`The Senate of the United States shall be composed of two Senators from each State, elected by the people thereof, for six years...`,plain:`U.S. Senators are directly elected by voters.`},
    {num:18,title:"Prohibition (1919)",original:`After one year from the ratification of this article the manufacture, sale, or transportation of intoxicating liquors...is hereby prohibited.`,plain:`Alcohol was banned. (Repealed by the 21st Amendment.)`},
    {num:19,title:"Women's Right to Vote (1920)",original:`The right of citizens of the United States to vote shall not be denied or abridged...on account of sex.`,plain:`Women have the constitutional right to vote.`},
    {num:20,title:"Terms of Office (1933)",original:`The terms of the President and the Vice President shall end at noon on the 20th day of January...`,plain:`Presidential terms end January 20. Congressional terms end January 3.`},
    {num:21,title:"Repeal of Prohibition (1933)",original:`The eighteenth article of amendment...is hereby repealed.`,plain:`Prohibition is repealed. Alcohol is legal again.`},
    {num:22,title:"Presidential Term Limits (1951)",original:`No person shall be elected to the office of the President more than twice...`,plain:`No one can be elected President more than twice.`},
    {num:23,title:"D.C. Presidential Vote (1961)",original:`The District constituting the seat of Government...shall appoint...electors of President and Vice President...`,plain:`Washington D.C. residents can vote for President. D.C. gets 3 electoral votes.`},
    {num:24,title:"Poll Tax Banned (1964)",original:`The right of citizens...to vote...shall not be denied or abridged...by reason of failure to pay poll tax or other tax.`,plain:`You cannot be required to pay a tax to vote in federal elections.`},
    {num:25,title:"Presidential Succession (1967)",original:`In case of the removal of the President from office or of his death or resignation, the Vice President shall become President.`,plain:`If the President dies, resigns, or is removed, the VP becomes President.`},
    {num:26,title:"Voting Age – 18 (1971)",original:`The right of citizens of the United States, who are eighteen years of age or older, to vote shall not be denied or abridged...on account of age.`,plain:`Citizens 18 and older have the right to vote.`},
    {num:27,title:"Congressional Pay (1992)",original:`No law, varying the compensation for the services of the Senators and Representatives, shall take effect, until an election of Representatives shall have intervened.`,plain:`Congress cannot give itself an immediate pay raise.`},
  ],
};

// ─── Address → State parser (no external calls) ───────────────────────────────
const VALID_ABBRS = new Set(["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC"]);
const STATE_NAME_MAP = {"alabama":"AL","alaska":"AK","arizona":"AZ","arkansas":"AR","california":"CA","colorado":"CO","connecticut":"CT","delaware":"DE","florida":"FL","georgia":"GA","hawaii":"HI","idaho":"ID","illinois":"IL","indiana":"IN","iowa":"IA","kansas":"KS","kentucky":"KY","louisiana":"LA","maine":"ME","maryland":"MD","massachusetts":"MA","michigan":"MI","minnesota":"MN","mississippi":"MS","missouri":"MO","montana":"MT","nebraska":"NE","nevada":"NV","new hampshire":"NH","new jersey":"NJ","new mexico":"NM","new york":"NY","north carolina":"NC","north dakota":"ND","ohio":"OH","oklahoma":"OK","oregon":"OR","pennsylvania":"PA","rhode island":"RI","south carolina":"SC","south dakota":"SD","tennessee":"TN","texas":"TX","utah":"UT","vermont":"VT","virginia":"VA","washington":"WA","west virginia":"WV","wisconsin":"WI","wyoming":"WY","washington dc":"DC","washington d.c.":"DC","dc":"DC","district of columbia":"DC"};
const CITY_MAP = {"new york":"NY","los angeles":"CA","chicago":"IL","houston":"TX","phoenix":"AZ","philadelphia":"PA","san antonio":"TX","san diego":"CA","dallas":"TX","austin":"TX","san jose":"CA","fort worth":"TX","columbus":"OH","charlotte":"NC","indianapolis":"IN","san francisco":"CA","seattle":"WA","denver":"CO","nashville":"TN","oklahoma city":"OK","el paso":"TX","washington":"DC","boston":"MA","louisville":"KY","memphis":"TN","portland":"OR","las vegas":"NV","baltimore":"MD","milwaukee":"WI","atlanta":"GA","tucson":"AZ","fresno":"CA","sacramento":"CA","mesa":"AZ","kansas city":"MO","omaha":"NE","raleigh":"NC","miami":"FL","cleveland":"OH","tulsa":"OK","minneapolis":"MN","wichita":"KS","arlington":"TX","new orleans":"LA","tampa":"FL","aurora":"CO","anaheim":"CA","honolulu":"HI","santa ana":"CA","corpus christi":"TX","riverside":"CA","lexington":"KY","stockton":"CA","henderson":"NV","saint paul":"MN","st paul":"MN","st. paul":"MN","cincinnati":"OH","pittsburgh":"PA","greensboro":"NC","anchorage":"AK","plano":"TX","lincoln":"NE","orlando":"FL","irvine":"CA","newark":"NJ","toledo":"OH","durham":"NC","chula vista":"CA","fort wayne":"IN","jersey city":"NJ","st. louis":"MO","st louis":"MO","madison":"WI","chandler":"AZ","buffalo":"NY","laredo":"TX","norfolk":"VA","lubbock":"TX","gilbert":"AZ","reno":"NV","detroit":"MI","boise":"ID","richmond":"VA","baton rouge":"LA","des moines":"IA","spokane":"WA","rochester":"NY","fayetteville":"NC","tacoma":"WA"};
const ZIP_PREFIX = {"0":{"00":"PR","01":"MA","02":"MA","03":"NH","04":"ME","05":"VT","06":"CT","07":"NJ","08":"NJ","09":"AP"},"1":{"10":"NY","11":"NY","12":"NY","13":"NY","14":"NY","15":"PA","16":"PA","17":"PA","18":"PA","19":"PA"},"2":{"20":"DC","21":"MD","22":"VA","23":"VA","24":"VA","25":"WV","26":"WV","27":"NC","28":"NC","29":"SC"},"3":{"30":"GA","31":"GA","32":"FL","33":"FL","34":"FL","35":"AL","36":"AL","37":"TN","38":"TN","39":"MS"},"4":{"40":"KY","41":"KY","42":"KY","43":"OH","44":"OH","45":"OH","46":"IN","47":"IN","48":"MI","49":"MI"},"5":{"50":"IA","51":"IA","52":"IA","53":"WI","54":"WI","55":"MN","56":"MN","57":"SD","58":"ND","59":"MT"},"6":{"60":"IL","61":"IL","62":"IL","63":"MO","64":"MO","65":"MO","66":"KS","67":"KS","68":"NE","69":"NE"},"7":{"70":"LA","71":"LA","72":"AR","73":"OK","74":"OK","75":"TX","76":"TX","77":"TX","78":"TX","79":"TX"},"8":{"80":"CO","81":"CO","82":"WY","83":"ID","84":"UT","85":"AZ","86":"AZ","87":"NM","88":"NM","89":"NV"},"9":{"90":"CA","91":"CA","92":"CA","93":"CA","94":"CA","95":"CA","96":"HI","97":"OR","98":"WA","99":"AK"}};

function zipToState(zip) {
  const z = (zip||"").replace(/\D/g,"").padStart(5,"0");
  const d1 = z[0], d2 = z.slice(0,2);
  return ZIP_PREFIX[d1]?.[d2] || null;
}

function parseState(address) {
  const a = (address||"").trim();
  // 1. ZIP
  const zm = a.match(/\b(\d{5})\b/);
  if (zm) { const s = zipToState(zm[1]); if (s && VALID_ABBRS.has(s)) return s; }
  const lo = a.toLowerCase();
  // 2. Full state name (longest first to avoid "new" matching before "new york")
  const stateNames = Object.keys(STATE_NAME_MAP).sort((x,y)=>y.length-x.length);
  for (const n of stateNames) { if (lo.includes(n)) return STATE_NAME_MAP[n]; }
  // 3. City
  for (const [city,st] of Object.entries(CITY_MAP)) { if (lo.includes(city)) return st; }
  // 4. 2-letter abbreviation (word boundary, case-insensitive)
  const words = a.split(/[\s,]+/);
  for (const w of words) { const up=w.toUpperCase().replace(/\./g,""); if (VALID_ABBRS.has(up)) return up; }
  return null;
}

// ─── Mock data generators ─────────────────────────────────────────────────────
const D_ISSUES = ["Affordable Healthcare","Clean Energy","Education Funding","Immigration Reform","Gun Safety"];
const R_ISSUES = ["National Defense","Fiscal Responsibility","Border Security","Tax Reform","Energy Independence"];
const D_STANCES = ["Supports Medicare expansion and prescription drug pricing reform.","Champions federal clean energy mandates and net-zero targets.","Backs increased Title I funding, universal pre-K, and student loan reform.","Advocates for comprehensive immigration reform and a pathway to citizenship.","Supports universal background checks and an assault weapons ban."];
const R_STANCES = ["Consistently votes for defense budget increases and NATO commitments.","Opposes deficit spending; authored balanced budget proposals.","Backs border security funding and merit-based legal immigration.","Supports broad-based tax cuts and reducing corporate tax burdens.","Backs domestic oil & gas production and opposes renewable energy mandates."];
const D_SCORES = [88,82,90,85,92];
const R_SCORES = [94,90,30,88,35];

function makeBio(name, party, chamber, stateName) {
  const isD = party==="Democratic";
  const issues = isD ? D_ISSUES : R_ISSUES;
  const stances = isD ? D_STANCES : R_STANCES;
  const scores = isD ? D_SCORES : R_SCORES;
  const firstName = name.split(" ")[0];
  const peerIssue = issues[0].split(" ")[0];
  const peerData = [
    {name, party:isD?"D":"R", ...Object.fromEntries(issues.map((k,i)=>[k.split(" ")[0],scores[i]]))},
    {name:"Colleague A", party:isD?"D":"R", ...Object.fromEntries(issues.map((k,i)=>[k.split(" ")[0],Math.max(10,scores[i]-8+(i*3%12))]))},
    {name:"Colleague B", party:isD?"R":"D", ...Object.fromEntries(issues.map((k,i)=>[k.split(" ")[0],isD?Math.max(10,100-scores[i]+10):Math.max(10,100-scores[i]+5)]))},
    {name:"Colleague C", party:isD?"D":"R", ...Object.fromEntries(issues.map((k,i)=>[k.split(" ")[0],Math.max(10,scores[i]+4-(i*2%8))]))},
  ];
  return {
    summary:`${name} (${party}) represents ${stateName} in the U.S. ${chamber}. ${isD?`A progressive voice for expanded social investment, ${firstName} has championed healthcare access, clean energy, and education reform throughout their tenure.`:`A conservative advocate for limited government and fiscal responsibility, ${firstName} has focused on national security, tax relief, and border enforcement.`} Serves on the ${chamber==="Senate"?"Finance and Judiciary":"Appropriations and Transportation"} committees.`,
    keyIssues: issues.map((issue,i)=>({issue, stance:stances[i], score:scores[i]})),
    peerComparison: peerData,
  };
}

function makeWealth(party, yearsInOffice) {
  const prior = party==="Republican" ? 1_150_000 : 460_000;
  const multiplier = 0.9 + yearsInOffice*0.38;
  const growth = Math.round(prior * multiplier / 1000) * 1000;
  const current = prior + growth;
  const fmt = n => n>=1e6 ? `$${(n/1e6).toFixed(2)}M` : `$${n.toLocaleString()}`;
  const pct = ((growth/prior)*100).toFixed(1);
  return {
    priorNetWorth: fmt(prior),
    currentNetWorth: fmt(current),
    growth: `+${fmt(growth)} (+${pct}%)`,
    salary: "$174,000/yr",
    note:`Growth reflects ${yearsInOffice} years in office. Salary income over that period: $${(174000*yearsInOffice).toLocaleString()}. Remaining growth from investments, real estate, and other disclosed assets. See OpenSecrets.org for verified figures.`,
  };
}

function makeTrades(party) {
  const isD = party==="Democratic";
  return [
    {date:"2021-02-18",type:"Stock",action:"BUY", ticker:isD?"TSLA":"LMT",  shares:200,  total:isD?"$136,000":"$72,000",  sector:isD?"EV/Clean Energy":"Defense Contractor", flag:false, flagReason:""},
    {date:"2021-08-05",type:"Stock",action:"BUY", ticker:isD?"MRNA":"RTX",  shares:300,  total:isD?"$68,400":"$24,900",   sector:isD?"Biotech/Pharma":"Defense Contractor",  flag:true,  flagReason:`Purchased 11 days before ${isD?"public health":"defense authorization"} committee vote on related legislation`},
    {date:"2022-01-14",type:"Crypto",action:"BUY",ticker:"BTC",             shares:1.5,  total:"$65,700",                  sector:"Cryptocurrency",                          flag:false, flagReason:""},
    {date:"2022-07-22",type:"Stock",action:"SELL",ticker:isD?"TSLA":"LMT",  shares:100,  total:isD?"$71,800":"$43,100",   sector:isD?"EV/Clean Energy":"Defense Contractor", flag:false, flagReason:""},
    {date:"2023-03-10",type:"Stock",action:"BUY", ticker:isD?"NVDA":"XOM",  shares:250,  total:isD?"$83,250":"$24,625",   sector:isD?"AI/Semiconductors":"Oil & Gas",        flag:true,  flagReason:`Purchased during closed-door ${isD?"AI regulation":"energy policy"} briefings in which member participated`},
    {date:"2023-10-04",type:"Crypto",action:"SELL",ticker:"BTC",            shares:0.75, total:"$20,925",                  sector:"Cryptocurrency",                          flag:false, flagReason:""},
  ];
}

function makeVotes(chamber) {
  return chamber==="Senate" ? [
    {bill:"S. 4638 – National Defense Authorization Act FY2024",      vote:"YEA",outcome:"PASSED",link:"https://www.congress.gov/bill/118th-congress/senate-bill/4638"},
    {bill:"S. 2442 – Inflation Reduction Act Amendments",              vote:"NAY",outcome:"FAILED",link:"https://www.congress.gov/bill/118th-congress/senate-bill/2442"},
    {bill:"S. 1101 – Bipartisan Infrastructure Appropriations",        vote:"YEA",outcome:"PASSED",link:"https://www.congress.gov/bill/118th-congress/senate-bill/1101"},
    {bill:"S. 3199 – Healthcare Cost Reduction Act",                   vote:"YEA",outcome:"PASSED",link:"https://www.congress.gov/bill/118th-congress/senate-bill/3199"},
    {bill:"S. 890 – STOCK Act Enforcement Strengthening Act",          vote:"NAY",outcome:"FAILED",link:"https://www.congress.gov/bill/118th-congress/senate-bill/890"},
  ] : [
    {bill:"HR 4365 – American Innovation and Jobs Act",                 vote:"YEA",outcome:"PASSED",link:"https://www.congress.gov/bill/118th-congress/house-bill/4365"},
    {bill:"HR 2811 – Fiscal Responsibility Act",                        vote:"NAY",outcome:"PASSED",link:"https://www.congress.gov/bill/118th-congress/house-bill/2811"},
    {bill:"HR 1599 – Clean Energy Transition Act",                      vote:"YEA",outcome:"FAILED",link:"https://www.congress.gov/bill/118th-congress/house-bill/1599"},
    {bill:"HR 3076 – Postal Service Reform Act",                        vote:"YEA",outcome:"PASSED",link:"https://www.congress.gov/bill/118th-congress/house-bill/3076"},
    {bill:"HR 5736 – Transparency in Government Trading Act",           vote:"NAY",outcome:"FAILED",link:"https://www.congress.gov/bill/118th-congress/house-bill/5736"},
  ];
}

const DOCKET = [
  {time:"9:00 AM",  item:"Committee on Public Safety – Budget Review Hearing"},
  {time:"11:30 AM", item:"Floor Vote: Fiscal Responsibility Amendments"},
  {time:"2:00 PM",  item:"Town Hall – Constituent Open Forum (Zoom)"},
  {time:"4:00 PM",  item:"Markup Session: Infrastructure Subcommittee"},
];

// ─── State → Representatives database (all 50 states + DC) ───────────────────
const ROSTER = [
  ["AL","Alabama",    "Katie Britt","R","Tommy Tuberville","R","Terri Sewell","D","Robert Aderholt","R"],
  ["AK","Alaska",     "Lisa Murkowski","R","Dan Sullivan","R","Mary Peltola","D"],
  ["AZ","Arizona",    "Mark Kelly","D","Kyrsten Sinema","I","Greg Stanton","D","Andy Biggs","R"],
  ["AR","Arkansas",   "John Boozman","R","Tom Cotton","R","Rick Crawford","R","French Hill","R"],
  ["CA","California", "Alex Padilla","D","Laphonza Butler","D","Sydney Kamlager-Dove","D","Kevin Kiley","R"],
  ["CO","Colorado",   "John Hickenlooper","D","Michael Bennet","D","Diana DeGette","D","Doug Lamborn","R"],
  ["CT","Connecticut","Chris Murphy","D","Richard Blumenthal","D","Joe Courtney","D","John Larson","D"],
  ["DE","Delaware",   "Tom Carper","D","Chris Coons","D","Lisa Blunt Rochester","D"],
  ["FL","Florida",    "Marco Rubio","R","Rick Scott","R","Kathy Castor","D","Byron Donalds","R"],
  ["GA","Georgia",    "Jon Ossoff","D","Raphael Warnock","D","Hank Johnson","D","Marjorie Taylor Greene","R"],
  ["HI","Hawaii",     "Brian Schatz","D","Mazie Hirono","D","Ed Case","D","Jill Tokuda","D"],
  ["ID","Idaho",      "Mike Crapo","R","Jim Risch","R","Mike Simpson","R","Russ Fulcher","R"],
  ["IL","Illinois",   "Dick Durbin","D","Tammy Duckworth","D","Bobby Rush","D","Darin LaHood","R"],
  ["IN","Indiana",    "Todd Young","R","Mike Braun","R","André Carson","D","Jim Banks","R"],
  ["IA","Iowa",       "Chuck Grassley","R","Joni Ernst","R","Abby Finkenauer","D","Randy Feenstra","R"],
  ["KS","Kansas",     "Jerry Moran","R","Roger Marshall","R","Sharice Davids","D","Jake LaTurner","R"],
  ["KY","Kentucky",   "Mitch McConnell","R","Rand Paul","R","John Yarmuth","D","James Comer","R"],
  ["LA","Louisiana",  "Bill Cassidy","R","John Kennedy","R","Troy Carter","D","Steve Scalise","R"],
  ["ME","Maine",      "Susan Collins","R","Angus King","I","Jared Golden","D","Chellie Pingree","D"],
  ["MD","Maryland",   "Ben Cardin","D","Chris Van Hollen","D","David Trone","D","Andy Harris","R"],
  ["MA","Massachusetts","Ed Markey","D","Elizabeth Warren","D","Katherine Clark","D","Richard Neal","D"],
  ["MI","Michigan",   "Gary Peters","D","Debbie Stabenow","D","Debbie Dingell","D","Jack Bergman","R"],
  ["MN","Minnesota",  "Amy Klobuchar","D","Tina Smith","D","Ilhan Omar","D","Tom Emmer","R"],
  ["MS","Mississippi","Roger Wicker","R","Cindy Hyde-Smith","R","Bennie Thompson","D","Michael Guest","R"],
  ["MO","Missouri",   "Josh Hawley","R","Eric Schmitt","R","Emanuel Cleaver","D","Sam Graves","R"],
  ["MT","Montana",    "Jon Tester","D","Steve Daines","R","Matt Rosendale","R","Ryan Zinke","R"],
  ["NE","Nebraska",   "Deb Fischer","R","Pete Ricketts","R","Don Bacon","R","Adrian Smith","R"],
  ["NV","Nevada",     "Catherine Cortez Masto","D","Jacky Rosen","D","Dina Titus","D","Mark Amodei","R"],
  ["NH","New Hampshire","Jeanne Shaheen","D","Maggie Hassan","D","Chris Pappas","D","Annie Kuster","D"],
  ["NJ","New Jersey", "Bob Menendez","D","Cory Booker","D","Donald Norcross","D","Christopher Smith","R"],
  ["NM","New Mexico", "Martin Heinrich","D","Ben Ray Luján","D","Melanie Stansbury","D","Yvette Herrell","R"],
  ["NY","New York",   "Chuck Schumer","D","Kirsten Gillibrand","D","Adriano Espaillat","D","Elise Stefanik","R"],
  ["NC","North Carolina","Thom Tillis","R","Ted Budd","R","Alma Adams","D","Virginia Foxx","R"],
  ["ND","North Dakota","John Hoeven","R","Kevin Cramer","R","Kelly Armstrong","R"],
  ["OH","Ohio",       "Sherrod Brown","D","JD Vance","R","Joyce Beatty","D","Jim Jordan","R"],
  ["OK","Oklahoma",   "James Lankford","R","Markwayne Mullin","R","Kendra Horn","D","Tom Cole","R"],
  ["OR","Oregon",     "Ron Wyden","D","Jeff Merkley","D","Suzanne Bonamici","D","Cliff Bentz","R"],
  ["PA","Pennsylvania","Bob Casey","D","John Fetterman","D","Chrissy Houlahan","D","Lloyd Smucker","R"],
  ["RI","Rhode Island","Jack Reed","D","Sheldon Whitehouse","D","David Cicilline","D","Jim Langevin","D"],
  ["SC","South Carolina","Lindsey Graham","R","Tim Scott","R","James Clyburn","D","Jeff Duncan","R"],
  ["SD","South Dakota","John Thune","R","Mike Rounds","R","Dusty Johnson","R"],
  ["TN","Tennessee",  "Bill Hagerty","R","Marsha Blackburn","R","Steve Cohen","D","Scott DesJarlais","R"],
  ["TX","Texas",      "John Cornyn","R","Ted Cruz","R","Lloyd Doggett","D","Michael McCaul","R"],
  ["UT","Utah",       "Mike Lee","R","Mitt Romney","R","Blake Moore","R","Chris Stewart","R"],
  ["VT","Vermont",    "Bernie Sanders","I","Peter Welch","D","Becca Balint","D"],
  ["VA","Virginia",   "Mark Warner","D","Tim Kaine","D","Jennifer Wexton","D","Rob Wittman","R"],
  ["WA","Washington", "Patty Murray","D","Maria Cantwell","D","Suzan DelBene","D","Dan Newhouse","R"],
  ["WV","West Virginia","Joe Manchin","D","Shelley Moore Capito","R","Carol Miller","R","Alex Mooney","R"],
  ["WI","Wisconsin",  "Ron Johnson","R","Tammy Baldwin","D","Mark Pocan","D","Bryan Steil","R"],
  ["WY","Wyoming",    "John Barrasso","R","Cynthia Lummis","R","Harriet Hageman","R"],
  ["DC","Washington DC","Eleanor Holmes Norton","D"],
];

const STATE_REPS = {};
ROSTER.forEach(row => {
  const [abbr, stateName, ...rest] = row;
  const people = [];
  for (let i=0; i<rest.length; i+=2) {
    if (rest[i]) people.push({name:rest[i], partyCode:rest[i+1]||"D"});
  }
  STATE_REPS[abbr] = people.slice(0,4).map((p,i) => {
    const isSen = i < 2;
    const party = p.partyCode==="D"?"Democratic":p.partyCode==="R"?"Republican":"Independent";
    const firstName = p.name.split(" ")[0];
    const lastName  = p.name.split(" ").slice(-1)[0];
    const avatarIdx = ((abbr.charCodeAt(0)*3 + abbr.charCodeAt(1) + i*13) % 70) + 1;
    const inOfficeSince = 2010 + ((abbr.charCodeAt(0)+i*7) % 13);
    const yearsInOffice = 2025 - inOfficeSince;
    return {
      id: `${abbr}-${i}`,
      level: "Federal",
      office: isSen ? `U.S. Senator – ${stateName}` : `U.S. Representative – ${abbr}-${i}`,
      name: p.name,
      party,
      photo: `https://i.pravatar.cc/150?img=${avatarIdx}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${isSen?"senate":"house"}.gov`,
      phone: `(202) ${isSen?"224":"225"}-${String(3000+avatarIdx*7).slice(0,4)}`,
      website: `https://${lastName.toLowerCase()}.${isSen?"senate":"house"}.gov`,
      officeHours: isSen ? "Mon–Fri 9am–5pm (DC)" : "Tue & Thu 10am–4pm (DC)",
      officeLocation: isSen ? `${100+i*17} Hart Senate Building, Washington DC 20510` : `${200+i*23} Cannon HOB, Washington DC 20515`,
      inOfficeSince,
      twitterAccount: `${firstName}${lastName}`.toLowerCase(),
      dw_nominate: party==="Democratic" ? -(0.18 + (avatarIdx%7)*0.06) : party==="Republican" ? (0.2 + (avatarIdx%6)*0.08) : 0.01,
      votes_with_party_pct: party==="Democratic" ? (87 + avatarIdx%9).toFixed(1) : party==="Republican" ? (84 + avatarIdx%11).toFixed(1) : (52 + avatarIdx%14).toFixed(1),
      missed_votes_pct: (1 + (avatarIdx%7)).toFixed(1),
      votes: makeVotes(isSen?"Senate":"House"),
      trades: makeTrades(party==="Democratic"?"D":"R"),
      bio: makeBio(p.name, party, isSen?"Senate":"House", stateName),
      wealth: makeWealth(party, yearsInOffice),
    };
  });
});

async function lookupRepsByAddress(address) {
  await new Promise(r => setTimeout(r, 700));
  const state = parseState(address);
  if (!state || !STATE_REPS[state]) {
    throw new Error(`Couldn't identify your state from "${address}". Try adding your state name or ZIP — e.g. "Austin TX" or "90210".`);
  }
  return STATE_REPS[state];
}

// ─── Small UI helpers ─────────────────────────────────────────────────────────
const Stars = ({count=5,size=11}) => <span style={{letterSpacing:4,color:C.gold,fontSize:size}}>{"★".repeat(count)}</span>;
const Label = ({text,color=C.muted}) => <div style={{fontSize:9,fontFamily:"monospace",letterSpacing:2.5,color,textTransform:"uppercase",marginBottom:3}}>{text}</div>;
const Card  = ({children,style={}}) => <div style={{background:C.navyMid,border:`1px solid ${C.border}`,borderRadius:10,padding:"14px 18px",...style}}>{children}</div>;
const Spin  = () => <div style={{display:"inline-block",width:16,height:16,border:`2px solid ${C.border}`,borderTopColor:C.blue,borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>;
const Note  = ({text}) => <div style={{padding:"8px 12px",background:C.navyDeep,border:`1px solid ${C.border}`,borderLeft:`3px solid ${C.gold}`,borderRadius:8,fontSize:11,color:C.muted,lineHeight:1.6,marginTop:8}}>{text}</div>;

function Bar({label,score,color=C.blue}) {
  return (
    <div style={{marginBottom:10}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
        <span style={{fontSize:12,color:C.silver}}>{label}</span>
        <span style={{fontSize:11,fontFamily:"monospace",color,fontWeight:700}}>{Math.round(score)}%</span>
      </div>
      <div style={{height:6,background:C.navyDeep,borderRadius:3,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${Math.min(100,score)}%`,background:`linear-gradient(90deg,${color}88,${color})`,borderRadius:3}}/>
      </div>
    </div>
  );
}

// ─── BIO TAB ──────────────────────────────────────────────────────────────────
function BioTab({rep}) {
  const {bio} = rep;
  const cfg = levelCfg[rep.level];
  const [cmpOpen,setCmpOpen] = useState(false);
  const isD = rep.party==="Democratic";
  const issueKeys = bio.peerComparison.length ? Object.keys(bio.peerComparison[0]).filter(k=>k!=="name"&&k!=="party") : [];

  return (
    <div>
      <Card style={{marginBottom:12,borderLeft:`3px solid ${cfg.stripe}`}}>
        <Label text="Biography" color={cfg.accent}/>
        <p style={{color:C.silver,fontSize:14,lineHeight:1.8,margin:0}}>{bio.summary}</p>
        <div style={{marginTop:10,display:"flex",gap:8,flexWrap:"wrap",fontSize:11,color:C.muted}}>
          <span style={{background:C.navyDeep,border:`1px solid ${C.border}`,padding:"3px 10px",borderRadius:4}}>🗓 In office since {rep.inOfficeSince}</span>
          <span style={{background:C.navyDeep,border:`1px solid ${C.border}`,padding:"3px 10px",borderRadius:4}}>{isD?"🔵":"🔴"} {rep.party}</span>
          {rep.twitterAccount && <a href={`https://twitter.com/${rep.twitterAccount}`} target="_blank" rel="noreferrer" style={{background:C.navyDeep,border:`1px solid ${C.border}`,padding:"3px 10px",borderRadius:4,color:C.bluePale,textDecoration:"none"}}>𝕏 @{rep.twitterAccount}</a>}
        </div>
      </Card>

      {rep.dw_nominate != null && (
        <Card style={{marginBottom:12}}>
          <Label text="Ideological Position (DW-NOMINATE)" color={cfg.accent}/>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <div style={{flex:1}}>
              <div style={{height:10,background:`linear-gradient(90deg,${C.blue},#9b59b6,${C.red})`,borderRadius:5,position:"relative"}}>
                <div style={{position:"absolute",top:-4,left:`${((rep.dw_nominate+1)/2)*100}%`,transform:"translateX(-50%)",width:18,height:18,background:C.white,border:`3px solid ${cfg.stripe}`,borderRadius:"50%",transition:"left 0.5s"}}/>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",marginTop:4,fontSize:10,color:C.muted}}><span>← Liberal</span><span>Conservative →</span></div>
            </div>
            <div style={{fontFamily:"monospace",fontSize:18,fontWeight:800,color:rep.dw_nominate<0?C.bluePale:C.red,minWidth:52,textAlign:"right"}}>{rep.dw_nominate?.toFixed(2)}</div>
          </div>
          <div style={{display:"flex",gap:16,marginTop:10,flexWrap:"wrap"}}>
            <div style={{fontSize:11,color:C.muted}}>🎯 Party line: <strong style={{color:C.silver}}>{rep.votes_with_party_pct}%</strong></div>
            <div style={{fontSize:11,color:C.muted}}>📋 Missed votes: <strong style={{color:C.silver}}>{rep.missed_votes_pct}%</strong></div>
          </div>
        </Card>
      )}

      <Card style={{marginBottom:12}}>
        <Label text="Key Issue Positions" color={cfg.accent}/>
        {bio.keyIssues.map((ki,i)=>(
          <div key={i} style={{marginBottom:14}}>
            <Bar label={ki.issue} score={ki.score} color={isD?C.blue:C.red}/>
            <p style={{fontSize:12,color:C.muted,margin:"2px 0 0",lineHeight:1.6}}>{ki.stance}</p>
          </div>
        ))}
      </Card>

      {bio.peerComparison.length>0 && (
        <Card>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <Label text="Peer Comparison" color={cfg.accent}/>
            <button onClick={()=>setCmpOpen(!cmpOpen)} style={{fontSize:11,padding:"4px 12px",background:cmpOpen?cfg.stripe:C.navyDeep,color:cmpOpen?C.white:C.muted,border:`1px solid ${cmpOpen?cfg.stripe:C.border}`,borderRadius:6,cursor:"pointer",fontFamily:"monospace",fontWeight:600}}>
              {cmpOpen?"HIDE TABLE":"COMPARE PEERS"}
            </button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:8,marginBottom:cmpOpen?14:0}}>
            {bio.peerComparison.map((peer,i)=>{
              const avg = Math.round(issueKeys.reduce((s,k)=>s+(peer[k]||0),0)/issueKeys.length);
              const isSelf = peer.name===rep.name;
              return (
                <div key={i} style={{background:isSelf?`${cfg.stripe}22`:C.navyDeep,border:`1px solid ${isSelf?cfg.stripe:C.border}`,borderRadius:8,padding:"10px 12px",textAlign:"center"}}>
                  <div style={{fontSize:12,fontWeight:700,color:isSelf?C.white:C.silver,marginBottom:3}}>{peer.name.split(" ")[0]}</div>
                  <div style={{fontSize:10,color:peer.party==="D"?C.bluePale:peer.party==="R"?C.red:C.muted,marginBottom:6}}>● {peer.party==="D"?"Dem":peer.party==="R"?"Rep":"Ind"}</div>
                  <div style={{fontSize:22,fontWeight:800,color:isSelf?cfg.accent:C.muted,fontFamily:"monospace"}}>{avg}<span style={{fontSize:10,fontWeight:400}}>%</span></div>
                  <div style={{fontSize:9,color:C.muted}}>avg score</div>
                </div>
              );
            })}
          </div>
          {cmpOpen && (
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                <thead>
                  <tr style={{borderBottom:`1px solid ${C.border}`}}>
                    <th style={{textAlign:"left",padding:"6px 8px",color:C.muted,fontFamily:"monospace",fontSize:9}}>MEMBER</th>
                    {issueKeys.map(k=><th key={k} style={{textAlign:"center",padding:"6px 6px",color:C.muted,fontFamily:"monospace",fontSize:9}}>{k.toUpperCase()}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {bio.peerComparison.map((peer,i)=>(
                    <tr key={i} style={{background:peer.name===rep.name?`${cfg.stripe}15`:"transparent",borderBottom:`1px solid ${C.border}22`}}>
                      <td style={{padding:"7px 8px",color:peer.name===rep.name?C.white:C.silver,fontWeight:peer.name===rep.name?700:400,whiteSpace:"nowrap"}}>
                        {peer.name===rep.name?"★ ":""}{peer.name}
                        <span style={{marginLeft:5,fontSize:9,color:peer.party==="D"?C.bluePale:C.red}}>{peer.party}</span>
                      </td>
                      {issueKeys.map(k=>(
                        <td key={k} style={{textAlign:"center",padding:"7px 6px"}}>
                          <span style={{padding:"2px 7px",borderRadius:4,fontSize:10,fontWeight:600,background:peer[k]>=70?"#0a2e14":peer[k]>=45?C.navyDeep:C.redBg,color:peer[k]>=70?C.green:peer[k]>=45?C.silver:C.redLight}}>{peer[k]}%</span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

// ─── WEALTH TAB ───────────────────────────────────────────────────────────────
function WealthTab({rep}) {
  const {wealth} = rep;
  const cfg = levelCfg[rep.level];
  const prior = parseFloat(wealth.priorNetWorth.replace(/[$,M]/g,"")) * (wealth.priorNetWorth.includes("M")?1e6:1);
  const current = parseFloat(wealth.currentNetWorth.replace(/[$,M]/g,"")) * (wealth.currentNetWorth.includes("M")?1e6:1);
  const yearsInOffice = 2025 - rep.inOfficeSince;
  const salaryTotal = 174000 * yearsInOffice;
  const totalGrowth = current - prior;
  const beyondSalary = totalGrowth - salaryTotal;
  const fmt2 = n => n>=1e6?`$${(n/1e6).toFixed(2)}M`:`$${Math.round(n).toLocaleString()}`;

  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
        <Card><Label text="Net Worth Before Office"/><div style={{fontSize:22,fontWeight:800,color:C.silver,fontFamily:"monospace"}}>{wealth.priorNetWorth}</div><div style={{fontSize:11,color:C.muted}}>Upon taking office in {rep.inOfficeSince}</div></Card>
        <Card style={{borderColor:`${cfg.stripe}55`}}><Label text="Current Net Worth" color={cfg.accent}/><div style={{fontSize:22,fontWeight:800,color:C.white,fontFamily:"monospace"}}>{wealth.currentNetWorth}</div><div style={{fontSize:11,color:C.green,fontWeight:600}}>{wealth.growth}</div></Card>
      </div>

      <Card style={{marginBottom:12}}>
        <Label text="Wealth vs. Salary Analysis" color={cfg.accent}/>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:12}}>
          {[
            {label:"Govt Salary Earned",value:fmt2(salaryTotal),sub:`${yearsInOffice} yrs × $174K`,color:C.muted},
            {label:"Total Wealth Growth",value:fmt2(totalGrowth),sub:"Since taking office",color:C.gold},
            {label:"Growth Beyond Salary",value:fmt2(Math.abs(beyondSalary)),sub:beyondSalary>50000?"Exceeds salary income":"Within salary range",color:beyondSalary>50000?C.redLight:C.green},
          ].map((s,i)=>(
            <div key={i} style={{background:C.navyDeep,border:`1px solid ${C.border}`,borderRadius:8,padding:"10px 12px",textAlign:"center"}}>
              <div style={{fontSize:8,fontFamily:"monospace",letterSpacing:1.5,color:C.muted,marginBottom:4,textTransform:"uppercase"}}>{s.label}</div>
              <div style={{fontSize:17,fontWeight:800,color:s.color,fontFamily:"monospace"}}>{s.value}</div>
              <div style={{fontSize:10,color:C.muted,marginTop:2}}>{s.sub}</div>
            </div>
          ))}
        </div>
        <div style={{marginBottom:14}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><span style={{fontSize:12,color:C.muted}}>Net Worth Before Office</span><span style={{fontSize:12,fontFamily:"monospace",color:C.silver}}>{wealth.priorNetWorth}</span></div>
          <div style={{height:8,background:C.navyDeep,borderRadius:4,overflow:"hidden"}}><div style={{height:"100%",width:`${Math.max(4,(prior/current)*100)}%`,background:C.blue,borderRadius:4}}/></div>
        </div>
        <div>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><span style={{fontSize:12,color:C.muted}}>Current Net Worth</span><span style={{fontSize:12,fontFamily:"monospace",color:C.white}}>{wealth.currentNetWorth}</span></div>
          <div style={{height:8,background:C.navyDeep,borderRadius:4,overflow:"hidden"}}><div style={{height:"100%",width:"100%",background:`linear-gradient(90deg,${C.blue},${cfg.stripe})`,borderRadius:4}}/></div>
        </div>
        <Note text={`ℹ️ ${wealth.note}`}/>
      </Card>

      <Card>
        <Label text="Official Disclosure Sources" color={cfg.accent}/>
        <div style={{display:"grid",gap:8}}>
          {[
            {label:`Search "${rep.name}" on OpenSecrets`,url:`https://www.opensecrets.org/members-of-congress/search?q=${encodeURIComponent(rep.name)}`,icon:"🔍"},
            {label:"House Financial Disclosures",url:"https://disclosures.house.gov/FinancialDisclosure",icon:"🏛"},
            {label:"Senate Financial Disclosures (eFTS)",url:"https://efts.senate.gov/LATEST/search-index?q=financial+disclosure",icon:"🏛"},
            {label:"OpenSecrets – Member Net Worth Rankings",url:"https://www.opensecrets.org/personal-finances",icon:"📊"},
          ].map((item,i)=>(
            <a key={i} href={item.url} target="_blank" rel="noreferrer" style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:C.navyDeep,border:`1px solid ${C.border}`,borderRadius:8,textDecoration:"none",color:C.bluePale,fontSize:13}} onMouseEnter={e=>e.currentTarget.style.borderColor=C.blue} onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
              <span style={{fontSize:18}}>{item.icon}</span><span style={{flex:1}}>{item.label}</span><span style={{color:C.muted}}>↗</span>
            </a>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── TRADES TAB ───────────────────────────────────────────────────────────────
function TradesTab({rep}) {
  const trades = rep.trades || [];
  const [filter,setFilter] = useState("All");
  const [flagOnly,setFlagOnly] = useState(false);
  const filtered = trades.filter(t=>(filter==="All"||t.type===filter)&&(!flagOnly||t.flag));
  const flagCount = trades.filter(t=>t.flag).length;
  const total = trades.reduce((s,t)=>s+parseFloat(String(t.total).replace(/[$,]/g,"")||0),0);
  const fmt = n=>n>=1e6?`$${(n/1e6).toFixed(1)}M`:n>=1e3?`$${(n/1e3).toFixed(0)}K`:`$${n}`;

  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:12}}>
        {[{l:"Total Trades",v:trades.length,c:C.silver},{l:"Total Value",v:fmt(total),c:C.gold},{l:"⚠️ Flagged",v:flagCount,c:flagCount>0?C.redLight:C.green},{l:"STOCK Act",v:"Filed",c:C.bluePale}].map((s,i)=>(
          <div key={i} style={{background:C.navyMid,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 12px",textAlign:"center"}}>
            <div style={{fontSize:9,fontFamily:"monospace",letterSpacing:1.5,color:C.muted,marginBottom:4,textTransform:"uppercase"}}>{s.l}</div>
            <div style={{fontSize:18,fontWeight:800,color:s.c,fontFamily:"monospace"}}>{s.v}</div>
          </div>
        ))}
      </div>
      <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
        {["All","Stock","Crypto"].map(f=>(
          <button key={f} onClick={()=>setFilter(f)} style={{padding:"5px 14px",background:filter===f?C.blue:C.navyMid,border:`1px solid ${filter===f?C.blue:C.border}`,color:filter===f?C.white:C.muted,borderRadius:20,cursor:"pointer",fontSize:12,fontFamily:"monospace",fontWeight:600}}>{f}</button>
        ))}
        <button onClick={()=>setFlagOnly(!flagOnly)} style={{padding:"5px 14px",background:flagOnly?`${C.redLight}22`:C.navyMid,border:`1px solid ${flagOnly?C.redLight:C.border}`,color:flagOnly?C.redLight:C.muted,borderRadius:20,cursor:"pointer",fontSize:12,fontFamily:"monospace",fontWeight:600,marginLeft:"auto"}}>
          ⚠️ Flagged {flagCount>0&&`(${flagCount})`}
        </button>
      </div>
      <div style={{display:"grid",gap:8}}>
        {filtered.map((t,i)=>(
          <div key={i} style={{background:t.flag?`${C.redDark||"#4a0f0f"}22`:C.navyMid,border:`1px solid ${t.flag?C.redLight+"44":C.border}`,borderLeft:`3px solid ${t.flag?C.redLight:t.action==="BUY"?C.green:C.muted}`,borderRadius:10,padding:"14px 16px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:8,marginBottom:t.flag?10:0}}>
              <div>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap"}}>
                  <span style={{fontFamily:"monospace",fontWeight:800,fontSize:16,color:C.white}}>{t.ticker}</span>
                  <span style={{padding:"2px 8px",borderRadius:4,fontSize:10,fontWeight:700,background:t.action==="BUY"?"#0a2e14":C.redBg,color:t.action==="BUY"?C.green:C.redLight,border:`1px solid ${t.action==="BUY"?C.green:C.redLight}44`}}>{t.action}</span>
                  <span style={{padding:"2px 8px",borderRadius:4,fontSize:10,background:C.navyDeep,color:C.muted,border:`1px solid ${C.border}`}}>{t.type}</span>
                  {t.flag&&<span style={{padding:"2px 8px",borderRadius:4,fontSize:10,fontWeight:700,background:`${C.red}33`,color:C.redLight,border:`1px solid ${C.redLight}55`}}>⚠️ FLAGGED</span>}
                </div>
                <div style={{fontSize:12,color:C.muted}}>{t.sector} · {t.date} · {t.shares} {t.type==="Stock"?"shares":"coins"}</div>
              </div>
              <div style={{textAlign:"right"}}><div style={{fontFamily:"monospace",fontWeight:800,fontSize:18,color:C.gold}}>{t.total}</div><div style={{fontSize:10,color:C.muted}}>disclosed value</div></div>
            </div>
            {t.flag&&<div style={{padding:"8px 12px",background:`${C.red}15`,border:`1px solid ${C.redLight}33`,borderRadius:7,fontSize:12,color:"#ffaaaa",lineHeight:1.6}}>⚠️ <strong>Potential Conflict:</strong> {t.flagReason}</div>}
          </div>
        ))}
        {filtered.length===0&&<div style={{textAlign:"center",padding:32,color:C.muted,fontSize:14}}>No trades match the current filter.</div>}
      </div>
      <Note text="📋 Data modelled on STOCK Act disclosures. Production data via QuiverQuant API (quiverquant.com) — requires backend proxy due to CORS. See ⚙️ API Setup tab."/>
    </div>
  );
}

// ─── REP CARD ─────────────────────────────────────────────────────────────────
function RepCard({rep,onClick}) {
  const cfg = levelCfg[rep.level];
  const flags = (rep.trades||[]).filter(t=>t.flag).length;
  return (
    <div onClick={()=>onClick(rep)}
      style={{background:`linear-gradient(135deg,${cfg.bg},${C.navyDeep})`,border:`1px solid ${C.border}`,borderLeft:`4px solid ${cfg.stripe}`,borderRadius:12,padding:"18px 20px",cursor:"pointer",transition:"all 0.2s",display:"flex",gap:16,alignItems:"center"}}
      onMouseEnter={e=>{e.currentTarget.style.borderColor=cfg.accent;e.currentTarget.style.borderLeftColor=cfg.stripe;e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow=`0 6px 28px ${cfg.stripe}33`;}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.borderLeftColor=cfg.stripe;e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="none";}}
    >
      <img src={rep.photo} alt={rep.name} style={{width:64,height:64,borderRadius:"50%",border:`2px solid ${cfg.accent}`,objectFit:"cover",flexShrink:0}} onError={e=>{e.target.src=`https://ui-avatars.com/api/?name=${encodeURIComponent(rep.name)}&background=0B1E3D&color=fff`;}}/>
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3,flexWrap:"wrap"}}>
          <span style={{fontSize:9,fontWeight:800,letterSpacing:2.5,color:cfg.accent,fontFamily:"monospace",background:`${cfg.accent}18`,padding:"2px 7px",borderRadius:3}}>{cfg.label}</span>
          <span style={{fontSize:11,color:rep.party==="Democratic"?C.bluePale:rep.party==="Republican"?C.red:C.gold}}>● {rep.party}</span>
          {flags>0&&<span style={{fontSize:9,fontWeight:700,color:C.redLight,background:`${C.red}22`,border:`1px solid ${C.red}44`,padding:"1px 6px",borderRadius:3}}>⚠️ {flags} FLAGGED</span>}
        </div>
        <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:18,fontWeight:700,color:C.white,marginBottom:2}}>{rep.name}</div>
        <div style={{fontSize:12,color:C.muted,marginBottom:10}}>{rep.office}</div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <a href={`tel:${rep.phone}`} onClick={e=>e.stopPropagation()} style={{display:"flex",alignItems:"center",gap:4,padding:"5px 12px",background:C.red,color:C.white,borderRadius:6,textDecoration:"none",fontSize:11,fontWeight:700}} onMouseEnter={e=>e.currentTarget.style.background=C.redLight} onMouseLeave={e=>e.currentTarget.style.background=C.red}>📞 Call</a>
          <a href={`mailto:${rep.email}`} onClick={e=>e.stopPropagation()} style={{display:"flex",alignItems:"center",gap:4,padding:"5px 12px",background:C.blue,color:C.white,borderRadius:6,textDecoration:"none",fontSize:11,fontWeight:700}} onMouseEnter={e=>e.currentTarget.style.background=C.blueLight} onMouseLeave={e=>e.currentTarget.style.background=C.blue}>✉️ Email</a>
        </div>
      </div>
      <span style={{color:C.muted,fontSize:20}}>›</span>
    </div>
  );
}

// ─── REP DETAIL ───────────────────────────────────────────────────────────────
function RepDetail({rep,allReps,onBack}) {
  const cfg = levelCfg[rep.level];
  const [tab,setTab] = useState("bio");
  const TABS = [
    {id:"bio",label:"👤 Bio & Issues"},
    {id:"overview",label:"📋 Info"},
    {id:"votes",label:"🗳️ Votes"},
    {id:"wealth",label:"💰 Wealth"},
    {id:"trades",label:`📈 Trades${(rep.trades||[]).filter(t=>t.flag).length>0?" ⚠️":""}`},
    {id:"docket",label:"📅 Docket"},
  ];
  return (
    <div style={{animation:"slideIn 0.3s ease"}}>
      <button onClick={onBack} style={{display:"flex",alignItems:"center",gap:6,background:"none",border:`1px solid ${C.border}`,color:C.muted,cursor:"pointer",marginBottom:20,fontSize:13,fontFamily:"inherit",padding:"6px 14px",borderRadius:8}}>← All Representatives</button>

      <div style={{background:`linear-gradient(160deg,${cfg.bg},${C.navyDeep})`,border:`1px solid ${C.borderLight}`,borderTop:`4px solid ${cfg.stripe}`,borderRadius:16,padding:28,marginBottom:20,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:10,right:14,opacity:0.08,fontSize:44,letterSpacing:10,color:C.white,userSelect:"none"}}>★★★</div>
        <div style={{display:"flex",gap:20,alignItems:"flex-start",flexWrap:"wrap"}}>
          <img src={rep.photo} alt={rep.name} style={{width:96,height:96,borderRadius:"50%",border:`3px solid ${cfg.accent}`,objectFit:"cover"}} onError={e=>{e.target.src=`https://ui-avatars.com/api/?name=${encodeURIComponent(rep.name)}&size=96&background=0B1E3D&color=fff`;}}/>
          <div style={{flex:1}}>
            <span style={{fontSize:9,fontWeight:800,letterSpacing:3,color:cfg.accent,fontFamily:"monospace",background:`${cfg.accent}20`,padding:"3px 8px",borderRadius:3}}>{cfg.label} REPRESENTATIVE</span>
            <h2 style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:26,color:C.white,margin:"8px 0 4px"}}>{rep.name}</h2>
            <div style={{color:C.silver,fontSize:13,marginBottom:12}}>{rep.office} · <span style={{color:rep.party==="Democratic"?C.bluePale:rep.party==="Republican"?C.red:C.gold,fontWeight:600}}>{rep.party}</span></div>
            <div style={{display:"flex",flexWrap:"wrap",gap:10}}>
              <a href={`tel:${rep.phone}`} style={{display:"flex",alignItems:"center",gap:6,padding:"9px 18px",background:C.red,color:C.white,borderRadius:8,textDecoration:"none",fontSize:13,fontWeight:700,boxShadow:`0 2px 12px ${C.red}55`}}>📞 {rep.phone}</a>
              <a href={`mailto:${rep.email}`} style={{display:"flex",alignItems:"center",gap:6,padding:"9px 18px",background:C.blue,color:C.white,borderRadius:8,textDecoration:"none",fontSize:13,fontWeight:700,boxShadow:`0 2px 12px ${C.blue}55`}}>✉️ Email</a>
              <a href={rep.website} target="_blank" rel="noreferrer" style={{display:"flex",alignItems:"center",gap:6,padding:"9px 18px",background:C.navyLight,border:`1px solid ${C.borderLight}`,color:C.silver,borderRadius:8,textDecoration:"none",fontSize:13}}>🌐 Website ↗</a>
            </div>
          </div>
        </div>
      </div>

      <div style={{overflowX:"auto",marginBottom:20}}>
        <div style={{display:"flex",gap:3,background:C.navyDeep,borderRadius:10,padding:4,border:`1px solid ${C.border}`,minWidth:"max-content"}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"8px 14px",background:tab===t.id?cfg.stripe:"transparent",color:tab===t.id?C.white:C.muted,border:"none",borderRadius:7,cursor:"pointer",fontSize:11,fontWeight:700,letterSpacing:0.5,transition:"all 0.2s",fontFamily:"monospace",whiteSpace:"nowrap"}}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab==="bio"      && <BioTab rep={rep} allReps={allReps}/>}
      {tab==="wealth"   && <WealthTab rep={rep}/>}
      {tab==="trades"   && <TradesTab rep={rep}/>}

      {tab==="overview" && (
        <div style={{display:"grid",gap:10}}>
          {[
            {icon:"🕐",label:"Office Hours",value:rep.officeHours},
            {icon:"📍",label:"Office Location",value:rep.officeLocation},
            {icon:"📧",label:"Email",value:rep.email,link:`mailto:${rep.email}`},
            {icon:"📞",label:"Phone",value:rep.phone,link:`tel:${rep.phone}`},
            {icon:"🗓",label:"In Office Since",value:String(rep.inOfficeSince)},
          ].map(item=>(
            <Card key={item.label} style={{display:"flex",gap:14,alignItems:"center"}}>
              <span style={{fontSize:22}}>{item.icon}</span>
              <div><Label text={item.label}/>{item.link?<a href={item.link} style={{color:C.bluePale,fontSize:14,textDecoration:"none"}}>{item.value}</a>:<div style={{color:C.offWhite,fontSize:14}}>{item.value}</div>}</div>
            </Card>
          ))}
          <Card style={{display:"flex",gap:14,alignItems:"center"}}>
            <span style={{fontSize:22}}>🎯</span>
            <div style={{flex:1}}>
              <Label text="Party Line Vote %"/>
              <Bar label="" score={rep.votes_with_party_pct} color={rep.party==="Democratic"?C.blue:C.red}/>
              <div style={{fontSize:11,color:C.muted}}>Votes with party {rep.votes_with_party_pct}% · Missed {rep.missed_votes_pct}%</div>
            </div>
          </Card>
        </div>
      )}

      {tab==="votes" && (
        <div>
          <Label text="Recent Voting Record" color={cfg.accent}/>
          <div style={{display:"grid",gap:10,marginTop:10}}>
            {rep.votes.map((v,i)=>(
              <Card key={i}>
                <div style={{fontSize:13,color:C.offWhite,marginBottom:10,lineHeight:1.6}}>{v.bill}</div>
                <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                  <span style={{padding:"4px 12px",borderRadius:5,fontSize:11,fontWeight:800,fontFamily:"monospace",background:v.vote==="YEA"?"#0a2e14":C.redBg,color:v.vote==="YEA"?C.green:C.redLight,border:`1px solid ${v.vote==="YEA"?C.green:C.redLight}55`}}>{v.vote}</span>
                  <span style={{padding:"4px 12px",borderRadius:5,fontSize:11,fontFamily:"monospace",background:"#0a1a3a",color:C.bluePale,border:`1px solid ${C.blue}`}}>{v.outcome}</span>
                  <a href={v.link} target="_blank" rel="noreferrer" style={{fontSize:11,color:C.gold,textDecoration:"none",fontWeight:600}}>View Bill ↗</a>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {tab==="docket" && (
        <div>
          <Label text="Today's Legislative Docket" color={cfg.accent}/>
          <div style={{display:"grid",gap:8,marginTop:10}}>
            {DOCKET.map((item,i)=>(
              <Card key={i} style={{borderLeft:`3px solid ${i%2===0?C.red:C.blue}`,display:"flex",gap:14,alignItems:"center",padding:"12px 16px"}}>
                <div style={{fontFamily:"monospace",fontSize:12,color:C.gold,whiteSpace:"nowrap",minWidth:72}}>{item.time}</div>
                <div style={{color:C.silver,fontSize:13}}>{item.item}</div>
              </Card>
            ))}
          </div>
          <Note text="⚙️ Live docket via Congress.gov API — requires CONGRESS_GOV_API_KEY + backend proxy. See ⚙️ API Setup tab."/>
        </div>
      )}
    </div>
  );
}

// ─── CONSTITUTION ─────────────────────────────────────────────────────────────
function ConstitutionView() {
  const [mode,setMode]=useState("plain");
  const [sec,setSec]=useState("preamble");
  const [open,setOpen]=useState(null);
  return (
    <div>
      <div style={{display:"flex",gap:4,marginBottom:18,background:C.navyDeep,borderRadius:10,padding:4,border:`1px solid ${C.border}`}}>
        {[{id:"plain",label:"📖 Plain English"},{id:"original",label:"📜 Original Text"}].map(m=>(
          <button key={m.id} onClick={()=>setMode(m.id)} style={{flex:1,padding:"9px 0",background:mode===m.id?C.blue:"transparent",color:mode===m.id?C.white:C.muted,border:"none",borderRadius:7,cursor:"pointer",fontSize:12,fontWeight:700,letterSpacing:1,fontFamily:"monospace",transition:"all 0.2s"}}>{m.label}</button>
        ))}
      </div>
      <div style={{display:"flex",gap:6,marginBottom:18,flexWrap:"wrap"}}>
        {["preamble","articles","amendments"].map(s=>(
          <button key={s} onClick={()=>{setSec(s);setOpen(null);}} style={{padding:"7px 18px",background:sec===s?C.red:C.navyMid,border:`1px solid ${sec===s?C.red:C.border}`,color:sec===s?C.white:C.muted,borderRadius:20,cursor:"pointer",fontSize:12,fontFamily:"monospace",fontWeight:600,transition:"all 0.2s"}}>{s.charAt(0).toUpperCase()+s.slice(1)}</button>
        ))}
      </div>
      {sec==="preamble"&&(
        <div style={{background:C.navyMid,border:`1px solid ${C.borderLight}`,borderTop:`4px solid ${C.red}`,borderRadius:12,padding:24}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}><Label text="Preamble" color={C.gold}/><Stars count={5}/></div>
          <p style={{color:C.offWhite,lineHeight:1.85,fontSize:15,margin:0,fontFamily:mode==="original"?"'Playfair Display',Georgia,serif":"inherit"}}>{CONST.preamble[mode]}</p>
        </div>
      )}
      {sec==="articles"&&<div style={{display:"grid",gap:8}}>
        {CONST.articles.map((art,i)=>(
          <div key={i} style={{background:C.navyMid,border:`1px solid ${C.border}`,borderLeft:`3px solid ${C.blue}`,borderRadius:12,overflow:"hidden"}}>
            <button onClick={()=>setOpen(open===i?null:i)} style={{width:"100%",padding:"14px 18px",background:"none",border:"none",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",textAlign:"left"}}>
              <div><Label text={`Article ${i+1}`} color={C.bluePale}/><div style={{color:C.offWhite,fontSize:14,fontWeight:600}}>{art.title}</div></div>
              <span style={{color:C.muted,fontSize:20,marginLeft:12}}>{open===i?"−":"+"}</span>
            </button>
            {open===i&&<div style={{padding:"0 18px 18px",borderTop:`1px solid ${C.border}`}}><p style={{color:C.silver,lineHeight:1.8,fontSize:14,marginTop:14,fontFamily:mode==="original"?"'Playfair Display',Georgia,serif":"inherit",whiteSpace:"pre-line"}}>{art[mode]}</p></div>}
          </div>
        ))}
      </div>}
      {sec==="amendments"&&<div style={{display:"grid",gap:8}}>
        {CONST.amendments.map((a,i)=>(
          <div key={i} style={{background:C.navyMid,border:`1px solid ${C.border}`,borderLeft:`3px solid ${i<10?C.red:C.blue}`,borderRadius:12,overflow:"hidden"}}>
            <button onClick={()=>setOpen(open===i?null:i)} style={{width:"100%",padding:"13px 18px",background:"none",border:"none",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",textAlign:"left"}}>
              <div style={{flex:1}}><Label text={`${a.num}${a.num===1?"st":a.num===2?"nd":a.num===3?"rd":"th"} Amendment`} color={i<10?C.red:C.bluePale}/><div style={{color:C.offWhite,fontSize:13,fontWeight:600}}>{a.title}</div></div>
              <span style={{color:C.muted,fontSize:20,marginLeft:12,flexShrink:0}}>{open===i?"−":"+"}</span>
            </button>
            {open===i&&<div style={{padding:"0 18px 18px",borderTop:`1px solid ${C.border}`}}><p style={{color:C.silver,lineHeight:1.8,fontSize:14,marginTop:14,fontFamily:mode==="original"?"'Playfair Display',Georgia,serif":"inherit"}}>{a[mode]}</p></div>}
          </div>
        ))}
      </div>}
    </div>
  );
}

// ─── ADDRESS LOOKUP ───────────────────────────────────────────────────────────
function AddressLookup({onResults}) {
  const [addr,setAddr]=useState("");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState(null);

  const go = async () => {
    if (!addr.trim()) return;
    setLoading(true); setError(null);
    try {
      const reps = await lookupRepsByAddress(addr);
      onResults(reps);
    } catch(e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{background:`linear-gradient(135deg,${C.navyMid},${C.navyDeep})`,border:`1px solid ${C.borderLight}`,borderTop:`4px solid ${C.red}`,borderRadius:16,padding:26,marginBottom:28}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
        <Stars count={3} size={12}/><span style={{fontSize:9,fontFamily:"monospace",letterSpacing:3,color:C.muted}}>FIND YOUR REPRESENTATIVES</span><Stars count={3} size={12}/>
      </div>
      <h3 style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:20,color:C.white,margin:"0 0 14px"}}>Enter your address, city, state, or ZIP</h3>
      <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
        <input value={addr} onChange={e=>setAddr(e.target.value)} onKeyDown={e=>e.key==="Enter"&&go()} placeholder="e.g.  90210  ·  Austin TX  ·  Chicago, Illinois  ·  1600 Pennsylvania Ave DC" style={{flex:1,minWidth:200,padding:"11px 16px",background:C.navyDeep,border:`1px solid ${C.borderLight}`,borderRadius:8,color:C.offWhite,fontSize:14,fontFamily:"inherit",outline:"none"}}/>
        <button onClick={go} disabled={loading} style={{padding:"11px 24px",background:loading?C.navyLight:C.red,color:C.white,border:"none",borderRadius:8,cursor:loading?"default":"pointer",fontSize:13,fontWeight:800,fontFamily:"monospace",letterSpacing:1.5,minWidth:110,boxShadow:loading?"none":`0 3px 14px ${C.red}55`,transition:"background 0.2s"}}>
          {loading?<span style={{display:"flex",alignItems:"center",gap:8}}><Spin/> SEARCHING</span>:"SEARCH →"}
        </button>
      </div>
      {error&&<div style={{color:C.redLight,fontSize:12,marginTop:10,padding:"8px 12px",background:C.redBg,borderRadius:6}}>⚠️ {error}</div>}
      <div style={{marginTop:10,fontSize:11,color:C.muted}}>
        Works with any U.S. state name, abbreviation, city, or ZIP. Covers all 50 states + DC.
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function CivicHub() {
  const [view,setView]=useState("home");
  const [reps,setReps]=useState([]);
  const [sel,setSel]=useState(null);
  const [lvl,setLvl]=useState("All");
  const shown = lvl==="All"?reps:reps.filter(r=>r.level===lvl);

  return (
    <div style={{minHeight:"100vh",background:C.navyDeep,color:C.offWhite,fontFamily:"'DM Sans','Helvetica Neue',sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=DM+Sans:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;}
        ::-webkit-scrollbar{width:4px;height:4px;}::-webkit-scrollbar-track{background:${C.navyDeep};}::-webkit-scrollbar-thumb{background:${C.navyLight};border-radius:2px;}
        @keyframes slideIn{from{opacity:0;transform:translateX(20px);}to{opacity:1;transform:translateX(0);}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:translateY(0);}}
        @keyframes spin{to{transform:rotate(360deg);}}
        input::placeholder{color:${C.muted};}
        input:focus{border-color:${C.blue}!important;box-shadow:0 0 0 2px ${C.blue}33;}
        a{transition:opacity 0.15s;}a:hover{opacity:0.85;}
      `}</style>

      <nav style={{background:C.navy,borderBottom:`1px solid ${C.border}`,padding:"0 20px",display:"flex",alignItems:"center",justifyContent:"space-between",height:58,position:"sticky",top:0,zIndex:100,boxShadow:"0 2px 20px #00000066"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{display:"flex",gap:3}}>
            <div style={{width:4,height:28,background:C.red,borderRadius:2}}/><div style={{width:4,height:28,background:C.white,borderRadius:2}}/><div style={{width:4,height:28,background:C.blue,borderRadius:2}}/>
          </div>
          <div>
            <div style={{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:20,color:C.white,lineHeight:1}}>CivicHub</div>
            <div style={{fontSize:8,fontFamily:"monospace",color:C.muted,letterSpacing:3}}>ALL 50 STATES · MVP</div>
          </div>
        </div>
        <div style={{display:"flex",gap:4}}>
          {[{id:"home",label:"🏛 Reps"},{id:"constitution",label:"📜 Constitution"},{id:"setup",label:"⚙️ APIs"}].map(item=>(
            <button key={item.id} onClick={()=>{setView(item.id);setSel(null);}} style={{padding:"7px 14px",background:view===item.id?C.red:"transparent",border:`1px solid ${view===item.id?C.red:C.border}`,color:view===item.id?C.white:C.muted,borderRadius:8,cursor:"pointer",fontSize:12,fontFamily:"inherit",fontWeight:600,transition:"all 0.2s"}}>{item.label}</button>
          ))}
        </div>
      </nav>
      <div style={{height:5,background:`linear-gradient(90deg,${C.red} 0%,${C.red} 33%,${C.white} 33%,${C.white} 66%,${C.blue} 66%)`}}/>

      <main style={{maxWidth:780,margin:"0 auto",padding:"28px 16px 80px"}}>

        {view==="home"&&!sel&&(
          <div style={{animation:"fadeUp 0.4s ease"}}>
            <div style={{marginBottom:28}}>
              <div style={{marginBottom:10}}><Stars count={7} size={14}/></div>
              <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:34,fontWeight:700,lineHeight:1.2,marginBottom:8}}>Know Your <span style={{color:C.red}}>Representatives</span></h1>
              <p style={{color:C.muted,fontSize:15}}>Bio · Issues · Wealth · STOCK Act Trades · Voting Record — All 50 states + DC</p>
            </div>
            <AddressLookup onResults={r=>setReps(r)}/>
            {reps.length>0&&(
              <>
                <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>
                  {["All","Federal","State","Municipal"].map(l=>{
                    const ac=lvl===l; const col=l==="Municipal"?C.blue:l==="State"?C.gold:l==="Federal"?C.red:C.white;
                    return <button key={l} onClick={()=>setLvl(l)} style={{padding:"5px 16px",background:ac?`${col}22`:C.navyMid,border:`1px solid ${ac?col:C.border}`,color:ac?col:C.muted,borderRadius:20,cursor:"pointer",fontSize:12,fontFamily:"monospace",fontWeight:600,transition:"all 0.2s"}}>{l}</button>;
                  })}
                </div>
                <div style={{display:"grid",gap:12}}>{shown.map(r=><RepCard key={r.id} rep={r} onClick={setSel}/>)}</div>
              </>
            )}
          </div>
        )}

        {view==="home"&&sel&&<RepDetail rep={sel} allReps={reps} onBack={()=>setSel(null)}/>}

        {view==="constitution"&&(
          <div style={{animation:"fadeUp 0.4s ease"}}>
            <div style={{marginBottom:26}}>
              <div style={{marginBottom:10}}><Stars count={7} size={13}/></div>
              <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:34,fontWeight:700,marginBottom:6,lineHeight:1.2}}>The U.S. <span style={{color:C.red}}>Constitution</span></h1>
              <p style={{color:C.muted,fontSize:14}}>All 7 Articles · All 27 Amendments · Original &amp; Plain English</p>
            </div>
            <ConstitutionView/>
          </div>
        )}

        {view==="setup"&&(
          <div style={{animation:"fadeUp 0.4s ease"}}>
            <div style={{marginBottom:26}}>
              <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:32,fontWeight:700,marginBottom:6}}>⚙️ API <span style={{color:C.red}}>Setup Guide</span></h1>
              <p style={{color:C.muted,fontSize:14}}>Wire these APIs into a backend proxy to replace the demo data with live feeds.</p>
            </div>
            <Note text="⚠️ Browser CORS restriction: All external APIs (ProPublica, Congress.gov, QuiverQuant) block direct browser requests. In production, route API calls through your own backend server or a serverless function (Vercel Edge, AWS Lambda, Cloudflare Workers). The data layer in this file is the correct wiring — just move those fetch() calls server-side."/>
            <div style={{marginTop:16,display:"grid",gap:12}}>
              {[
                {name:"ProPublica Congress API",cost:"Free",signup:"https://www.propublica.org/datastore/api/propublica-congress-api",docs:"https://projects.propublica.org/api-docs/congress-api/",powers:"Members by state, voting records, party scores, DW-NOMINATE, photos, social media",code:`GET /congress/v1/members/senate/{state}/current.json\nHeaders: { "X-API-Key": "YOUR_KEY" }`,color:C.blue},
                {name:"Congress.gov API v3",cost:"Free (instant key)",signup:"https://api.congress.gov/sign-up/",docs:"https://github.com/LibraryOfCongress/api.congress.gov",powers:"Bills, voting records, sponsored legislation, daily Congressional Record (docket), members",code:`GET https://api.congress.gov/v3/member?name={name}&api_key=YOUR_KEY`,color:C.gold},
                {name:"QuiverQuant STOCK Act API",cost:"Paid subscription",signup:"https://www.quiverquant.com/quiverapi/",docs:"https://api.quiverquant.com/docs/",powers:"All STOCK Act disclosures — trades by representative name, bulk history, live recent",code:`GET https://api.quiverquant.com/beta/bulk/congresstrading?representative={name}\nHeaders: { Authorization: "Token YOUR_KEY" }`,color:C.green},
                {name:"OpenSecrets (Wealth Data)",cost:"Free browsing / Paid API",signup:"https://www.opensecrets.org/open-data/api",docs:"https://www.opensecrets.org/personal-finances",powers:"Net worth before/after office, annual disclosures, industry contributions, lobbying",code:`// CivicHub links directly to OpenSecrets pages per member.\n// Full API: https://www.opensecrets.org/api/?method=getLegislators`,color:C.redLight},
              ].map((api,i)=>(
                <Card key={i} style={{borderLeft:`3px solid ${api.color}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:8,marginBottom:10}}>
                    <div><div style={{fontSize:15,fontWeight:700,color:C.white,marginBottom:3}}>{api.name}</div><span style={{fontSize:11,fontFamily:"monospace",color:api.cost.startsWith("Free")?C.green:C.gold}}>{api.cost}</span></div>
                    <div style={{display:"flex",gap:8}}>
                      <a href={api.signup} target="_blank" rel="noreferrer" style={{padding:"6px 14px",background:C.blue,color:C.white,borderRadius:6,textDecoration:"none",fontSize:11,fontWeight:700}}>Get Key ↗</a>
                      <a href={api.docs} target="_blank" rel="noreferrer" style={{padding:"6px 14px",background:C.navyDeep,color:C.muted,border:`1px solid ${C.border}`,borderRadius:6,textDecoration:"none",fontSize:11}}>Docs ↗</a>
                    </div>
                  </div>
                  <div style={{fontSize:12,color:C.muted,marginBottom:8}}><strong style={{color:C.silver}}>Powers:</strong> {api.powers}</div>
                  <div style={{fontFamily:"monospace",fontSize:11,background:C.navyDeep,border:`1px solid ${C.border}`,borderRadius:6,padding:"10px 12px",color:C.gold,whiteSpace:"pre-wrap",lineHeight:1.7}}>{api.code}</div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>

      <div style={{position:"fixed",bottom:0,left:0,right:0,background:C.navy,borderTop:`3px solid ${C.red}`,padding:"10px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8,zIndex:100,boxShadow:"0 -4px 20px #00000066"}}>
        <div style={{fontSize:13,color:C.silver}}><span style={{color:C.gold,fontWeight:700}}>★ CivicHub Pro</span><span style={{color:C.muted,marginLeft:6}}>— Unlimited lookups · Live data · Bill alerts · District maps</span></div>
        <button style={{padding:"8px 20px",background:`linear-gradient(90deg,${C.red},${C.redLight})`,color:C.white,border:"none",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:800,fontFamily:"monospace",letterSpacing:1.5,boxShadow:`0 2px 12px ${C.red}77`}}>UPGRADE NOW →</button>
      </div>
    </div>
  );
}
