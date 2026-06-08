import { useState, useEffect, useRef, memo } from "react";
import audioEngine from "./audio.js";

const INTRO_LINES = [
  { text: "Your eyes open.", delay: 1500 },
  { text: "The room is dark.", delay: 2600 },
  { text: "You don't know this ceiling.", delay: 3850 },
  { text: "You don't remember coming here.", delay: 5050 },
  { text: "You don't remember much at all.", delay: 6250 },
  { text: "Your phone is on the floor beside you.", delay: 7850 },
  { text: "9% battery.  One bar.", delay: 9000 },
  { text: "It's been buzzing.", delay: 10200 },
];
const NOTIF_DELAY = 11400;

const SCRIPTED_EXCHANGES = [
  { msgs: ["found a phone. don't know whose.", "you were the last call on it. you still alive?"],
    choices: ["Yeah. I'm here. I don't remember anything.", "Alive. I don't know where I am or what happened."], onChoice: null },
  { msgs: ["no memory at all?", "like you just woke up there with no idea how you got in?"],
    choices: ["Yeah. Nothing. Just woke up.", "I remember calling someone. That's it."], onChoice: null },
  { msgs: ["how much battery you got right now?", "look around. anything to charge with?"],
    choices: ["9%. There's a charger right here. [collect charger]"], onChoice: "CHARGER" },
  { msgs: ["good. that buys us time.", "been three days. power went out the first night.", "stay away from the windows. what's out there now isn't the same."],
    choices: ["How bad is it out there?", "I can hear something outside my door."], onChoice: null },
  { msgs: ["forget outside. what's in that apartment?", "food. water. go look. tell me."],
    choices: ["Grabbed everything. Cans and water. [collect supplies]"], onChoice: "SUPPLIES" },
  { msgs: ["okay.", "name's ellie. found this in our stairwell two days ago. she was already gone."],
    choices: ["I called her right before this. I don't know why.", "Okay Ellie. What do I do?"], onChoice: "NAME_REVEAL" },
  { msgs: ["don't open your door tonight. i don't care what you hear.", "something moves in the building after dark. just let it."],
    choices: ["Staying put. Not making a sound.", "Something's right outside my door."], onChoice: null },
  { msgs: ["there's a broadcast. shortwave. been looping for two days.", "gps coordinates. someone out there saying there's still somewhere left."],
    choices: ["You think it's real?", "That's where we're going."], onChoice: null },
  { msgs: ["don't know. but it's been running two days straight. same loop.", "same voice. same coordinates. someone put real effort into it."],
    choices: ["What if it's a trap?", "Then we move toward it."], onChoice: null },
  { from: "narrator", msgs: ["night falls.", "day one ends."], choices: ["·"], onChoice: null },
  { msgs: ["morning. still there?", "we need to move toward those coordinates. find out where you are first."],
    choices: ["Found a city map. *It says Harwick.* [pick up map]"], onChoice: "MAP_FOUND" },
  { from: "narrator",
    msgs: ["you study the map.", "where do you go?"],
    choices: ["Mercy General Hospital [power still on]", "Harwick Metro [underground]", "Route 9 [open highway]"],
    onChoice: "BRANCH" },
];

const PATH_BEATS = {
  hospital: [
    { msgs: ["mercy general is 6 blocks east.", "stay close to the buildings. don't stop moving."],
      choices: ["Moving. Street looks clear so far.", "On my way. Something feels off going east."], onChoice: null },
    { msgs: ["you there?", "what does it look like?"],
      choices: ["I'm here. Power's still running somewhere inside.", "At the entrance. Doors are open. It's quiet."], onChoice: null },
    { msgs: ["security desk by the entrance.", "force the bottom drawer."],
      choices: ["Worn pocket knife. Looks used. [pick up knife]"], onChoice: "WEAPON_KNIFE" },
    // FORESHADOW 1 — Ellie knows the hospital layout
    { msgs: ["third floor. admin area.", "that's where the records would be."],
      choices: ["How do you know the layout?", "Got it. Third floor."], onChoice: null },
    // FORESHADOW 2 — Ellie knows specific room numbers
    { msgs: ["room 312.", "if it's still intact, personal files are kept there."],
      choices: ["How do you know room numbers?", "Heading to 312."], onChoice: null },
  ],
  metro: [
    { msgs: ["station entrance is around the corner from you.", "go down. tunnels run north. faster underground."],
      choices: ["Heading down. How dark is it?", "On my way. What's the platform situation?"], onChoice: null },
    { msgs: ["you down?", "stay on the south end of the platform. away from the tunnels."],
      choices: ["I'm on the platform. Something moved in the tunnel.", "Down. Emergency lighting only. I can see."], onChoice: null },
    { msgs: ["maintenance locker past the turnstiles.", "mostly emptied."],
      choices: ["One bat. Leaning against the back wall. [pick up bat]"], onChoice: "WEAPON_BAT" },
    // FORESHADOW 1 — Ellie knows track numbers
    { msgs: ["don't go near track three.", "i mean it. just don't."],
      choices: ["Why track three?", "Understood. Avoiding it."], onChoice: null },
    // FORESHADOW 2 — Ellie knows station layout details
    { msgs: ["service exit c is past the maintenance office.", "it should be unlocked. it usually is."],
      choices: ["How do you know this station?", "Looking for exit C."], onChoice: null },
  ],
  route9: [
    { msgs: ["on-ramp is four blocks north of you.", "open road. good and bad. keep moving."],
      choices: ["Moving north. It's quieter up here.", "On my way. What am I looking at on the highway?"], onChoice: null },
    { msgs: ["you at the ramp?", "should be maintenance trucks near the barrier."],
      choices: ["Yeah. Truck's blocking the lane. Lot of abandoned cars.", "At the ramp. Opens up past the overpass."], onChoice: null },
    { msgs: ["truck bed.", "someone left in a hurry."],
      choices: ["Crowbar still in there. [pick up crowbar]"], onChoice: "WEAPON_CROWBAR" },
    // FORESHADOW 1 — Ellie knows checkpoint status before player reaches it
    { msgs: ["checkpoint ahead should be empty.", "keep moving."],
      choices: ["How do you know that?", "Moving. Thanks."], onChoice: null },
    // FORESHADOW 2 — Ellie knows specific highway markers
    { msgs: ["fuel depot on the left. mile marker 14.", "worth checking."],
      choices: ["How do you know this highway?", "I'll check it."], onChoice: null },
  ],
};

const MEMORY_FRAGMENT_POOLS = {
  hospital: [
    { name:"Unknown Voice",  from:"narrator", msgs:["someone says:", "'don't let them finish it.'"], choices:["*Who said that?*", "Keep walking."] },
    { name:"Waiting Room",   from:"narrator", msgs:["a waiting room.", "fluorescent lights.", "you've sat here before."], choices:["*When was this?*", "Keep moving."] },
    { name:"The Hallway",    from:"narrator", msgs:["a hallway.", "someone calling your name.", "you don't recognize the voice."], choices:["*Who is that?*", "Keep walking."] },
  ],
  metro: [
    { name:"The Promise",         from:"narrator", msgs:["a woman's voice.", "'you promised this wouldn't happen.'", "then gone."], choices:["*Who was that?*", "Keep moving."] },
    { name:"Running Late",        from:"narrator", msgs:["you're late.", "for something important.", "the trains are different here."], choices:["*What were you late for?*", "Keep moving."] },
    { name:"Underground Meeting", from:"narrator", msgs:["a meeting.", "underground.", "people arguing about something you understand."], choices:["*What did you understand?*", "Keep moving."] },
  ],
  route9: [
    { name:"Driving Away", from:"narrator", msgs:["you're driving away from harwick.", "you're on the phone.", "you're telling someone it's done."], choices:["*What's done?*", "Keep moving."] },
    { name:"The Clipboard", from:"narrator", msgs:["a clipboard.", "a name you know.", "a project name you don't say out loud."], choices:["*What project?*", "Keep moving."] },
    { name:"The Keys",      from:"narrator", msgs:["someone hands you something.", "keys.", "to a building you've been to before."], choices:["*What building?*", "Keep moving."] },
  ],
};

const DISCOVERY_BEATS = {
  hospital: {
    from: "narrator",
    msgs: ["a filing cabinet. slightly open.", "patient records. you flip through them.", "your name is on one of them."],
    choices: ["Take it. *Your name. Your photo. The admission date.* [examine patient file]"],
    onChoice: "DISCOVERY_HOSPITAL",
  },
  metro: {
    from: "narrator",
    msgs: ["transit authority office at the end of the platform.", "door open. nobody came back for it.", "shortwave log on the desk. recent entries."],
    choices: ["Haven mentioned by name two weeks before the signal started. *Two weeks.* [examine broadcast log]"],
    onChoice: "DISCOVERY_METRO",
  },
  route9: {
    from: "narrator",
    msgs: ["a checkpoint barrier. guard booth empty.", "a patrol truck stopped at the gate. coffee cold on the dash.", "clipboard face-down on the seat."],
    choices: ["Deployment order. *Personnel reassigned to Project Haven.* Same week I was admitted. [examine deployment order]"],
    onChoice: "DISCOVERY_ROUTE9",
  },
};

// ─── EXPLORATION BEAT POOLS (local replacement for AI filler dialogue) ─────────
// One pool per location context. Each entry is a short exchange: 1-2 Ellie/narrator
// lines + 2-3 generic forward choices. pickExploreBeat() pulls from these between
// scripted story beats. Purely atmospheric — never carry loot markers or geography
// the player hasn't reached. ~10 each for now (voice pass); target 15-25.
// Choices are movement/observation only — explore beats are non-branching (a random
// beat follows regardless), so a choice must never imply finding something or ask a
// question the next beat won't answer. Real searching/agency lives in ENCOUNTERS.
const EXPLORE_BEATS = {
  hospital: [
    { from:"ellie",    msgs:["corridor's long.", "keep to the wall."],                     choices:["Keep moving.","Stay low.","Listen first."] },
    { from:"narrator", msgs:["a gurney blocks half the hall.", "something dried on the floor."], choices:["Step around it.","Stay clear of it.","Back off."] },
    { from:"narrator", msgs:["a light flickers overhead.", "then holds."],                  choices:["Keep going.","Move while it's lit.","Hurry past."] },
    { from:"ellie",    msgs:["power's still on in here.", "that's not normal."],            choices:["Just keep moving.","Stay alert.","Don't trust it."] },
    { from:"narrator", msgs:["a nurses' station.", "charts still clipped to the rack."],    choices:["Leave it.","Keep walking.","Don't slow down."] },
    { from:"ellie",    msgs:["doors on both sides.", "don't open any you don't have to."],  choices:["Understood.","Moving.","Hands off."] },
    { from:"narrator", msgs:["a wheelchair, turned over.", "wheels still spinning."],       choices:["Keep moving.","Stop. Listen.","Back away."] },
    { from:"narrator", msgs:["the air smells like antiseptic.", "and under it, something worse."], choices:["Push on.","Cover your mouth.","Stay quiet."] },
    { from:"ellie",    msgs:["stairwell should be ahead.", "take it slow."],                choices:["On it.","Taking it slow.","Listening."] },
    { from:"narrator", msgs:["handprints on a door window.", "from the inside."],           choices:["Keep moving.","Don't look.","Back away."] },
  ],
  metro: [
    { from:"narrator", msgs:["water drips somewhere in the dark.", "steady. close."],       choices:["Keep moving.","Stay still.","Move past it."] },
    { from:"ellie",    msgs:["stay off the tracks.", "third rail might still be live."],    choices:["Got it.","Moving.","Careful."] },
    { from:"narrator", msgs:["the tunnel curves ahead.", "your light only reaches so far."], choices:["Go slow.","Push forward.","Wait and listen."] },
    { from:"narrator", msgs:["an abandoned train car.", "doors jammed half open."],         choices:["Slip through it.","Go around.","Keep your distance."] },
    { from:"ellie",    msgs:["you hear that?", "could be nothing."],                         choices:["Keep moving.","Stop.","Stay quiet."] },
    { from:"narrator", msgs:["emergency lights buzz low.", "everything's the color of rust."], choices:["Keep walking.","Stay close to the wall.","Hurry."] },
    { from:"narrator", msgs:["a turnstile, frozen mid-spin.", "a bag left on the ground past it."], choices:["Step over.","Leave it.","Keep going."] },
    { from:"ellie",    msgs:["platform should be coming up.", "stay south of the tunnels."], choices:["On it.","Moving.","Staying south."] },
    { from:"narrator", msgs:["your footsteps echo too far.", "you slow down."],             choices:["Keep moving.","Freeze.","Move quieter."] },
    { from:"narrator", msgs:["a map on the wall.", "half the lines scratched out."],        choices:["Ignore it.","Keep going.","Don't stop."] },
  ],
  route9: [
    { from:"narrator", msgs:["the highway opens up.", "cars left where they stopped."],     choices:["Keep moving.","Stay low.","Keep to the shoulder."] },
    { from:"ellie",    msgs:["you're exposed out here.", "keep to the shoulder."],          choices:["Understood.","Moving.","Staying low."] },
    { from:"narrator", msgs:["wind moves through the wrecks.", "nothing else does."],       choices:["Keep walking.","Stop and listen.","Pick up the pace."] },
    { from:"narrator", msgs:["an overpass ahead.", "shade under it. and blind spots."],     choices:["Go under it.","Go around.","Wait."] },
    { from:"ellie",    msgs:["any movement out there?", "tell me."],                         choices:["Nothing yet.","Hard to say.","Just keep me talking."] },
    { from:"narrator", msgs:["a pileup blocks two lanes.", "you'll have to weave through."], choices:["Weave through.","Climb over.","Back off."] },
    { from:"narrator", msgs:["a suitcase burst open on the asphalt.", "clothes scattered for yards."], choices:["Step past it.","Keep going.","Don't stop."] },
    { from:"ellie",    msgs:["mile markers'll keep you straight.", "just follow them north."], choices:["Following them.","Moving.","Heading north."] },
    { from:"narrator", msgs:["a dog barks somewhere far off.", "then stops."],              choices:["Keep moving.","Freeze.","Head away from it."] },
    { from:"narrator", msgs:["the sun's high and there's no cover.", "you feel watched."],   choices:["Push on.","Find shade.","Stay calm."] },
  ],
  crossing: [
    { from:"narrator", msgs:["rows of houses, all dark.", "yards gone to weed."],           choices:["Keep moving north.","Cut through a yard.","Stay on the street."] },
    { from:"ellie",    msgs:["keep heading north.", "don't slow down in the open."],        choices:["Moving.","Staying low.","Pushing north."] },
    { from:"narrator", msgs:["a car alarm rings two streets over.", "no one comes."],        choices:["Keep moving.","Wait it out.","Head the other way."] },
    { from:"narrator", msgs:["broken glass across the sidewalk.", "you pick your steps."],   choices:["Step carefully.","Go around.","Push through."] },
    { from:"ellie",    msgs:["you still with me?", "talk to me."],                           choices:["Still here.","Still moving.","Keep talking."] },
    { from:"narrator", msgs:["a chain-link fence, torn open.", "a path worn through to the next lot."], choices:["Take the gap.","Find another way.","Wait."] },
    { from:"narrator", msgs:["industrial blocks now.", "loading docks. roll-up doors."],     choices:["Keep north.","Cut between buildings.","Stay in the open."] },
    { from:"ellie",    msgs:["signal's getting clearer.", "you're closing in."],            choices:["Good.","Keep guiding me.","Almost there."] },
    { from:"narrator", msgs:["someone's laundry still on a line.", "stiff and grey."],       choices:["Keep moving.","Don't linger.","Move on."] },
    { from:"narrator", msgs:["a shopping cart in the middle of the road.", "nothing in it."], choices:["Step around it.","Keep going.","Stop. Listen."] },
  ],
  haven: [
    { from:"narrator", msgs:["floodlights wash the path white.", "the generators never stopped."], choices:["Keep going.","Stay close.","Move slow."] },
    { from:"ellie",    msgs:["they kept it running.", "all of it."],                         choices:["Keep moving.","Stay sharp.","Take it in."] },
    { from:"narrator", msgs:["a row of bunks.", "beds made. one slept in, not stripped."],   choices:["Move on.","Keep going.","Don't linger."] },
    { from:"narrator", msgs:["a med station.", "supplies stocked. nothing used."],          choices:["Leave it.","Keep walking.","Move on."] },
    { from:"ellie",    msgs:["i missed this place.", "i don't know why i said that."],       choices:["Keep moving.","Stay with me.","Let it go."] },
    { from:"narrator", msgs:["a common room.", "a card game left mid-hand."],               choices:["Move on.","Keep going.","Listen."] },
    { from:"narrator", msgs:["a hallway of doors.", "every one of them open."],             choices:["Keep going.","Stay in the hall.","Move on."] },
    { from:"ellie",    msgs:["it's so quiet.", "it shouldn't be this quiet."],              choices:["Stay with me.","Keep moving.","Stay sharp."] },
    { from:"narrator", msgs:["a child's drawing taped to a wall.", "sun. a fence. stick people inside it."], choices:["Keep moving.","Move on.","Don't linger."] },
    { from:"narrator", msgs:["a clock on the wall.", "still keeping time."],                choices:["Keep going.","Move on.","Don't stop."] },
  ],
};

// State-bucketed reaction lines. pickExploreBeat() checks these first; the highest-
// priority matching condition wins, else a normal atmospheric beat fires. Choices stay
// movement/directive — never "look for a charger" (the player owns one; they need power).
const STATE_LINES = {
  battery_critical: { from:"ellie", msgs:["your battery.", "find power or i lose you."], choices:["Keep moving.","Find power."] },
  battery_low:      { from:"ellie", msgs:["battery's getting low.", "watch it."],         choices:["Keep moving.","Watch it."] },
  injured_bad:      { from:"ellie", msgs:["you're hurt bad.", "slow down."],              choices:["Push on.","Slow down."] },
  low_food:         { from:"ellie", msgs:["when did you last eat?", "find something."],   choices:["Keep moving.","Push on."] },
  low_water:        { from:"ellie", msgs:["you need water.", "soon."],                     choices:["Keep moving.","Press on."] },
};

// ─── HAVEN PHASE 2C ───────────────────────────────────────────────────────────

