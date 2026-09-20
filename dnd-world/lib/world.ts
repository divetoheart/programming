export const WORLD_BIBLE = {
  title: "Mournreach",
  age: "The Ashen Reckoning, Year 311",
  premise: "Three centuries ago the Nine Saint-Kings rang the Bell Beneath the World to end a war. The dead stopped dreaming, the sun dimmed for nine days, and every miracle afterward demanded payment in memory, blood, or years. Mournreach survived, but never healed.",
  laws: [
    "Magic always has a cost. Powerful workings consume memory, blood, lifespan, identity, or an equivalent sacrifice.",
    "The dead do not naturally return. Apparitions are echoes, bargains, possessions, or counterfeit lives.",
    "Names have metaphysical weight. True names can bind, protect, curse, inherit debt, and open old imperial wards.",
    "Iron disrupts spirit-work. Salt preserves boundaries. Blackglass stores impressions of violence and strong emotion.",
    "No faction is omnipotent. Information moves slowly, roads fail, weather matters, and distance has consequences.",
    "NPCs remember humiliation, mercy, debt, promises, wounds, theft, betrayal, and public reputation.",
  ],
  history: [
    { era: "Before Reckoning", text: "The Caldran Empire linked the coast, fen, highlands, and cinder plains with saint-roads and bell towers. Imperial scholars codified six languages and built blackglass archives that could preserve witnessed memory." },
    { era: "Year 0", text: "At the Siege of Orison, nine crowned saints performed the Last Concord and rang a buried bronze bell. The opposing army vanished. So did much of Orison. The miracle poisoned the covenant between memory and death." },
    { era: "Years 1-40", text: "The empire fractured. Plagues of sleepwalking dead and memory loss destroyed census, law, and inheritance. Regional powers replaced imperial government." },
    { era: "Years 160-240", text: "The Lantern Synod standardized burial law and licensed miracle-workers. Salt roads reopened. House Morcant rose through debt, mercenary tolls, and salvage rights." },
    { era: "Present", text: "Bells are ringing under abandoned places again. People disappear from records before they disappear from streets. Something beneath the old empire is rehearsing history." },
  ],
  regions: [
    {
      id: "gloam-coast",
      name: "The Gloam Coast",
      tone: "salt, rain, black cliffs, drowned shrines",
      description: "A storm-bitten western coast where villages lash their graveyards to the earth with iron chain. Smugglers use drowned imperial tunnels at low tide.",
      image: "/art/gloam-coast.svg",
      settlements: ["Gallowspire", "Greywake", "Vesper Quay"],
    },
    {
      id: "weeping-fen",
      name: "The Weeping Fen",
      tone: "peat smoke, corpse-lights, reed cathedrals",
      description: "A continent-sized wetland layered over older cities. Roads drift. Maps expire. Salt Witches pole between villages and trade in memories sealed inside wax beads.",
      image: "/art/weeping-fen.svg",
      settlements: ["Mirecross", "Saint Letha's Steps", "Wormwater"],
    },
    {
      id: "saints-teeth",
      name: "The Saint's Teeth",
      tone: "snow, monasteries, bone-white peaks",
      description: "Knife-edged mountains crowned by monasteries that keep forbidden calendars. The oldest bells in Mournreach hang here, though none have ropes.",
      image: "/art/saints-teeth.svg",
      settlements: ["High Veyr", "The Ninth Cloister", "Kestrel Hold"],
    },
    {
      id: "cinder-march",
      name: "The Cinder March",
      tone: "ash fields, ruined forts, red grass",
      description: "A former imperial breadbasket burned during the Reckoning. Glass storms expose battlefields and whole streets preserved beneath ash.",
      image: "/art/cinder-march.svg",
      settlements: ["Ashmarket", "Red Mercy", "Caldran Gate"],
    },
    {
      id: "blackwood",
      name: "The Blackwood",
      tone: "ancient forest, antler shrines, perpetual dusk",
      description: "A forest older than empire. Trees grow around iron nails and spit them out decades later. Hunters say the wood changes its borders when offended.",
      image: "/art/blackwood.svg",
      settlements: ["Thornwake", "Old Hart", "The Root Court"],
    },
  ],
  factions: [
    {
      id: "lantern-synod",
      name: "The Lantern Synod",
      publicGoal: "Keep the dead buried, license miracle-work, preserve civil order.",
      doctrine: "A memory willingly surrendered can buy a miracle without damnation.",
      secret: "Senior prelates maintain an archive of confiscated memories and can reconstruct partial personalities from them.",
    },
    {
      id: "house-morcant",
      name: "House Morcant",
      publicGoal: "Secure roads, collect lawful tolls, restore the old trade network.",
      doctrine: "Order is a debt paid in coin or blood.",
      secret: "Morcant cartographers have mapped a functioning imperial road beneath the Cinder March.",
    },
    {
      id: "carrion-compact",
      name: "The Carrion Compact",
      publicGoal: "Protect free companies, scavengers, undertakers, and battlefield salvagers.",
      doctrine: "Nothing useful should be buried.",
      secret: "The Compact has recovered one of the nine saint-crowns and cannot agree who should wear it.",
    },
    {
      id: "salt-witches",
      name: "The Salt Witches",
      publicGoal: "Keep old boundaries, guide travelers, trade cures and curses.",
      doctrine: "Every promise is a border.",
      secret: "Their oldest matriarch remembers the Reckoning despite being born two centuries later.",
    },
    {
      id: "pale-court",
      name: "The Pale Court",
      publicGoal: "Unknown; most people consider it folklore.",
      doctrine: "Identity is only a habit memory teaches the body.",
      secret: "The Court replaces influential people with memory-perfect counterfeits that do not know they are copies.",
    },
  ],
  faiths: [
    {
      name: "The Ninefold Lantern",
      belief: "The saint-kings were flawed protectors whose final miracle saved humanity but broke the world. Worship focuses on duty, burial, confession, and remembered names.",
    },
    {
      name: "The Hearth Below",
      belief: "Rural ancestor faith. The dead become part of household luck if properly named and fed with stories.",
    },
    {
      name: "The Empty Choir",
      belief: "A forbidden mystical school claiming the Bell did not break death; it revealed that death had always been an artificial boundary.",
    },
  ],
  languages: [
    {
      id: "low-veyric",
      name: "Low Veyric",
      script: "Veyric hand",
      use: "Trade and daily speech across western Mournreach.",
      grammar: "Subject-verb-object. Titles follow names. Oaths often use weather metaphors.",
      phrases: [
        { native: "Va ren tal.", meaning: "The road remembers." },
        { native: "Sorren nai.", meaning: "No debt between us." },
        { native: "Kel va mor.", meaning: "Keep your name." },
      ],
    },
    {
      id: "old-caldran",
      name: "Old Caldran",
      script: "Imperial square glyphs",
      use: "Ruins, law stones, military commands, sealed mechanisms.",
      grammar: "Case-heavy and formal. Verbs encode whether an action was witnessed, inherited, or merely reported.",
      phrases: [
        { native: "OR VELA TESTUM", meaning: "By witnessed authority." },
        { native: "NOMEN CLAUDE", meaning: "Seal the name." },
        { native: "MORTIS NON REDIT", meaning: "Death does not return." },
      ],
    },
    {
      id: "nhalic",
      name: "Nhalic",
      script: "Knotted grave marks",
      use: "Funerary rites and spirit bargains.",
      grammar: "Avoids first-person pronouns. Speaking one's own name in Nhalic is considered dangerous.",
      phrases: [
        { native: "En var ith.", meaning: "This one remembers." },
        { native: "Thal en neth.", meaning: "Let the boundary hold." },
        { native: "Ith sa vel.", meaning: "The debt is carried." },
      ],
    },
    {
      id: "varkesh",
      name: "Varkesh",
      script: "Notched runes",
      use: "Highland clans, hunt songs, contracts cut into horn.",
      grammar: "Possession is described as temporary stewardship. There is no ordinary verb for permanent ownership.",
      phrases: [
        { native: "Kar vekh.", meaning: "Stand with me." },
        { native: "Orr ka than.", meaning: "The mountain is listening." },
        { native: "Vesh tor.", meaning: "Blood witnessed." },
      ],
    },
    {
      id: "asteri-cant",
      name: "Asteri Cant",
      script: "Lantern notation",
      use: "Synod liturgy, miracle licenses, theological argument.",
      grammar: "Chanted register with precise stress. Incorrect cadence can change ritual meaning.",
      phrases: [
        { native: "Luma veri.", meaning: "Let memory be light." },
        { native: "Cor ad nomen.", meaning: "Heart to name." },
        { native: "Nona custodi.", meaning: "Nine keep us." },
      ],
    },
    {
      id: "threnody",
      name: "Threnody",
      script: "Blackglass sigils",
      use: "Pre-imperial magic and dangerous memory-work.",
      grammar: "Not a normal spoken language. Meaning depends on sequence, reflection, and the reader's remembered emotional state.",
      phrases: [
        { native: "⟟ VEL / NEM / ORR ⟟", meaning: "A self may be divided and remain answerable." },
        { native: "⟟ NAI / ITH ⟟", meaning: "What is forgotten still acts." },
      ],
    },
  ],
  calendar: {
    months: ["Ashwane", "Rainmoot", "Harrowtide", "Greenwake", "Longlight", "Emberwane", "Saintfall", "Blackrain", "Frostmere"],
    week: ["Bell", "Lantern", "Iron", "Salt", "Ash", "Hearth", "Grave"],
  },
} as const;

export function compactWorldBible() {
  return JSON.stringify(WORLD_BIBLE);
}
