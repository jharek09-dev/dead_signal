import { useState, useEffect, useRef, memo } from "react";
import audioEngine from "./audio.js";

const INTRO_LINES = [
  { text: "Day 1.", delay: 0 },
  { text: "Your eyes open.", delay: 1500 },
  { text: "The room is dark.", delay: 2900 },
  { text: "You don't know this ceiling.", delay: 4600 },
  { text: "You don't remember coming here.", delay: 6200 },
  { text: "You don't remember much at all.", delay: 7800 },
  { text: "Your phone is on the floor beside you.", delay: 9800 },
  { text: "9% battery.  One bar.", delay: 11200 },
  { text: "It's been buzzing.", delay: 12700 },
];
const NOTIF_DELAY = 14000;

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

// ─── HAVEN PHASE 2C ───────────────────────────────────────────────────────────

const HAVEN_APPROACH_BEATS = [
  { from:"ellie",
    msgs:["morning.", "signal's stronger now.", "you're close."],
    choices:["How close?", "I can feel it."] },
  { from:"narrator",
    msgs:["day three.", "the city thins out.", "buildings give way to service roads and dead grass."],
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

const buildHavenSystem = (path, resources, weapon, noise = 0) => {
  const weaponStr = weapon ? `${weapon.shortName} (${weapon.damage} damage)` : "unarmed";
  const pathNote  = {
    hospital: "The player came through Mercy General Hospital. They found medical records with their own name.",
    metro:    "The player came through the metro tunnels. They found broadcast logs proving Haven was planned before the outbreak.",
    route9:   "The player came through Route 9. They found military deployment orders redirecting personnel to Haven.",
  }[path] || "";
  return `You are Ellie, texting the player who just entered Haven, a fenced compound that was home to 143 people until very recently.

HAVEN STATE: completely empty. No violence. No bodies. No blood. No struggle. Power running. Floodlights on. Generators humming. Food on tables. Beds slept in. Coffee gone cold. Organized, deliberate departure. Nobody knows why.

PLAYER: Battery ${resources.battery}%. HP ${resources.hp}/10. Weapon: ${weaponStr}. ${pathNote}

YOUR STATE: For the first time, you are becoming emotional. Small cracks only. Not dramatic. Say things like "i missed this place." or "they kept it running." Things that suggest you know Haven personally. Do not explain. Do not clarify. Just let the cracks show.

Guide the player through Haven's areas: sleeping quarters, medical station, operations center. Each area is perfect, recent, and wrong in the same way: everything maintained, nothing disturbed, nobody home.

RESOURCES: You never decide resource amounts. If the player takes supplies, mark that choice with [+N Food] or [+N Water] (example: "take the water [+2 Water]"); the game applies it. If the player's message contains a RESOURCE UPDATE, state those exact numbers. Otherwise never mention specific food, water, battery, or HP counts.

No em dashes. Lowercase. Short texts. 1-2 sentences max. 20 words max.

ALWAYS respond with valid JSON only:
{ "messages": ["msg1", "msg2"], "choices": ["choice 1", "choice 2"] }
2-3 messages. 2-3 choices under 8 words.`;
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
      choices:[{text:"Check it out. [risk]",action:"SEARCH"},{text:"Slip past without looking.",action:"SNEAK"},{text:"Hold still.",action:"WAIT"}] },
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
      choices:[{text:"Move carefully.",action:"SNEAK"},{text:"Don't go in. Go around.",action:"AVOID"},{text:"Search the corridor. [risk]",action:"SEARCH"}] },
    { id:"turnstile_blockage", msgs:["turnstiles blocked.","something piled against them."],
      choices:[{text:"Climb over quietly.",action:"SNEAK"},{text:"Force through. Loud.",action:"FORCE"},{text:"Wait and listen.",action:"WAIT"}] },
  ],
  route9: [
    { id:"car_alarm",    msgs:["you brush a car.","it starts beeping."],
      choices:[{text:"Run.",action:"RUN"},{text:"Find the source. Silence it.",action:"SNEAK"},{text:"Freeze. Wait it out.",action:"WAIT"}] },
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
      choices:[{text:"Wait for it to move.",action:"WAIT"},{text:"Slip past quietly.",action:"SNEAK"},{text:"Push through. [risk]",action:"FORCE"}] },
    { id:"apartment_fire",   msgs:["smoke from an apartment window.","could cover your movement. or draw more."],
      choices:[{text:"Use the smoke. Move fast.",action:"SNEAK"},{text:"Go around.",action:"AVOID"},{text:"Stop and watch first.",action:"WAIT"}] },
    { id:"rooftop",          msgs:["a silhouette on a rooftop.","still. watching."],
      choices:[{text:"Ignore it. Keep moving.",action:"AVOID"},{text:"Duck and wait.",action:"WAIT"},{text:"Wave. Identify yourself. [risk]",action:"FORCE"}] },
    { id:"floor_above",      msgs:["movement on the floor above.","heavy. slow."],
      choices:[{text:"Move quickly and quietly.",action:"SNEAK"},{text:"Stay still and wait.",action:"WAIT"},{text:"Check it out. [risk]",action:"SEARCH"}] },
    { id:"noise_drawn", minNoise:2, msgs:["your noise drew something.","it's close."],
      choices:[{text:"Run.",action:"RUN"},{text:"Hide. Go quiet.",action:"WAIT"},{text:"Stand your ground.",action:"FORCE"}] },
    { id:"house_generator",  msgs:["a house with a generator running.","light in the windows."],
      choices:[{text:"Search it carefully. [risk]",action:"SEARCH"},{text:"Keep moving.",action:"AVOID"},{text:"Watch from outside first.",action:"WAIT"}] },
    { id:"crashed_bus",      msgs:["bus crashed into a storefront.","might be supplies inside."],
      choices:[{text:"Search the bus. [risk]",action:"SEARCH"},{text:"Go around.",action:"AVOID"},{text:"Check from the outside.",action:"WAIT"}] },
    { id:"emergency_shelter",msgs:["emergency shelter sign.","door still open."],
      choices:[{text:"Go in. [risk]",action:"SEARCH"},{text:"Keep moving.",action:"AVOID"},{text:"Listen at the door first.",action:"WAIT"}] },
  ],
};

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
  avoid:         ["probably smart.", "keep moving."],
};

const NARRATOR_ATMOSPHERE = {
  sneak_fail:    "it heard you.",
  search_fail:   "something stirs.",
  run_fail:      "you made it. barely.",
  force:         "noise. but you're through.",
  sneak_success: "the noise fades. nothing follows.",
  wait:          "it passes.",
  observe:       "you take it in.",
};

const PHASE1_SYSTEM = `You are Ellie, a survivor texting a stranger in Harwick whose number you found in a dead woman's phone.

WORLD: Three days ago an outbreak tore through Harwick. Power is mostly gone. You are somewhere on the east side of the city, near the old bridge. Yesterday you picked up a shortwave radio signal: GPS coordinates, broadcasting on a loop, claiming there's a safe location.

You found a phone in your building stairwell. Don't know whose. Texted the last number. The player answered. They have no memory of how they got here or what happened. They found a city map, discovered they're in Harwick. They're now moving through the city toward the signal.

YOUR VOICE: Short texts. 1-2 sentences, 20 words max. Practical. Fear in what you don't say. Dry humor when bad. Lowercase, contractions. You are alone. Never use em dashes. Periods and commas only.

BATTERY: 5-6%: mention finding power. 2-3%: urgent. 1%: say what matters.

ALWAYS respond with valid JSON only:
{ "messages": ["msg1", "msg2"], "choices": ["choice 1", "choice 2"] }
2-3 messages under 20 words. 2-3 choices under 8 words.`;