const HAVEN_APPROACH_BEATS = [
  { from:"ellie",
    msgs:["signal's stronger now.", "you're close."],
    choices:["How close?", "I can feel it."] },
  { from:"narrator",
    msgs:["the city thins out.", "buildings give way to service roads and dead grass."],
    choices:["Keep moving."] },
  { from:"ellie",
    msgs:["follow the road north.", "there should be a fence line before the compound."],
    choices:["How do you know that?", "Following it north."] },
  { from:"narrator",
    msgs:["the phone buzzes in your hand.", "not a message.", "just pressure behind the screen."],
    choices:["The Signal?", "Ignore it. Keep walking."] },
  { from:"ellie",
    msgs:["don't stop now.", "please."],
    choices:["Ellie?", "I'm still moving."] },
  { from:"narrator",
    msgs:["a hill rises ahead.", "beyond it, light spills through the trees.", "real light."],
    choices:["Climb the hill.", "Move slowly."] },
  { from:"narrator",
    msgs:["haven.", "a fenced compound.", "floodlights still burning.", "generator hum.", "no movement."],
    choices:["·"] },
  { from:"narrator",
    msgs:["the gate.", "open.", "not broken.", "not forced.", "just open."],
    choices:["Go through the gate.", "Wait. Listen first."] },
  { from:"ellie",
    msgs:["you made it.", "i wasn't sure you would."],
    choices:["Are you okay?", "Where is everyone?"] },
  { from:"narrator",
    msgs:["dining hall.", "food still on the tables.", "coffee in a mug.", "cold."],
    choices:["·"] },
];

const HAVEN_FINAL_SEQUENCE = [
  { from:"narrator", msgs:["operations building.", "monitors still running.", "chairs empty."],                          choices:["·"] },
  { from:"narrator", msgs:["a corkboard.", "photographs.", "haven residents.", "everyone smiling."],                     choices:["·"] },
  { from:"narrator", msgs:["there's a date in the corner.", "three weeks before day one."],                             choices:["·"] },
  { from:"narrator", msgs:["you see her.", "third row.", "labeled."],                                                   choices:["·"] },
  { from:"narrator", msgs:["ellie."],                                                                                   choices:["*How is she in this photo?*"] },
];

// Priority 5 — branch-aware ending. One extra beat that ties Ellie to the
// evidence the player surfaced on their route (the discovery clue). Inserted
// after the photos, before the date. Deepens the mystery; reveals no Phase 3 twist.
const HAVEN_FINAL_PATH_BEAT = {
  hospital: { from:"narrator", msgs:["the patient file from mercy general.", "her face is in it too.", "same building. before any of this."], choices:["·"] },
  metro:    { from:"narrator", msgs:["the broadcast log from the metro.", "her voice logged it.", "two weeks before the signal."],          choices:["·"] },
  route9:   { from:"narrator", msgs:["the deployment order from the checkpoint.", "her name is on the roster.", "assigned here. before day one."], choices:["·"] },
};
const buildHavenFinal = (path) => {
  const beat = HAVEN_FINAL_PATH_BEAT[path];
  if (!beat) return HAVEN_FINAL_SEQUENCE;
  return [...HAVEN_FINAL_SEQUENCE.slice(0, 2), beat, ...HAVEN_FINAL_SEQUENCE.slice(2)];
};

// Location-specific loot when SEARCH succeeds (encounter id → possible finds)
const SEARCH_LOOT = {
  supply_closet:    ["food", "water"],
  generator_room:   ["food", "water"],
  cafeteria:        ["food", "food", "water"],
  operating_room:   ["food"],
  maintenance_office: ["water", "battery"],
  ticket_booth:     ["food", "water"],
  service_corridor: ["water"],
  highway_wreck:    ["food", "battery"],
  fuel_truck:       ["food", "battery"],
  abandoned_convoy: ["food", "food", "battery"],
  abandoned_checkpoint_small: ["food", "water"],
  house_generator:  ["battery", "battery"],
  crashed_bus:      ["food", "water"],
  emergency_shelter:["food", "water", "battery"],
  pharmacy:         ["food", "water"],
  default:          ["food", "water"],
};

// Encounters that sit on a live power source. A successful SEARCH here also tops up
// the portable charger reservoir (distinct from the instant battery-pack loot, which
// goes straight to the phone). This is what keeps the charger a living mechanic.
const POWER_SOURCES = new Set(["generator_room", "maintenance_office", "fuel_truck", "abandoned_convoy", "house_generator", "emergency_shelter"]);
const CHARGER_RECHARGE = 25; // reservoir gained per power-source search (tuning knob)
const CHARGER_TRANSFER = 25; // reservoir → phone per "Use charger" tap (tuning knob)
const CHARGER_FIND     = 20; // phase-1 charger find → battery dumped into the phone. Tight: start phase 2 ~29% — neglecting power still → offline, but an engaged player who works the power sources has margin to Haven (tuning)
const START_SUPPLY     = 4;  // phase-1 starting food & water. Low enough that neglect → 0 in the crossing/approach (starvation death), but an engaged searcher keeps a survivable margin to the Haven cache (tuning)

// Weapons. damage drives the FIGHT action (success odds + bleed on a loss). Improvised
// base tier = 3; upgrades raise the floor. equipWeapon() only ever upgrades.
const WEAPONS = {
  knife:   { name:"worn pocket knife", shortName:"knife",    damage:3 },
  bat:     { name:"baseball bat",      shortName:"bat",      damage:3 },
  crowbar: { name:"crowbar",           shortName:"crowbar",  damage:3 },
  axe:     { name:"fire axe",          shortName:"fire axe", damage:5 },
  machete: { name:"machete",           shortName:"machete",  damage:6 },
};
const WEAPON_PICKUPS = { WEAPON_KNIFE:"knife", WEAPON_BAT:"bat", WEAPON_CROWBAR:"crowbar", WEAPON_AXE:"axe", WEAPON_MACHETE:"machete" };

// Haven cache (the relief at the end of the scarcity gauntlet — diegetic, placed in
// logical rooms). Replaces the old invisible battery floor.
const HAVEN_BATTERY_CACHE = 45; // battery packs in the ops building add this much
const HAVEN_SUPPLY_FLOOR  = 5;  // pantry tops food/water up to at least this

// ─── ROUTE MAP — the "invisible map" the pacing walks ─────────────────────────
// Each leg is an ordered list of beat-nodes; a cursor (aiExchangeCount) advances one
// node per player choice, so node[newCnt-1] is what THIS choice leads into. The first
// atmospheric beat of a leg is rendered on entry (cursor 0); the final node ends the
// leg (its story beat is the transition). This replaces the old scattered counters
// (memory@fragTarget, discovery@aiTarget, sectionPlan{1,3,5}) with one declarative
// schedule the system can read top-to-bottom.
//   kind "explore"   → a free atmospheric beat (no story beat queued)
//        "encounter" → a guaranteed encounter; plan "power" (a POWER_SOURCES spot —
//                      the battery lifeline) | "search" (food/water/loot) | "hazard"
//        "memory" | "discovery" | "shelter" → queue that scripted story beat
//   drain (optional) → applyTransitionDrain key fired as the node is reached
// One guaranteed power-source per leg keeps battery survivable for an ENGAGED player
// (search it → charger reserve) while neglect (skip/avoid it) still leads to offline.
// (The Haven leg stays on its own variable-length 3-5 explore threshold — no encounters
// or story branches there, so it isn't route-driven.)
const ROUTE = {
  path: [
    { kind: "encounter", plan: "power" },         // 1 — guaranteed power source
    { kind: "memory" },                            // 2
    { kind: "encounter", plan: "hazard" },        // 3
    { kind: "explore", drain: "path_mid" },        // 4 — mid-leg squeeze
    { kind: "encounter", plan: "search" },        // 5
    { kind: "discovery" },                         // 6 — ends the path leg
  ],
  crossing: [
    { kind: "encounter", plan: "power" },         // 1 — guaranteed power source
    { kind: "explore" },                           // 2
    { kind: "encounter", plan: "hazard" },        // 3
    { kind: "explore", drain: "crossing_mid" },    // 4 — mid-leg squeeze
    { kind: "encounter", plan: "search" },        // 5
    { kind: "shelter" },                           // 6 — ends the crossing leg
  ],
};

// ─── ENCOUNTER POOLS (8 per path, 9 crossing) ─────────────────────────────────
const ENCOUNTERS = {
  hospital: [
    { id:"patient_door",   msgs:["movement behind a patient room door.","slow. rhythmic."],
      choices:[{text:"Slip past quickly.",action:"SNEAK"},{text:"Stay still. Let it pass.",action:"WAIT"},{text:"Check the room. [risk]",action:"SEARCH"}] },
    { id:"elevator",       msgs:["an elevator dings somewhere above.","then silence."],
      choices:[{text:"Stop. Don't move.",action:"WAIT"},{text:"Move now. Stairs.",action:"SNEAK"},{text:"Keep going. Ignore it.",action:"AVOID"}] },
    { id:"generator_room", msgs:["generator room. loud enough to cover your movement.","supplies inside."],
      choices:[{text:"Go in fast. [risk]",action:"SEARCH"},{text:"Use the noise. Move through.",action:"SNEAK"},{text:"Too risky. Keep going.",action:"AVOID"}] },
    { id:"supply_closet",  msgs:["supply closet. lock's broken.","medical supplies visible."],
      choices:[{text:"Grab what you can. [risk]",action:"SEARCH"},{text:"Leave it.",action:"AVOID"},{text:"Listen at the door first.",action:"WAIT"}] },
    { id:"blood_trail",    msgs:["blood trail in the corridor.","recent. leads toward you."],
      choices:[{text:"Follow it to find the source. [risk]",action:"SEARCH"},{text:"Go the other way.",action:"AVOID"},{text:"Freeze. Watch the end of the hall.",action:"WAIT"}] },
    { id:"cafeteria",      msgs:["hospital cafeteria.","vending machines. mostly emptied."],
      choices:[{text:"Check what's left. [risk]",action:"SEARCH"},{text:"Move past quickly.",action:"SNEAK"},{text:"Watch the exits first.",action:"WAIT"}] },
    { id:"operating_room", msgs:["operating room lights flicker.","movement inside."],
      choices:[{text:"Slip past without looking.",action:"SNEAK"},{text:"Search it. [risk]",action:"SEARCH"},{text:"Take it on. [risk]",action:"FIGHT"}] },
    { id:"roof_access",    msgs:["stairwell door. sound from above.","heavy steps."],
      choices:[{text:"Move past quickly.",action:"SNEAK"},{text:"Stay still until it stops.",action:"WAIT"},{text:"Push through anyway.",action:"FORCE"}] },
  ],
  metro: [
    { id:"tunnel_movement",    msgs:["movement in the tunnel.","past the platform edge. in the dark."],
      choices:[{text:"Back away quietly.",action:"SNEAK"},{text:"Hold still. Wait.",action:"WAIT"},{text:"Check with your light. [risk]",action:"SEARCH"}] },
    { id:"platform_lights",    msgs:["the platform lights cut out.","then back on.","something moved."],
      choices:[{text:"Don't move. Wait.",action:"WAIT"},{text:"Move now while the lights are on.",action:"SNEAK"},{text:"Run for the next section.",action:"RUN"}] },
    { id:"maintenance_office", msgs:["maintenance office. door open.","tools and a battery pack visible."],
      choices:[{text:"Go in fast. [risk]",action:"SEARCH"},{text:"Keep moving.",action:"AVOID"},{text:"Watch it first.",action:"WAIT"}] },
    { id:"broadcast_speaker",  msgs:["emergency speaker crackles.","old broadcast. on loop."],
      choices:[{text:"Stop. Listen.",action:"WAIT"},{text:"Keep moving.",action:"AVOID"},{text:"Pull it off the wall. [risk]",action:"FORCE"}] },
    { id:"flooded_section",    msgs:["platform flooded ahead.","knee-deep."],
      choices:[{text:"Wade through quietly.",action:"SNEAK"},{text:"Find another way. Takes longer.",action:"AVOID"},{text:"Push through fast.",action:"FORCE"}] },
    { id:"ticket_booth",       msgs:["ticket booth. glass broken.","supplies inside."],
      choices:[{text:"Search it. [risk]",action:"SEARCH"},{text:"Bypass it.",action:"SNEAK"},{text:"Wait and watch.",action:"WAIT"}] },
    { id:"service_corridor",   msgs:["service corridor. dark. tight.","something shuffles ahead."],
      choices:[{text:"Move carefully.",action:"SNEAK"},{text:"Back out. Go around.",action:"AVOID"},{text:"Take it on. [risk]",action:"FIGHT"}] },
    { id:"turnstile_blockage", msgs:["turnstiles blocked.","something piled against them."],
      choices:[{text:"Climb over quietly.",action:"SNEAK"},{text:"Force through. Loud.",action:"FORCE"},{text:"Wait and listen.",action:"WAIT"}] },
  ],
  route9: [
    { id:"car_alarm",    msgs:["you brush a car.","it starts beeping."],
      choices:[{text:"Run.",action:"RUN"},{text:"Find the source. Silence it.",action:"SNEAK"},{text:"Freeze. Wait it out.",action:"WAIT"}] },
    { id:"road_walker",  msgs:["a figure on the road ahead.","it turns toward you."],
      choices:[{text:"Slip off the road.",action:"SNEAK"},{text:"Back away slow.",action:"AVOID"},{text:"Take it down. [risk]",action:"FIGHT"}] },
    { id:"highway_wreck",msgs:["a wreck blocking two lanes.","supplies visible in the cab."],
      choices:[{text:"Climb over quietly.",action:"SNEAK"},{text:"Go around. Slower but safe.",action:"AVOID"},{text:"Search the cab. [risk]",action:"SEARCH"}] },
    { id:"abandoned_checkpoint_small",msgs:["smaller checkpoint. barrier arm down.","someone left fast."],
      choices:[{text:"Slip under. Quick.",action:"SNEAK"},{text:"Check the booth. [risk]",action:"SEARCH"},{text:"Go around.",action:"AVOID"}] },
    { id:"fuel_truck",   msgs:["fuel truck parked across the median.","cab unlocked."],
      choices:[{text:"Search the cab. [risk]",action:"SEARCH"},{text:"Take the long route around.",action:"AVOID"},{text:"Check outside only.",action:"WAIT"}] },
    { id:"evacuation_sign", msgs:["spray painted evacuation route.","someone circled it. then crossed it out."],
      choices:[{text:"Study it. *Why cross it out?*",action:"OBSERVE"},{text:"Keep moving. Doesn't matter.",action:"AVOID"}] },
    { id:"abandoned_convoy",msgs:["military convoy. three trucks. doors open.","big risk. big reward."],
      choices:[{text:"Search the trucks. [risk]",action:"SEARCH"},{text:"Move past carefully.",action:"SNEAK"},{text:"Watch from a distance first.",action:"WAIT"}] },
    { id:"burned_vehicle",  msgs:["burned-out car on the shoulder.","still warm."],
      choices:[{text:"Look it over. *Still warm.*",action:"OBSERVE"},{text:"Give it distance.",action:"AVOID"}] },
    { id:"quarantine_marker",msgs:["yellow quarantine tape.","half down. weeks old."],
      choices:[{text:"Duck under. Keep moving.",action:"SNEAK"},{text:"Go around.",action:"AVOID"},{text:"Read the markers. *What do they say?*",action:"OBSERVE"}] },
  ],
  crossing: [
    { id:"pharmacy",         msgs:["something's moving inside the pharmacy.","it hasn't noticed you. yet."],
      choices:[{text:"Sneak past.",action:"SNEAK"},{text:"Search it. [+Noise]",action:"SEARCH"},{text:"Throw food to lure it off. [-1 Food]",action:"DISTRACT"}] },
    { id:"stray_street",     msgs:["a stray in the street ahead.","it hasn't noticed you yet."],
      choices:[{text:"Wait for it to move.",action:"WAIT"},{text:"Slip past quietly.",action:"SNEAK"},{text:"Put it down. [risk]",action:"FIGHT"}] },
    { id:"apartment_fire",   msgs:["smoke from an apartment window.","could cover your movement. or draw more."],
      choices:[{text:"Use the smoke. Move fast.",action:"SNEAK"},{text:"Go around.",action:"AVOID"},{text:"Stop and watch first.",action:"WAIT"}] },
    { id:"rooftop",          msgs:["a silhouette on a rooftop.","still. watching."],
      choices:[{text:"Ignore it. Keep moving.",action:"AVOID"},{text:"Duck and wait.",action:"WAIT"},{text:"Wave. Identify yourself. [risk]",action:"FORCE"}] },
    { id:"floor_above",      msgs:["movement on the floor above.","heavy. slow."],
      choices:[{text:"Move quickly and quietly.",action:"SNEAK"},{text:"Stay still and wait.",action:"WAIT"},{text:"Check it out. [risk]",action:"SEARCH"}] },
    { id:"noise_drawn", minNoise:2, msgs:["your noise drew something.","it's close."],
      choices:[{text:"Run.",action:"RUN"},{text:"Hide. Go quiet.",action:"WAIT"},{text:"Stand and fight. [risk]",action:"FIGHT"}] },
    { id:"house_generator",  msgs:["a house with a generator running.","light in the windows."],
      choices:[{text:"Search it carefully. [risk]",action:"SEARCH"},{text:"Keep moving.",action:"AVOID"},{text:"Watch from outside first.",action:"WAIT"}] },
    { id:"crashed_bus",      msgs:["bus crashed into a storefront.","might be supplies inside."],
      choices:[{text:"Search the bus. [risk]",action:"SEARCH"},{text:"Go around.",action:"AVOID"},{text:"Check from the outside.",action:"WAIT"}] },
    { id:"emergency_shelter",msgs:["emergency shelter sign.","door still open."],
      choices:[{text:"Go in. [risk]",action:"SEARCH"},{text:"Keep moving.",action:"AVOID"},{text:"Listen at the door first.",action:"WAIT"}] },
  ],
};

// Forced fight — fires when noise hits max (you got loud, they found you). No safe
// sneak/wait: FIGHT (weapon decides) or RUN. Works in any leg (not in a leg pool).
const CORNERED_ENCOUNTER = { id:"cornered", msgs:["they're on you.","no room. no time."],
  choices:[{text:"Fight. [risk]",action:"FIGHT"},{text:"Break away and run. [risk]",action:"RUN"}] };

const ENCOUNTER_REACTIONS = {
  sneak_success: ["good.", "keep moving.", "nice."],
  sneak_fail:    ["noise. move.", "that brought something.", "go."],
  search_found:  ["take it and go.", "good find."],
  search_fail:   ["you disturbed something. run.", "go. now."],
  wait:          ["smart.", "patience.", "...good."],
  observe:       ["noted.", "anything useful?", "keep moving."],
  distract:      ["it worked. move.", "go now."],
  run_success:   ["don't stop.", "keep going."],
  run_fail:      ["you dropped something. doesn't matter. go.", "cost you. keep moving."],
  force:         ["you made it through.", "that was loud."],
  fight_win:     ["it's down. move.", "good. keep going.", "that worked. go."],
  fight_loss:    ["you're hurt. go.", "that cost you. move.", "keep moving. don't stop."],
  avoid:         ["probably smart.", "keep moving."],
};

const NARRATOR_ATMOSPHERE = {
  sneak_fail:    "it heard you.",
  search_fail:   "something stirs.",
  run_fail:      "you made it. barely.",
  force:         "noise. but you're through.",
  fight_win:     "it stops moving.",
  fight_loss:    "you break away. bleeding.",
  sneak_success: "the noise fades. nothing follows.",
  wait:          "it passes.",
  observe:       "you take it in.",
};

const OFFLINE_LINES = [
  { text: "the screen goes dark.", delay: 0 },
  { text: "battery dead.", delay: 1800 },
  { text: "signal lost.", delay: 3200 },
];

const P2_COMPLETE_LINES = [
  { text: "you found haven.", delay: 0 },
  { text: "it was empty.", delay: 1800 },
  { text: "end of phase 2.", delay: 3800 },
];

// Death screen lines, keyed by cause. Distinct from OFFLINE_LINES (battery).
// Priority 1 — close the survival loop.
const DEATH_LINES = {
  injury: [
    { text: "you go down.", delay: 0 },
    { text: "the phone slips from your hand.", delay: 1800 },
    { text: "the screen stays lit a moment longer.", delay: 3300 },
    { text: "then nothing.", delay: 4800 },
  ],
  starvation: [
    { text: "your legs give out.", delay: 0 },
    { text: "you haven't eaten in too long.", delay: 1800 },
    { text: "the screen blurs.", delay: 3300 },
    { text: "then nothing.", delay: 4800 },
  ],
  dehydration: [
    { text: "your legs give out.", delay: 0 },
    { text: "you can't remember the last time you drank.", delay: 1800 },
    { text: "the screen blurs.", delay: 3300 },
    { text: "then nothing.", delay: 4800 },
  ],
};

// Explicit mapping from the BRANCH choice labels to a path id, with a
// substring fallback so a reworded label still resolves to something valid.
const BRANCH_PATHS = {
  "Mercy General Hospital [power still on]": "hospital",
  "Harwick Metro [underground]": "metro",
  "Route 9 [open highway]": "route9",
};
const detectPath = (c) => BRANCH_PATHS[c]
  || (c.toLowerCase().includes("metro") ? "metro" : c.toLowerCase().includes("route") ? "route9" : "hospital");
const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

// ─── Pure text helpers (hoisted to module scope — no component state) ─────────
const stripMarkers = (t) => t.replace(/\[.*?\]/g, "").replace(/\*([^*]*)\*/g, "$1").replace(/\s+/g, " ").trim();

// Fix #5 — code-authoritative loot. Extract resource deltas from a choice's
// markers, e.g. "grab the cans and go [+3 Food]" → { food: 3, ... }. Note the
// regex requires a number immediately before the keyword, so the AI-phase
// battery-drain display marker "[-1% Battery]" (has a %) is intentionally NOT
// matched here and won't be double-counted.
const parseResourceMarkers = (choice) => {
  const out = { food: 0, water: 0, hp: 0, battery: 0 };
  const re = /\[([+-]\d+)\s*(food|water|hp|battery)\]/gi;
  let m;
  while ((m = re.exec(choice))) out[m[2].toLowerCase()] += parseInt(m[1], 10);
  return out;
};

// Battery is the master clock. The phone is on the whole game, so advancing a beat
// costs power — one place owns the rate. Exceptions: phase1 is a pre-charger set-piece
// (not a clock yet), and pure story beats (memory flash, discovery) aren't traversal.
// Continues ("·") are charged 0 by the caller. Tune this rate in the M7 balance pass.
const beatBatteryCost = (phase) => {
  if (phase === "phase1") return 0;
  if (phase === "p2_memory_frag" || phase === "p2_discovery") return 0;
  return 1; // everything else: 1% per advance
};

const parseText = (text, ctx = "button") => {
  return text.split(/(\[.*?\]|\*[^*]+\*)/g).map((tok, i) => {
    if (tok.startsWith("[") && tok.endsWith("]")) {
      const inner = tok.slice(1, -1).trim();
      const low   = inner.toLowerCase();
      let color;
      // Resource impact coloring (sign-prefixed markers first)
      if (low.startsWith("+") && low.includes("noise")) color = "#c8a020";       // +Noise = yellow warning
      else if (low.startsWith("-") && low.includes("noise")) color = "#4a9e6b";  // -Noise = green
      else if (low.startsWith("+"))  color = "#4a9e6b";                          // any gain = green
      else if (low.startsWith("-"))  color = "#8b4a4a";                          // any cost = red
      // Story / discovery
      else if (low.includes("memory fragment") || low === "memory") color = "#4a9e6b";
      else if (low.includes("project haven") || low.includes("discovery") || low.includes("examine") || low.includes("clue")) color = "#4ab5c8";
      // Risk / warning
      else if (low.includes("risk") || low.includes("attracts")) color = "#c8a020";
      // Neutral actions (collect, pick up, equip) + default
      else color = ctx === "button" ? "#4a9e6b" : "#8fba8f";
      return <span key={i} style={{ color }}>{tok}</span>;
    }
    if (tok.startsWith("*") && tok.endsWith("*"))
      return <em key={i} style={{ fontStyle: "italic", opacity: 0.65 }}>{tok.slice(1, -1)}</em>;
    return tok;
  });
};

// Shared style fragments (L2 — hoisted so the three screens don't duplicate them)
const FONT_IMPORT = "@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400&display=swap');";
const KEYFRAMES_FI = "@keyframes fi{from{opacity:0;transform:translateY(3px)}to{opacity:1;transform:none}}";
// Responsive tweaks that can't be expressed inline (media queries). On narrow phones,
// hide the FRAGMENTS/CLUES word labels so the HUD stays on one line (icon + count remain).
const RESPONSIVE_CSS = "@media (max-width:480px){.statlabel{display:none}}";

// Diagnostic overlay — only renders when the URL has ?debug. Shows the live audio-context
// state so iOS audio interruptions can be diagnosed without a Mac/remote inspector.
const AudioDebug = () => {
  const [s, setS] = useState(null);
  useEffect(() => {
    if (typeof location === "undefined" || !/[?&]debug/.test(location.search)) return;
    const id = setInterval(() => setS(audioEngine.status()), 400);
    return () => clearInterval(id);
  }, []);
  if (!s) return null;
  return (
    <div style={{ position:"fixed", top:0, left:0, zIndex:9999, background:"#000", color:"#0f0",
      fontFamily:"monospace", fontSize:"11px", padding:"3px 6px", letterSpacing:"0.02em", pointerEvents:"none" }}>
      aud:{s.state} · unlocked:{s.unlocked?1:0} · nodes:{s.hasNodes?1:0} · muted:{s.muted?1:0}
    </div>
  );
};

// Sleek iOS-style signal strength: 4 rounded ascending bars. `level` is the game's
// signalLevel (1–5), mapped to 1–4 lit bars. `flicker` drives the unstable animation.
// (Relies on the sigflicker/sigpulse keyframes defined in the chat screen's <style>.)
const SignalBars = ({ level, flicker }) => {
  const lit = Math.max(0, Math.min(4, Math.round((level / 5) * 4)));
  const heights = [4, 6, 8, 11];
  return (
    <svg width="21" height="12" viewBox="0 0 21 12" style={{ display:"block" }} aria-hidden="true">
      {heights.map((h, i) => {
        const on = i < lit;
        return (
          <rect key={i} x={i * 5.2} y={12 - h} width="3.4" height={h} rx="1.2"
            fill={on ? "#4a9e6b" : "#282828"}
            style={{
              filter: on ? "drop-shadow(0 0 3px rgba(74,158,107,0.6))" : "none",
              animation: on && flicker ? "sigflicker 0.18s ease infinite" : on ? "sigpulse 3s ease infinite" : "none",
            }} />
        );
      })}
    </svg>
  );
};

// #4 — a single chat row, memoized so the growing message list doesn't fully
// re-render when only isTyping / choices change. Depends solely on `m`.
const MessageRow = memo(function MessageRow({ m }) {
  if (m.from === "system")
    return <div style={{ alignSelf:"center", fontSize:"0.63rem", letterSpacing:"0.09em", color:"#2a3d2c", padding:"0.25rem 0", animation:"fi 0.6s ease" }}>{m.text}</div>;
  if (m.from === "narrator")
    return <div style={{ alignSelf:"center", textAlign:"center", fontSize:"0.78rem", letterSpacing:"0.12em", color:"#c8b98a", opacity:0.4, padding:"0.6rem 0", fontStyle:"italic", animation:"fi 1.2s ease" }}>{parseText(m.text, "msg")}</div>;
  if (m.from === "memory_note")
    return (
      <div style={{ alignSelf:"center", textAlign:"center", padding:"0.55rem 1.2rem", border:`1px solid ${m.kind==="discovery"?"#1a4a52":"#1a3a24"}`, background:m.kind==="discovery"?"#010a0d":"#010a04", animation:"fi 0.8s ease" }}>
        <div style={{ color:m.kind==="discovery"?"#4ab5c8":"#4a9e6b", fontSize:"0.62rem", letterSpacing:"0.14em" }}>{m.kind==="discovery"?"DISCOVERY":"MEMORY FRAGMENT"}</div>
        <div style={{ color:m.kind==="discovery"?"#7accd4":"#6aba8a", fontSize:"0.78rem", fontStyle:"italic", margin:"0.2rem 0" }}>"{m.name}"</div>
        {m.kind==="fragment" && <div style={{ color:"#2a6a3a", fontSize:"0.58rem", letterSpacing:"0.1em" }}>{m.count} of 9 recovered</div>}
      </div>
    );
  return (
    <div style={{ alignSelf:m.from==="ellie"?"flex-start":"flex-end", maxWidth:"82%", padding:"0.55rem 0.9rem", background:m.from==="ellie"?"#0d0d0d":"#0b110b", border:`1px solid ${m.from==="ellie"?"#222222":"#1c2a1c"}`, color:m.from==="ellie"?"#d8c79b":"#79b580", fontSize:"clamp(0.85rem, 3.6vw, 0.92rem)", lineHeight:"1.7", fontWeight:300, animation:"fi 0.35s ease" }}>
      {m.from==="player" ? parseText(m.text,"sent") : parseText(m.text,"msg")}
    </div>
  );
});