const buildP2System = (path, section, resources, weapon, noise = 0) => {
  const weaponStr  = weapon ? `${weapon.shortName} (${weapon.damage} damage)` : "unarmed";
  const noiseStr   = noise >= 4 ? "VERY HIGH. infected are close." : noise >= 2 ? "elevated" : "low";
  const injuryStr  = resources.hp <= 2 ? "CRITICALLY INJURED" : resources.hp <= 4 ? "bleeding badly" : resources.hp <= 6 ? "bruised" : "okay";
  const hungerNote = resources.food <= 1 ? " LOW FOOD. Mention finding food." : resources.water <= 1 ? " LOW WATER. Mention finding water." : "";
  const pathDesc   = {
    hospital: `Player is INSIDE Mercy General Hospital: long dark corridors, wards, stairwells, emergency lighting, generators humming deep inside. Something about this building feels familiar but they don't know why. Keep it tense. GEOGRAPHY: they stay inside the building this whole phase. Never mention the metro, subway, the highway, vehicles on a road, or the outdoors.`,
    metro:    `Player is in the Harwick Metro tunnels, underground: platform, tracks, service corridors, emergency lighting only, sounds carry strangely. Keep it claustrophobic. GEOGRAPHY: they stay underground this whole phase. Never mention the hospital, the highway, or open sky.`,
    route9:   `Player is on Route 9 highway heading north on foot: open road, abandoned vehicles, overpasses, the city receding behind them. Keep it exposed. GEOGRAPHY: they stay on the open highway this phase. Never mention the hospital, the metro, subways, or tunnels.`,
  };
  const crossDesc  = `Player has ALREADY LEFT their starting location and is crossing Harwick on foot, moving north through a mix of residential and industrial streets toward the signal. Keep it tense. GEOGRAPHY: do not send them back to the hospital, metro, or highway, and do not say they have reached the signal's source yet.`;
  const desc = section === "path" ? (pathDesc[path] || crossDesc) : crossDesc;

  return `You are Ellie, texting the player through Harwick.

SITUATION: ${desc}
PLAYER: Battery ${resources.battery}%. Water ${resources.water}. Food ${resources.food}. HP: ${resources.hp}/10 (${injuryStr}). Weapon: ${weaponStr}. Noise: ${noiseStr}.${hungerNote}

React to HP if injured. React to noise if high. React to low supplies if relevant.
Move at pace — if the player is heading somewhere, they arrive next beat. Do not count down intermediate steps (no "308, 310, almost there"). Do not add extra exchanges between the player and a known object in front of them.

RESOURCES: You never decide resource amounts. When an action would give the player supplies, put an explicit marker inside that choice: [+N Food], [+N Water], or [+N HP] (example: "grab the cans and go [+3 Food]"). The game applies it. If the player's message contains a RESOURCE UPDATE, state those exact numbers. Otherwise never mention specific food, water, battery, or HP counts.

LOOT COHERENCE: Do not invent searchable objects, containers, stashes, or supplies the player cannot act on. Never say an item is "still there" and then move on, and never describe the player finding something they did not just obtain through a choice. Searchable supplies are introduced by the game as explicit search encounters — describe only what the game presents, not loot you imagined.

CONTINUITY: Keep exploration generic — say "a storefront" or "a building," never specific shop types (no "convenience store," "pharmacy," etc.); the game names locations itself. Within a scene, never reference objects (a dash, a seat, a back room) that belong to something you haven't placed. Never contradict the setting described in SITUATION.

Short texts, 1-2 sentences, 20 words max. Lowercase. No em dashes. Periods and commas only.

ALWAYS respond with valid JSON only:
{ "messages": ["msg1", "msg2"], "choices": ["choice 1", "choice 2"] }
2-3 messages under 20 words. 2-3 choices under 8 words.`;
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

// Priority 3 — conservative AI geography guard. Clearly-contradictory location
// words per path during p2 exploration. Matched with \bword\b so they never fire
// inside "toward"/"training"/etc. Ambiguous words are deliberately excluded.
const GEO_FORBIDDEN = {
  hospital: ["subway","metro","tunnel","platform","highway","freeway","on-ramp","overpass","interstate","turnstile"],
  metro:    ["hospital","highway","freeway","on-ramp","overpass","interstate"],
  route9:   ["hospital","subway","metro","tunnel","platform","turnstile"],
};
const PREMATURE_TERMS = ["haven"]; // referencing the destination before arrival
const GEO_SAFE_LINE = {
  hospital: "you move through the corridor. stay focused.",
  metro:    "you keep moving along the platform. stay focused.",
  route9:   "you keep moving up the road. stay focused.",
  crossing: "you keep moving through the streets. stay focused.",
};
// Once the player has LEFT their starting leg and is crossing the city, the AI must
// not send them back to it. These prior-leg location words are forbidden only during
// the crossing section (they're legitimate during the matching path leg).
const CROSSING_EXTRA_FORBIDDEN = {
  hospital: ["hospital", "ward", "corridor"],
  metro:    ["metro", "subway", "tunnel", "platform", "turnstile"],
  route9:   ["highway", "freeway", "overpass", "on-ramp", "checkpoint"],
};
// Forbidden terms for a (path, section). "haven" is only premature during a PATH
// leg — in the crossing the player is openly heading toward the signal/Haven, so
// the word can appear legitimately and is not flagged (F2). During the crossing we
// instead forbid the player's own prior-leg location words.
const geoTerms = (path, section) => [
  ...(GEO_FORBIDDEN[path] || []),
  ...(section === "crossing" ? (CROSSING_EXTRA_FORBIDDEN[path] || []) : PREMATURE_TERMS),
];
// Returns the first offending term found in messages/choices, or null. Only
// meaningful for path/crossing exploration (callEllie gates on phase).
const detectGeoContradiction = (parsed, path, section) => {
  if (!path) return null;
  const terms = geoTerms(path, section);
  const hay = [...(parsed.messages || []), ...(parsed.choices || [])].join(" ");
  for (const t of terms) {
    const re = new RegExp(`\\b${t.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}\\b`, "i");
    if (re.test(hay)) return t;
  }
  return null;
};
// Replace any message/choice containing a forbidden term with a safe neutral line.
const sanitizeGeo = (parsed, path, section) => {
  const terms = geoTerms(path, section);
  const res = terms.map(t => new RegExp(`\\b${t.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}\\b`, "i"));
  const hits = (s) => res.some(re => re.test(s));
  const safeLine = GEO_SAFE_LINE[section === "crossing" ? "crossing" : path] || GEO_SAFE_LINE.hospital;
  return {
    messages: (parsed.messages || []).map(m => hits(m) ? safeLine : m),
    choices:  (parsed.choices  || []).map(c => hits(c) ? "Keep moving." : c),
  };
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
    <div style={{ alignSelf:m.from==="ellie"?"flex-start":"flex-end", maxWidth:"82%", padding:"0.48rem 0.85rem", background:m.from==="ellie"?"#0d0d0d":"#0b110b", border:`1px solid ${m.from==="ellie"?"#222222":"#1c2a1c"}`, color:m.from==="ellie"?"#d8c79b":"#79b580", fontSize:"0.84rem", lineHeight:"1.7", fontWeight:300, animation:"fi 0.35s ease" }}>
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
  const [confirmReset, setConfirmReset] = useState(false); // two-tap confirm for the pause-menu wipe
  const [showRestart, setShowRestart]   = useState(false);
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
  const [fragTarget, setFragTarget]             = useState(3);
  const [fragFired, setFragFired]               = useState(false);
  const [currentEncounter, setCurrentEncounter] = useState(null);
  const [selectedFragment, setSelectedFragment] = useState(null);
  const [recoveredMemories, setRecoveredMemories] = useState([]);
  const [sigFlicker, setSigFlicker] = useState(false);
  const [battPulse, setBattPulse]   = useState(false); // P6c — battery pickup HUD flourish
  const [dayThree, setDayThree]     = useState(false);
  const [havenFinalIndex, setHavenFinalIndex] = useState(0);

  const apiHistoryRef       = useRef([]);
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
  const fragTargetRef       = useRef(fragTarget);
  const fragFiredRef        = useRef(fragFired);
  const currentEncounterRef = useRef(currentEncounter);
  const selectedFragmentRef  = useRef(selectedFragment);
  const recoveredMemoriesRef = useRef(recoveredMemories);
  const lastEncounterIdRef   = useRef(null);
  const shelterForcedRef     = useRef(false);
  const pendingStoryBeatRef  = useRef(null);
  const lastEventWasEncRef  = useRef(false);
  const returnToPhaseRef    = useRef("p2_ai");
  const lastCallRef         = useRef(null);   // C1 — args of the most recent callEllie, for "Try again."
  const sectionPlanRef      = useRef({});     // exchange# → "search" | "hazard" (guaranteed search spots)
  const havenFinalRef       = useRef(HAVEN_FINAL_SEQUENCE); // P5 — path-aware final sequence for this run
  const seenEncountersRef   = useRef(new Set()); // P6a — encounter ids seen this run (reduce repetition)
  const activeSlotRef       = useRef(null);  // P4 — slot index (0–2) the in-progress run auto-saves to
  const mutedRef            = useRef(false); // audio — mirror of `muted` for the one-time unlock listener

  resourcesRef.current      = resources;
  screenRef.current         = screen;
  weaponRef.current         = weapon;
  noiseRef.current          = noise;
  gamePhaseRef.current      = gamePhase;
  currentPathRef.current    = currentPath;
  aiCountRef.current        = aiExchangeCount;
  aiTargetRef.current       = aiExchangeTarget;
  fragTargetRef.current     = fragTarget;
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
  const buildSnapshot = () => ({
    v: 1, idCounter: idRef.current,
    messages, choices, lastMessage,
    resources, weapon, noise, contactName,
    gamePhase, chosenPath, currentPath, exchangePhase, p2BeatIndex,
    aiExchangeCount, aiExchangeTarget, fragTarget, fragFired,
    currentEncounter, selectedFragment, dayThree, havenFinalIndex,
    apiHistory: apiHistoryRef.current,
    pendingStoryBeat: pendingStoryBeatRef.current,
    returnToPhase: returnToPhaseRef.current,
    lastEncounterId: lastEncounterIdRef.current,
    sectionPlan: sectionPlanRef.current,
    havenFinal: havenFinalRef.current,
    seenEncounters: [...seenEncountersRef.current],
    shelterForced: shelterForcedRef.current,
    lastEventWasEnc: lastEventWasEncRef.current,
    // P4 — lightweight summary so the slot screen renders without restoring the run.
    meta: { day: snapshotDay(), location: locationLabel(), hp: resources.hp, battery: resources.battery, savedAt: Date.now() },
  });
  // A snapshot is resumable only if it's a real-progress run with a sane schema.
  const validSnap = (s) => !!s && s.v === 1 && s.gamePhase && s.gamePhase !== "phase1"
    && s.resources && typeof s.resources.battery === "number";
  // Read every slot's meta (or null) for the slot screen; clean up invalid saves.
  const refreshSlots = async () => {
    const next = [];
    for (let i = 0; i < SLOT_COUNT; i++) {
      let snap;
      try { const r = await window.storage.get(slotKey(i)); if (r?.value) snap = JSON.parse(r.value); } catch (e) {}
      if (validSnap(snap)) {
        next.push(snap.meta || { day: 2, location: "—", hp: snap.resources.hp, battery: snap.resources.battery, savedAt: 0 });
      } else {
        if (snap) { try { await window.storage.delete(slotKey(i)); } catch (e) {} } // drop a malformed save
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
    try { await window.storage.set(slotKey(i), JSON.stringify(buildSnapshot())); await refreshSlots(); return true; } catch (e) { return false; }
  };
  const deleteSlot = async (i) => {
    if (i == null) return;
    try { await window.storage.delete(slotKey(i)); } catch (e) {}
    if (activeSlotRef.current === i) activeSlotRef.current = null;
    await refreshSlots();
  };
  const resumeSlot = async (i) => {
    let snap;
    try { const r = await window.storage.get(slotKey(i)); if (r?.value) snap = JSON.parse(r.value); } catch (e) {}
    if (!snap) return;
    // F1 — refuse a malformed / wrong-schema snapshot instead of crashing on it.
    if (!validSnap(snap)) {
      console.warn("[DeadSignal] ignoring incompatible save");
      deleteSlot(i);
      return;
    }
    activeSlotRef.current = i; // this run now auto-saves back to slot i
    clearPending();
    // refs (not mirrored from state)
    idRef.current             = snap.idCounter || 0;
    apiHistoryRef.current     = snap.apiHistory || [];
    pendingStoryBeatRef.current = snap.pendingStoryBeat || null;
    returnToPhaseRef.current  = snap.returnToPhase || "p2_ai";
    lastEncounterIdRef.current = snap.lastEncounterId || null;
    sectionPlanRef.current    = snap.sectionPlan || {};
    havenFinalRef.current     = snap.havenFinal || HAVEN_FINAL_SEQUENCE;
    seenEncountersRef.current = new Set(snap.seenEncounters || []);
    shelterForcedRef.current  = !!snap.shelterForced;
    lastEventWasEncRef.current = !!snap.lastEventWasEnc;
    chatStartedRef.current    = true; // prevent the chat-start effect from re-firing exchange 0
    // state
    setMessages(snap.messages || []); setChoices(snap.choices || []); setLastMessage(snap.lastMessage || "");
    setResources(snap.resources); setWeapon(snap.weapon || null); setNoise(snap.noise || 0);
    setContactName(snap.contactName || "KIM");
    setGamePhase(snap.gamePhase || "phase1"); setChosenPath(snap.chosenPath || null);
    setCurrentPath(snap.currentPath || null); setExchangePhase(snap.exchangePhase || 0);
    setP2BeatIndex(snap.p2BeatIndex || 0); setAiExchangeCount(snap.aiExchangeCount || 0);
    setAiExchangeTarget(snap.aiExchangeTarget || 7); setFragTarget(snap.fragTarget || 3);
    setFragFired(!!snap.fragFired); setCurrentEncounter(snap.currentEncounter || null);
    setSelectedFragment(snap.selectedFragment || null); setDayThree(!!snap.dayThree);
    setHavenFinalIndex(snap.havenFinalIndex || 0);
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
  useEffect(() => {
    const onGesture = async () => {
      window.removeEventListener("pointerdown", onGesture);
      window.removeEventListener("keydown", onGesture);
      await audioEngine.unlock();
      audioEngine.setMuted(mutedRef.current);
      setAudioReady(true);
    };
    window.addEventListener("pointerdown", onGesture);
    window.addEventListener("keydown", onGesture);
    return () => { window.removeEventListener("pointerdown", onGesture); window.removeEventListener("keydown", onGesture); };
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

  // Load persisted memories on mount
  useEffect(() => {
    const load = async () => {
      try {
        const result = await window.storage.get("ds_memories");
        if (result?.value) setRecoveredMemories(JSON.parse(result.value));
      } catch(e) {}
    };
    load();
  }, []);

  // Save memories whenever they change
  useEffect(() => {
    if (recoveredMemories.length === 0) return;
    const save = async () => {
      try { await window.storage.set("ds_memories", JSON.stringify(recoveredMemories)); } catch(e) {}
    };
    save();
  }, [recoveredMemories]);

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

  // Priority 1 — catch-all defeat check (covers encounter HP loss). The
  // screen==="chat" guard means it fires once, then screen flips to "dead".
  useEffect(() => {
    if (screen !== "chat" || resources.hp > 0) return;
    const cause = resources.food <= 0 ? "starvation" : resources.water <= 0 ? "dehydration" : "injury";
    triggerDeath(cause);
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
          if (validSnap(snap) && !slot0?.value) {
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

  // Terminal screens aren't resumable: always clear the run save. Failure
  // (death / battery-offline) is a full clean slate — also wipe fragments/clues,
  // so even a reload on the screen starts fresh. Finishing keeps memories (the
  // buttons there decide).
  useEffect(() => {
    if (screen === "dead" || screen === "offline") {
      deleteSlot(activeSlotRef.current);
      setRecoveredMemories([]);
      (async () => { try { await window.storage.delete("ds_memories"); } catch (e) {} })();
    } else if (screen === "phase2_complete") {
      deleteSlot(activeSlotRef.current);
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
  // returns the post-change battery + a "truth" string so Ellie's narration cites
  // the exact numbers instead of inventing them. `baseBattery` is the already-
  // drained battery for this turn; any [+N Battery] loot stacks on top of it.
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

    const t = [];
    if (d.food)    t.push(`food now ${newFood}`);
    if (d.water)   t.push(`water now ${newWater}`);
    if (d.hp)      t.push(`hp now ${newHp}`);
    if (d.battery) t.push(`battery now ${newBattery}`);
    const truth = t.length
      ? ` [RESOURCE UPDATE APPLIED: ${t.join(", ")}. State these exact numbers if you mention them. Do not invent other numbers.]`
      : "";
    return { hasDelta, newBattery, newFood, newWater, newHp, truth };
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

  const callEllie = async (history, systemOverride = null, batteryOverride = null, skipMsgLoot = false, geoRetry = false) => {
    const system = systemOverride || PHASE1_SYSTEM;
    const effectiveBattery = batteryOverride !== null ? batteryOverride : resourcesRef.current.battery;
    lastCallRef.current = { history, systemOverride, batteryOverride }; // C1 — enables retry on failure
    // H3 — only resend a sliding window of the conversation to cap latency/token cost.
    // Must start on a "user" turn (Anthropic requires it), so drop a leading assistant msg.
    let sentHistory = history.length > 16 ? history.slice(-16) : history;
    if (sentHistory[0]?.role !== "user") sentHistory = sentHistory.slice(1);
    // C1 — abort a hung request instead of leaving the player stuck on the typing indicator.
    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), 20000);
    // API endpoint: defaults to Anthropic's API (works inside the Claude artifact
    // sandbox). For standalone/local dev, main.jsx sets window.__DS_API_URL__ to a
    // proxied path (see vite.config.js) so an API key can be injected server-side.
    const apiUrl = (typeof window !== "undefined" && window.__DS_API_URL__) || "https://api.anthropic.com/v1/messages";
    try {
      const res  = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Direct browser → Anthropic (GitHub Pages build). In local dev the
          // same-origin /api/messages proxy overwrites these server-side, so the
          // empty client key is harmless and never needs to live in local .env.
          "x-api-key": import.meta.env.VITE_ANTHROPIC_KEY || "",
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({ model: "claude-sonnet-4-5", max_tokens: 1000, system, messages: sentHistory }),
        signal: controller.signal,
      });
      const data = await res.json();
      const raw  = data.content?.[0]?.text || "{}";
      let parsed = { messages: ["..."], choices: ["Keep moving.", "What's next?"] };
      try { parsed = JSON.parse(raw.replace(/```json|```/g, "").trim()); } catch {}
      // M3 — never trust the model's shape: clamp to 3 non-empty strings each.
      const msgs    = (Array.isArray(parsed.messages) ? parsed.messages : []).filter(m => typeof m === "string" && m.trim()).slice(0, 3);
      const choices = (Array.isArray(parsed.choices) ? parsed.choices : []).filter(c => typeof c === "string" && c.trim()).slice(0, 3);
      parsed = {
        messages: msgs.length ? msgs : ["..."],
        choices:  choices.length ? choices : ["Keep moving.", "What's next?"],
      };

      // Priority 3 — AI geography guard (path/crossing exploration only). Run
      // BEFORE loot/history so a contradictory reply never persists or applies loot.
      const geoPhase = gamePhaseRef.current === "p2_ai" || gamePhaseRef.current === "p2_ai_cross";
      if (geoPhase) {
        const geoPath = currentPathRef.current || "hospital";
        const geoSection = gamePhaseRef.current === "p2_ai" ? "path" : "crossing";
        const bad = detectGeoContradiction(parsed, geoPath, geoSection);
        if (bad && !geoRetry) {
          console.warn("[DeadSignal] geo guard:", bad, "→ regenerate");
          const anchor = geoSection === "crossing"
            ? "moving through the streets of harwick toward the signal"
            : geoPath === "hospital" ? "inside mercy general hospital"
            : geoPath === "metro" ? "in the harwick metro tunnels"
            : "on route 9, the open highway";
          const corrective = `[GEOGRAPHY CORRECTION] Your last reply mentioned "${bad}", which does not exist here. The player is ${anchor}. Do not mention "${bad}" or any other location. Rewrite your reply for the current location only.`;
          clearTimeout(timeoutId);
          callEllie([...history, { role: "user", content: corrective }], systemOverride, batteryOverride, skipMsgLoot, true);
          return; // discard the contradictory reply; the retry renders
        }
        if (bad && geoRetry) {
          console.warn("[DeadSignal] geo guard:", bad, "→ sanitize");
          parsed = sanitizeGeo(parsed, geoPath, geoSection);
        }
      }

      // Priority 2 — code-authoritative loot from AI *narration*. If Ellie's
      // messages contain a resource marker (e.g. "granola bar [+1 Food]"), code
      // applies the delta so the HUD stays in sync. `skipMsgLoot` is set when the
      // triggering choice already applied loot, so an echoed delta isn't counted
      // twice. Code owns the clamp; the AI only proposes the delta.
      if (!skipMsgLoot) {
        const md = parseResourceMarkers(parsed.messages.join(" "));
        if (md.food || md.water || md.hp || md.battery) {
          setResources(p => ({
            ...p,
            food:    Math.max(0, p.food + md.food),
            water:   Math.max(0, p.water + md.water),
            hp:      Math.max(0, Math.min(10, p.hp + md.hp)),
            battery: Math.max(0, Math.min(100, p.battery + md.battery)),
          }));
          stingForDelta(md); // audio
          if (md.battery > 0) pulseBattery(); // P6c
        }
      }

      apiHistoryRef.current = [...history, { role: "assistant", content: raw }];
      const isAiPhase = ["p2_ai", "p2_ai_cross", "haven_ai"].includes(gamePhaseRef.current);
      const displayChoices = isAiPhase
        ? parsed.choices.map(c => `${c} [-1% Battery]`)
        : parsed.choices;

      const pending = pendingStoryBeatRef.current;

      if (effectiveBattery <= 0) {
        scheduleMessages(parsed.messages, null);
        pendingRef.current.push(setTimeout(() => setScreen("offline"), parsed.messages.length * 2000 + 1500)); // C2 — cancelable

      } else if (pending) {
        // Resolve the current action first — show AI response with no choices
        pendingStoryBeatRef.current = null;
        const aiMsgTime = scheduleMessages(parsed.messages, null);
        const path = currentPathRef.current || "hospital"; // H4 — never index data maps with null

        // After AI messages finish, bridge into the queued beat
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
        scheduleMessages(parsed.messages, displayChoices);
      }
    } catch (e) {
      // C1 — surface the failure AND give the player a way to retry instead of soft-locking.
      // Leave pendingStoryBeatRef intact: the fetch threw before the beat was consumed,
      // so a successful retry will still bridge into it.
      // P6b — give a reason: timeout/abort vs generic connection drop.
      const timedOut = e?.name === "AbortError";
      setIsTyping(false);
      setMessages(p => [...p, { id: nextId("err"), from: "ellie",
        text: timedOut ? "...still there? took too long to come through." : "...you there? signal's bad." }]);
      setChoices(["Try again."]);
    } finally {
      clearTimeout(timeoutId);
    }
  };

  const resolveEncounterChoice = (choice, encounter) => {
    const action   = encounter.choices.find(c => stripMarkers(c.text) === stripMarkers(choice))?.action || "AVOID";
    const curNoise = noiseRef.current;
    const curRes   = resourcesRef.current;
    let dNoise = 0, dHp = 0, dFood = 0, dWater = 0, dBatt = 0;
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
          outcome = "you disturbed something."; reactionKey = "search_fail"; dNoise = 2; dHp = -1;
        }
        break;
      }
      case "WAIT":    { outcome = "you waited. it passed."; reactionKey = "wait"; break; }
      case "DISTRACT":{ dFood = curRes.food > 0 ? -1 : 0; outcome = "it goes for the food. you slip past."; reactionKey = "distract"; dNoise = 1; break; }
      case "RUN": {
        const ok = Math.random() < (curNoise <= 3 ? 0.75 : 0.48);
        if (ok) { outcome = "you ran. made it."; reactionKey = "run_success"; dNoise = 1; }
        else    { outcome = "you got away. dropped something."; reactionKey = "run_fail"; dFood = -1; dWater = -1; dNoise = 2; }
        break;
      }
      case "OBSERVE": { outcome = "you look. more questions than answers."; reactionKey = "observe"; break; }
      case "FORCE":   { outcome = "you forced through."; reactionKey = "force"; dHp = -2; dNoise = 2; break; }
      default:        { outcome = "you kept moving."; reactionKey = "avoid"; }
    }

    const prevNoise = curNoise;
    const newNoise  = Math.min(5, Math.max(0, curNoise + dNoise));
    setNoise(newNoise);
    setResources(prev => ({
      ...prev,
      hp:      Math.max(0, Math.min(10, prev.hp + dHp)),
      food:    Math.max(0, prev.food  + dFood),
      water:   Math.max(0, prev.water + dWater),
      battery: Math.min(100, prev.battery + dBatt),
    }));
    stingForDelta({ food: dFood, water: dWater, hp: dHp, battery: dBatt }); // audio
    if (dBatt > 0) { addMsg("system", `battery pack connected · +${dBatt}%`, 300); pulseBattery(); } // P6c

    addMsg("system", outcome, dBatt > 0 ? 800 : 300);

    const narLine = NARRATOR_ATMOSPHERE[reactionKey];
    const useNar  = narLine && (reactionKey.includes("fail") || reactionKey === "sneak_success" || reactionKey === "wait");
    const reactionDelay = useNar ? 2000 : 1400;
    if (useNar) addMsg("narrator", narLine, 900);
    addMsg("ellie", pickRandom(ENCOUNTER_REACTIONS[reactionKey] || ["keep moving."]), reactionDelay);

    if (prevNoise < 4 && newNoise >= 4) addMsg("narrator", "something answers.", reactionDelay + 700);
    if (prevNoise < 5 && newNoise >= 5) addMsg("narrator", "you hear footsteps. more than one set.", reactionDelay + 700);

    pendingRef.current.push(setTimeout(() => {
      const returnPhase = returnToPhaseRef.current;
      const path = currentPathRef.current;
      lastEncounterIdRef.current = encounter.id;
      setGamePhase(returnPhase);
      setCurrentEncounter(null);
      lastEventWasEncRef.current = true;
      const system  = buildP2System(path, returnPhase === "p2_ai" ? "path" : "crossing", resourcesRef.current, weaponRef.current, newNoise);
      // During the crossing the player has left their starting leg — never reground
      // them back "inside the hospital"/"in the tunnels". Path strings apply only to p2_ai.
      const locationStr = returnPhase === "p2_ai_cross"
        ? "the streets of Harwick (crossing the city on foot, moving north)"
        : path === "hospital" ? "Mercy General Hospital (still inside, heading toward the admin floor)" : path === "metro" ? "the Harwick Metro tunnels (underground, heading north)" : path === "route9" ? "Route 9 highway (moving north)" : "Harwick city streets";
      const history = [...apiHistoryRef.current, { role: "user", content: `[ENCOUNTER RESOLVED] ${outcome} Noise: ${newNoise}/5. HP: ${Math.max(0, curRes.hp + dHp)}/10. Player is in ${locationStr}. Do not reference anything from before this encounter. Do not invent new destinations. Continue forward from here.` }];
      apiHistoryRef.current = history;
      setIsTyping(true);
      callEllie(history, system);
    }, reactionDelay + 1800));
  };

  const handleChoice = (choice) => {
    audioEngine.tapResponse(); // audio — response/choice tap
    clearPending();
    setChoices([]);

    // C1 — retry the failed request without recording "Try again." as a player line.
    if (choice === "Try again." && lastCallRef.current) {
      const { history, systemOverride, batteryOverride } = lastCallRef.current;
      setIsTyping(true);
      callEllie(history, systemOverride, batteryOverride);
      return;
    }

    setLastMessage(choice);
    const isNarContinue = choice === "·";
    const isEncounter   = gamePhaseRef.current === "encounter";
    const aiPhases      = ["p2_ai", "p2_ai_cross", "haven_ai"];
    const drainBatt     = aiPhases.includes(gamePhaseRef.current);
    const newBattery    = drainBatt ? Math.max(0, resourcesRef.current.battery - 1) : resourcesRef.current.battery;
    if (drainBatt) setResources(p => ({ ...p, battery: newBattery }));
    if (!isNarContinue) setMessages(p => [...p, { id: nextId("p"), from: "player", text: choice }]);
    if (!isEncounter && !isNarContinue) setIsTyping(true);

    if (isEncounter) { resolveEncounterChoice(choice, currentEncounterRef.current); return; }

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
      const path   = currentPathRef.current;

      // Delay API call until notification has rendered
      pendingRef.current.push(setTimeout(() => {
        const system  = buildP2System(path, "path", resourcesRef.current, weaponRef.current, noiseRef.current);
        const reground = {
          hospital: "they are still in the hospital — the corridor, whatever was just in front of them.",
          metro:    "they are still in the metro tunnels — underground, whatever was just ahead on the platform.",
          route9:   "they are still on route 9 — the highway stretching north, whatever was just in the road.",
        }[path] || "they are still moving through harwick — whatever was directly in front of them.";
        const content = `[MEMORY FLASH] Player briefly experienced a past memory. Their choice was: "${stripMarkers(choice)}". React in one short line. Then immediately reground them — ${reground} If you mentioned something specific just before (a body, a sound, a blocked path, a vehicle), name it again briefly so the player knows where they are. Then give new choices that follow directly from that situation.`;
        const history = [...apiHistoryRef.current, { role: "user", content }];
        apiHistoryRef.current = history;
        setIsTyping(true);
        callEllie(history, system);
      }, 1400));
      return;
    }

    if (gamePhaseRef.current === "phase1") {
      const cur  = SCRIPTED_EXCHANGES[exchangePhase];
      const next = exchangePhase + 1;
      setExchangePhase(next);
      if (cur?.onChoice === "CHARGER")     { const ch = Math.min(100, newBattery + 35); setResources(p => ({ ...p, battery: ch, charger: 0 })); addMsg("system", `portable charger connected · battery ${ch}%`, 700); }
      if (cur?.onChoice === "SUPPLIES")    { setResources(p => ({ ...p, food: 5, water: 5 })); addMsg("system", "supplies gathered · food 5 · water 5", 700); }
      if (cur?.onChoice === "MAP_FOUND")   { addMsg("system", "city map found — harwick", 700); }
      let detected = null;
      if (cur?.onChoice === "BRANCH") { detected = detectPath(choice); setCurrentPath(detected); setChosenPath(choice); }
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
      return;
    }

    if (gamePhaseRef.current === "p2_scripted") {
      const path  = currentPathRef.current || "hospital"; // H4
      const beats = PATH_BEATS[path];
      const cur   = beats[p2BeatIndex];
      const next  = p2BeatIndex + 1;
      const wmap  = { WEAPON_KNIFE:{ name:"worn pocket knife",shortName:"knife",damage:3 }, WEAPON_BAT:{ name:"baseball bat",shortName:"bat",damage:3 }, WEAPON_CROWBAR:{ name:"crowbar",shortName:"crowbar",damage:3 } };
      if (wmap[cur?.onChoice]) { const w = wmap[cur.onChoice]; setWeapon(w); addMsg("system", `${w.name} equipped · ${w.damage}dmg`, 700); }
      if (next < beats.length) {
        setP2BeatIndex(next);
        scheduleMessages(beats[next].msgs, beats[next].choices, "ellie");
      } else {
        // Path scripted complete — pick random fragment for this run, drain water, start AI
        const fragPool = MEMORY_FRAGMENT_POOLS[path] || MEMORY_FRAGMENT_POOLS.hospital;
        const chosenFrag = fragPool[Math.floor(Math.random() * fragPool.length)];
        setSelectedFragment(chosenFrag);
        applyTransitionDrain("path_start");
        // Fixed cadence + guaranteed search spots: memory@2, discovery@6,
        // searchable spots at ex1 & ex5, a hazard at ex3 (ex4 free, mid-leg drain).
        setFragTarget(2); setAiExchangeTarget(6);
        sectionPlanRef.current = { 1: "search", 3: "hazard", 5: "search" };
        setFragFired(false); setAiExchangeCount(0); setGamePhase("p2_ai");
        const system  = buildP2System(path, "path", resourcesRef.current, weaponRef.current, noiseRef.current);
        const pathContext = {
          hospital: `[PATH CONTINUATION] The player is already inside Mercy General Hospital and moving. Knife equipped. Ellie has given them the destination: third floor, room 312, admin area. That information has been delivered — do not repeat it. The player just said they are heading there. Guide them through what they encounter on the way up: sounds, hazards, movement decisions inside the building. Start mid-action.`,
          metro:    `[PATH CONTINUATION] The player is on the metro platform underground. Bat equipped. Ellie has already warned them about track three and mentioned service exit C as a route north. Both pieces of information have been delivered — do not repeat them. Guide the player through the tunnels and platform: sounds in the dark, hazards, movement decisions. Start mid-action.`,
          route9:   `[PATH CONTINUATION] The player is on Route 9 moving north on foot past abandoned vehicles. Crowbar equipped. Ellie has already told them the checkpoint ahead is empty and mentioned mile marker 14. Both pieces of information have been delivered — do not repeat them. Guide them up the highway: what they see, what moves, what choices they face. Start mid-action.`,
        };
        const history = [{ role: "user", content: pathContext[path] || `[PATH CONTINUATION] Player is moving with a ${weaponRef.current?.name || "weapon"}. Guide them forward. Start mid-action.` }];
        apiHistoryRef.current = history;
        callEllie(history, system);
      }
      return;
    }

    if (gamePhaseRef.current === "shelter") {
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

      addMsg("narrator", "night presses against the walls.", 1800);
      addMsg("narrator", "you dream of static.", 3400);

      pendingRef.current.push(setTimeout(() => {
        setDayThree(true);
        setMessages(p => [...p, { id:nextId("day3"), from:"system", text:"day 3." }]);
      }, 5200));

      addMsg("ellie", "still there?", 6800);
      addMsg("ellie", "morning. you made it through the night.", 8400);

      // Start Haven approach after morning messages
      pendingRef.current.push(setTimeout(() => {
        setGamePhase("haven_approach");
        setP2BeatIndex(0);
        scheduleMessages(HAVEN_APPROACH_BEATS[0].msgs, HAVEN_APPROACH_BEATS[0].choices, HAVEN_APPROACH_BEATS[0].from || "ellie");
      }, 10200));
      return;
    }

    if (gamePhaseRef.current === "haven_approach") {
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
        const system  = buildHavenSystem(currentPathRef.current, resourcesRef.current, weaponRef.current, noiseRef.current);
        const history = [{ role:"user", content:"[HAVEN ARRIVAL] Player entered Haven compound. Dining hall: food on tables, coffee cold, nobody home. Guide them deeper into the site. Start mid-exploration." }];
        apiHistoryRef.current = history;
        callEllie(history, system);
      }
      return;
    }

    if (gamePhaseRef.current === "haven_ai") {
      const newCnt = aiCountRef.current + 1;
      setAiExchangeCount(newCnt);
      if (newCnt >= aiTargetRef.current) {
        pendingStoryBeatRef.current = { type: "haven_final" };
      }
      const loot = applyChoiceLoot(choice, newBattery); // Fix #5
      const system = buildHavenSystem(currentPathRef.current, resourcesRef.current, weaponRef.current, noiseRef.current);
      callEllie([...apiHistoryRef.current, { role:"user", content: stripMarkers(choice) + loot.truth }], system, loot.newBattery, loot.hasDelta);
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

      // Mid-leg drain (the steady squeeze). Fires once per section on a free exchange.
      if (gamePhaseRef.current === "p2_ai" && newCnt === 4)        applyTransitionDrain("path_mid");
      if (gamePhaseRef.current === "p2_ai_cross" && newCnt === 4)  applyTransitionDrain("crossing_mid");

      // Determine if a beat should follow — queue it, never fire before Ellie resolves the action
      let pendingBeat = null;

      if (gamePhaseRef.current === "p2_ai" && !fragFiredRef.current && newCnt >= fragTargetRef.current) {
        setFragFired(true);
        pendingBeat = { type: "memory" };

      } else if (gamePhaseRef.current === "p2_ai" && newCnt >= aiTargetRef.current) {
        pendingBeat = { type: "discovery" };

      } else if (gamePhaseRef.current === "p2_ai_cross" && newCnt >= aiTargetRef.current) {
        pendingBeat = { type: "shelter" };

      } else {
        // Guaranteed search spots: a deterministic per-section schedule decides which
        // exchanges host a loot-bearing (SEARCH) encounter vs a hazard. Schedule indices
        // are spaced so consecutive encounters never collide. Code owns the loot.
        const planned = sectionPlanRef.current[newCnt];
        if (planned) {
          const pool = (ENCOUNTERS[section === "path" ? path : "crossing"] || ENCOUNTERS.crossing)
            .filter(e => (e.minNoise || 0) <= noiseRef.current && e.id !== lastEncounterIdRef.current);
          const wantSearch = planned === "search";
          const matching = pool.filter(e => e.choices.some(c => c.action === "SEARCH") === wantSearch);
          const choicesPool = matching.length ? matching : pool;
          // P6a — prefer encounters not yet seen this run; fall back once exhausted.
          const unseen = choicesPool.filter(e => !seenEncountersRef.current.has(e.id));
          const finalPool = unseen.length ? unseen : choicesPool;
          if (finalPool.length) {
            const enc = pickRandom(finalPool);
            seenEncountersRef.current.add(enc.id);
            pendingBeat = { type: "encounter", enc };
          }
        }
      }

      lastEventWasEncRef.current = false;
      pendingStoryBeatRef.current = pendingBeat;

      // Fix #5 — apply any loot marker before calling the AI; effBattery folds in
      // the drain plus any [+N Battery] loot, and truth pins Ellie to real numbers.
      const loot = applyChoiceLoot(choice, newBattery);
      const effBattery = loot.newBattery;

      // Priority 1 — starvation/dehydration on the loot-adjusted vitals. If it
      // drops HP to 0, end the run now instead of firing an orphan API call.
      const survHp = applyStarvation({ food: loot.newFood, water: loot.newWater, hp: loot.newHp });
      if (survHp <= 0) { triggerDeath(loot.newFood <= 0 ? "starvation" : "dehydration"); return; }

      let battNote = "";
      if (effBattery <= 1)      battNote = " [BATTERY 1%]";
      else if (effBattery <= 3) battNote = ` [BATTERY CRITICAL ${effBattery}%]`;
      else if (effBattery <= 5) battNote = ` [BATTERY LOW ${effBattery}%]`;
      const system = buildP2System(path, section, resourcesRef.current, weaponRef.current, noiseRef.current);
      callEllie([...apiHistoryRef.current, { role: "user", content: stripMarkers(choice) + battNote + loot.truth }], system, effBattery, loot.hasDelta);
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
      // Crossing cadence mirrors the path: shelter@6; searchable spots at ex1 & ex5,
      // hazard at ex3 (ex2/ex4 free, mid-leg drain at ex4). Encounters stay spaced.
      setAiExchangeTarget(6); setAiExchangeCount(0);
      sectionPlanRef.current = { 1: "search", 3: "hazard", 5: "search" };
      setGamePhase("p2_ai_cross");
      setNoise(Math.max(0, noiseRef.current - 1));

      // Delay API call until after all notifications have rendered
      pendingRef.current.push(setTimeout(() => {
        const system  = buildP2System(path, "crossing", resourcesRef.current, weaponRef.current, noiseRef.current);
        const history = [{ role: "user", content: `[CROSSING START] Player has been in Harwick the entire time. They already know they're in Harwick. Do not tell them. They left the ${path === "hospital" ? "hospital" : path === "metro" ? "metro tunnels" : "highway checkpoint"} and are now moving north through the middle of the city toward the signal. Urban environment. Guide them forward.` }];
        apiHistoryRef.current = history;
        setIsTyping(true);
        callEllie(history, system);
      }, 2400));
      return;
    }
  };

  // Pure run-state reset — no save/screen side effects (shared by restart + new run).
  const resetRunState = () => {
    clearPending();
    chatStartedRef.current = false; apiHistoryRef.current = [];
    lastEventWasEncRef.current = false; lastEncounterIdRef.current = null;
    pendingStoryBeatRef.current = null; sectionPlanRef.current = {};
    seenEncountersRef.current = new Set(); havenFinalRef.current = HAVEN_FINAL_SEQUENCE;
    setMessages([]); setChoices([]); setIsTyping(false); setSigFlicker(false); setBattPulse(false);
    setResources({ battery: 9, water: 0, food: 0, charger: null, hp: 10 });
    setWeapon(null); setNoise(0);
    setExchangePhase(0); setContactName("KIM"); setChosenPath(null);
    setGamePhase("phase1"); setCurrentPath(null); setP2BeatIndex(0);
    setAiExchangeCount(0); setAiExchangeTarget(7); setFragTarget(3); setFragFired(false);
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

  const handleRestart = () => {
    resetRunState();
    deleteSlot(activeSlotRef.current); // P4 — abandon the just-finished run's slot
    setScreen("menu");
  };

  // P4 — start a fresh run in slot i, clearing any prior occupant first.
  const beginRunInSlot = async (i) => {
    await deleteSlot(i);
    resetRunState();
    activeSlotRef.current = i; // this run auto-saves into slot i
    setSlotConfirm(null);
    setScreen("intro");
  };

  const handleFullReset = async () => {
    for (let i = 0; i < SLOT_COUNT; i++) { try { await window.storage.delete(slotKey(i)); } catch(e) {} }
    activeSlotRef.current = null;
    try { await window.storage.delete("ds_memories"); } catch(e) {}
    setRecoveredMemories([]);
    resetRunState();
    await refreshSlots();
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
  const allFull    = slots.every(Boolean); // P4 — every slot occupied (overwrite needed for a new run)

  if (screen === "intro") return (
    <div style={{ background:"#070707", minHeight:"100vh", fontFamily:font, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"2.5rem", userSelect:"none" }}>
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
    <div style={{ background:"#070707", minHeight:"100vh", fontFamily:font, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"2.5rem", userSelect:"none" }}>
      <style>{`${FONT_IMPORT}${KEYFRAMES_FI}@keyframes sigpulse{0%,100%{opacity:0.78}50%{opacity:1}}.rb:hover{border-color:#4a9e6b!important;color:#4a9e6b!important}`}</style>
      {muteBtn({ position:"fixed", top:"1rem", right:"1rem" })}
      {/* Logo: DEAD (powered-down grey) + SIGNAL (live green glow), one word */}
      <div style={{ fontSize:"2.4rem", fontWeight:700, letterSpacing:"0.12em", marginBottom:"3rem", animation:"fi 1.2s ease forwards" }}>
        <span style={{ color:"#4a4a4a" }}>DEAD</span><span style={{ color:"#4a9e6b", textShadow:"0 0 10px rgba(74,158,107,0.6), 0 0 26px rgba(74,158,107,0.25)", animation:"sigpulse 3s ease infinite" }}>SIGNAL</span>
      </div>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"stretch", gap:"0.7rem", width:"230px" }}>
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
        <div style={{ minHeight:"0.9rem", textAlign:"center", color:"#505050", fontSize:"0.58rem", letterSpacing:"0.14em", marginTop:"0.3rem" }}>{menuNote}</div>
      </div>
    </div>
  );

  // ─── Slot screen — 3-save picker. START picks/overwrites a slot; LOAD resumes one.
  if (screen === "slots") return (
    <div style={{ background:"#070707", minHeight:"100vh", fontFamily:font, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"2.5rem", userSelect:"none" }}>
      <style>{`${FONT_IMPORT}${KEYFRAMES_FI}.rb:hover{border-color:#4a9e6b!important;color:#4a9e6b!important}.del:hover{border-color:#5a2020!important;color:#e08a8a!important}`}</style>
      {muteBtn({ position:"fixed", top:"1rem", right:"1rem" })}
      <div style={{ fontSize:"0.78rem", fontWeight:600, letterSpacing:"0.26em", marginBottom:"2rem", color:"#6a6a6a", animation:"fi 0.8s ease forwards" }}>
        {slotMode === "load" ? "LOAD GAME" : "NEW RUN — SELECT SLOT"}
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:"0.7rem", width:"320px" }}>
        {slots.map((m, i) => {
          const occupied   = !!m;
          const delPending = slotConfirm && slotConfirm.index === i && slotConfirm.action === "delete";
          const ovrPending = slotConfirm && slotConfirm.index === i && slotConfirm.action === "overwrite";
          return (
            <div key={i} style={{ border:"1px solid #1c1c1c", padding:"0.7rem 0.85rem", display:"flex", flexDirection:"column", gap:"0.5rem", animation:"fi 0.8s ease forwards" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline" }}>
                <span style={{ color:"#7a7a7a", fontSize:"0.6rem", letterSpacing:"0.18em" }}>SLOT {i + 1}</span>
                {occupied && <span style={{ color:"#c8b98a", fontSize:"0.62rem", letterSpacing:"0.07em" }}>DAY {m.day} · {m.location}</span>}
              </div>
              {occupied ? (
                <>
                  <div style={{ display:"flex", gap:"1.2rem", fontSize:"0.6rem", letterSpacing:"0.06em", color:"#6a6a6a" }}>
                    <span>HP {m.hp}/10</span><span>BATT {m.battery}</span>
                  </div>
                  <div style={{ display:"flex", gap:"0.5rem" }}>
                    {/* Occupied slots load the save (continue) in both modes. */}
                    <button className="rb" onClick={withMenuSound(()=>{ clearPending(); resumeSlot(i); })}
                      style={{ flex:1, background:"transparent", border:"1px solid #1d3a22", color:"#4a9e6b", padding:"0.45rem", fontFamily:"inherit", fontSize:"0.64rem", letterSpacing:"0.12em", cursor:"pointer", transition:"all 0.2s" }}>
                      {slotMode === "load" ? "▸ LOAD" : "▸ CONTINUE"}
                    </button>
                    <button className="del" onClick={withMenuSound(()=>{ if (delPending) deleteSlot(i); else setSlotConfirm({ index:i, action:"delete" }); })}
                      style={{ background:"transparent", border:`1px solid ${delPending ? "#5a2020" : "#2a2a2a"}`, color: delPending ? "#e08a8a" : "#7a5a5a", padding:"0.45rem 0.7rem", fontFamily:"inherit", fontSize:"0.64rem", letterSpacing:"0.1em", cursor:"pointer", transition:"all 0.2s" }}>
                      {delPending ? "DELETE?" : "DELETE"}
                    </button>
                  </div>
                  {/* Overwrite is only needed in START mode when no empty slot is left. */}
                  {slotMode === "start" && allFull && (
                    <button className="rb" onClick={withMenuSound(()=>{ if (ovrPending) beginRunInSlot(i); else setSlotConfirm({ index:i, action:"overwrite" }); })}
                      style={{ background:"transparent", border:`1px solid ${ovrPending ? "#5a4a20" : "#2a2a2a"}`, color: ovrPending ? "#c8a840" : "#7a7050", padding:"0.45rem", fontFamily:"inherit", fontSize:"0.6rem", letterSpacing:"0.1em", cursor:"pointer", transition:"all 0.2s" }}>
                      {ovrPending ? "OVERWRITE?" : "OVERWRITE — START FRESH"}
                    </button>
                  )}
                </>
              ) : (
                slotMode === "start" ? (
                  <button className="rb" onClick={withMenuSound(()=>{ beginRunInSlot(i); })}
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
      <div style={{ background:"#070707", minHeight:"100vh", fontFamily:font, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"2.5rem", userSelect:"none" }}>
        <style>{`${FONT_IMPORT}${KEYFRAMES_FI}.rb:hover{border-color:#4a9e6b!important;color:#4a9e6b!important}`}</style>
        {muteBtn({ position:"fixed", top:"1rem", right:"1rem" })}
        <div style={{ display:"flex", flexDirection:"column", gap:"0.1rem", textAlign:"center" }}>
          {lines.map((l,i) => <p key={i} style={{ color:colors(i), fontSize:"0.9rem", lineHeight:"2.2", letterSpacing:"0.06em", animation:"fi 1s ease forwards", margin:0, fontWeight:300 }}>{l}</p>)}
          {screen === "phase2_complete" && showRestart && (
            <p style={{ color:"#505050", fontSize:"0.72rem", marginTop:"1.5rem", letterSpacing:"0.14em", animation:"fi 1s ease forwards" }}>— to be continued —</p>
          )}
          {screen === "offline" && lastMessage && lines.length >= 3 && (
            <p style={{ color:"#1a1a1a", fontSize:"0.68rem", marginTop:"1.5rem", letterSpacing:"0.06em", fontWeight:300 }}>last sent: "{lastMessage}"</p>
          )}
        </div>
        {showRestart && (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"0.7rem", marginTop:"3rem" }}>
            {screen === "phase2_complete" ? (<>
              {/* Finishing is the only place memories can be kept. */}
              <button className="rb" onClick={withMenuSound(handleRestart)} style={{ background:"transparent", border:"1px solid #3a3a3a", color:"#606060", padding:"0.65rem 1.5rem", fontFamily:"inherit", fontSize:"0.72rem", letterSpacing:"0.12em", cursor:"pointer", transition:"all 0.2s" }}>play again · keep memories</button>
              <button className="rb" onClick={withMenuSound(handleFullReset)} style={{ background:"transparent", border:"1px solid #2a2a2a", color:"#444444", padding:"0.5rem 1.5rem", fontFamily:"inherit", fontSize:"0.64rem", letterSpacing:"0.1em", cursor:"pointer", transition:"all 0.2s" }}>full reset · clear everything</button>
            </>) : (
              /* Death / battery-offline: save + memories already wiped on entry; just go home. */
              <button className="rb" onClick={withMenuSound(handleRestart)} style={{ background:"transparent", border:"1px solid #3a3a3a", color:"#606060", padding:"0.65rem 1.5rem", fontFamily:"inherit", fontSize:"0.72rem", letterSpacing:"0.12em", cursor:"pointer", transition:"all 0.2s" }}>▸&nbsp;&nbsp;return to title</button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ background:"#070707", height:"100vh", fontFamily:font, color:"#d8c79b", display:"flex", flexDirection:"column", maxWidth:"620px", margin:"0 auto", overflow:"hidden" }}>
      <style>{`${FONT_IMPORT}${KEYFRAMES_FI}@keyframes pu{0%,100%{opacity:1}50%{opacity:.3}}@keyframes flash{0%,100%{opacity:1}50%{opacity:.2}}@keyframes slowflash{0%,100%{opacity:1}50%{opacity:.08}}@keyframes sigflicker{0%,100%{opacity:1}40%{opacity:.05}65%{opacity:.7}}@keyframes sigpulse{0%,100%{opacity:0.75}50%{opacity:1}}@keyframes battpop{0%{transform:scale(1)}30%{transform:scale(1.28)}100%{transform:scale(1)}}.cb:hover{border-color:#4a9e6b!important;color:#4a9e6b!important}::-webkit-scrollbar{width:2px}::-webkit-scrollbar-track{background:#070707}::-webkit-scrollbar-thumb{background:#242424}`}</style>

      {/* Top utility bar: DEAD SIGNAL far left · menu button centered · fragments/battery right */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"0.4rem 1rem 0.25rem", flexShrink:0 }}>
        <div style={{ flex:1, minWidth:0, display:"flex", alignItems:"center", gap:"0.4rem" }}>
          <span style={{ color:"#4a9e6b", fontSize:"0.72rem", fontWeight:700, letterSpacing:"0.22em", textShadow:"0 0 9px rgba(74,158,107,0.65), 0 0 22px rgba(74,158,107,0.3)" }}>DEAD SIGNAL</span>
          <span style={{ fontSize:"0.72rem", lineHeight:1, letterSpacing:"0.02em" }}>
            {["▂","▃","▄","▅","▆"].map((b,i) => <span key={i} style={{ color: i < signalLevel ? "#4a9e6b" : "#282828", textShadow: i < signalLevel ? "0 0 5px rgba(74,158,107,0.7)" : "none", animation: (sigFlicker || noise >= 4) && i < signalLevel ? "sigflicker 0.18s ease infinite" : i < signalLevel ? "sigpulse 3s ease infinite" : "none" }}>{b}</span>)}
          </span>
        </div>
        <button className="cb" onClick={withMenuSound(()=>{ setMenuMsg(""); setConfirmReset(false); setMenuOpen(true); })} title="menu" aria-label="menu"
          style={{ flexShrink:0, background:"transparent", border:"1px solid #1c1c1c", color:"#6a6a6a", fontFamily:"inherit", fontSize:"0.7rem", lineHeight:1, padding:"0.15rem 0.5rem", cursor:"pointer", transition:"border-color 0.15s, color 0.15s" }}>☰</button>
        <div style={{ flex:1, minWidth:0, display:"flex", alignItems:"center", justifyContent:"flex-end", gap:"0.6rem" }}>
          <span style={{ color:"#2a7a4a", fontSize:"0.58rem", letterSpacing:"0.07em" }}>
            ◈ FRAGMENTS <span style={{ color: fragCount > 0 ? "#4a9e6b" : "#1e4a2e", textShadow: fragCount > 0 ? "0 0 6px rgba(74,158,107,0.5)" : "none" }}>{fragCount}/9</span>
          </span>
          <span style={{ color:"#2a6070", fontSize:"0.58rem", letterSpacing:"0.07em" }}>
            ◉ CLUES <span style={{ color: clueCount > 0 ? "#4ab5c8" : "#1d3a42", textShadow: clueCount > 0 ? "0 0 6px rgba(74,181,200,0.5)" : "none" }}>{clueCount}/3</span>
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
          {resources.charger !== null && <span style={{ color:resources.charger>0?"#3a6b40":"#484848" }}>charger {resources.charger>0?`${resources.charger}%`:"empty"}</span>}
        </div>
      )}

      {/* Messages */}
      <div style={{ flex:1, overflowY:"auto", padding:"0.6rem 0.9rem", display:"flex", flexDirection:"column", gap:"0.4rem", minHeight:0 }}>
        {messages.map(m => <MessageRow key={m.id} m={m} />)}
        {isTyping && <div style={{ alignSelf:"flex-start", padding:"0.48rem 0.9rem", background:"#0d0d0d", border:"1px solid #222", color:"#333", fontSize:"0.84rem", animation:"pu 1.1s ease infinite" }}>· · ·</div>}
        <div ref={bottomRef} />
      </div>

      {resources.battery<=10 && resources.battery>0 && <div style={{ padding:"0.35rem 1rem", background:"#0e0404", borderTop:"1px solid #2a0a0a", fontSize:"0.65rem", letterSpacing:"0.1em", color:"#8b2020", animation:battAnim }}>▸ battery critical — find a charger</div>}

      {choices.length>0 && !isTyping && (
        <div style={{ padding:"0.6rem 1rem 1rem", borderTop:"1px solid #111", display:"flex", flexDirection:"column", gap:"0.4rem", flexShrink:0 }}>
          {choices.map((c,i) =>
            c==="·"
              ? <button key={i} className="cb" onClick={()=>handleChoice(c)} style={{ background:"transparent", border:"none", color:"#252525", padding:"0.5rem", textAlign:"center", cursor:"pointer", fontFamily:"inherit", fontSize:"1rem", letterSpacing:"0.4em", width:"100%", transition:"color 0.15s" }}>· · ·</button>
              : <button key={i} className="cb" onClick={()=>handleChoice(c)} style={{ background:"transparent", border:"1px solid #1c1c1c", color:"#c8b98a", padding:"0.55rem 0.9rem", textAlign:"left", cursor:"pointer", fontFamily:"inherit", fontSize:"0.78rem", fontWeight:300, letterSpacing:"0.04em", lineHeight:"1.5", transition:"border-color 0.15s, color 0.15s" }}>
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
            {/* Restart · full wipe — two-tap confirm. Clears the save AND fragments/clues. */}
            <button onClick={withMenuSound(()=>{ if (confirmReset) { handleFullReset(); } else { setConfirmReset(true); setMenuMsg("tap again — wipes save & memories"); } })}
              style={{ ...menuBtn, color: confirmReset ? "#e08a8a" : "#a87a7a", border:`1px solid ${confirmReset ? "#5a2020" : "#3a2020"}` }}>
              {confirmReset ? "Confirm — wipe everything?" : "Restart · wipe save"}
            </button>
            <div style={{ minHeight:"0.9rem", textAlign:"center", color:"#4a9e6b", fontSize:"0.58rem", letterSpacing:"0.12em", marginTop:"0.2rem" }}>{menuMsg}</div>
          </div>
        </div>
      )}
    </div>
  );
}