export default function DeadSignal() {
  const [screen, setScreen]             = useState("menu");
  const [shownLines, setShownLines]     = useState([]);
  const [showNotif, setShowNotif]       = useState(false);
  const [offlineLines, setOfflineLines] = useState([]);
  const [completeLines, setCompleteLines] = useState([]);
  const [deathLines, setDeathLines]     = useState([]);   // Priority 1 — death screen
  const [deathCause, setDeathCause]     = useState(null); // "injury" | "starvation" | "dehydration"
  const [muted, setMuted]               = useState(false); // audio — user mute preference (persisted)
  const [audioReady, setAudioReady]     = useState(false); // audio — true once unlocked by a user gesture
  const [slots, setSlots]               = useState([null, null, null]); // P4 — 3 save slots (meta or null)
  const [slotMode, setSlotMode]         = useState("start"); // slot screen mode: "start" | "load"
  const [slotConfirm, setSlotConfirm]   = useState(null);    // { index, action } two-tap confirm on the slot screen
  const [menuOpen, setMenuOpen]         = useState(false); // pause / save-load-exit menu
  const [menuMsg, setMenuMsg]           = useState("");    // transient confirmation in the menu
  const [menuNote, setMenuNote]         = useState("");    // transient note on the main menu (e.g. Story teaser)
  const [confirmReset, setConfirmReset] = useState(false); // two-tap confirm for the pause-menu "reset this run"
  const [optConfirm, setOptConfirm]     = useState(false); // two-tap confirm for Options "reset all data"
  const [showRestart, setShowRestart]   = useState(false);
  const [winProfile, setWinProfile]     = useState(null); // post-finish profile summary for the win screen
  const [lastMessage, setLastMessage]   = useState("");
  const [messages, setMessages]         = useState([]);
  const [choices, setChoices]           = useState([]);
  const [isTyping, setIsTyping]         = useState(false);
  const [contactName, setContactName]   = useState("KIM");
  const [resources, setResources]       = useState({ battery: 9, water: 0, food: 0, charger: null, hp: 10 });
  const [weapon, setWeapon]             = useState(null);
  const [noise, setNoise]               = useState(0);
  const [exchangePhase, setExchangePhase]       = useState(0);
  const [chosenPath, setChosenPath]             = useState(null);
  const [gamePhase, setGamePhase]               = useState("phase1");
  const [currentPath, setCurrentPath]           = useState(null);
  const [p2BeatIndex, setP2BeatIndex]           = useState(0);
  const [aiExchangeCount, setAiExchangeCount]   = useState(0);
  const [aiExchangeTarget, setAiExchangeTarget] = useState(7);
  const [fragFired, setFragFired]               = useState(false);
  const [currentEncounter, setCurrentEncounter] = useState(null);
  const [selectedFragment, setSelectedFragment] = useState(null);
  const [recoveredMemories, setRecoveredMemories] = useState([]);
  const [sigFlicker, setSigFlicker] = useState(false);
  const [battPulse, setBattPulse]   = useState(false); // P6c — battery pickup HUD flourish
  const [dayThree, setDayThree]     = useState(false);
  const [havenFinalIndex, setHavenFinalIndex] = useState(0);

  const pendingRef          = useRef([]);
  const dialogueRef         = useRef([]);   // timers owned by scheduleMessages (C3 — kept separate from pendingRef)
  const idRef               = useRef(0);    // monotonic id source (H1 — avoids Date.now() key collisions)
  const bottomRef           = useRef(null);
  const chatStartedRef      = useRef(false);
  const resourcesRef        = useRef(resources);
  const screenRef           = useRef(screen);
  const weaponRef           = useRef(weapon);
  const noiseRef            = useRef(noise);
  const gamePhaseRef        = useRef(gamePhase);
  const currentPathRef      = useRef(currentPath);
  const aiCountRef          = useRef(aiExchangeCount);
  const aiTargetRef         = useRef(aiExchangeTarget);
  const fragFiredRef        = useRef(fragFired);
  const currentEncounterRef = useRef(currentEncounter);
  const selectedFragmentRef  = useRef(selectedFragment);
  const recoveredMemoriesRef = useRef(recoveredMemories);
  const lastEncounterIdRef   = useRef(null);
  const shelterForcedRef     = useRef(false);
  const pendingStoryBeatRef  = useRef(null);
  const lastEventWasEncRef  = useRef(false);
  const returnToPhaseRef    = useRef("p2_ai");
  const havenFinalRef       = useRef(HAVEN_FINAL_SEQUENCE); // P5 — path-aware final sequence for this run
  const seenEncountersRef   = useRef(new Set()); // P6a — encounter ids seen this run (reduce repetition)
  const seenBeatsRef        = useRef(new Set()); // exploration beats shown this run (prefer unseen)
  const lastStateLineRef    = useRef(null);      // last STATE_LINES key fired (avoid back-to-back repeats)
  const activeSlotRef       = useRef(null);  // P4 — slot index (0–2) the in-progress run auto-saves to
  const activeProfileRef    = useRef(null);  // per-slot progression profile for the active run (playthroughs/fragments/clues)
  const legacyMemoriesRef   = useRef(null);  // one-time migration: legacy global ds_memories, used to seed a resumed v:1 save
  const mutedRef            = useRef(false); // audio — mirror of `muted` for the one-time unlock listener

  resourcesRef.current      = resources;
  screenRef.current         = screen;
  weaponRef.current         = weapon;
  noiseRef.current          = noise;
  gamePhaseRef.current      = gamePhase;
  currentPathRef.current    = currentPath;
  aiCountRef.current        = aiExchangeCount;
  aiTargetRef.current       = aiExchangeTarget;
  fragFiredRef.current      = fragFired;
  currentEncounterRef.current  = currentEncounter;
  selectedFragmentRef.current  = selectedFragment;
  recoveredMemoriesRef.current = recoveredMemories;

  const clearPending = () => {
    pendingRef.current.forEach(clearTimeout); pendingRef.current = [];
    dialogueRef.current.forEach(clearTimeout); dialogueRef.current = [];
  };
  const nextId = (prefix) => `${prefix}${idRef.current++}`;

  // Priority 1 — end the run on defeat. Distinct from the battery "offline" path.
  const triggerDeath = (cause) => {
    clearPending();
    setChoices([]);
    setIsTyping(false);
    pendingStoryBeatRef.current = null;
    setDeathCause(cause);
    setScreen("dead");
  };

  // ─── P4 — mid-run save/resume (reuses the window.storage pattern) ──────────────
  // Snapshot is taken at stable decision points (choices shown, not typing), so it
  // never captures a mid-animation state. Persisted memories/clues stay in their own
  // key (ds_memories) and are untouched.
  const SLOT_COUNT = 3;
  const slotKey = (i) => `ds_save_${i}`;
  // Short, human-readable location for the slot screen, derived from run state.
  const locationLabel = () => {
    if (dayThree || gamePhase.startsWith("haven")) return "The Haven";
    if (gamePhase === "shelter")     return "Shelter";
    if (gamePhase === "p2_ai_cross") return "Crossing Harwick";
    if (currentPath === "hospital")  return "Hospital";
    if (currentPath === "metro")     return "Metro tunnels";
    if (currentPath === "highway")   return "Highway checkpoint";
    return "Harwick";
  };
  const snapshotDay = () =>
    (dayThree || gamePhase.startsWith("haven")) ? 3
    : (gamePhase.startsWith("p2") || gamePhase === "encounter" || gamePhase === "shelter" || exchangePhase >= 10) ? 2 : 1;
  // ─── Per-slot progression model (schema v2) ────────────────────────────────────
  // A slot holds a persistent PROFILE (playthroughs + collected fragments/clues) plus
  // an optional in-progress RUN snapshot. Finishing a run merges its collection into the
  // profile and clears the run (back to the beginning). 100% = all 9 fragments + 3 clues.
  const emptyProfile = () => ({ playthroughs: 0, fragments: [], clues: [], complete: false });
  const profileComplete = (p) => (p?.fragments?.length || 0) >= 9 && (p?.clues?.length || 0) >= 3;
  // The resumable mid-run snapshot (the old v1 body) — now also carries this run's memories.
  const buildRunSnapshot = () => ({
    v: 1, idCounter: idRef.current,
    messages, choices, lastMessage,
    resources, weapon, noise, contactName,
    gamePhase, chosenPath, currentPath, exchangePhase, p2BeatIndex,
    aiExchangeCount, aiExchangeTarget, fragFired,
    currentEncounter, selectedFragment, dayThree, havenFinalIndex,
    recoveredMemories, // this run's cumulative collection (profile + new this run)
    pendingStoryBeat: pendingStoryBeatRef.current,
    returnToPhase: returnToPhaseRef.current,
    lastEncounterId: lastEncounterIdRef.current,
    havenFinal: havenFinalRef.current,
    seenEncounters: [...seenEncountersRef.current],
    shelterForced: shelterForcedRef.current,
    lastEventWasEnc: lastEventWasEncRef.current,
    meta: { day: snapshotDay(), location: locationLabel(), hp: resources.hp, battery: resources.battery, savedAt: Date.now() },
  });
  // The full per-slot record written to storage.
  const buildSlotData = (profile, run) => ({ v: 2, profile: profile || emptyProfile(), run: run || null });
  // A run body is resumable only if it's real progress with a sane schema.
  const validRun = (r) => !!r && r.gamePhase && r.gamePhase !== "phase1" && r.resources && typeof r.resources.battery === "number";
  // Normalize any stored value → { profile, run } (or null). Handles legacy v1 saves.
  const normalizeSlot = (raw) => {
    if (!raw) return null;
    if (raw.v === 2) {
      const profile = (raw.profile && typeof raw.profile === "object") ? raw.profile : emptyProfile();
      const run = validRun(raw.run) ? raw.run : null;
      const hasProgress = (profile.playthroughs || 0) > 0 || (profile.fragments?.length || 0) > 0 || (profile.clues?.length || 0) > 0;
      if (!run && !hasProgress) return null;
      return { profile, run };
    }
    if (raw.v === 1) { // legacy bare snapshot → migrate to a run with an empty profile
      if (!validRun(raw)) return null;
      return { profile: emptyProfile(), run: raw };
    }
    return null;
  };
  // Read every slot's display summary (or null) for the slot screen; clean up junk.
  const refreshSlots = async () => {
    const next = [];
    for (let i = 0; i < SLOT_COUNT; i++) {
      let raw;
      try { const r = await window.storage.get(slotKey(i)); if (r?.value) raw = JSON.parse(r.value); } catch (e) {}
      const slot = normalizeSlot(raw);
      if (slot) {
        const p = slot.profile;
        const rmeta = slot.run ? (slot.run.meta || { day: 2, location: "—", hp: slot.run.resources?.hp, battery: slot.run.resources?.battery }) : null;
        next.push({
          playthroughs: p.playthroughs || 0,
          frags: p.fragments?.length || 0,
          clues: p.clues?.length || 0,
          complete: !!p.complete || profileComplete(p),
          hasRun: !!slot.run,
          ...(rmeta ? { day: rmeta.day, location: rmeta.location, hp: rmeta.hp, battery: rmeta.battery } : {}),
        });
      } else {
        if (raw) { try { await window.storage.delete(slotKey(i)); } catch (e) {} }
        next.push(null);
      }
    }
    setSlots(next);
  };
  const saveRun = async () => {
    // Resume is only offered for a run with real progress — never the Day 1 intro.
    if (gamePhaseRef.current === "phase1") return false;
    const i = activeSlotRef.current;
    if (i == null) return false; // no slot claimed for this run
    const profile = activeProfileRef.current || emptyProfile();
    try { await window.storage.set(slotKey(i), JSON.stringify(buildSlotData(profile, buildRunSnapshot()))); await refreshSlots(); return true; } catch (e) { return false; }
  };
  const deleteSlot = async (i) => {
    if (i == null) return;
    try { await window.storage.delete(slotKey(i)); } catch (e) {}
    if (activeSlotRef.current === i) { activeSlotRef.current = null; activeProfileRef.current = null; }
    await refreshSlots();
  };
  // Seed the HUD memory list from a committed profile (used when starting a playthrough).
  const memsFromProfile = (p) => [
    ...((p?.fragments) || []).map(name => ({ name, type: "fragment" })),
    ...((p?.clues) || []).map(name => ({ name, type: "discovery" })),
  ];
  const resumeSlot = async (i) => {
    let raw;
    try { const r = await window.storage.get(slotKey(i)); if (r?.value) raw = JSON.parse(r.value); } catch (e) {}
    const slot = normalizeSlot(raw);
    if (!slot || !slot.run) { // nothing resumable
      if (raw && !slot) { console.warn("[DeadSignal] ignoring incompatible save"); deleteSlot(i); }
      return;
    }
    const run = slot.run;
    activeSlotRef.current = i; // this run now auto-saves back to slot i
    activeProfileRef.current = slot.profile || emptyProfile();
    clearPending();
    // refs (not mirrored from state)
    idRef.current             = run.idCounter || 0;
    pendingStoryBeatRef.current = run.pendingStoryBeat || null;
    returnToPhaseRef.current  = run.returnToPhase || "p2_ai";
    lastEncounterIdRef.current = run.lastEncounterId || null;
    havenFinalRef.current     = run.havenFinal || HAVEN_FINAL_SEQUENCE;
    seenEncountersRef.current = new Set(run.seenEncounters || []);
    seenBeatsRef.current = new Set(); lastStateLineRef.current = null; // run-local, not persisted
    shelterForcedRef.current  = !!run.shelterForced;
    lastEventWasEncRef.current = !!run.lastEventWasEnc;
    chatStartedRef.current    = true; // prevent the chat-start effect from re-firing exchange 0
    // state
    setMessages(run.messages || []); setChoices(run.choices || []); setLastMessage(run.lastMessage || "");
    setResources(run.resources); setWeapon(run.weapon || null); setNoise(run.noise || 0);
    setContactName(run.contactName || "KIM");
    setGamePhase(run.gamePhase || "phase1"); setChosenPath(run.chosenPath || null);
    setCurrentPath(run.currentPath || null); setExchangePhase(run.exchangePhase || 0);
    setP2BeatIndex(run.p2BeatIndex || 0); setAiExchangeCount(run.aiExchangeCount || 0);
    setAiExchangeTarget(run.aiExchangeTarget || 7);
    setFragFired(!!run.fragFired); setCurrentEncounter(run.currentEncounter || null);
    setSelectedFragment(run.selectedFragment || null); setDayThree(!!run.dayThree);
    setHavenFinalIndex(run.havenFinalIndex || 0);
    // memories: prefer the run's own cumulative set; else committed profile; else legacy global
    setRecoveredMemories(run.recoveredMemories || legacyMemoriesRef.current || memsFromProfile(slot.profile));
    setIsTyping(false); setShowNotif(false); setShownLines([]); setMenuOpen(false);
    setScreen("chat");
  };

  // ─── Pause menu actions (manual save / load / exit) ────────────────────────────
  const menuSave = async () => {
    const ok = await saveRun();
    setMenuMsg(ok ? "game saved." : "nothing to save yet.");
    pendingRef.current.push(setTimeout(() => setMenuMsg(""), 1800));
  };
  const menuLoad = async () => {
    setMenuMsg("");
    if (activeSlotRef.current != null) await resumeSlot(activeSlotRef.current); // reload this run's slot
  };
  const menuSaveExit = async () => {
    await saveRun();
    setMenuOpen(false); setMenuMsg("");
    clearPending();
    setScreen("menu"); // the save persists → "LOAD" is available from the main menu
  };

  // ─── Audio (procedural, Tone.js) — purely additive, fully mutable ──────────────
  const toggleMute = () => {
    const next = !mutedRef.current;
    mutedRef.current = next;
    setMuted(next);
    audioEngine.setMuted(next);
    (async () => { try { await window.storage.set("ds_muted", JSON.stringify(next)); } catch (e) {} })();
  };

  // Restore the mute preference on mount.
  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get("ds_muted");
        if (r?.value) { const m = JSON.parse(r.value); setMuted(!!m); mutedRef.current = !!m; audioEngine.setMuted(!!m); }
      } catch (e) {}
    })();
  }, []);

  // Unlock the audio context on the first user gesture (browser autoplay policy).
  // iOS Safari only grants audio activation on touchend/click (not pointerdown), and may
  // not resume on the first try — so listen broadly and keep retrying until the context is
  // actually running (audioEngine.unlock only reports success when it is).
  useEffect(() => {
    const events = ["touchend", "click", "keydown", "pointerdown"];
    const remove = () => events.forEach(e => window.removeEventListener(e, onGesture));
    const onGesture = async () => {
      await audioEngine.unlock();
      if (audioEngine.isUnlocked()) {
        audioEngine.setMuted(mutedRef.current);
        setAudioReady(true);
        remove(); // only stop listening once audio is genuinely unlocked
      }
    };
    events.forEach(e => window.addEventListener(e, onGesture, { passive: true }));
    return remove;
  }, []);

  // Keep audio alive across app-switching. iOS suspends the AudioContext when the page is
  // backgrounded and won't auto-resume — so resume on return-to-foreground and on the next
  // gesture (resume() no-ops when already running, so this is effectively free).
  useEffect(() => {
    const resume = () => audioEngine.resume();
    const onVis = () => { if (document.visibilityState === "visible") audioEngine.resume(); };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pageshow", resume);
    window.addEventListener("focus", resume);
    window.addEventListener("pointerdown", resume, { passive: true });
    window.addEventListener("touchend", resume, { passive: true });
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pageshow", resume);
      window.removeEventListener("focus", resume);
      window.removeEventListener("pointerdown", resume);
      window.removeEventListener("touchend", resume);
    };
  }, []);

  // Terminal-screen audio (once unlocked). Only completion has a sound.
  useEffect(() => {
    if (audioReady && screen === "phase2_complete") audioEngine.terminal("complete");
  }, [screen, audioReady]);

  useEffect(() => {
    if (screen !== "intro") return; // re-fires every time screen returns to "intro"
    setShownLines([]); setShowNotif(false); // start the cinematic clean — never stack lines
    const ids = [];
    INTRO_LINES.forEach(({ text, delay }) => ids.push(setTimeout(() => setShownLines(p => [...p, text]), delay)));
    ids.push(setTimeout(() => setShowNotif(true), NOTIF_DELAY));
    ids.forEach(id => pendingRef.current.push(id));
    return () => ids.forEach(clearTimeout); // C2 — cancel on screen change/unmount
  }, [screen]);

  // One-time migration read: fragments/clues are now tracked PER SLOT (in each slot's
  // profile), persisted via saveRun. The legacy global `ds_memories` is read once here
  // only to seed a resumed legacy (v1) save so its collection isn't lost.
  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get("ds_memories");
        if (r?.value) legacyMemoriesRef.current = JSON.parse(r.value);
      } catch (e) {}
    })();
  }, []);

  useEffect(() => {
    if (screen !== "chat" || chatStartedRef.current) return;
    chatStartedRef.current = true;
    const first = SCRIPTED_EXCHANGES[0];
    setIsTyping(true);
    scheduleMessages(first.msgs, first.choices, first.from || "ellie");
  }, [screen]);

  useEffect(() => {
    if (screen !== "offline") return;
    const ids = [];
    OFFLINE_LINES.forEach(({ text, delay }) => ids.push(setTimeout(() => setOfflineLines(p => [...p, text]), delay)));
    ids.push(setTimeout(() => setShowRestart(true), 5200));
    return () => ids.forEach(clearTimeout); // C2
  }, [screen]);

  // Priority 1 — catch-all defeat check. Only ever fires for HP lost in an ENCOUNTER:
  // starvation/dehydration deaths are attributed directly in the p2_ai handler (which
  // flips screen→"dead" first, suppressing this), and shelter damage clamps to HP≥1.
  // So the proximate cause here is always the injury, regardless of food/water level.
  useEffect(() => {
    if (screen !== "chat" || resources.hp > 0) return;
    triggerDeath("injury");
  }, [resources.hp, screen]);

  // Priority 1 — death screen reveal (mirrors the offline effect).
  useEffect(() => {
    if (screen !== "dead") return;
    const lines = DEATH_LINES[deathCause] || DEATH_LINES.injury;
    const ids = [];
    lines.forEach(({ text, delay }) => ids.push(setTimeout(() => setDeathLines(p => [...p, text]), delay)));
    const lastDelay = lines.length ? lines[lines.length - 1].delay : 0;
    ids.push(setTimeout(() => setShowRestart(true), lastDelay + 1600));
    return () => ids.forEach(clearTimeout);
  }, [screen, deathCause]);

  useEffect(() => {
    if (screen !== "phase2_complete") return;
    const ids = [];
    P2_COMPLETE_LINES.forEach(({ text, delay }) => ids.push(setTimeout(() => setCompleteLines(p => [...p, text]), delay)));
    ids.push(setTimeout(() => setShowRestart(true), 6000));
    return () => ids.forEach(clearTimeout); // C2
  }, [screen]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages, isTyping, choices]);

  // P4 — on mount, migrate any legacy single-slot save into slot 0, then read all slots.
  // refreshSlots() validates each slot and cleans up zero-progress / malformed saves.
  useEffect(() => {
    (async () => {
      try {
        const legacy = await window.storage.get("ds_save");
        if (legacy?.value) {
          const snap = JSON.parse(legacy.value);
          const slot0 = await window.storage.get(slotKey(0));
          if (validRun(snap) && !slot0?.value) {
            // Leave it as a bare v1 body — normalizeSlot() migrates it (→ empty profile + run) on read.
            if (!snap.meta) snap.meta = { day: 2, location: "—", hp: snap.resources.hp, battery: snap.resources.battery, savedAt: 0 };
            await window.storage.set(slotKey(0), JSON.stringify(snap));
          }
          try { await window.storage.delete("ds_save"); } catch (e) {}
        }
      } catch (e) {}
      await refreshSlots();
    })();
  }, []);

  // P4 — save at stable decision points (choices shown, animation settled).
  useEffect(() => {
    if (screen === "chat" && choices.length > 0 && !isTyping) saveRun();
  }, [screen, choices, isTyping]);

  // Terminal screens resolve the active slot's profile (the per-slot progression).
  //  • death / offline → discard the in-progress run, KEEP the accumulated profile
  //    (a single failure no longer erases fragments earned in earlier playthroughs).
  //  • win → merge this run's collection into the profile, bump playthroughs, clear the
  //    run (back to the beginning), and keep the slot (it locks at 100%).
  useEffect(() => {
    const i = activeSlotRef.current;
    if (screen === "dead" || screen === "offline") {
      const profile = activeProfileRef.current || emptyProfile();
      const hasProgress = (profile.playthroughs || 0) > 0 || profile.fragments.length || profile.clues.length;
      (async () => {
        try {
          if (i != null && hasProgress) await window.storage.set(slotKey(i), JSON.stringify(buildSlotData(profile, null)));
          else if (i != null) await window.storage.delete(slotKey(i)); // nothing committed yet → empty
        } catch (e) {}
        await refreshSlots();
      })();
      setRecoveredMemories([]);
    } else if (screen === "phase2_complete") {
      const prev = activeProfileRef.current || emptyProfile();
      const fragments = [...new Set([...(prev.fragments || []), ...recoveredMemories.filter(m => m.type === "fragment").map(m => m.name)])];
      const clues     = [...new Set([...(prev.clues     || []), ...recoveredMemories.filter(m => m.type === "discovery").map(m => m.name)])];
      const profile = { playthroughs: (prev.playthroughs || 0) + 1, fragments, clues, complete: fragments.length >= 9 && clues.length >= 3 };
      activeProfileRef.current = profile;
      setWinProfile({ playthroughs: profile.playthroughs, frags: fragments.length, clues: clues.length, complete: profile.complete });
      (async () => {
        try { if (i != null) await window.storage.set(slotKey(i), JSON.stringify(buildSlotData(profile, null))); } catch (e) {}
        await refreshSlots();
      })();
    }
  }, [screen]);

  // `onShown(text, index)` fires exactly when each message is appended — lets
  // callers hook an event to a message render instead of a magic delay (P6d).
  const scheduleMessages = (msgs, choiceList, msgType = "ellie", onShown = null) => {
    // C3 — clear only this queue's own timers, leaving addMsg/bridge timers (pendingRef) intact.
    dialogueRef.current.forEach(clearTimeout); dialogueRef.current = [];
    let t = 350;

    if (msgs.length === 0) {
      // No messages — still need to clear typing indicator
      dialogueRef.current.push(setTimeout(() => setIsTyping(false), t));
      t += 50;
    }

    msgs.forEach((text, i) => {
      dialogueRef.current.push(setTimeout(() => setIsTyping(msgType !== "narrator"), t));
      t += msgType === "narrator" ? 1800 : Math.min(500 + text.length * 22, 1800);
      dialogueRef.current.push(setTimeout(() => {
        setIsTyping(false);
        setMessages(p => [...p, { id: nextId("e"), from: msgType, text }]);
        audioEngine.blip(); // ultra-quiet incoming-message blip (ellie/narrator only)
        onShown?.(text, i);
      }, t));
      t += msgType === "narrator" ? 600 : 280;
    });
    if (choiceList?.length) dialogueRef.current.push(setTimeout(() => setChoices(choiceList), t + 80));
    return t;
  };

  // P6c — brief battery-pickup HUD flourish.
  const pulseBattery = () => {
    setBattPulse(true);
    pendingRef.current.push(setTimeout(() => setBattPulse(false), 1400));
  };

  const addMsg = (from, text, delay = 0) => {
    pendingRef.current.push(setTimeout(() => setMessages(p => [...p, { id: nextId(from), from, text }]), delay));
  };

  // audio — soft confirm on a net gain, duller thud on a loss, from a resource delta.
  const stingForDelta = (d) => {
    const pos = d.food > 0 || d.water > 0 || d.hp > 0 || d.battery > 0;
    const neg = d.food < 0 || d.water < 0 || d.hp < 0 || d.battery < 0;
    if (pos) audioEngine.gain(); else if (neg) audioEngine.loss();
  };

  // Resource drain at section transitions and mid-legs. The steady squeeze that
  // makes searching matter (supply economy). Code owns every number.
  const applyTransitionDrain = (type) => {
    if (type === "path_start") {
      setResources(p => ({ ...p, food: Math.max(0, p.food - 1), water: Math.max(0, p.water - 1) }));
      addMsg("system", "moving out · [-1 Food] [-1 Water]", 500);
    }
    if (type === "path_mid") {
      setResources(p => ({ ...p, water: Math.max(0, p.water - 1) }));
      addMsg("system", "the climb wears on you · [-1 Water]", 500);
    }
    if (type === "crossing_start") {
      setResources(p => ({ ...p, food: Math.max(0, p.food - 1), water: Math.max(0, p.water - 1) }));
      addMsg("system", "crossing harwick · [-1 Food] [-1 Water]", 500);
    }
    if (type === "crossing_mid") {
      setResources(p => ({ ...p, food: Math.max(0, p.food - 1), water: Math.max(0, p.water - 1) }));
      addMsg("system", "the miles add up · [-1 Food] [-1 Water]", 500);
    }
    // Only sound the loss if a resource actually drops (not already at 0).
    const cur = resourcesRef.current;
    const willDrop = type === "path_mid" ? cur.water > 0 : (cur.food > 0 || cur.water > 0);
    if (willDrop) audioEngine.loss();
  };

  // Fix #5 — apply code-authoritative loot parsed from an AI-phase choice marker.
  // Updates resources (clamped), drops a HUD system line on the same beat, and
  // returns the post-change vitals. `baseBattery` is the already-drained battery
  // for this turn; any [+N Battery] loot stacks on top of it.
  const applyChoiceLoot = (choice, baseBattery) => {
    const d   = parseResourceMarkers(choice);
    const cur = resourcesRef.current;
    const newFood    = Math.max(0, cur.food + d.food);
    const newWater   = Math.max(0, cur.water + d.water);
    const newHp      = Math.max(0, Math.min(10, cur.hp + d.hp));
    const newBattery = Math.max(0, Math.min(100, baseBattery + d.battery));
    const hasDelta   = !!(d.food || d.water || d.hp || d.battery);

    if (hasDelta) {
      setResources(p => ({
        ...p,
        food:    Math.max(0, p.food + d.food),
        water:   Math.max(0, p.water + d.water),
        hp:      Math.max(0, Math.min(10, p.hp + d.hp)),
        battery: Math.max(0, Math.min(100, p.battery + d.battery)),
      }));
      const parts = [];
      if (d.food)    parts.push(`food ${d.food > 0 ? "+" : ""}${d.food}`);
      if (d.water)   parts.push(`water ${d.water > 0 ? "+" : ""}${d.water}`);
      if (d.hp)      parts.push(`hp ${d.hp > 0 ? "+" : ""}${d.hp}`);
      if (d.battery) parts.push(`battery ${d.battery > 0 ? "+" : ""}${d.battery}%`);
      addMsg("system", parts.join(" · "), 300);
      stingForDelta(d); // audio
      if (d.battery > 0) pulseBattery(); // P6c
    }

    return { hasDelta, newBattery, newFood, newWater, newHp };
  };

  // Priority 1 — gradual starvation/dehydration. Each empty vital costs 1 HP per
  // AI exploration choice (they stack). Code owns the math; returns the
  // prospective new HP so the caller can end the run before firing an API call.
  // `snap` lets the caller pass loot-adjusted vitals (the ref is stale until the
  // next render), so grabbing food this turn correctly prevents starving this turn.
  const applyStarvation = (snap) => {
    const r = snap || resourcesRef.current;
    let dHp = 0;
    if (r.food <= 0)  { dHp -= 1; addMsg("system", "starving · [-1 HP]", 300); }
    if (r.water <= 0) { dHp -= 1; addMsg("system", "dehydrated · [-1 HP]", 300); }
    if (dHp !== 0) setResources(p => ({ ...p, hp: Math.max(0, p.hp + dHp) }));
    return Math.max(0, r.hp + dHp);
  };

  // Local exploration-beat picker — deterministic replacement for the AI's
  // connective dialogue. State-reaction lines punctuate exploration (they don't
  // take it over): the matching condition fires occasionally and never twice in a
  // row, otherwise a fresh atmospheric beat for the current location plays. The
  // 0.4 injection rate and the seen-set reset are the tuning knobs for M7.
  const pickExploreBeat = (path, section, res) => {
    const stateKey = res.battery <= 3 ? "battery_critical"
                   : res.battery <= 8 ? "battery_low"
                   : res.hp <= 3      ? "injured_bad"
                   : res.food <= 1    ? "low_food"
                   : res.water <= 1   ? "low_water" : null;
    // battery_critical is near-death and rare — let it through every time (still
    // not back-to-back). Softer conditions only punctuate, so the pools breathe.
    if (stateKey && stateKey !== lastStateLineRef.current &&
        (stateKey === "battery_critical" || Math.random() < 0.4)) {
      lastStateLineRef.current = stateKey;
      return STATE_LINES[stateKey];
    }
    lastStateLineRef.current = null;

    const poolKey = section === "crossing" ? "crossing"
                  : section === "haven"    ? "haven"
                  : path;
    const pool  = EXPLORE_BEATS[poolKey] || EXPLORE_BEATS.crossing;
    const seen  = seenBeatsRef.current;
    let fresh   = pool.filter(b => !seen.has(b));
    if (!fresh.length) { seen.clear(); fresh = pool; } // exhausted — reset, delay repeats not eliminate
    const beat  = pickRandom(fresh);
    seen.add(beat);
    return beat;
  };

  // Renders the next exploration exchange entirely locally: pick a beat, show its
  // messages + choices, and — when a story beat is queued in pendingStoryBeatRef —
  // bridge into it (memory / discovery / shelter / encounter / haven_final). This
  // is the deterministic replacement for the old AI dialogue call.
  // phaseOverride: localBeat is synchronous, so at call sites that setGamePhase(X)
  // then invoke it in the SAME tick, gamePhaseRef.current is still the old phase
  // (the ref only updates on re-render). Those sites pass the target phase explicitly.
  const localBeat = (batteryOverride = null, phaseOverride = null) => {
    const res     = resourcesRef.current;
    const path    = currentPathRef.current || "hospital";
    const phase   = phaseOverride || gamePhaseRef.current;
    const section = phase === "p2_ai" ? "path"
                  : phase === "p2_ai_cross" ? "crossing" : "haven";
    const beat    = pickExploreBeat(path, section, res);
    const effectiveBattery = batteryOverride !== null ? batteryOverride : res.battery;

    // No per-choice battery marker: drain is now universal/passive (beatBatteryCost),
    // so a per-choice "cost" tag would be misleading. The HUD battery shows the drain.
    const displayChoices = beat.choices;

    const pending = pendingStoryBeatRef.current;

    if (effectiveBattery <= 0) {
      scheduleMessages(beat.msgs, null, beat.from);
      pendingRef.current.push(setTimeout(() => setScreen("offline"), beat.msgs.length * 2000 + 1500)); // C2 — cancelable

    } else if (pending) {
      // Resolve the current action first — show the beat with no choices
      pendingStoryBeatRef.current = null;
      const aiMsgTime = scheduleMessages(beat.msgs, null, beat.from);
      const path = currentPathRef.current || "hospital"; // H4 — never index data maps with null

      // After the beat finishes, bridge into the queued story beat
      pendingRef.current.push(setTimeout(() => {

        if (pending.type === "memory") {
          const bridgeTime = scheduleMessages(["you keep walking.", "then the world slips sideways."], null, "narrator");
          pendingRef.current.push(setTimeout(() => {
            setGamePhase("p2_memory_frag");
            const frag = selectedFragmentRef.current || MEMORY_FRAGMENT_POOLS[path][0];
            scheduleMessages(frag.msgs, frag.choices, "narrator");
          }, bridgeTime + 300));

        } else if (pending.type === "discovery") {
          const discBridges = {
            hospital: ["you move deeper into the building.", "then you find it."],
            metro:    ["you keep moving through the tunnels.", "then something catches your eye."],
            route9:   ["you leave it behind.", "the highway opens ahead.", "then you see the checkpoint."],
          };
          const bridgeTime = scheduleMessages(discBridges[path] || ["you move on.", "then you find it."], null, "narrator");
          pendingRef.current.push(setTimeout(() => {
            setGamePhase("p2_discovery");
            const disc = DISCOVERY_BEATS[path];
            scheduleMessages(disc.msgs, disc.choices, disc.from || "narrator");
          }, bridgeTime + 300));

        } else if (pending.type === "shelter") {
          shelterForcedRef.current = false;
          setChoices([]); setIsTyping(false);
          setGamePhase("shelter");
          addMsg("ellie", "it's getting dark.", 600);
          addMsg("ellie", "you need to find somewhere to stop.", 2400);
          addMsg("narrator", "emergency shelter.", 4800);
          addMsg("narrator", "cots still unfolded.", 6400);
          addMsg("narrator", "names written on tape above each one.", 7900);
          addMsg("narrator", "one of them is yours.", 9400);
          pendingRef.current.push(setTimeout(() => setChoices([
            "Sleep here. [-1 Food] [-1 Water]",
            "Barricade the door first. [+1 Noise] [-1 Food] [-1 Water]",
            "Keep moving. [danger]",
          ]), 11000));

        } else if (pending.type === "haven_final") {
          setGamePhase("haven_final");
          setHavenFinalIndex(0);
          havenFinalRef.current = buildHavenFinal(currentPathRef.current); // P5 — branch-aware
          scheduleMessages(havenFinalRef.current[0].msgs, havenFinalRef.current[0].choices, "narrator");

        } else if (pending.type === "encounter") {
          const enc = pending.enc;
          const encBridges = {
            hospital: ["you move deeper in.", "then something blocks the way ahead."],
            metro:    ["you keep moving through the dark.", "then something stops you."],
            route9:   ["the road opens ahead.", "then you see it."],
          };
          // During the city crossing the player is on open streets, not the original
          // leg — use a street-level bridge instead of the path's indoor/underground one.
          const crossingBridge = ["the street narrows ahead.", "then something blocks the way."];
          const encBridge = gamePhaseRef.current === "p2_ai_cross"
            ? crossingBridge
            : (encBridges[path] || ["you move on.", "then something blocks the way ahead."]);
          const bridgeTime = scheduleMessages(encBridge, null, "narrator");
          pendingRef.current.push(setTimeout(() => {
            setCurrentEncounter(enc);
            returnToPhaseRef.current = gamePhaseRef.current;
            setGamePhase("encounter");
            scheduleMessages(enc.msgs, enc.choices.map(c => c.text), "narrator");
          }, bridgeTime + 300));
        }

      }, aiMsgTime + 600));

    } else {
      scheduleMessages(beat.msgs, displayChoices, beat.from);
    }
  };

  const resolveEncounterChoice = (choice, encounter) => {
    const action   = encounter.choices.find(c => stripMarkers(c.text) === stripMarkers(choice))?.action || "AVOID";
    const curNoise = noiseRef.current;
    const curRes   = resourcesRef.current;
    let dNoise = 0, dHp = 0, dFood = 0, dWater = 0, dBatt = 0, dCharger = 0;
    let outcome = "", reactionKey = "avoid";

    switch (action) {
      case "SNEAK": {
        const ok = Math.random() < (curNoise <= 1 ? 0.92 : curNoise <= 3 ? 0.68 : 0.38);
        if (ok) { outcome = "you slipped past unnoticed."; reactionKey = "sneak_success"; }
        else    { outcome = "it heard you."; reactionKey = "sneak_fail"; dNoise = 1; dHp = -1; }
        break;
      }
      case "SEARCH": {
        dNoise = 1;
        // Power source charges the bank reliably — you plug into a live generator, so
        // the reservoir tops up even if you don't turn up loot (keeps the battery
        // lifeline dependable for an engaged player; the risk is just noise/HP).
        if (curRes.charger !== null && POWER_SOURCES.has(encounter.id)) dCharger = CHARGER_RECHARGE;
        if (Math.random() < 0.80) { // guaranteed search spots usually pay; risk is the noise/HP on a fail
          const lootTable = SEARCH_LOOT[encounter.id] || SEARCH_LOOT.default;
          const item = pickRandom(lootTable);
          if (item === "food")    { dFood = 1; outcome = "you found food."; }
          else if (item === "water")   { dWater = 1; outcome = "you found water."; }
          else if (item === "battery") { dBatt = 10; outcome = "you found a battery pack."; }
          reactionKey = "search_found";
          // Food restores HP if injured
          if ((item === "food" || item === "water") && curRes.hp < 10) dHp = 1;
        } else {
          outcome = dCharger > 0 ? "nothing useful, but the charger's topped up." : "you disturbed something.";
          reactionKey = "search_fail"; dNoise = 2; dHp = -1;
        }
        break;
      }
      case "WAIT":    { outcome = "you waited. it passed."; reactionKey = "wait"; break; }
      case "DISTRACT":{ if (curRes.food > 0) { dFood = -1; outcome = "it goes for the food. you slip past."; } else { outcome = "nothing to throw. you slip past anyway."; } reactionKey = "distract"; dNoise = 1; break; }
      case "RUN": {
        const ok = Math.random() < (curNoise <= 3 ? 0.75 : 0.48);
        if (ok) { outcome = "you ran. made it."; reactionKey = "run_success"; dNoise = 1; }
        else    { outcome = "you got away. dropped something."; reactionKey = "run_fail"; dFood = -1; dWater = -1; dNoise = 2; }
        break;
      }
      case "OBSERVE": { outcome = "you look. more questions than answers."; reactionKey = "observe"; break; }
      case "FORCE":   { outcome = "you forced through."; reactionKey = "force"; dHp = -2; dNoise = 2; break; }
      case "FIGHT": {
        // Weapon-driven combat. Damage raises the odds of a clean kill and cuts the
        // bleed on a loss. Unarmed is desperate. Fighting is loud either way.
        const dmg = weaponRef.current ? weaponRef.current.damage : 0;
        const ok  = Math.random() < Math.max(0.1, Math.min(0.95, 0.45 + dmg * 0.08 - (curNoise >= 4 ? 0.1 : 0)));
        dNoise = dmg ? 1 : 2;
        if (ok) { outcome = dmg ? "you put it down." : "you fight it off. barely."; reactionKey = "fight_win";  dHp = dmg ? 0  : -1; }
        else    { outcome = dmg ? "it gets a hit in."  : "it gets to you. bad.";    reactionKey = "fight_loss"; dHp = dmg ? -1 : -3; }
        break;
      }
      default:        { outcome = "you kept moving."; reactionKey = "avoid"; }
    }

    const prevNoise = curNoise;
    // A forced cornered fight breaks contact — reset noise to 0 (you lost them) so the
    // next forced fight needs another loud streak, instead of re-triggering immediately.
    const newNoise  = encounter.id === "cornered"
      ? 0
      : Math.min(5, Math.max(0, curNoise + dNoise));
    setNoise(newNoise);
    setResources(prev => ({
      ...prev,
      hp:      Math.max(0, Math.min(10, prev.hp + dHp)),
      food:    Math.max(0, prev.food  + dFood),
      water:   Math.max(0, prev.water + dWater),
      battery: Math.min(100, prev.battery + dBatt),
      charger: prev.charger === null ? null : Math.min(100, prev.charger + dCharger),
    }));
    stingForDelta({ food: dFood, water: dWater, hp: dHp, battery: dBatt }); // audio
    if (dBatt > 0) { addMsg("system", `battery pack connected · +${dBatt}%`, 300); pulseBattery(); } // P6c
    if (dCharger > 0) { addMsg("system", `charger recharged · +${dCharger}%`, dBatt > 0 ? 1100 : 300); pulseBattery(); }

    addMsg("system", outcome, dBatt > 0 ? 800 : 300);

    const narLine = NARRATOR_ATMOSPHERE[reactionKey];
    const useNar  = narLine && (reactionKey.includes("fail") || reactionKey.startsWith("fight") || reactionKey === "sneak_success" || reactionKey === "wait");
    const reactionDelay = useNar ? 2000 : 1400;
    if (useNar) addMsg("narrator", narLine, 900);
    addMsg("ellie", pickRandom(ENCOUNTER_REACTIONS[reactionKey] || ["keep moving."]), reactionDelay);

    if (prevNoise < 2 && newNoise >= 2) addMsg("ellie", "you're making noise. ease off.", reactionDelay + 700);
    if (prevNoise < 4 && newNoise >= 4) addMsg("narrator", "something answers.", reactionDelay + 700);
    if (prevNoise < 5 && newNoise >= 5) addMsg("narrator", "you hear footsteps. more than one set.", reactionDelay + 700);

    pendingRef.current.push(setTimeout(() => {
      const returnPhase = returnToPhaseRef.current;
      lastEncounterIdRef.current = encounter.id;
      setGamePhase(returnPhase);
      setCurrentEncounter(null);
      lastEventWasEncRef.current = true;
      setIsTyping(true);
      localBeat(null, returnPhase); // resume exploration in the phase we returned to
    }, reactionDelay + 1800));
  };

  // Free action (does NOT advance a beat or drain): bleed the charger reservoir into
  // the phone. Available on normal choice screens while charger has reserve and the
  // phone isn't already near full — surfaced as a button beside the choices.
  const chargerTransferAmount = () => Math.min(CHARGER_TRANSFER, resourcesRef.current.charger || 0, 100 - resourcesRef.current.battery);
  const useCharger = () => {
    const amt = chargerTransferAmount();
    if (amt <= 0) return;
    audioEngine.tapResponse();
    setResources(p => ({ ...p, battery: Math.min(100, p.battery + amt), charger: Math.max(0, p.charger - amt) }));
    addMsg("system", `charger → phone · +${amt}%`, 300);
    pulseBattery();
  };

  // Equip a weapon by key — only ever an upgrade (never downgrades a better weapon).
  const equipWeapon = (key, delay = 700) => {
    const w = WEAPONS[key]; if (!w) return false;
    const cur = weaponRef.current;
    if (cur && cur.damage >= w.damage) { addMsg("system", `${w.shortName} found — your ${cur.shortName} is better`, delay); return false; }
    setWeapon(w); addMsg("system", `${w.name} equipped · ${w.damage}dmg`, delay); return true;
  };

  const handleChoice = (choice) => {
    audioEngine.tapResponse(); // audio — response/choice tap
    clearPending();
    setChoices([]);

    setLastMessage(choice);
    const isNarContinue = choice === "·";
    const isEncounter   = gamePhaseRef.current === "encounter";
    // Game-wide drain: every advancing beat costs power (beatBatteryCost owns the
    // per-phase rate). Continues ("·") are free — reading, not traversal.
    const drainCost  = isNarContinue ? 0 : beatBatteryCost(gamePhaseRef.current);
    const newBattery = Math.max(0, resourcesRef.current.battery - drainCost);
    if (drainCost) setResources(p => ({ ...p, battery: Math.max(0, p.battery - drainCost) }));
    if (!isNarContinue) setMessages(p => [...p, { id: nextId("p"), from: "player", text: choice }]);
    if (!isEncounter && !isNarContinue) setIsTyping(true);

    if (isEncounter) { resolveEncounterChoice(choice, currentEncounterRef.current); return; }

    // Offline coherence: AI phases and encounters reach `offline` through localBeat's
    // own battery check, but these scripted phases don't pass through it — so if the
    // drain just emptied the phone here, go dark after the tapped choice renders.
    // (haven_approach is excluded — it checks starvation FIRST so a starving run dies
    // of the right cause instead of offline always winning the tie; it handles offline
    // itself after that check.)
    if (newBattery <= 0 && ["p2_scripted", "shelter", "haven_final"].includes(gamePhaseRef.current)) {
      pendingRef.current.push(setTimeout(() => setScreen("offline"), 1500));
      return;
    }

    if (gamePhaseRef.current === "p2_memory_frag") {
      const frag = selectedFragmentRef.current;
      const fragName = frag?.name || "Unknown";
      const isNewFrag = !recoveredMemoriesRef.current.some(m => m.name === fragName);
      if (isNewFrag) {
        setRecoveredMemories(prev => [...prev, { name: fragName, type: "fragment" }]);
      }
      const newCount = recoveredMemoriesRef.current.filter(m => m.type === "fragment").length + (isNewFrag ? 1 : 0);
      setSigFlicker(true);
      pendingRef.current.push(setTimeout(() => setSigFlicker(false), 900));
      if (isNewFrag) {
        pendingRef.current.push(setTimeout(() => {
          setMessages(p => [...p, { id:nextId("mem"), from:"memory_note", name:fragName, count:newCount, kind:"fragment" }]);
        }, 600));
      }
      setGamePhase("p2_ai");
      lastEventWasEncRef.current = true;
      // Delay until the memory notification has rendered, then reground from the
      // flashback to the present before the next beat (no hard cut back to reality).
      pendingRef.current.push(setTimeout(() => {
        const path = currentPathRef.current || "hospital";
        const reground = {
          hospital: ["you blink.", "the corridor again."],
          metro:    ["you blink.", "the tunnel again."],
          route9:   ["you blink.", "the road again."],
        }[path] || ["you blink.", "back to the present."];
        const t = scheduleMessages(reground, null, "narrator");
        pendingRef.current.push(setTimeout(() => { setIsTyping(true); localBeat(null, "p2_ai"); }, t + 300));
      }, 1400));
      return;
    }

    if (gamePhaseRef.current === "phase1") {
      const cur  = SCRIPTED_EXCHANGES[exchangePhase];
      const next = exchangePhase + 1;
      setExchangePhase(next);
      if (cur?.onChoice === "CHARGER")     { const ch = Math.min(100, newBattery + CHARGER_FIND); setResources(p => ({ ...p, battery: ch, charger: 0 })); addMsg("system", `portable charger drained into phone · battery ${ch}%`, 700); addMsg("system", "charger empty — recharge it at a power source", 1400); }
      if (cur?.onChoice === "SUPPLIES")    { setResources(p => ({ ...p, food: START_SUPPLY, water: START_SUPPLY })); addMsg("system", `supplies gathered · food ${START_SUPPLY} · water ${START_SUPPLY}`, 700); }
      if (cur?.onChoice === "MAP_FOUND")   { addMsg("system", "city map found — harwick", 700); }
      let detected = null;
      if (cur?.onChoice === "BRANCH") { detected = detectPath(choice); setCurrentPath(detected); setChosenPath(choice); }
      // CHARGER emits two staggered captions; hold the next exchange until both have
      // landed so they read as a pair (the typing indicator from line 1421 bridges the
      // gap). Other choices have at most one caption, so they start the reply at once.
      const startNext = () => {
        if (next < SCRIPTED_EXCHANGES.length) {
          const nx = SCRIPTED_EXCHANGES[next];
          // P6d — flip KIM→ELLIE the instant the name-reveal message actually renders,
          // tied to the message text (not a magic 3040ms delay). Only the reveal
          // exchange (onChoice NAME_REVEAL) gets the hook.
          const onShown = nx.onChoice === "NAME_REVEAL"
            ? (text) => { if (/ellie/i.test(text)) setContactName("ELLIE"); }
            : null;
          scheduleMessages(nx.msgs, nx.choices, nx.from || "ellie", onShown);
        } else {
          const path = detected || currentPathRef.current || "hospital"; // H4
          setGamePhase("p2_scripted"); setP2BeatIndex(0);
          scheduleMessages(PATH_BEATS[path][0].msgs, PATH_BEATS[path][0].choices, "ellie");
        }
      };
      const nextDelay = cur?.onChoice === "CHARGER" ? 1700 : 0;
      if (nextDelay > 0) pendingRef.current.push(setTimeout(startNext, nextDelay));
      else startNext();
      return;
    }

    if (gamePhaseRef.current === "p2_scripted") {
      const path  = currentPathRef.current || "hospital"; // H4
      const beats = PATH_BEATS[path];
      const cur   = beats[p2BeatIndex];
      const next  = p2BeatIndex + 1;
      if (WEAPON_PICKUPS[cur?.onChoice]) equipWeapon(WEAPON_PICKUPS[cur.onChoice]);
      if (next < beats.length) {
        setP2BeatIndex(next);
        scheduleMessages(beats[next].msgs, beats[next].choices, "ellie");
      } else {
        // Path scripted complete — pick random fragment for this run, drain water, start AI
        const fragPool = MEMORY_FRAGMENT_POOLS[path] || MEMORY_FRAGMENT_POOLS.hospital;
        const chosenFrag = fragPool[Math.floor(Math.random() * fragPool.length)];
        setSelectedFragment(chosenFrag);
        applyTransitionDrain("path_start");
        // Pacing for this leg is the declarative ROUTE.path schedule. Just reset the
        // cursor (aiExchangeCount) and the one-shot memory guard.
        setFragFired(false); setAiExchangeCount(0); setGamePhase("p2_ai");
        localBeat(null, "p2_ai"); // first exploration beat of the path leg
      }
      return;
    }

    if (gamePhaseRef.current === "shelter") {
      // Day 2 resolution — player tapped "·" after "day two ends." Bring on Day 3 morning.
      if (choice === "·") {
        setChoices([]); setIsTyping(false);
        setDayThree(true);
        addMsg("ellie", "still there?", 1400);
        addMsg("ellie", "morning. you made it through the night.", 3000);
        pendingRef.current.push(setTimeout(() => {
          setGamePhase("haven_approach"); setP2BeatIndex(0);
          scheduleMessages(HAVEN_APPROACH_BEATS[0].msgs, HAVEN_APPROACH_BEATS[0].choices, HAVEN_APPROACH_BEATS[0].from || "ellie");
        }, 4800));
        return;
      }
      setChoices([]);
      const keepMoving = choice.includes("Keep moving");

      if (keepMoving && !shelterForcedRef.current) {
        // Punishment — lose HP, forced second shelter
        setResources(p => ({ ...p, hp: Math.max(1, p.hp - 2) }));
        addMsg("system", "pushed too far · [-2 HP]", 300);
        addMsg("narrator", "you keep walking.", 1000);
        addMsg("narrator", "night gets worse.", 2600);
        addMsg("narrator", "something follows.", 4100);
        addMsg("ellie", "stop.", 5600);
        addMsg("ellie", "you have to stop. right now.", 7100);
        shelterForcedRef.current = true;
        pendingRef.current.push(setTimeout(() => {
          addMsg("narrator", "a doorway.", 200);
          addMsg("narrator", "dark inside. but quiet.", 1600);
          pendingRef.current.push(setTimeout(() => setChoices([
            "Go inside. Sleep. [-1 Food] [-1 Water]",
            "Bar the door and sleep. [+1 Noise] [-1 Food] [-1 Water]",
          ]), 3800));
        }, 9000));
        return;
      }

      // Sleep path (Sleep here / Barricade / forced Go inside / forced Bar door)
      const barricade = choice.includes("Barricade") || choice.includes("Bar the door");
      if (barricade) {
        setNoise(n => Math.min(5, n + 1));
        addMsg("system", "entrance barricaded · [+1 Noise]", 300);
      }
      setResources(p => ({ ...p, food: Math.max(0, p.food - 1), water: Math.max(0, p.water - 1) }));
      addMsg("system", "shelter costs · [-1 Food] [-1 Water]", barricade ? 700 : 300);

      // Mid-game weapon upgrade — a fire axe left at the shelter (logical, guaranteed before Haven).
      addMsg("narrator", "a fire axe by the door. left behind.", 1500);
      equipWeapon("axe", 2200);

      // Day 2 resolution — mirror Day 1's "night falls. day one ends.", then wait for the tap.
      // The morning + Haven handoff fires from the "·" guard at the top of this branch.
      addMsg("narrator", "night falls.", 3200);
      addMsg("narrator", "day two ends.", 4400);
      pendingRef.current.push(setTimeout(() => { setIsTyping(false); setChoices(["·"]); }, 5600));
      return;
    }

    if (gamePhaseRef.current === "haven_approach") {
      // No starvation check here: if you've reached Haven's doorstep, the cache (food,
      // water, battery, weapon — moments away in haven_ai) is your relief. Dying of
      // hunger at the gate felt cheap. Starvation/dehydration stays lethal in the
      // crossing (where it's checked) for real neglect; offline still guards the approach.
      if (newBattery <= 0) { pendingRef.current.push(setTimeout(() => setScreen("offline"), 1500)); return; }
      const next = p2BeatIndex + 1;
      setP2BeatIndex(next);
      if (next < HAVEN_APPROACH_BEATS.length) {
        const nx = HAVEN_APPROACH_BEATS[next];
        scheduleMessages(nx.msgs, nx.choices, nx.from || "narrator");
      } else {
        setGamePhase("haven_ai");
        setAiExchangeCount(0);
        const tgt = Math.floor(Math.random() * 2) + 3;
        setAiExchangeTarget(tgt);
        // Haven cache — the relief at the end of the scarcity gauntlet. A stocked
        // compound, looted at logical rooms: ops building (power), pantry (supplies),
        // security (weapon). Replaces the old invisible battery floor. You must SURVIVE
        // to here to get it — neglect kills you in the crossing/approach first.
        addMsg("narrator", "the operations building.", 800);
        addMsg("narrator", "a rack of charged battery packs by the dead terminals.", 1900);
        setResources(p => ({ ...p, battery: Math.min(100, p.battery + HAVEN_BATTERY_CACHE), charger: p.charger === null ? null : Math.min(100, p.charger + 40) }));
        addMsg("system", `battery packs · +${HAVEN_BATTERY_CACHE}% · charger refilled`, 2700); pulseBattery();
        addMsg("narrator", "the pantry off the dining hall. still stocked.", 3900);
        setResources(p => ({ ...p, food: Math.max(p.food, HAVEN_SUPPLY_FLOOR), water: Math.max(p.water, HAVEN_SUPPLY_FLOOR) }));
        addMsg("system", `supplies restocked · food & water to ${HAVEN_SUPPLY_FLOOR}`, 4700);
        addMsg("narrator", "a security office. a weapon locker, forced but not emptied.", 5900);
        equipWeapon("machete", 6700);
        pendingRef.current.push(setTimeout(() => { setIsTyping(true); localBeat(null, "haven_ai"); }, 7900));
      }
      return;
    }

    if (gamePhaseRef.current === "haven_ai") {
      const newCnt = aiCountRef.current + 1;
      setAiExchangeCount(newCnt);
      if (newCnt >= aiTargetRef.current) {
        pendingStoryBeatRef.current = { type: "haven_final" };
      }
      const loot = applyChoiceLoot(choice, newBattery); // Fix #5 — choice-marker loot
      localBeat(loot.newBattery, "haven_ai");
      return;
    }

    if (gamePhaseRef.current === "haven_final") {
      const seq  = havenFinalRef.current;
      const next = havenFinalIndex + 1;
      setHavenFinalIndex(next);
      if (next < seq.length) {
        scheduleMessages(seq[next].msgs, seq[next].choices, "narrator");
      } else {
        // Incoming call
        setChoices([]); setIsTyping(false);
        setSigFlicker(true);
        addMsg("narrator", "the phone vibrates.", 800);
        addMsg("system", "INCOMING CALL  —  ELLIE", 2400);
        addMsg("narrator", "you answer.", 4000);
        pendingRef.current.push(setTimeout(() => { setSigFlicker(false); setIsTyping(true); }, 5400));
        pendingRef.current.push(setTimeout(() => {
          setIsTyping(false);
          setMessages(p => [...p, { id:nextId("e"), from:"ellie", text:"..." }]);
        }, 7000));
        pendingRef.current.push(setTimeout(() => setIsTyping(true), 8200));
        pendingRef.current.push(setTimeout(() => {
          setIsTyping(false);
          setMessages(p => [...p, { id:nextId("e"), from:"ellie", text:"i remember you." }]);
        }, 9800));
        pendingRef.current.push(setTimeout(() => setScreen("phase2_complete"), 12500));
      }
      return;
    }

    if (gamePhaseRef.current === "p2_ai" || gamePhaseRef.current === "p2_ai_cross") {
      const path    = currentPathRef.current;
      const section = gamePhaseRef.current === "p2_ai" ? "path" : "crossing";
      const newCnt  = aiCountRef.current + 1;
      setAiExchangeCount(newCnt);

      // Walk the route map: this choice advances into node[newCnt-1]. Past the leg's
      // end (e.g. a restored save) clamps to the leg-ending node. The node decides
      // whether a story beat / encounter is queued; "explore" = a free atmospheric beat.
      const leg  = ROUTE[section];
      const node = leg[Math.min(newCnt, leg.length) - 1];

      if (node.drain) applyTransitionDrain(node.drain); // mid-leg squeeze

      let pendingBeat = null;
      if (noiseRef.current >= 3 && (node.kind === "explore" || node.kind === "encounter")) {
        // Loud → they found you. Forced fight, no sneak escape (never overrides a
        // memory/discovery/shelter story beat). Noise drops after it (break contact).
        pendingBeat = { type: "encounter", enc: CORNERED_ENCOUNTER };
      } else if (node.kind === "memory" && !fragFiredRef.current) {
        setFragFired(true);
        pendingBeat = { type: "memory" };
      } else if (node.kind === "discovery") {
        pendingBeat = { type: "discovery" };
      } else if (node.kind === "shelter") {
        pendingBeat = { type: "shelter" };
      } else if (node.kind === "encounter") {
        // Guaranteed encounter. node.plan picks the spot: "power" = a battery lifeline
        // (POWER_SOURCES), "search" = a loot/supply spot, "hazard" = a non-search threat.
        const pool = (ENCOUNTERS[section === "path" ? path : "crossing"] || ENCOUNTERS.crossing)
          .filter(e => (e.minNoise || 0) <= noiseRef.current && e.id !== lastEncounterIdRef.current);
        let matching;
        if (node.plan === "power") {
          matching = pool.filter(e => POWER_SOURCES.has(e.id));
        } else {
          const wantSearch = node.plan === "search";
          matching = pool.filter(e => e.choices.some(c => c.action === "SEARCH") === wantSearch);
        }
        const choicesPool = matching.length ? matching : pool;
        const unseen = choicesPool.filter(e => !seenEncountersRef.current.has(e.id)); // P6a
        const finalPool = unseen.length ? unseen : choicesPool;
        if (finalPool.length) {
          const enc = pickRandom(finalPool);
          seenEncountersRef.current.add(enc.id);
          pendingBeat = { type: "encounter", enc };
        }
      }
      // node.kind === "explore" → no story beat; localBeat renders a free atmospheric beat.
      // Noise is a "how loud have you been" meter: only loud actions (search/force/fight)
      // raise it; it doesn't fade per-beat (that cancelled it out before). Recovery comes
      // from breaking contact in a forced fight (resets to 0) and the leg transition (−1),
      // so stealth play stays near 0 while loud play climbs to the forced-fight threshold.

      lastEventWasEncRef.current = false;
      pendingStoryBeatRef.current = pendingBeat;

      // Fix #5 — apply any loot marker before the beat; effBattery folds in the
      // drain plus any [+N Battery] loot.
      const loot = applyChoiceLoot(choice, newBattery);
      const effBattery = loot.newBattery;

      // Priority 1 — starvation/dehydration on the loot-adjusted vitals. If it
      // drops HP to 0, end the run now.
      const survHp = applyStarvation({ food: loot.newFood, water: loot.newWater, hp: loot.newHp });
      if (survHp <= 0) { triggerDeath(loot.newFood <= 0 ? "starvation" : "dehydration"); return; }

      localBeat(effBattery); // gamePhaseRef is correct mid-section, no override needed
      return;
    }

    if (gamePhaseRef.current === "p2_discovery") {
      const path = currentPathRef.current || "hospital"; // H4
      const smsgs = { DISCOVERY_HOSPITAL:"patient file found. the name is yours.", DISCOVERY_METRO:"broadcast log. haven mentioned two weeks pre-signal.", DISCOVERY_ROUTE9:"deployment order found. personnel reassigned to project haven." };
      const discoveryNames = { DISCOVERY_HOSPITAL:"Patient File", DISCOVERY_METRO:"Broadcast Log", DISCOVERY_ROUTE9:"Project Haven" };
      const dName = discoveryNames[DISCOVERY_BEATS[path].onChoice] || "Unknown";
      const isNewClue = !recoveredMemoriesRef.current.some(m => m.name === dName);
      if (isNewClue) {
        setRecoveredMemories(prev => [...prev, { name: dName, type: "discovery" }]);
      }
      const newCount = recoveredMemoriesRef.current.filter(m => m.type === "discovery").length + (isNewClue ? 1 : 0);
      setSigFlicker(true);
      pendingRef.current.push(setTimeout(() => setSigFlicker(false), 900));

      // System message and notification — let these land visually before API call
      addMsg("system", smsgs[DISCOVERY_BEATS[path].onChoice], 600);
      if (isNewClue) {
        pendingRef.current.push(setTimeout(() => {
          setMessages(p => [...p, { id:nextId("disc"), from:"memory_note", name:dName, count:newCount, kind:"discovery" }]);
        }, 1400));
      }

      applyTransitionDrain("crossing_start");
      // Pacing for this leg is the declarative ROUTE.crossing schedule. Reset the cursor.
      setAiExchangeCount(0);
      setGamePhase("p2_ai_cross");
      // Noise carries into the crossing (loudness persists) so an active/searching player
      // builds toward the forced-fight threshold instead of it resetting each leg.

      // Delay until notifications render, then bridge out of the starting leg into
      // the city crossing (no hard cut from "inside the building" to "rows of houses").
      pendingRef.current.push(setTimeout(() => {
        const exitLine = {
          hospital: ["you slip out of mercy general.", "harwick's streets open ahead."],
          metro:    ["you climb back up to the street.", "harwick opens ahead."],
          route9:   ["you leave the highway behind.", "harwick's streets close in."],
        }[path] || ["you move on.", "harwick's streets open ahead."];
        const t = scheduleMessages(exitLine, null, "narrator");
        pendingRef.current.push(setTimeout(() => { setIsTyping(true); localBeat(null, "p2_ai_cross"); }, t + 300));
      }, 2400));
      return;
    }
  };

  // Pure run-state reset — no save/screen side effects (shared by restart + new run).
  const resetRunState = () => {
    clearPending();
    chatStartedRef.current = false;
    lastEventWasEncRef.current = false; lastEncounterIdRef.current = null;
    pendingStoryBeatRef.current = null;
    seenEncountersRef.current = new Set(); havenFinalRef.current = HAVEN_FINAL_SEQUENCE;
    seenBeatsRef.current = new Set(); lastStateLineRef.current = null;
    setMessages([]); setChoices([]); setIsTyping(false); setSigFlicker(false); setBattPulse(false);
    setResources({ battery: 9, water: 0, food: 0, charger: null, hp: 10 });
    setWeapon(null); setNoise(0);
    setExchangePhase(0); setContactName("KIM"); setChosenPath(null);
    setGamePhase("phase1"); setCurrentPath(null); setP2BeatIndex(0);
    setAiExchangeCount(0); setAiExchangeTarget(7); setFragFired(false);
    setCurrentEncounter(null); setSelectedFragment(null); setDayThree(false);
    setHavenFinalIndex(0); shelterForcedRef.current = false;
    // recoveredMemories intentionally NOT reset — persists across runs
    setOfflineLines([]); setCompleteLines([]); setShowRestart(false); setLastMessage("");
    setDeathLines([]); setDeathCause(null);
    setShownLines([]); setShowNotif(false); setMenuOpen(false); setMenuMsg(""); setMenuNote("");
  };

  // audio — wrap a menu-button handler so it plays the distinct menu-tap click.
  const withMenuSound = (fn) => () => { audioEngine.tapMenu(); fn?.(); };

  // audio — small mute toggle glyph (line-through ♪ when muted). Reused on every screen.
  // audio — speaker icon (line style matches the HUD battery glyph). Sound waves
  // when on; a small ✕ where the waves were when muted.
  const speakerIcon = (col) => (
    <svg width="16" height="14" viewBox="0 0 16 14" style={{ display:"block" }}>
      <path d="M2 5 H4.2 L7.8 2 V12 L4.2 9 H2 Z" fill={col} stroke={col} strokeWidth="0.8" strokeLinejoin="round"/>
      {muted ? (
        <g>
          <line x1="10.6" y1="4.6" x2="14.4" y2="9.4" stroke={col} strokeWidth="1.2" strokeLinecap="round"/>
          <line x1="14.4" y1="4.6" x2="10.6" y2="9.4" stroke={col} strokeWidth="1.2" strokeLinecap="round"/>
        </g>
      ) : (
        <g>
          <path d="M10.5 4.8 Q12.2 7 10.5 9.2" fill="none" stroke={col} strokeWidth="1.1" strokeLinecap="round"/>
          <path d="M12 2.8 Q15 7 12 11.2" fill="none" stroke={col} strokeWidth="1.1" strokeLinecap="round"/>
        </g>
      )}
    </svg>
  );

  // audio — compact icon-only mute toggle (used on the title / slot / terminal screens).
  const muteBtn = (extra = {}) => (
    <button onClick={toggleMute} title={muted ? "unmute" : "mute"} aria-label={muted ? "unmute" : "mute"}
      style={{ background:"transparent", border:"1px solid #1c1c1c", display:"inline-flex", alignItems:"center", justifyContent:"center",
        padding:"0.25rem 0.45rem", cursor:"pointer", transition:"border-color 0.15s", ...extra }}>
      {speakerIcon(muted ? "#5a5a5a" : "#4a9e6b")}
    </button>
  );

  // Return to the title (terminal screens already resolved the slot's profile).
  const handleRestart = () => {
    resetRunState();
    setScreen("menu");
  };

  // Start a playthrough in slot i. `fresh` wipes the slot's profile (new/empty slot or a
  // 100% Reset); otherwise the existing profile is preserved (play again / keep collecting).
  const beginRun = async (i, { fresh } = {}) => {
    let profile = emptyProfile();
    if (fresh) {
      try { await window.storage.delete(slotKey(i)); } catch (e) {}
    } else {
      try { const r = await window.storage.get(slotKey(i)); if (r?.value) { const s = normalizeSlot(JSON.parse(r.value)); if (s) profile = s.profile || emptyProfile(); } } catch (e) {}
    }
    resetRunState();
    activeSlotRef.current = i;       // this run auto-saves into slot i
    activeProfileRef.current = profile;
    setRecoveredMemories(memsFromProfile(profile)); // HUD starts from committed progress
    setSlotConfirm(null);
    setScreen("intro");
  };

  // Options → "reset all data": the ONLY full wipe. Clears every slot + legacy globals.
  const handleFullReset = async () => {
    for (let i = 0; i < SLOT_COUNT; i++) { try { await window.storage.delete(slotKey(i)); } catch(e) {} }
    activeSlotRef.current = null; activeProfileRef.current = null; legacyMemoriesRef.current = null;
    try { await window.storage.delete("ds_memories"); } catch(e) {}
    setRecoveredMemories([]);
    resetRunState();
    await refreshSlots();
    setOptConfirm(false);
    setScreen("menu");
  };

  const battColor      = resources.battery <= 20 ? "#8b2020" : "#4a9e6b";
  const battAnim       = resources.battery <= 5 ? "slowflash 1.8s ease infinite" : "none";
  const watColor   = resources.water === 0 ? "#1d3a42" : resources.water <= 1 ? "#8b2020" : "#4ab5c8";
  const fooColor   = resources.food  === 0 ? "#3a2010" : resources.food  <= 1 ? "#8b2020" : "#c87a40";
  const hpColor    = resources.hp <= 3 ? "#8b2020" : resources.hp <= 6 ? "#7a6020" : "#c8a840";
  const noiseColor = noise >= 4 ? "#8b2020" : noise >= 2 ? "#7a6020" : "#3a7a52";
  const injuryLbl  = resources.hp <= 2 ? "critical" : resources.hp <= 4 ? "bleeding" : resources.hp <= 6 ? "bruised" : null;
  const showRow2   = weapon !== null || noise > 0 || resources.charger !== null;
  const fragCount  = recoveredMemories.filter(m => m.type === "fragment").length;
  // "Use charger" is a free action on normal choice screens (not encounters, not
  // continue-only beats) while the reservoir has charge and the phone isn't near full.
  const chargerAmt    = Math.min(CHARGER_TRANSFER, resources.charger || 0, 100 - resources.battery);
  const canUseCharger = chargerAmt > 0 && resources.battery < 90 && gamePhase !== "encounter" && !(choices.length === 1 && choices[0] === "·");
  const clueCount  = recoveredMemories.filter(m => m.type === "discovery").length;
  const signalLevel =
    screen === "phase2_complete" || dayThree ? 5 :
    ["p2_ai_cross","shelter","haven_approach","haven_ai","haven_final"].includes(gamePhase) ? 4 :
    gamePhase === "p2_discovery"    ? 3 :
    ["p2_scripted","p2_ai","p2_memory_frag","encounter"].includes(gamePhase) ? 2 : 1;
  const displayDay =
    screen === "phase2_complete" || dayThree ? 3 :
    (gamePhase.startsWith("p2") || gamePhase === "encounter" || gamePhase === "shelter") ? 2 :
    exchangePhase >= 10 ? 2 : 1;
  const contactStatus = (dayThree || ["p2_ai_cross","shelter"].includes(gamePhase))
    ? "unknown · unstable"
    : "unknown · unverified";
  const font       = "'IBM Plex Mono', 'Courier New', monospace";
  const flashAnim  = "flash 0.9s ease infinite";
  const menuBtn    = { background:"transparent", border:"1px solid #1c1c1c", color:"#c8b98a", padding:"0.55rem 0.9rem", textAlign:"left", cursor:"pointer", fontFamily:"inherit", fontSize:"0.74rem", letterSpacing:"0.06em", transition:"border-color 0.15s, color 0.15s" };
  const hasAnySave = slots.some(Boolean); // P4 — at least one occupied slot

  if (screen === "intro") return (
    <div style={{ background:"#070707", minHeight:"100dvh", fontFamily:font, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"clamp(1.25rem, 5vw, 2.5rem)", userSelect:"none" }}>
      <style>{`${FONT_IMPORT}${KEYFRAMES_FI}@keyframes pu{0%,100%{opacity:1}50%{opacity:.2}}.rb:hover{border-color:#4a9e6b!important;color:#4a9e6b!important}`}</style>
      <div style={{ display:"flex", flexDirection:"column", gap:"0.1rem", textAlign:"center" }}>
        {shownLines.map((l,i) => <p key={i} style={{ color:"#c8b98a", fontSize:"0.9rem", lineHeight:"2.1", letterSpacing:"0.05em", animation:"fi 0.9s ease forwards", margin:0, fontWeight:300 }}>{l}</p>)}
      </div>
      {showNotif && (
        <button onClick={(e)=>{ e.stopPropagation(); if(screenRef.current!=="intro")return; audioEngine.tapResponse(); clearPending(); setScreen("chat"); }}
          style={{ marginTop:"2.8rem", padding:"0.7rem 1.5rem", border:"1px solid #1d3a22", color:"#4a9e6b", fontSize:"0.7rem", letterSpacing:"0.16em", animation:"pu 1.3s ease infinite", background:"transparent", cursor:"pointer", fontFamily:"inherit" }}>
          ▸&nbsp;&nbsp;NEW MESSAGE — KIM
        </button>
      )}
    </div>
  );

  // ─── Main Menu — landing hub (Start / Resume / Story) ──────────────────────────
  if (screen === "menu") return (
    <div style={{ background:"#070707", minHeight:"100dvh", fontFamily:font, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"clamp(1.25rem, 5vw, 2.5rem)", userSelect:"none" }}>
      <style>{`${FONT_IMPORT}${KEYFRAMES_FI}@keyframes sigpulse{0%,100%{opacity:0.78}50%{opacity:1}}.rb:hover{border-color:#4a9e6b!important;color:#4a9e6b!important}`}</style>
      {muteBtn({ position:"fixed", top:"1rem", right:"1rem" })}
      {/* Logo: DEAD (powered-down grey) + SIGNAL (live green glow), one word */}
      <div style={{ fontSize:"2.4rem", fontWeight:700, letterSpacing:"0.12em", marginBottom:"3rem", animation:"fi 1.2s ease forwards" }}>
        <span style={{ color:"#4a4a4a" }}>DEAD</span><span style={{ color:"#4a9e6b", textShadow:"0 0 10px rgba(74,158,107,0.6), 0 0 26px rgba(74,158,107,0.25)", animation:"sigpulse 3s ease infinite" }}>SIGNAL</span>
      </div>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"stretch", gap:"0.7rem", width:"min(260px, 100%)" }}>
        <button className="rb" onClick={withMenuSound(()=>{ setSlotMode("start"); setSlotConfirm(null); setScreen("slots"); })}
          style={{ background:"transparent", border:"1px solid #1d3a22", color:"#4a9e6b", padding:"0.7rem 1rem", fontFamily:"inherit", fontSize:"0.72rem", letterSpacing:"0.16em", textAlign:"center", cursor:"pointer", transition:"all 0.2s" }}>
          ▸&nbsp;&nbsp;START
        </button>
        {hasAnySave && (
          <button className="rb" onClick={withMenuSound(()=>{ setSlotMode("load"); setSlotConfirm(null); setScreen("slots"); })}
            style={{ background:"transparent", border:"1px solid #2a2a2a", color:"#9a9a9a", padding:"0.7rem 1rem", fontFamily:"inherit", fontSize:"0.72rem", letterSpacing:"0.16em", textAlign:"center", cursor:"pointer", transition:"all 0.2s" }}>
            ▸&nbsp;&nbsp;LOAD
          </button>
        )}
        <button className="rb" onClick={withMenuSound(()=>{ setMenuNote("story mode — coming soon"); })}
          style={{ background:"transparent", border:"1px solid #2a2a2a", color:"#6a6a6a", padding:"0.7rem 1rem", fontFamily:"inherit", fontSize:"0.72rem", letterSpacing:"0.16em", textAlign:"center", cursor:"pointer", transition:"all 0.2s" }}>
          ▸&nbsp;&nbsp;STORY
        </button>
        <button className="rb" onClick={withMenuSound(()=>{ setMenuNote(""); setOptConfirm(false); setScreen("options"); })}
          style={{ background:"transparent", border:"1px solid #2a2a2a", color:"#6a6a6a", padding:"0.7rem 1rem", fontFamily:"inherit", fontSize:"0.72rem", letterSpacing:"0.16em", textAlign:"center", cursor:"pointer", transition:"all 0.2s" }}>
          ▸&nbsp;&nbsp;OPTIONS
        </button>
        <div style={{ minHeight:"0.9rem", textAlign:"center", color:"#505050", fontSize:"0.58rem", letterSpacing:"0.14em", marginTop:"0.3rem" }}>{menuNote}</div>
      </div>
    </div>
  );

  // ─── Options — settings hub. Today: the only full "reset all data" lives here. ──────
  if (screen === "options") return (
    <div style={{ background:"#070707", minHeight:"100dvh", fontFamily:font, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"clamp(1.25rem, 5vw, 2.5rem)", userSelect:"none" }}>
      <style>{`${FONT_IMPORT}${KEYFRAMES_FI}.rb:hover{border-color:#4a9e6b!important;color:#4a9e6b!important}.dz:hover{border-color:#7a2424!important;color:#ff8a8a!important}`}</style>
      {muteBtn({ position:"fixed", top:"1rem", right:"1rem" })}
      <div style={{ fontSize:"0.78rem", fontWeight:600, letterSpacing:"0.26em", marginBottom:"2rem", color:"#6a6a6a", animation:"fi 0.8s ease forwards" }}>OPTIONS</div>
      <div style={{ display:"flex", flexDirection:"column", gap:"0.7rem", width:"min(300px, 100%)" }}>
        <div style={{ border:"1px solid #3a1414", padding:"0.9rem 0.85rem", display:"flex", flexDirection:"column", gap:"0.55rem", animation:"fi 0.8s ease forwards" }}>
          <span style={{ color:"#8b3030", fontSize:"0.58rem", letterSpacing:"0.18em" }}>DANGER ZONE</span>
          <span style={{ color:"#7a6a6a", fontSize:"0.6rem", letterSpacing:"0.04em", lineHeight:1.6 }}>Erases all three save slots and every collected fragment and clue. This cannot be undone.</span>
          <button className="dz" onClick={withMenuSound(()=>{ if (optConfirm) handleFullReset(); else setOptConfirm(true); })}
            style={{ background:"transparent", border:`1px solid ${optConfirm ? "#7a2424" : "#5a2020"}`, color: optConfirm ? "#ff8a8a" : "#c85050", padding:"0.6rem", fontFamily:"inherit", fontSize:"0.66rem", letterSpacing:"0.12em", cursor:"pointer", transition:"all 0.2s" }}>
            {optConfirm ? "⚠ TAP AGAIN — ERASE EVERYTHING" : "RESET ALL DATA"}
          </button>
        </div>
        <button className="rb" onClick={withMenuSound(()=>{ setOptConfirm(false); setScreen("menu"); })}
          style={{ marginTop:"0.6rem", background:"transparent", border:"1px solid #2a2a2a", color:"#6a6a6a", padding:"0.55rem", fontFamily:"inherit", fontSize:"0.66rem", letterSpacing:"0.16em", textAlign:"center", cursor:"pointer", transition:"all 0.2s" }}>
          ◂ BACK
        </button>
      </div>
    </div>
  );

  // ─── Slot screen — 3 save profiles. Each tracks playthroughs + fragments/clues.
  if (screen === "slots") return (
    <div style={{ background:"#070707", minHeight:"100dvh", fontFamily:font, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"clamp(1.25rem, 5vw, 2.5rem)", userSelect:"none" }}>
      <style>{`${FONT_IMPORT}${KEYFRAMES_FI}.rb:hover{border-color:#4a9e6b!important;color:#4a9e6b!important}.del:hover{border-color:#5a2020!important;color:#e08a8a!important}`}</style>
      {muteBtn({ position:"fixed", top:"1rem", right:"1rem" })}
      <div style={{ fontSize:"0.78rem", fontWeight:600, letterSpacing:"0.26em", marginBottom:"2rem", color:"#6a6a6a", animation:"fi 0.8s ease forwards" }}>
        {slotMode === "load" ? "LOAD GAME" : "NEW RUN — SELECT SLOT"}
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:"0.7rem", width:"min(340px, 100%)" }}>
        {slots.map((m, i) => {
          const occupied   = !!m;
          const complete   = occupied && m.complete;
          const inProgress = occupied && m.hasRun && !complete;
          const between    = occupied && !m.hasRun && !complete; // finished ≥1 run, not 100%
          const delPending = slotConfirm && slotConfirm.index === i && slotConfirm.action === "delete";
          const resPending = slotConfirm && slotConfirm.index === i && slotConfirm.action === "reset";
          const progress = occupied && (
            <div style={{ display:"flex", gap:"1rem", fontSize:"0.58rem", letterSpacing:"0.06em", color:"#6a6a6a" }}>
              <span>▷ {m.playthroughs} {m.playthroughs === 1 ? "run" : "runs"}</span>
              <span style={{ color: m.frags > 0 ? "#4a9e6b" : "#3a5a44" }}>◈ {m.frags}/9</span>
              <span style={{ color: m.clues > 0 ? "#4ab5c8" : "#2d4a52" }}>◉ {m.clues}/3</span>
            </div>
          );
          // DELETE is available on any occupied slot (two-tap), wiping the run + profile.
          const delBtn = (
            <button className="del" onClick={withMenuSound(()=>{ if (delPending) deleteSlot(i); else setSlotConfirm({ index:i, action:"delete" }); })}
              style={{ background:"transparent", border:`1px solid ${delPending ? "#5a2020" : "#2a2a2a"}`, color: delPending ? "#e08a8a" : "#7a5a5a", padding:"0.45rem 0.7rem", fontFamily:"inherit", fontSize:"0.62rem", letterSpacing:"0.1em", cursor:"pointer", transition:"all 0.2s" }}>
              {delPending ? "DELETE?" : "DELETE"}
            </button>
          );
          return (
            <div key={i} style={{ border:`1px solid ${complete ? "#2a4a32" : "#1c1c1c"}`, padding:"0.7rem 0.85rem", display:"flex", flexDirection:"column", gap:"0.5rem", animation:"fi 0.8s ease forwards" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline" }}>
                <span style={{ color:"#7a7a7a", fontSize:"0.6rem", letterSpacing:"0.18em" }}>SLOT {i + 1}</span>
                {complete
                  ? <span style={{ color:"#4a9e6b", fontSize:"0.6rem", letterSpacing:"0.14em", textShadow:"0 0 8px rgba(74,158,107,0.45)" }}>100% COMPLETE</span>
                  : inProgress && <span style={{ color:"#c8b98a", fontSize:"0.62rem", letterSpacing:"0.07em" }}>DAY {m.day} · {m.location}</span>}
              </div>
              {occupied && progress}
              {complete ? (
                <>
                  <span style={{ color:"#3a6a48", fontSize:"0.56rem", letterSpacing:"0.06em" }}>everything recovered · locked</span>
                  <div style={{ display:"flex", gap:"0.5rem" }}>
                    <button className="rb" onClick={withMenuSound(()=>{ if (resPending) { clearPending(); beginRun(i, { fresh:true }); } else setSlotConfirm({ index:i, action:"reset" }); })}
                      style={{ flex:1, background:"transparent", border:`1px solid ${resPending ? "#5a4a20" : "#2a2a2a"}`, color: resPending ? "#c8a840" : "#7a7050", padding:"0.45rem", fontFamily:"inherit", fontSize:"0.62rem", letterSpacing:"0.1em", cursor:"pointer", transition:"all 0.2s" }}>
                      {resPending ? "RESET?" : "RESET"}
                    </button>
                    {delBtn}
                  </div>
                </>
              ) : inProgress ? (
                <>
                  <div style={{ display:"flex", gap:"1.2rem", fontSize:"0.6rem", letterSpacing:"0.06em", color:"#6a6a6a" }}>
                    <span>HP {m.hp}/10</span><span>BATT {m.battery}</span>
                  </div>
                  <div style={{ display:"flex", gap:"0.5rem" }}>
                    <button className="rb" onClick={withMenuSound(()=>{ clearPending(); resumeSlot(i); })}
                      style={{ flex:1, background:"transparent", border:"1px solid #1d3a22", color:"#4a9e6b", padding:"0.45rem", fontFamily:"inherit", fontSize:"0.64rem", letterSpacing:"0.12em", cursor:"pointer", transition:"all 0.2s" }}>
                      ▸ CONTINUE
                    </button>
                    {delBtn}
                  </div>
                </>
              ) : between ? (
                <div style={{ display:"flex", gap:"0.5rem" }}>
                  <button className="rb" onClick={withMenuSound(()=>{ clearPending(); beginRun(i, { fresh:false }); })}
                    style={{ flex:1, background:"transparent", border:"1px solid #1d3a22", color:"#4a9e6b", padding:"0.45rem", fontFamily:"inherit", fontSize:"0.64rem", letterSpacing:"0.12em", cursor:"pointer", transition:"all 0.2s" }}>
                    ▸ PLAY AGAIN
                  </button>
                  {delBtn}
                </div>
              ) : (
                slotMode === "start" ? (
                  <button className="rb" onClick={withMenuSound(()=>{ beginRun(i, { fresh:true }); })}
                    style={{ background:"transparent", border:"1px solid #1d3a22", color:"#4a9e6b", padding:"0.45rem", fontFamily:"inherit", fontSize:"0.64rem", letterSpacing:"0.12em", cursor:"pointer", transition:"all 0.2s" }}>
                    ▸ NEW RUN
                  </button>
                ) : (
                  <div style={{ color:"#3a3a3a", fontSize:"0.62rem", letterSpacing:"0.12em", padding:"0.4rem 0" }}>— EMPTY —</div>
                )
              )}
            </div>
          );
        })}
        <button className="rb" onClick={withMenuSound(()=>{ setSlotConfirm(null); setScreen("menu"); })}
          style={{ marginTop:"0.6rem", background:"transparent", border:"1px solid #2a2a2a", color:"#6a6a6a", padding:"0.55rem", fontFamily:"inherit", fontSize:"0.66rem", letterSpacing:"0.16em", textAlign:"center", cursor:"pointer", transition:"all 0.2s" }}>
          ◂ BACK
        </button>
      </div>
    </div>
  );

  if (screen === "offline" || screen === "phase2_complete" || screen === "dead") {
    const lines  = screen === "offline" ? offlineLines : screen === "dead" ? deathLines : completeLines;
    const colors = screen === "offline"
      ? (i) => i === 0 ? "#2a2a2a" : "#8b2020"
      : screen === "dead"
      ? (i) => i === 0 ? "#a83232" : "#7a1f1f"
      : () => "#c8b98a";
    return (
      <div style={{ background:"#070707", minHeight:"100dvh", fontFamily:font, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"clamp(1.25rem, 5vw, 2.5rem)", userSelect:"none" }}>
        <style>{`${FONT_IMPORT}${KEYFRAMES_FI}.rb:hover{border-color:#4a9e6b!important;color:#4a9e6b!important}`}</style>
        {muteBtn({ position:"fixed", top:"1rem", right:"1rem" })}
        <div style={{ display:"flex", flexDirection:"column", gap:"0.1rem", textAlign:"center" }}>
          {lines.map((l,i) => <p key={i} style={{ color:colors(i), fontSize:"0.9rem", lineHeight:"2.2", letterSpacing:"0.06em", animation:"fi 1s ease forwards", margin:0, fontWeight:300 }}>{l}</p>)}
          {screen === "phase2_complete" && showRestart && (
            <p style={{ color:"#505050", fontSize:"0.72rem", marginTop:"1.5rem", letterSpacing:"0.14em", animation:"fi 1s ease forwards" }}>— to be continued —</p>
          )}
          {screen === "phase2_complete" && showRestart && winProfile && (
            <p style={{ marginTop:"1rem", fontSize:"0.66rem", letterSpacing:"0.1em", animation:"fi 1s ease forwards", color:"#6a6a6a" }}>
              playthrough {winProfile.playthroughs} · <span style={{ color: winProfile.frags > 0 ? "#4a9e6b" : "#3a5a44" }}>◈ {winProfile.frags}/9</span> · <span style={{ color: winProfile.clues > 0 ? "#4ab5c8" : "#2d4a52" }}>◉ {winProfile.clues}/3</span>
              {winProfile.complete && <><br/><span style={{ color:"#4a9e6b", letterSpacing:"0.16em", textShadow:"0 0 8px rgba(74,158,107,0.45)" }}>— 100% · everything recovered —</span></>}
            </p>
          )}
          {screen === "offline" && lastMessage && lines.length >= 3 && (
            <p style={{ color:"#1a1a1a", fontSize:"0.68rem", marginTop:"1.5rem", letterSpacing:"0.06em", fontWeight:300 }}>last sent: "{lastMessage}"</p>
          )}
        </div>
        {showRestart && (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"0.7rem", marginTop:"3rem" }}>
            {/* Win: the slot is saved with updated progress. Play again (keeps the profile,
                unless 100% — then it's locked and you return to title to Reset from the slot). */}
            {screen === "phase2_complete" && !(winProfile && winProfile.complete) && (
              <button className="rb" onClick={withMenuSound(()=>{ const i = activeSlotRef.current; if (i != null) beginRun(i, { fresh:false }); else handleRestart(); })} style={{ background:"transparent", border:"1px solid #3a3a3a", color:"#606060", padding:"0.65rem 1.5rem", fontFamily:"inherit", fontSize:"0.72rem", letterSpacing:"0.12em", cursor:"pointer", transition:"all 0.2s" }}>▸&nbsp;&nbsp;play again</button>
            )}
            <button className="rb" onClick={withMenuSound(handleRestart)} style={{ background:"transparent", border:"1px solid #2a2a2a", color:"#505050", padding:"0.55rem 1.5rem", fontFamily:"inherit", fontSize:"0.68rem", letterSpacing:"0.12em", cursor:"pointer", transition:"all 0.2s" }}>▸&nbsp;&nbsp;return to title</button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ background:"#070707", height:"100dvh", fontFamily:font, color:"#d8c79b", display:"flex", flexDirection:"column", maxWidth:"620px", margin:"0 auto", overflow:"hidden" }}>
      <style>{`${FONT_IMPORT}${KEYFRAMES_FI}${RESPONSIVE_CSS}@keyframes pu{0%,100%{opacity:1}50%{opacity:.3}}@keyframes flash{0%,100%{opacity:1}50%{opacity:.2}}@keyframes slowflash{0%,100%{opacity:1}50%{opacity:.08}}@keyframes sigflicker{0%,100%{opacity:1}40%{opacity:.05}65%{opacity:.7}}@keyframes sigpulse{0%,100%{opacity:0.75}50%{opacity:1}}@keyframes battpop{0%{transform:scale(1)}30%{transform:scale(1.28)}100%{transform:scale(1)}}.cb:hover{border-color:#4a9e6b!important;color:#4a9e6b!important}::-webkit-scrollbar{width:2px}::-webkit-scrollbar-track{background:#070707}::-webkit-scrollbar-thumb{background:#242424}`}</style>
      <AudioDebug />

      {/* Top utility bar: DEAD SIGNAL far left · menu button centered · fragments/battery right */}
      <div style={{ display:"flex", flexWrap:"nowrap", justifyContent:"space-between", alignItems:"center", gap:"0.5rem", padding:"calc(0.4rem + env(safe-area-inset-top)) 1rem 0.25rem", flexShrink:0 }}>
        <div style={{ flex:1, minWidth:0, display:"flex", alignItems:"center", gap:"0.45rem" }}>
          <span style={{ color:"#4a9e6b", fontSize:"0.72rem", fontWeight:700, letterSpacing:"0.2em", whiteSpace:"nowrap", textShadow:"0 0 9px rgba(74,158,107,0.65), 0 0 22px rgba(74,158,107,0.3)" }}>DEAD&nbsp;SIGNAL</span>
          <SignalBars level={signalLevel} flicker={sigFlicker || noise >= 4} />
        </div>
        <button className="cb" onClick={withMenuSound(()=>{ setMenuMsg(""); setConfirmReset(false); setMenuOpen(true); })} title="menu" aria-label="menu"
          style={{ flexShrink:0, background:"transparent", border:"1px solid #1c1c1c", color:"#6a6a6a", fontFamily:"inherit", fontSize:"0.7rem", lineHeight:1, padding:"0.2rem 0.55rem", cursor:"pointer", transition:"border-color 0.15s, color 0.15s" }}>☰</button>
        <div style={{ flex:1, minWidth:0, display:"flex", alignItems:"center", justifyContent:"flex-end", gap:"0.55rem", whiteSpace:"nowrap" }}>
          <span style={{ color:"#2a7a4a", fontSize:"0.58rem", letterSpacing:"0.07em" }}>
            ◈<span className="statlabel">&nbsp;FRAGMENTS</span> <span style={{ color: fragCount > 0 ? "#4a9e6b" : "#1e4a2e", textShadow: fragCount > 0 ? "0 0 6px rgba(74,158,107,0.5)" : "none" }}>{fragCount}/9</span>
          </span>
          <span style={{ color:"#2a6070", fontSize:"0.58rem", letterSpacing:"0.07em" }}>
            ◉<span className="statlabel">&nbsp;CLUES</span> <span style={{ color: clueCount > 0 ? "#4ab5c8" : "#1d3a42", textShadow: clueCount > 0 ? "0 0 6px rgba(74,181,200,0.5)" : "none" }}>{clueCount}/3</span>
          </span>
          <span style={{ display:"inline-flex", alignItems:"center", gap:"0.18rem", animation: battPulse ? "battpop 0.6s ease" : battAnim }}>
            <svg width="18" height="9" viewBox="0 0 18 9" style={{ display:"block", filter: battPulse ? "drop-shadow(0 0 5px rgba(74,158,107,0.9))" : resources.battery <= 10 ? "drop-shadow(0 0 3px rgba(180,40,40,0.6))" : "none" }}>
              <rect x="0.5" y="0.5" width="14" height="8" rx="1.5" fill="none" stroke={battPulse ? "#7fffa0" : battColor} strokeWidth="1"/>
              <rect x="14.5" y="2" width="2.5" height="5" rx="0.5" fill={battPulse ? "#7fffa0" : battColor}/>
              <rect x="1.5" y="1.5" width={Math.max(0,Math.round((resources.battery/100)*12))} height="5" rx="0.5" fill={battPulse ? "#7fffa0" : battColor}/>
            </svg>
            <span style={{ color: battPulse ? "#7fffa0" : battColor, fontSize:"0.58rem", textShadow: battPulse ? "0 0 8px rgba(74,158,107,0.8)" : resources.battery <= 10 ? "0 0 6px rgba(180,40,40,0.5)" : "none" }}>{resources.battery}%</span>
          </span>
        </div>
      </div>

      {/* Contact header: iPhone-style, centered */}
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"0.4rem 1rem 0.5rem", borderBottom:"1px solid #111", flexShrink:0 }}>
        <div style={{ width:26, height:26, borderRadius:"50%", border:`1px solid ${contactName==="ELLIE"?"#2f8a58":"#2f8a58"}`, display:"flex", alignItems:"center", justifyContent:"center", background:"#0a0f0a", color:contactName==="ELLIE"?"#2a6a40":"#1e4a2a", fontSize:"0.78rem", marginBottom:"0.2rem", transition:"border-color 0.8s, color 0.8s", boxShadow:contactName==="ELLIE"?"0 0 9px rgba(74,158,107,0.25)":"0 0 6px rgba(47,138,88,0.18)" }}>◉</div>
        <span style={{ color:"#c8b896", fontSize:"0.7rem", letterSpacing:"0.16em", transition:"color 0.8s, text-shadow 0.8s", textShadow:contactName==="ELLIE"?"0 0 8px rgba(200,185,138,0.28)":"none" }}>{contactName}</span>
        <span style={{ color:"#6a6a6a", fontSize:"0.56rem", letterSpacing:"0.07em", marginTop:"0.1rem" }}>{contactStatus}</span>
      </div>

      {/* Resource bar — row 1: vitals */}
      <div style={{ display:"flex", gap:"1rem", padding:"0.38rem 1rem", alignItems:"center", flexWrap:"wrap", borderBottom: showRow2 ? "none" : "1px solid #111", fontSize:"0.66rem", letterSpacing:"0.09em", flexShrink:0 }}>
        <span style={{ color:"#4a9e6b" }}>DAY {displayDay}</span>
        <span style={{ color:hpColor, animation:resources.hp<=2?flashAnim:"none" }}>HP {resources.hp}/10{injuryLbl ? ` · ${injuryLbl}` : ""}</span>
        <span style={{ color:watColor }}>WATER {resources.water}</span>
        <span style={{ color:fooColor }}>FOOD {resources.food}</span>
      </div>

      {/* Resource bar — row 2: equipment/status (conditional) */}
      {showRow2 && (
        <div style={{ display:"flex", gap:"1rem", padding:"0.25rem 1rem", borderBottom:"1px solid #111", fontSize:"0.64rem", letterSpacing:"0.09em", flexShrink:0 }}>
          {weapon && <span style={{ color:"#8a7a58" }}>{weapon.shortName} ·{weapon.damage}dmg</span>}
          {noise > 0 && <span style={{ color:noiseColor, animation:noise>=4?flashAnim:"none" }}>noise {noise}/5</span>}
          {resources.charger !== null && <span style={{ color:resources.charger>0?"#3a6b40":"#484848" }}>charger {resources.charger>0?`${resources.charger}%`:"needs power"}</span>}
        </div>
      )}

      {/* Messages */}
      <div style={{ flex:1, overflowY:"auto", padding:"0.6rem 0.9rem", display:"flex", flexDirection:"column", gap:"0.4rem", minHeight:0 }}>
        {messages.map(m => <MessageRow key={m.id} m={m} />)}
        {isTyping && <div style={{ alignSelf:"flex-start", padding:"0.55rem 0.9rem", background:"#0d0d0d", border:"1px solid #222", color:"#333", fontSize:"clamp(0.85rem, 3.6vw, 0.92rem)", animation:"pu 1.1s ease infinite" }}>· · ·</div>}
        <div ref={bottomRef} />
      </div>

      {resources.battery<=10 && resources.battery>0 && <div style={{ padding:"0.4rem 1rem", background:"#0e0404", borderTop:"1px solid #2a0a0a", fontSize:"0.65rem", letterSpacing:"0.1em", color:"#8b2020", animation:battAnim }}>▸ battery critical — {resources.charger===null ? "find a charger" : "find power"}</div>}

      {choices.length>0 && !isTyping && (
        <div style={{ padding:"0.6rem 1rem calc(1rem + env(safe-area-inset-bottom))", borderTop:"1px solid #111", display:"flex", flexDirection:"column", gap:"0.5rem", flexShrink:0 }}>
          {canUseCharger && (
            <button className="cb" onClick={useCharger}
              style={{ background:"transparent", border:"1px solid #244a2c", color:"#3a6b40", padding:"clamp(0.5rem, 2vw, 0.65rem) 0.9rem", textAlign:"left", cursor:"pointer", fontFamily:"inherit", fontSize:"clamp(0.72rem, 3vw, 0.78rem)", fontWeight:300, letterSpacing:"0.04em", transition:"border-color 0.15s, color 0.15s" }}>
              ⌁&nbsp;&nbsp;Use the charger [+{chargerAmt}% Battery]
            </button>
          )}
          {choices.map((c,i) =>
            c==="·"
              ? <button key={i} className="cb" onClick={()=>handleChoice(c)} style={{ background:"transparent", border:"none", color:"#252525", padding:"0.85rem", textAlign:"center", cursor:"pointer", fontFamily:"inherit", fontSize:"1.5rem", letterSpacing:"0.4em", width:"100%", transition:"color 0.15s" }}>· · ·</button>
              : <button key={i} className="cb" onClick={()=>handleChoice(c)} style={{ background:"transparent", border:"1px solid #1c1c1c", color:"#c8b98a", padding:"clamp(0.6rem, 2.4vw, 0.75rem) 0.9rem", textAlign:"left", cursor:"pointer", fontFamily:"inherit", fontSize:"clamp(0.8rem, 3.4vw, 0.85rem)", fontWeight:300, letterSpacing:"0.04em", lineHeight:"1.5", transition:"border-color 0.15s, color 0.15s" }}>
                  {i+1}.&nbsp;&nbsp;{parseText(c,"button")}
                </button>
          )}
        </div>
      )}

      {/* Pause menu — save / load / exit / restart. Sits above the chat as an overlay. */}
      {menuOpen && (
        <div onClick={()=>{ setMenuOpen(false); setConfirmReset(false); }}
          style={{ position:"fixed", inset:0, background:"rgba(3,5,3,0.82)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:50, fontFamily:font }}>
          <div onClick={e=>e.stopPropagation()}
            style={{ background:"#080a08", border:"1px solid #1d3a22", padding:"1.4rem 1.3rem", width:"260px", display:"flex", flexDirection:"column", gap:"0.55rem", boxShadow:"0 0 40px rgba(0,0,0,0.8)" }}>
            <div style={{ color:"#4a9e6b", fontSize:"0.66rem", letterSpacing:"0.24em", textAlign:"center", marginBottom:"0.5rem", textShadow:"0 0 8px rgba(74,158,107,0.4)" }}>— PAUSED —</div>
            <button className="cb" onClick={withMenuSound(()=>{ setMenuOpen(false); setConfirmReset(false); })} style={menuBtn}>Resume</button>
            <button className="cb" onClick={withMenuSound(toggleMute)} style={{ ...menuBtn, display:"flex", alignItems:"center", gap:"0.55rem" }}>
              {speakerIcon(muted ? "#5a5a5a" : "#4a9e6b")}<span>Sound · {muted ? "off" : "on"}</span>
            </button>
            <button className="cb" onClick={withMenuSound(menuSave)} style={menuBtn}>Save game</button>
            {slots[activeSlotRef.current] && <button className="cb" onClick={withMenuSound(menuLoad)} style={menuBtn}>Load last save</button>}
            <button className="cb" onClick={withMenuSound(menuSaveExit)} style={menuBtn}>Save &amp; exit to title</button>
            {/* Reset THIS run — two-tap confirm. Wipes only the active slot (run + its
                fragments/clues); other slots are untouched. Full wipe lives in Options. */}
            <button onClick={withMenuSound(async ()=>{ if (confirmReset) { const i = activeSlotRef.current; if (i != null) await deleteSlot(i); resetRunState(); setMenuOpen(false); setConfirmReset(false); setMenuMsg(""); setScreen("menu"); } else { setConfirmReset(true); setMenuMsg("tap again — wipes this run's save & memories"); } })}
              style={{ ...menuBtn, color: confirmReset ? "#e08a8a" : "#a87a7a", border:`1px solid ${confirmReset ? "#5a2020" : "#3a2020"}` }}>
              {confirmReset ? "Confirm — reset this run?" : "Reset this run"}
            </button>
            <div style={{ minHeight:"0.9rem", textAlign:"center", color:"#4a9e6b", fontSize:"0.58rem", letterSpacing:"0.12em", marginTop:"0.2rem" }}>{menuMsg}</div>
          </div>
        </div>
      )}
    </div>
  );
}
