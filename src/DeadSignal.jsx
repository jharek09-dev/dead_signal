import { useState, useEffect, useLayoutEffect, useRef, memo } from "react";
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

const DAY1_OPENING = {
  msgs: ["found a phone. don't know whose.", "you were the last call on it. you still alive?"],
  choices: ["Yeah. I'm here. I don't remember anything.", "Alive. I don't know where I am or what happened."],
};

const DAY1_FLAGS = {
  STARTED: "started",
  CHARGER: "charger",
  SUPPLIES: "supplies",
  BATHROOM: "bathroom",
  WINDOW: "window",
  DOOR: "door_secured",
  STAIRWELL: "stairwell",
  ELLIE: "ellie",
  BROADCAST: "broadcast",
  MAP: "map",
};
const DAY1_REQUIRED = [DAY1_FLAGS.CHARGER, DAY1_FLAGS.SUPPLIES, DAY1_FLAGS.DOOR, DAY1_FLAGS.ELLIE, DAY1_FLAGS.BROADCAST];
const DAY1_ROUTE_CHOICES = ["Head for Mercy General. [power still on]", "Take Harwick Metro. [underground]", "Follow Route 9. [open highway]"];
// Two caps, two jobs. MAX_VISIBLE_CHOICES (4) is the Day-1 menu DESIGN target — those menus
// are built to fit it by construction. HARD_CHOICE_CAP (5) is the runtime safety limit: the
// Phase-3 map legitimately presents 5 (gate_yard, fully-unlocked outer_road, room+search),
// so the enforcement layer must never truncate below that — a cut exit is an unreachable
// node (the 4-cap made Phase 3 unwinnable: gate_yard's "Out to the road." was dropped).
const MAX_VISIBLE_CHOICES = 4;
const HARD_CHOICE_CAP = 5;

const PATH_BEATS = {
  hospital: [
    { msgs: ["mercy general is 6 blocks east.", "stay close to the buildings. don't stop moving.", "power's still on in there. but those halls carry sound. whatever hears you stays close."],
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
    { msgs: ["on-ramp is four blocks north of you.", "open road. good and bad. keep moving.", "nothing to charge from out there. but it's open — sound just goes."],
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
    choices: ["Haven mentioned by name two weeks before the broadcast started. *Two weeks.* [examine broadcast log]"],
    onChoice: "DISCOVERY_METRO",
  },
  route9: {
    from: "narrator",
    msgs: ["a checkpoint barrier. guard booth empty.", "a patrol truck stopped at the gate. coffee cold on the dash.", "clipboard face-down on the seat."],
    choices: ["Deployment order. *Personnel reassigned to Project Haven.* Dated the week before any of this. [examine deployment order]"],
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
    { from:"ellie",    msgs:["the broadcast's getting clearer.", "you're closing in."],      choices:["Good.","Keep guiding me.","Almost there."] },
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
// Battery warnings stay Ellie's voice (the phone is her line to you). Body/survival warnings
// (injury/food/water) are the game's voice — narrator (centered, diegetic), never Ellie, since
// she can't know your physical state.
const STATE_LINES = {
  battery_critical: { from:"ellie", pool:[
    ["your battery.", "find power or i lose you."],
    ["you're about to go dark.", "i can't follow you into that."],
    ["the screen's dying.", "please. find something. anything."],
  ], choices:["Keep moving.","Find power."] },
  battery_low: { from:"ellie", pool:[
    ["battery's getting low.", "watch it."],
    ["you're burning power.", "don't waste it."],
    ["keep an eye on that battery.", "i don't like how low it's getting."],
  ], choices:["Keep moving.","Watch it."] },
  injured_bad:      { from:"narrator", msgs:["the bleeding hasn't stopped.", "you're slowing down."], choices:["Push on."] },
  low_food:         { from:"narrator", msgs:["your stomach is hollow.", "it's been too long since you ate."], choices:["Keep moving."] },
  low_water:        { from:"narrator", msgs:["your mouth is dry.", "you need water soon."],   choices:["Keep moving."] },
};

// ─── HAVEN PHASE 2C ───────────────────────────────────────────────────────────

const HAVEN_APPROACH_BEATS = [
  { from:"ellie",
    msgs:["the broadcast's stronger now.", "you're close."],
    choices:["How close?", "I can feel it."] },
  { from:"narrator",
    msgs:["the city thins out.", "buildings give way to service roads and dead grass."],
    choices:["Keep moving."] },
  { from:"ellie",
    msgs:["follow the road north.", "there should be a fence line before the compound."],
    choices:["How do you know that?", "Following it north."] },
  // Ellie crack — she volunteers unease about her own knowledge (STORY.md §3/§4: slow,
  // sparse, no exposition). The first time the player has reason to doubt her.
  { from:"ellie",
    msgs:["...", "i don't know how i know that.", "i don't know how i know any of this."],
    choices:["Ellie?", "Keep moving."] },
  { from:"narrator",
    msgs:["the phone buzzes in your hand.", "not a message.", "just pressure behind the screen."],
    choices:["The Signal?", "Ignore it. Keep walking."], effect:"signal" },
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

// Haven is the first CRACK, not the answer — and an explorable HUB (Phase-3 foundation).
// You navigate a small compound of named destinations, each holding one reveal. These are
// OPTIONAL (full-freedom exploring); the route-specific `records` beat ties Ellie to the
// player's own evidence — the personal hook of the crack. We deliberately do NOT spell it out
// with a "you see her / labeled" dump; the player infers and carries the question into Phase 3.
// `path:true` swaps in the route-specific reveal at render time.
const HAVEN_DESTINATIONS = [
  { id:"operations",  label:"Operations building",
    msgs:["monitors still running. chairs empty.", "a loop plays on every screen.", "the haven broadcast. the one that brought you here.", "every monitor in the room, playing it back."] },
  { id:"dormitories", label:"The dormitories",
    msgs:["rows of bunks. all made.", "numbers stenciled by hand above each one.", "the last one reads 143."] },
  // `after` = Ellie's reaction once the narrator beat lands — her crack at the faces she
  // shouldn't know (re-homed from the old free-roam haven pool; STORY.md §3/§4: sparse unease).
  { id:"photos",      label:"The photo wall",
    msgs:["a corkboard. photographs.", "haven residents. everyone smiling.", "a date in the corner.", "three weeks before day one."],
    after:["i missed this place.", "i don't know why i said that."] },
  // Kim seed (STORY.md §3) — plant her shadow without naming her. "K.A." only. No 143, no reveal.
  { id:"comms",       label:"Communications desk",
    msgs:["a communications desk.", "a headset still plugged in.", "tape on the monitor.", "K.A."] },
  { id:"records",     label:"Records office", path:true },
];
// The route-specific reveal shown at the Records office — ties Ellie to the evidence the
// player surfaced on their leg. (Was inserted into the old linear finale; now a destination.)
const HAVEN_RECORDS_BEAT = {
  hospital: ["a second file is clipped behind yours.", "her face is on it too.", "same building. before any of this."],
  metro:    ["the broadcast log from the metro.", "her voice logged it.", "two weeks before the loop started."],
  route9:   ["a deployment order from the checkpoint.", "her name is on the roster.", "assigned here. before day one."],
};

// The CRACK + the call. Reached only via "Move on — to the heart of it" (gated ending), so the
// impossible record always lands (STORY.md §3 — paid off as a contradiction, not an explanation).
const HAVEN_FINAL_SEQUENCE = [
  { from:"narrator", msgs:["a control room, deeper in.", "a status board on the wall. still lit.", "RESIDENTS  143", "PRESENT  143", "you're the only one here."], choices:["·"], effect:"record143" },
];
const HEART_LABEL = "Move on — to the heart of it.";

// ─── PHASE 3 — the invisible region map (hub & spoke from Haven; STORY.md §5) ────────
// Phase 3 is the open investigation. The player never sees a literal map — geography is
// IMPLIED by a node graph: every region is rooms/exits with real adjacency, so every
// movement choice correlates to where you actually are ("through the gate, across the
// dining hall, into the dorms, back to the yard, out to the road"). Movement reuses the
// chat choice list + scheduleMessages, so it autosaves/resumes like any decision point.
//
// Node shape:
//   label   — short room name (HUD / prose)
//   kind    — "hub" | "room" | "exit"
//   power   — true → topping station; entering tops a low battery to PHASE3_POWER_FLOOR
//   onEnter — first-visit beats [{from, msgs}]; revisit — shorter return beats (optional)
//   ellie   — optional sparse Ellie crack line(s), text-message voice (STORY.md §3/§4)
//   caseFile.raise — question/fact keys raised on first visit (real keys announce a NEW
//             QUESTION card + show in OPEN QUESTIONS; silent keys only gate KNOWN FACTS)
//   exits   — [{label, to}]  in-region moves  |  [{label, region, locked, hidden}] region exits
//
// 3A ships Haven only. Other regions are metadata placeholders (no nodes) — filled in
// 3B–3E. Haven establishes the hub + investigation seeds; it does NOT pay off the Ellie
// truth (that's 3F). Spoiler discipline holds: 143 motif, no bodies, lights on, Ellie's
// shell thinning in tiny cracks, never acting in physical space.
const PHASE3_REGIONS = {
  haven: {
    id: "haven", label: "The Haven", truth: "ellie", entryNode: "gate_yard", unlocked: true,
    nodes: {
      gate_yard: {
        label: "Gate Yard", kind: "hub", power: true,
        onEnter: [{ from: "narrator", msgs: ["the yard, inside the open gate.", "floodlights still burning. nothing moves.", "a charging rack by the dead terminals — still live."] }],
        revisit: [{ from: "narrator", msgs: ["back in the yard. the floodlights don't blink."] }],
        caseFile: { raise: ["p3_powered"] },
        exits: [
          { label: "Cross to the dining hall.", to: "dining_hall" },
          { label: "Head for the dormitories.", to: "dormitories" },
          { label: "Enter the operations building.", to: "operations" },
          { label: "Down to the generator room.", to: "generator_room" },
          { label: "Out to the road.", to: "outer_road" },
        ],
      },
      dining_hall: {
        label: "Dining Hall", kind: "room",
        onEnter: [{ from: "narrator", msgs: ["the dining hall.", "trays still out. food gone grey.", "a mug of coffee, a skin set on top.", "they left in the middle of a meal. no one cleared a plate."] }],
        revisit: [{ from: "narrator", msgs: ["the cold dining hall. the trays haven't moved."] }],
        caseFile: { raise: ["p3_livedin"] },
        exits: [
          { label: "Back to the gate yard.", to: "gate_yard" },
          { label: "Through to the dormitories.", to: "dormitories" },
          { label: "Follow the hum to the generator room.", to: "generator_room" },
        ],
      },
      dormitories: {
        label: "Dormitories", kind: "room", shelter: true,
        onEnter: [{ from: "narrator", msgs: ["rows of bunks. all made.", "numbers stenciled by hand above each one.", "a watch on a pillow. a paperback, dog-eared.", "the last bunk reads 143."] }],
        revisit: [{ from: "narrator", msgs: ["the bunks again. 143, made, empty."] }],
        ellie: ["someone slept there.", "i don't know how i know that."],
        caseFile: { raise: ["p3_143everywhere"] },
        exits: [
          { label: "Back to the gate yard.", to: "gate_yard" },
          { label: "Back to the dining hall.", to: "dining_hall" },
          { label: "Down the corridor of photos.", to: "photo_wall" },
        ],
      },
      photo_wall: {
        label: "Photo Wall", kind: "room",
        onEnter: [{ from: "narrator", msgs: ["a corridor of corkboard. photographs, edge to edge.", "haven residents. everyone smiling.", "a date in the corner. three weeks before day one."] }],
        revisit: [{ from: "narrator", msgs: ["the wall of faces. all still smiling."] }],
        ellie: ["i remember the light in there.", "..."],
        caseFile: { raise: ["p3_ellie_knows"] },
        exits: [
          { label: "Back to the dormitories.", to: "dormitories" },
          { label: "Through to operations.", to: "operations" },
        ],
      },
      operations: {
        label: "Operations", kind: "room",
        onEnter: [{ from: "narrator", msgs: ["the operations building.", "monitors still running. the haven broadcast, looping on every screen.", "the control room, deeper in — where the call found you.", "the status board still reads 143. present."] }],
        revisit: [{ from: "narrator", msgs: ["operations. the loop still plays to no one."] }],
        exits: [
          { label: "Back to the gate yard.", to: "gate_yard" },
          { label: "Back to the photo wall.", to: "photo_wall" },
          { label: "Over to the communications desk.", to: "communications_desk" },
          { label: "Into the records office.", to: "records_office" },
        ],
      },
      communications_desk: {
        label: "Comms Desk", kind: "room",
        onEnter: [{ from: "narrator", msgs: ["a communications desk, off the ops floor.", "a headset still plugged in.", "the terminal's logged in. one account. never signed off.", "tape on the monitor, hand-lettered. K.A."] }],
        revisit: [{ from: "narrator", msgs: ["the comms desk. K.A., still logged in."] }],
        caseFile: { raise: ["p3_kim"], unlocks: "comms" }, // Kim's station points to the array
        exits: [
          { label: "Back to operations.", to: "operations" },
          { label: "Across to the records office.", to: "records_office" },
        ],
      },
      records_office: {
        label: "Records Office", kind: "room", routeRecords: true, // onEnter pulled from PHASE3_RECORDS[path]
        revisit: [{ from: "narrator", msgs: ["the records office. your evidence and hers, filed together."] }],
        caseFile: { raise: ["p3_records"], unlocks: "mercy" }, // the records point you back at Mercy
        exits: [
          { label: "Back to operations.", to: "operations" },
          { label: "Over to the communications desk.", to: "communications_desk" },
        ],
      },
      generator_room: {
        label: "Generator Room", kind: "room", power: true,
        onEnter: [{ from: "narrator", msgs: ["the generator room.", "the hum you've heard since the gate.", "fuel drums, half full. topped up by hand, recently.", "this is why the lights never went out. someone kept it running."] }],
        revisit: [{ from: "narrator", msgs: ["the generator, still turning over. fuel still in the drums."] }],
        caseFile: { raise: ["p3_power"] },
        exits: [
          { label: "Back to the gate yard.", to: "gate_yard" },
          { label: "Up to the dining hall.", to: "dining_hall" },
        ],
      },
      outer_road: {
        label: "Outer Road", kind: "exit",
        onEnter: [{ from: "narrator", msgs: ["the road out of haven.", "past the gate, the dark spreads in every direction.", "harwick. and somewhere in it, the places your evidence pointed to.", "not yet. but the roads are there when you're ready."] }],
        revisit: [{ from: "narrator", msgs: ["the road out. harwick, waiting in the dark."] }],
        exits: [
          { label: "Back into the compound.", to: "gate_yard" },
          // Region exits — spokes from the Haven hub. All locked in 3A. The two regions the
          // player earned evidence for in the prologue are named; the rest stay hidden until
          // a later region surfaces them (no premature names for places never heard of).
          { label: "Mercy General — back east.", region: "mercy", locked: true },
          { label: "The Communications Array — the broadcast's source.", region: "comms", locked: true },
          { label: "City Hall.", region: "cityhall", locked: true, hidden: true },
          { label: "The Research Annex.", region: "annex", locked: true, hidden: true },
        ],
      },
    },
  },
  // ── Mercy General (3B) — truth: YOU. Who you were / why the wipe. Clinical, personal, dread.
  // The full personal payoff lands at room 312: you were Project Haven's architect and erased your
  // own memory here, out of guilt. It states ONLY your identity + the self-wipe — never what the
  // Signal is, never the 143 upload, never the infected (those are Comms / City Hall / Annex).
  // Mostly dark (only dark_ward has power) → battery tension is the dread; you recharge at Haven.
  mercy: {
    id: "mercy", label: "Mercy General", truth: "you", entryNode: "ambulance_bay", unlocked: false,
    nodes: {
      ambulance_bay: {
        label: "Ambulance Bay", kind: "hub",
        onEnter: [{ from: "narrator", msgs: ["mercy general. the way you came in, days ago — and long before that.", "the ambulance bay. rigs left with their doors open.", "past them, the power's dead. just your phone-light and what leaks through the windows."] }],
        revisit: [{ from: "narrator", msgs: ["the ambulance bay. the rigs haven't moved."] }],
        exits: [
          { label: "In through the lobby.", to: "lobby" },
          { label: "Out to the road — back toward Haven.", region: "haven" },
        ],
      },
      lobby: {
        label: "Lobby", kind: "room",
        onEnter: [{ from: "narrator", msgs: ["the lobby. triage tape still down on the floor.", "gurneys shoved against the wall. a clipboard. a cup of coffee gone to mould.", "the dark sits heavier in here. somewhere deep in the building, something hums."] }],
        revisit: [{ from: "narrator", msgs: ["the lobby again. the dark, the hum."] }],
        exits: [
          { label: "Back to the ambulance bay.", to: "ambulance_bay" },
          { label: "Down the administration wing.", to: "admin_wing" },
          { label: "Toward the sealed ward — where the hum is.", to: "dark_ward" },
        ],
      },
      admin_wing: {
        label: "Administration", kind: "room",
        onEnter: [{ from: "narrator", msgs: ["the administration wing. offices, doors ajar.", "a staff directory on the wall. names and titles.", "one of them is yours. and the title beside it: director.", "the corner office is yours too. your nameplate. a layer of dust on everything but the chair."] }],
        revisit: [{ from: "narrator", msgs: ["the admin wing. your name, still on the wall."] }],
        caseFile: { raise: ["p3_mercy_staff"] },
        exits: [
          { label: "Back to the lobby.", to: "lobby" },
          { label: "Into medical records.", to: "records_room" },
        ],
      },
      records_room: {
        label: "Medical Records", kind: "room",
        onEnter: [{ from: "narrator", msgs: ["medical records. drawers hanging open.", "your file is thick. years of it — staff, then patient.", "the last entry is an admission. self-admitted. you checked yourself in.", "the day before the broadcast started looping."] }],
        revisit: [{ from: "narrator", msgs: ["records. your file, where you left it open."] }],
        caseFile: { raise: ["p3_admit"] },
        exits: [
          { label: "Back to administration.", to: "admin_wing" },
          { label: "Through to the procedure suite.", to: "procedure_room" },
        ],
      },
      procedure_room: {
        label: "Procedure Suite", kind: "room",
        onEnter: [{ from: "narrator", msgs: ["a procedure suite. one chair, bolted to the floor.", "leads, straps, a tray of instruments laid out neat.", "the order on the tray: targeted memory ablation.", "the authorization line carries one signature. yours."] }],
        revisit: [{ from: "narrator", msgs: ["the procedure suite. the chair, waiting."] }],
        caseFile: { raise: ["p3_mercy_procedure"] },
        exits: [
          { label: "Back to records.", to: "records_room" },
          { label: "To the room at the end of the hall — 312.", to: "patient_room_312" },
        ],
      },
      patient_room_312: {
        label: "Room 312", kind: "room", truth: "you",
        onEnter: [{ from: "narrator", msgs: ["room 312. your name is on the door.", "you knew the weight of it before you touched the handle.", "a bed. a chair pulled close, like someone sat the whole time.", "on the table, a project haven badge. director. architect. yours.", "and a note, in your own handwriting: 'i built it. i can't carry what that means. let me forget.'", "you ran project haven. and when you couldn't live with it, you came here and had yourself erased."] }],
        revisit: [{ from: "narrator", msgs: ["room 312. your name on the door. your note on the table."] }],
        ellie: ["i remember you choosing it.", "i remember all of you."],
        caseFile: { raise: ["p3_mercy_truth"] },
        exits: [
          { label: "Back to the procedure suite.", to: "procedure_room" },
        ],
      },
      dark_ward: {
        label: "Sealed Ward", kind: "room", power: true, shelter: true,
        onEnter: [{ from: "narrator", msgs: ["a sealed ward. a generator grinds somewhere below it — the one thing still running.", "the only lit hallway in the building. the lights buzz, wrong, and hold.", "the doors are taped shut from the outside. you don't open them.", "a crash cart by the nurses' station. its battery still holds a charge."] }],
        revisit: [{ from: "narrator", msgs: ["the sealed ward. the lights still buzz. the doors stay shut."] }],
        exits: [
          { label: "Back to the lobby.", to: "lobby" },
        ],
      },
    },
  },
  // ── Communications Array (3C) — truth: the SIGNAL. Electromagnetic, wrong, humming. The payoff at
  // signal_core: the Signal is an upload network (minds copied in; the connected are inside it), the
  // 143 are in there, and the "KIM" texts have been a transmission — no hand ever held the phone.
  // HOLD: what Ellie *is* / that she chose it (finale); the outbreak / infected = half-connected
  // (Annex — do NOT foreshadow). Still transmitting → it has power (transmitter_hall recharges).
  comms: {
    id: "comms", label: "Communications Array", truth: "signal", entryNode: "array_gate", unlocked: false,
    nodes: {
      array_gate: {
        label: "Array Gate", kind: "hub",
        onEnter: [{ from: "narrator", msgs: ["the communications array. a fenced lot at the edge of harwick.", "dishes, and a single mast — red lights still blinking at the top.", "the hum reaches you before the gate does. you feel it in your teeth."] }],
        revisit: [{ from: "narrator", msgs: ["the array gate. the mast lights still blink. the hum hasn't stopped."] }],
        exits: [
          { label: "In among the dishes.", to: "dish_field" },
          { label: "Back down the access road — toward Haven.", region: "haven" },
        ],
      },
      dish_field: {
        label: "Dish Field", kind: "room",
        onEnter: [{ from: "narrator", msgs: ["rows of dishes, all turned the same way. west — toward the city.", "the air between them is wrong. a pressure. a whine just under hearing.", "your phone-light stutters when you cross the lines."] }],
        revisit: [{ from: "narrator", msgs: ["the dish field. every dish aimed west, holding."] }],
        exits: [
          { label: "Back to the gate.", to: "array_gate" },
          { label: "Into the control room.", to: "control_room" },
        ],
      },
      control_room: {
        label: "Control Room", kind: "room",
        onEnter: [{ from: "narrator", msgs: ["the control room. monitors mostly dead, one still scrolling.", "transmitter logs. the broadcast — your broadcast, the loop that called you here — originates from this room.", "same coordinates, same voice, going out on a timer since the first night. no one at the desk."] }],
        revisit: [{ from: "narrator", msgs: ["the control room. the loop still goes out to no one."] }],
        caseFile: { raise: ["p3_comms_loop"] },
        exits: [
          { label: "Back to the dish field.", to: "dish_field" },
          { label: "Into the operator's booth.", to: "kim_booth" },
          { label: "Down to the transmitter hall.", to: "transmitter_hall" },
        ],
      },
      kim_booth: {
        label: "Operator's Booth", kind: "room",
        onEnter: [{ from: "narrator", msgs: ["a booth off the floor. a headset on the desk, a chair shoved back hard.", "the log is open to the last manual transmission. operator: K.A.", "she broke protocol — an open channel, unencrypted, one line:", "\"don't let them put you in. it isn't sleep. i'm going to find him.\"", "timestamped the night the uploads began. then she logged off, and never logged back in."] }],
        revisit: [{ from: "narrator", msgs: ["the operator's booth. K.A.'s last line, still open on the log."] }],
        caseFile: { raise: ["p3_kim_refused"] },
        exits: [
          { label: "Back to the control room.", to: "control_room" },
        ],
      },
      transmitter_hall: {
        label: "Transmitter Hall", kind: "room", power: true, shelter: true,
        onEnter: [{ from: "narrator", msgs: ["the transmitter hall. the hum is a roar here, felt in the sternum.", "racks of hardware, indicator lights crawling. it draws its own power — it has never once stopped.", "a maintenance battery bank by the door, still holding a charge."] }],
        revisit: [{ from: "narrator", msgs: ["the transmitter hall. the roar, the crawling lights."] }],
        exits: [
          { label: "Back to the control room.", to: "control_room" },
          { label: "Through to the cold room behind it.", to: "signal_core" },
        ],
      },
      signal_core: {
        label: "Signal Core", kind: "room", truth: "signal",
        onEnter: [{ from: "narrator", msgs: ["a cold room behind the transmitters. server racks, frost on the housings.", "the logs aren't broadcasts. they're people — names, then patterns. minds, written down and kept running.", "the haven 143. they didn't die. they were copied in here, and they're still running.", "you look at your phone. every text ellie ever sent you.", "they came over kim's number — but no hand ever held that phone. the words were a transmission, reaching from in here."] }],
        revisit: [{ from: "narrator", msgs: ["the cold room. the racks hum. the minds keep running."] }],
        ellie: ["i can still hear them.", "all of them. all the time."],
        caseFile: { raise: ["p3_signal_uploadnet", "p3_phone", "p3_voice"] },
        exits: [
          { label: "Back to the transmitter hall.", to: "transmitter_hall" },
        ],
      },
    },
  },
  // ── City Hall (3D) — truth: PROJECT HAVEN (what it was / who authorized). Bureaucratic rot,
  // cover-up. RESTRAINED reveal: the charter, the 143 roster, the authorization (your signature as
  // architect) — cold documents; let the player feel it. HOLD: the moral "lifeboat for the few"
  // framing + cover-up extent (don't editorialize); what "the end" was; that Haven's Signal caused
  // the outbreak (→ Annex; not foreshadowed). Truth-gated: opens once the "you" truth (Mercy) lands.
  cityhall: {
    id: "cityhall", label: "City Hall", truth: "project_haven", entryNode: "rotunda", unlocked: false,
    nodes: {
      rotunda: {
        label: "Rotunda", kind: "hub",
        onEnter: [{ from: "narrator", msgs: ["city hall. marble steps, a flag limp on its pole.", "the doors stand open. a rotunda under a dead chandelier.", "evacuation notices taped to everything — and dates that stop, all on the same day."] }],
        revisit: [{ from: "narrator", msgs: ["the rotunda. the chandelier hangs dark."] }],
        exits: [
          { label: "Into the atrium.", to: "atrium" },
          { label: "Out the front steps — back toward Haven.", region: "haven" },
        ],
      },
      atrium: {
        label: "Atrium", kind: "room",
        onEnter: [{ from: "narrator", msgs: ["the atrium. service counters, a building directory behind cracked glass.", "paper everywhere — forms half-filled, a city's worth of unfinished business.", "the directory lists a department that's on no public sign: project haven. sub-level."] }],
        revisit: [{ from: "narrator", msgs: ["the atrium. paper drifts where the doors don't quite close."] }],
        caseFile: { raise: ["p3_ch_dept"] },
        exits: [
          { label: "Back to the rotunda.", to: "rotunda" },
          { label: "Into the clerk's records.", to: "records_room" },
          { label: "Up to the council chamber.", to: "council_chamber" },
        ],
      },
      records_room: {
        label: "Clerk's Records", kind: "room",
        onEnter: [{ from: "narrator", msgs: ["the records room. cabinets pulled open and stripped.", "but the project haven drawer is full. they didn't get to it — or weren't allowed.", "requisitions. budgets. a program with a line item and a city seal."] }],
        revisit: [{ from: "narrator", msgs: ["the records room. the project haven drawer, still full."] }],
        exits: [
          { label: "Back to the atrium.", to: "atrium" },
          { label: "Into the cold archive.", to: "cold_archive" },
          { label: "Through to the vault.", to: "charter_vault" },
        ],
      },
      cold_archive: {
        label: "Cold Archive", kind: "room", power: true, shelter: true,
        onEnter: [{ from: "narrator", msgs: ["a climate-controlled archive behind the records room. a generator keeps it cold.", "dry air, steady lights — the one room they kept running, for the paper.", "a charged battery pack sits in a cradle by the door."] }],
        revisit: [{ from: "narrator", msgs: ["the cold archive. the generator holds the chill."] }],
        exits: [
          { label: "Back to the records room.", to: "records_room" },
        ],
      },
      council_chamber: {
        label: "Council Chamber", kind: "room",
        onEnter: [{ from: "narrator", msgs: ["the council chamber. a dais, a horseshoe of empty seats, brass name placards.", "a vote is still up on the board: motion — project haven — approved.", "no public minutes. the gallery seats are chained off."] }],
        revisit: [{ from: "narrator", msgs: ["the council chamber. the motion still reads approved."] }],
        caseFile: { raise: ["p3_ch_authorized"] },
        exits: [
          { label: "Back to the atrium.", to: "atrium" },
          { label: "Through to the vault.", to: "charter_vault" },
        ],
      },
      charter_vault: {
        label: "Charter Vault", kind: "room", truth: "project_haven",
        onEnter: [{ from: "narrator", msgs: ["a secure records vault behind the chamber. a heavy door, left open.", "the project haven charter. its purpose, in plain language: preservation of personnel — minds, kept, before the end.", "a roster clipped to it. one hundred forty-three names. kim's is on it. lower down, yours.", "the authorization page. signatures — the council's, and at the bottom, as architect: yours."] }],
        revisit: [{ from: "narrator", msgs: ["the vault. the charter, the roster, your signature at the bottom."] }],
        ellie: ["i remember everyone.", "every name on it."],
        caseFile: { raise: ["p3_ch_truth", "p3_why143"] },
        exits: [
          { label: "Back to the records room.", to: "records_room" },
          { label: "Back to the council chamber.", to: "council_chamber" },
        ],
      },
    },
  },
  // ── Research Annex (3E) — truth: THE OUTBREAK. "the worst place; the answer." Blunt, NOT softened
  // (STORY.md §2): the outbreak = the Signal breaching Haven's containment; the infected = the
  // half-connected (people, minds half-pulled in); EVERY prologue FIGHT was putting down a person;
  // your Project Haven built the thing that did it. HOLD for the finale (3F): where the 143 went /
  // that they "walked out"; what Ellie *is* / that she chose it; the Accept/Refuse choice + your slot.
  annex: {
    id: "annex", label: "Research Annex", truth: "outbreak", entryNode: "annex_dock", unlocked: false,
    nodes: {
      annex_dock: {
        label: "Loading Dock", kind: "hub",
        onEnter: [{ from: "narrator", msgs: ["the research annex. the last building, set apart — fenced twice over.", "a loading dock. biohazard placards, a decon shower long dry.", "the quiet here is heavier. you don't want to go in. you go in."] }],
        revisit: [{ from: "narrator", msgs: ["the loading dock. the decon shower, still dry."] }],
        exits: [
          { label: "In through the airlock.", to: "airlock" },
          { label: "Back up the service road — toward Haven.", region: "haven" },
        ],
      },
      airlock: {
        label: "Containment Airlock", kind: "room",
        onEnter: [{ from: "narrator", msgs: ["a containment airlock. the inner door is off its frame — blown outward.", "whatever was sealed in here didn't get let out. it pushed.", "scorch and warping, all of it pointing toward the city."] }],
        revisit: [{ from: "narrator", msgs: ["the airlock. the door still hangs the wrong way."] }],
        caseFile: { raise: ["p3_an_breach"] },
        exits: [
          { label: "Back to the dock.", to: "annex_dock" },
          { label: "Into the labs.", to: "labs" },
        ],
      },
      labs: {
        label: "Research Labs", kind: "room",
        onEnter: [{ from: "narrator", msgs: ["the research labs. benches, terminals, a whiteboard wall.", "the work is everywhere, and it's familiar: the signal. uploading. preserving minds.", "your handwriting is on half of it. this is where you built it."] }],
        revisit: [{ from: "narrator", msgs: ["the labs. your handwriting, still on the boards."] }],
        caseFile: { raise: ["p3_an_lab"] },
        exits: [
          { label: "Back to the airlock.", to: "airlock" },
          { label: "Into the cold lab.", to: "cold_lab" },
          { label: "Down to the observation wing.", to: "observation" },
        ],
      },
      cold_lab: {
        label: "Cold Lab", kind: "room", power: true, shelter: true,
        onEnter: [{ from: "narrator", msgs: ["a server lab, sealed and cold, still running on its own line.", "the breach report sits open on a terminal: containment failure. signal — uncontained.", "a charged cell in a rack by the door."] }],
        revisit: [{ from: "narrator", msgs: ["the cold lab. the breach report, still on the screen."] }],
        caseFile: { raise: ["p3_an_report"] },
        exits: [
          { label: "Back to the labs.", to: "labs" },
        ],
      },
      observation: {
        label: "Observation Wing", kind: "room",
        onEnter: [{ from: "narrator", msgs: ["an observation wing. cells behind reinforced glass.", "the early subjects — when it was still being studied, one at a time.", "behind the glass: movement. slow. wrong. and unmistakably people. faces.", "the same wrongness that's out in the streets. the same that came at you on the way here."] }],
        revisit: [{ from: "narrator", msgs: ["the observation wing. behind the glass, they still move."] }],
        caseFile: { raise: ["p3_an_patientzero"] },
        exits: [
          { label: "Back to the labs.", to: "labs" },
          { label: "To the containment chamber at the heart of it.", to: "containment_core" },
        ],
      },
      containment_core: {
        label: "Containment Core", kind: "room", truth: "outbreak",
        onEnter: [{ from: "narrator", msgs: ["the containment chamber at the heart of the annex. the breach started here.", "the signal was never just a broadcast. it was a way in — minds copied, kept. haven did that cleanly, to its 143.", "here it got loose. uncontained. and it didn't take people whole — it took them halfway.", "mind half-pulled into the signal, the body left standing, moving, wrong. that is the outbreak. that is the infected.", "the things you fought through to reach haven — every one of them was a person. still half-alive in there. you didn't know. you do now.", "haven's 143 went in clean. the city got the spill. you built the thing that did both."] }],
        revisit: [{ from: "narrator", msgs: ["the containment core. the breach, where it began."] }],
        ellie: ["the ones in the street.", "i felt every one of them go out."],
        caseFile: { raise: ["p3_an_truth"] },
        exits: [
          { label: "Back to the observation wing.", to: "observation" },
        ],
      },
    },
  },
};
// Locked-region exit beats — terse, no spoilers (the gate, not the truth behind it).
const PHASE3_LOCKED_EXIT = {
  mercy:    ["mercy general. east, the way you came.", "not yet. you need a reason to walk back into that."],
  comms:    ["the array — wherever the broadcast comes from.", "you don't know the way. not yet."],
  cityhall: ["there's somewhere else. you can feel it.", "but you don't have what you'd need to find it."],
  annex:    ["somewhere this all started.", "you're not ready. not for that."],
};
// records_office is ROUTE-AWARE — it ties to the same evidence the player surfaced on their
// prologue leg (mirrors HAVEN_RECORDS_BEAT: file/face · log/voice · order/name), so the beat
// never claims a "file" or a "face" on a route that actually found a log or a deployment order.
const PHASE3_RECORDS = {
  hospital: ["the records office. resident files, a roster.", "your patient file is here — the one with your name on it.", "a second clipped behind it. her face. same building. before any of this."],
  metro:    ["the records office. resident files, a roster.", "the broadcast log from the metro is filed here.", "and logged beside it — her voice. two weeks before the loop. before any of this."],
  route9:   ["the records office. resident files, a roster.", "the deployment order from the checkpoint is filed here.", "and on the roster beside it — her name. assigned here. before any of this."],
};
// Region truths — each spoke pays off exactly one (STORY.md §5). Keyed by truth id; `line` is the
// one-sentence Case File crystallization shown in the TRUTHS section once uncovered. Later regions
// (signal/project_haven/outbreak) get their lines when those regions are built (3C–3E).
const PHASE3_TRUTHS = {
  you:           { title: "Who you were",          line: "you were the architect of Project Haven — and you erased your own memory rather than carry what you'd done." },
  ellie:         { title: "What Ellie is",            line: "Ellie went into the Signal when the uploads began — she's been reaching you from inside it the whole time. no hand ever held the phone. she's been holding your slot open." },
  signal:        { title: "What the Signal is",        line: "the Signal is an upload network — it copies a mind in; the connected aren't dead, they're inside it. the 143 are in there. and the texts were a transmission. no one ever held the phone." },
  project_haven: { title: "What Project Haven was",     line: "Project Haven was a sanctioned program to upload the 143 into the Signal before the end. the charter, the roster, the signatures — yours among them, as architect. official. real. yours." },
  outbreak:      { title: "The outbreak",               line: "the outbreak was the Signal breaching Haven's containment — it got into people, pulled them halfway in, left the bodies moving. the 'infected' were the half-connected. every one you put down was a person. you built the thing that did it." },
};
// Truth-gated region unlocks — uncovering a truth can open the next spoke (mid/late progression).
// "you" (Mercy) → City Hall: you learn you ran the project, so you go find who authorized it.
// (The Research Annex, 3E, will gate on a truth COUNT rather than a single id.)
const TRUTH_UNLOCKS = { you: "cityhall" };

// ─── Phase 3F — the finale: the Accept / Refuse ending ──────────────────────────────
// Triggered by a final call at Haven once all 4 truths are uncovered (bookends the prologue's
// first call). The call pays off the last held threads — what Ellie IS, that the 143 walked out
// (destination OPEN, §2), the no-body phone, and your held slot — then offers the binary choice
// canon built toward. Two ambiguous, definitive endings; neither "wins" (SOMA-tone).
const FINALE_CHOICE = "▸ the phone — it's ringing. answer it.";
const ACCEPT_CHOICE = "Let her take you in.";
const REFUSE_CHOICE = "Put the phone down.";
// The convergence call — a flat line list, played with cumulative delays (mirrors the prologue call).
const FINALE_CONVERGENCE = [
  { from:"narrator", text:"the phone rings." },
  { from:"narrator", text:"not a buzz this time. a call. the way it did that first night." },
  { from:"system",   text:"INCOMING CALL  —  ELLIE" },
  { from:"narrator", text:"you answer." },
  { from:"ellie",    text:"you found all of it." },
  { from:"ellie",    text:"then you know what i am now." },
  { from:"ellie",    text:"i went in. when the uploads started, i said yes. i'm in the signal — i have been the whole time." },
  { from:"ellie",    text:"no one's been holding this phone. it's just me, reaching." },
  { from:"ellie",    text:"the 143 didn't vanish. once they were copied clean they walked out — through the open gate, on their own feet. that's what a finished one does." },
  { from:"ellie",    text:"kim wouldn't come. she said it wasn't sleep. she stayed herself, and the city took her for it." },
  { from:"ellie",    text:"there's a slot here. the board still counts it. it's been yours since the start — i've been holding it open." },
  { from:"ellie",    text:"you don't have to be the last one out there. come in. i'll be here. all of us will." },
  { from:"narrator", text:"the phone is warm in your hand." },
  { from:"narrator", text:"it's the same choice kim made. you can feel it waiting." },
];
const FINALE_ACCEPT = [
  { from:"player",   text:"Okay. Okay." },
  { from:"ellie",    text:"okay. just stop holding on." },
  { from:"narrator", text:"you let go." },
  { from:"narrator", text:"it doesn't hurt. it's like a name being read off a list." },
  { from:"narrator", text:"then you're — everywhere. the 143. ellie. all of it at once. warm. together." },
  { from:"narrator", text:"you can hear them. all of them. all the time." },
  { from:"narrator", text:"somewhere a body slumps against a wall, phone still in its hand, eyes open. it doesn't get up." },
  { from:"narrator", text:"the 143 walked out. yours doesn't." },
  { from:"narrator", text:"you don't think about it. you're not out there anymore." },
  { from:"narrator", text:"or something that remembers being you isn't. it's hard to tell, in here. it doesn't seem to matter." },
];
const ACCEPT_ENDING_LINES = ["you went in.", "you are not alone anymore.", "you are not sure you are anyone at all."];
const FINALE_REFUSE = [
  { from:"narrator", text:"you set the phone down on the rack. screen up." },
  { from:"ellie",    text:"..." },
  { from:"ellie",    text:"okay." },
  { from:"narrator", text:"the call doesn't end. you just stop listening to it." },
  { from:"narrator", text:"the screen stays lit a while. then it doesn't." },
  { from:"narrator", text:"you're alone. really alone now — the only voice out here that's still a person." },
  { from:"narrator", text:"the city is dead. you will be too, before long. like kim. as yourself." },
  { from:"narrator", text:"you don't know if that was brave or just stubborn." },
  { from:"narrator", text:"kim refused, and the city killed her for it. you refused too. the difference is you got to choose it with your eyes open." },
];
const REFUSE_ENDING_LINES = ["you stayed.", "you are still yourself.", "for as long as that lasts."];

// Dev-only map integrity check (run once on mount when import.meta.env.DEV). Catches the
// classic node-graph mistakes so a new region/node can't silently soft-lock: exits that point
// nowhere, dead ends, and nodes unreachable from the region's entry. No-op in production.
const validatePhase3Map = () => {
  Object.values(PHASE3_REGIONS).forEach(region => {
    const nodes = region.nodes || {};
    const ids = Object.keys(nodes);
    if (!ids.length) return; // placeholder region (no nodes yet) — skip
    if (!nodes[region.entryNode]) console.warn(`[Phase3] ${region.id}: entryNode "${region.entryNode}" does not exist`);
    ids.forEach(id => {
      const exits = nodes[id].exits || [];
      if (!exits.length && nodes[id].kind !== "terminal") console.warn(`[Phase3] ${region.id}.${id}: dead end (no exits, not kind:"terminal")`);
      exits.forEach(e => {
        if (e.to && !nodes[e.to]) console.warn(`[Phase3] ${region.id}.${id}: exit → "${e.to}" (no such node)`);
        if (e.region && !PHASE3_REGIONS[e.region]) console.warn(`[Phase3] ${region.id}.${id}: region exit → "${e.region}" (no such region)`);
        if (!e.to && !e.region) console.warn(`[Phase3] ${region.id}.${id}: exit "${e.label}" has neither to nor region`);
      });
    });
    // Reachability from entryNode (in-region `to` edges only).
    const seen = new Set(), stack = [region.entryNode];
    while (stack.length) { const n = stack.pop(); if (seen.has(n) || !nodes[n]) continue; seen.add(n); (nodes[n].exits || []).forEach(e => e.to && stack.push(e.to)); }
    ids.forEach(id => { if (!seen.has(id)) console.warn(`[Phase3] ${region.id}.${id}: unreachable from entryNode "${region.entryNode}"`); });
    // Choice-cap audit (mirrors showPhase3Exits): worst case per node = all exits visible
    // (hidden ones unlock) + finale (haven gate_yard) + bed-down (shelter at dusk). The
    // display layer may hide plain in-region rooms when over HARD_CHOICE_CAP, but region
    // exits / doors to them (dest kind "exit") / priority beats never cut — so that
    // protected set has to fit, and local rooms must stay reachable some other way.
    ids.forEach(id => {
      const exits = nodes[id].exits || [];
      const priority = (region.id === "haven" && id === "gate_yard" ? 1 : 0) + (nodes[id].shelter ? 1 : 0);
      const protectedCount = priority + exits.filter(e => e.region || (e.to && nodes[e.to]?.kind === "exit")).length;
      if (protectedCount > HARD_CHOICE_CAP)
        console.warn(`[Phase3] ${region.id}.${id}: ${protectedCount} never-cut choices exceed the ${HARD_CHOICE_CAP}-choice cap — exits would be unreachable`);
      else if (exits.length > HARD_CHOICE_CAP)
        console.warn(`[Phase3] ${region.id}.${id}: ${exits.length} exits — tail rooms permanently hidden by the ${HARD_CHOICE_CAP}-choice cap`);
    });
  });
};

// ─── Investigation board — the persistent case file (Phase-3 foundation). ───────────
// Entries reveal as the matching fragment/clue is collected; People/Locations/Questions
// are scaffolded now and deepen in Phase 3. Kept deliberately sparse — Haven cracks the
// mystery, it doesn't answer it. reveal(clues:Set<string>, reached:boolean) → boolean.
const ALL_FRAGMENT_NAMES = Object.values(MEMORY_FRAGMENT_POOLS).flat().map(f => f.name); // all 9
const FRAGMENT_BY_NAME = Object.fromEntries(Object.values(MEMORY_FRAGMENT_POOLS).flat().map(f => [f.name, f])); // board drop-downs replay the flashback
const BOARD_CLUES = [
  { name:"Patient File",  note:"mercy general. the name on it is yours." },
  { name:"Broadcast Log", note:"haven was named two weeks before the broadcast." },
  { name:"Project Haven", note:"personnel reassigned to project haven. before day one." },
];
const BOARD_PEOPLE = [
  { name:"Ellie", note:(c, reached, raised, truths) =>
      truths?.includes?.("signal") ? "she reaches you from inside the Signal — a transmission, not a hand on a phone. whether what's left is still her, you don't know yet."
      : "the voice. she says she remembers you." },
  // Kim deepens by progress but stays a QUESTION. Her full identity (Kim Alvarez — Haven comms
  // tech, one of the 143, Ellie's closest friend who rejected the Signal) is a PHASE 3 reveal,
  // kept out of the prologue (STORY.md §3). The `reached` tier ties her to the 143 as a question.
  { name:"Kim", note:(c, reached, raised) =>
      raised?.includes?.("p3_kim_refused") ? "Kim Alvarez — comms tech, one of the 143. her last transmission: she refused the upload ('it isn't sleep') and went to find the architect — you. she never connected. she died as herself."
      : raised?.includes?.("p3_kim") ? "K.A. — her station at haven, still logged in. she worked the comms here. you've stood at her chair. you called her the night it began. and the 143 — was she one of them?"
      : reached ? "her number is the one that texts you. you called her the night it began. and the 143 at haven — was she one of them? you don't know."
      : c.has("Patient File") ? "her name was already saved in your phone. you knew her. you don't remember her."
      : "you were found on her phone. you called her, right before. who was she?" },
  { name:"You",   note:(c, reached, raised, truths) =>
      truths?.includes?.("outbreak") ? "the architect of Project Haven. you built the Signal — and when it breached, it became the outbreak. the 143 went in clean; the city, and everyone in it, was the spill. all of it traces back to you. you couldn't carry it, so you made yourself forget."
      : truths?.includes?.("you") ? "the architect of Project Haven. you ran it — then you admitted yourself to Mercy and had your own memory erased. you couldn't carry what you'd built."
      : "no memory. the evidence keeps pointing back at you." },
];

// Phase 3 = hub & spoke from Haven; each region holds one truth (STORY.md §5). The Case File
// previews only the regions the player has *earned* in the prologue — City Hall / Research Annex
// stay hidden until Phase 3 surfaces them (no premature "???" for places never heard of).
// reveal(clues:Set<string>, reached:boolean, path:string) → boolean
const REGIONS = [
  // `truthId` is the short id stored in discoveredTruths (display `truth` is the prose label).
  { key:"haven",    name:"The Haven",            truth:"Ellie",         truthId:"ellie",         reveal:(c, reached) => reached,                                              blurb:"built for 143. you found it empty." },
  { key:"mercy",    name:"Mercy General",        truth:"you",           truthId:"you",           reveal:(c, reached, path) => c.has("Patient File") || path === "hospital",  blurb:"a hospital. your name is in its files." },
  // Gated on `reached` too: the truth label names "the Signal", and canon reserves that word
  // until the phone-pressure beat on the approach (STORY.md §8) — by Haven it's in-fiction.
  { key:"comms",    name:"Communications Array", truth:"the Signal",    truthId:"signal",        reveal:(c, reached) => c.has("Broadcast Log") && reached,                    blurb:"the broadcast has a source. someone's still transmitting." },
  { key:"cityhall", name:"City Hall",            truth:"Project Haven", truthId:"project_haven", reveal:() => false,                                                          blurb:"where the program was approved — on the record, and off it." },
  { key:"annex",    name:"Research Annex",       truth:"the outbreak",  truthId:"outbreak",      reveal:() => false,                                                          blurb:"where it began — and where it got out." },
];
// reveal(clues:Set<string>, reached:boolean, raised:string[]) → boolean
const BOARD_FACTS = [
  { reveal:(c) => c.has("Broadcast Log"), text:"Haven existed before the outbreak." },
  { reveal:(c) => c.has("Patient File"),  text:"You're tied to Mercy General." },
  { reveal:(c) => c.has("Project Haven"), text:"People were reassigned to Project Haven before Day 1." },
  { reveal:(c, reached) => reached,       text:"Haven was real, populated — then emptied." },
  // The contradiction — surfaces only once the player has *seen* the 143 record (haven143 raised).
  { reveal:(c, reached, raised) => !!raised?.includes?.("haven143"), text:"The board counts 143 residents — all present. You haven't seen a soul." },
  // Phase 3 — Haven investigation facts (raised silently by node caseFile hooks; STORY.md §5).
  { reveal:(c, reached, raised) => !!raised?.includes?.("p3_powered"),       text:"Haven's lights still burn — the power never failed." },
  { reveal:(c, reached, raised) => !!raised?.includes?.("p3_livedin"),       text:"Haven was lived-in — they left in the middle of a meal." },
  { reveal:(c, reached, raised) => !!raised?.includes?.("p3_143everywhere"), text:"143 bunks, 143 of everything — and not a body anywhere." },
  { reveal:(c, reached, raised) => !!raised?.includes?.("p3_records"),       text:"Your evidence and hers are filed together at Haven — before Day 1." },
  // Phase 3 — Mercy General investigation (raised by Mercy nodes; the last is the truth itself).
  { reveal:(c, reached, raised) => !!raised?.includes?.("p3_mercy_staff"),     text:"You were Mercy's director — and Project Haven's." },
  { reveal:(c, reached, raised) => !!raised?.includes?.("p3_admit"),           text:"You admitted yourself to Mercy — the day before the broadcast." },
  { reveal:(c, reached, raised) => !!raised?.includes?.("p3_mercy_procedure"), text:"The wipe was a procedure here. You signed the authorization." },
  { reveal:(c, reached, raised) => !!raised?.includes?.("p3_mercy_truth"),     text:"You built Project Haven — then erased yourself rather than carry it." },
  // Phase 3 — Communications Array (the Signal). Holds what Ellie *is* + the outbreak/infected truth.
  { reveal:(c, reached, raised) => !!raised?.includes?.("p3_comms_loop"),       text:"The Haven broadcast comes from the array — going out on a timer since the first night." },
  { reveal:(c, reached, raised) => !!raised?.includes?.("p3_kim_refused"),      text:"Kim refused the upload, warned you it isn't sleep, and went looking for you." },
  { reveal:(c, reached, raised) => !!raised?.includes?.("p3_signal_uploadnet"), text:"The Signal is an upload network. The connected aren't dead — they're inside it. The 143 are in there." },
  { reveal:(c, reached, raised) => !!raised?.includes?.("p3_phone"),            text:"No one holds Kim's phone. The texts are a transmission from inside the Signal." },
  // Phase 3 — City Hall (restrained: the documents, not the editorial). Holds the moral framing + cause.
  { reveal:(c, reached, raised) => !!raised?.includes?.("p3_ch_dept"),          text:"Project Haven was a sanctioned city department — off the public signs." },
  { reveal:(c, reached, raised) => !!raised?.includes?.("p3_ch_authorized"),    text:"Project Haven was approved by vote. No public minutes were kept." },
  { reveal:(c, reached, raised) => !!raised?.includes?.("p3_ch_truth"),         text:"Project Haven preserved minds — it uploaded the 143 into the Signal before 'the end.'" },
  { reveal:(c, reached, raised) => !!raised?.includes?.("p3_ch_truth"),         text:"The 143 were a fixed roster — Kim's name, and yours. The charter is signed by you, as architect." },
  // Phase 3 — Research Annex (the outbreak). Blunt; the combat reveal must land (STORY.md §2).
  { reveal:(c, reached, raised) => !!raised?.includes?.("p3_an_report"),        text:"Containment failed at the Annex. The Signal got out — uncontained." },
  { reveal:(c, reached, raised) => !!raised?.includes?.("p3_an_patientzero"),   text:"The 'infected' are people — minds half-pulled into the Signal, the bodies still moving." },
  { reveal:(c, reached, raised) => !!raised?.includes?.("p3_an_truth"),         text:"Every thing you fought through in the prologue was a half-connected person." },
  { reveal:(c, reached, raised) => !!raised?.includes?.("p3_an_truth"),         text:"The outbreak was your Signal breaching Haven. The 143 went in clean; the city got the spill — you built both." },
];
// CONTRADICTIONS — two KNOWN facts that can't both be true, paired into the open question they
// force. The investigation layer the bible says to protect: it makes the Case File read like a
// board, not a checklist. Same reveal signature as BOARD_FACTS (clues, reached, raised).
const BOARD_CONTRADICTIONS = [
  { reveal:(c, reached, raised) => !!raised?.includes?.("haven143"),
    known:["Haven is empty — you've seen no one.", "The status board reads PRESENT 143."],
    q:"Where are the 143?" },
  // Personal — once any route evidence is in hand, the amnesia and the evidence can't both stand.
  // Spoiler-safe: states no wipe, only the tension the player can feel.
  { reveal:(c) => c.has("Patient File") || c.has("Broadcast Log") || c.has("Project Haven"),
    known:["The route evidence is all about you.", "You remember none of it."],
    q:"Why is all of it about you?" },
];
// OPEN QUESTIONS reveal as the story beat that raises them is reached (key → raiseQuestion()).
// Worded to the player's *prologue* knowledge — no Phase-3 presumptions (e.g. no "self-wipe").
// `evolved` is a later, sharper form of the question, shown once its key is raised (at the 143
// record) — the moment a fact becomes a contradiction and the player starts theorizing.
const BOARD_QUESTIONS = [
  { key:"call",   text:"Why did you call Kim before any of this?" },
  { key:"memory", text:"Why can't you remember anything?" },
  { key:"kim",    text:"Who was Kim?",          evolved:{ key:"kim143",   text:"Was Kim one of the 143?" } },
  { key:"ellie",  text:"Who — or what — is Ellie?" },
  { key:"haven",  text:"Why is Haven empty?",   evolved:{ key:"haven143", text:"Where are the 143?" } },
  // World thread — raised by studying route-9's environmental clues (OBSERVE).
  { key:"harwick", text:"What actually happened to Harwick?" },
  // Phase 3 — Haven investigation. Surfaced as the player walks the compound (node caseFile
  // hooks). Spoiler-safe: questions, not answers — they deepen the mystery, never resolve it.
  { key:"p3_kim",         text:"Whose station is K.A. — and why is it still logged in?" },
  { key:"p3_ellie_knows", text:"Why does the voice know this place?" },
  { key:"p3_power",       text:"Who's been keeping Haven's lights on?" },
  // Phase 3 — Mercy General (answered by the room-312 truth).
  { key:"p3_admit",       text:"Why did you admit yourself to Mercy?" },
  // Phase 3 — Communications Array. Deliberately UNANSWERED — the hook to the finale (what Ellie is).
  { key:"p3_voice",       text:"If no hand ever held the phone — what's been texting you?" },
  // Phase 3 — City Hall. UNANSWERED — the hook to the Research Annex (the outbreak / what was coming).
  { key:"p3_why143",      text:"Why only 143 — and what were they so sure was coming?" },
];
// Base question keys (top-level) — used to decide whether a raiseQuestion() announces a "NEW
// QUESTION" card. Evolution keys (kim143/haven143) aren't here, so they don't double-announce.
const BASE_QUESTION_TEXT = Object.fromEntries(BOARD_QUESTIONS.map(q => [q.key, q.text]));

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

// Weapons. damage drives the FIGHT action (success odds + bleed on a loss). The three
// route starters are tiered so the route choice carries a combat fingerprint, and so the
// guaranteed shelter axe is a real upgrade for everyone. equipWeapon() only ever upgrades.
// FIGHT odds = 0.45 + dmg*0.08 → knife 61% / bat 69% / crowbar 77% / axe 85% / machete 93%.
const WEAPONS = {
  knife:   { name:"worn pocket knife", shortName:"knife",    damage:2 }, // hospital starter — desperate, close
  bat:     { name:"baseball bat",      shortName:"bat",      damage:3 }, // metro starter — middle
  crowbar: { name:"crowbar",           shortName:"crowbar",  damage:4 }, // route9 starter — best of the three; route9's tradeoff is power, not combat
  axe:     { name:"fire axe",          shortName:"fire axe", damage:5 },
  machete: { name:"machete",           shortName:"machete",  damage:6 },
};
const WEAPON_PICKUPS = { WEAPON_KNIFE:"knife", WEAPON_BAT:"bat", WEAPON_CROWBAR:"crowbar", WEAPON_AXE:"axe", WEAPON_MACHETE:"machete" };

// Route identity — each route makes one resource cheap and one expensive. Read at encounter
// selection (power frequency), combat resolution (noise penalty), and between-leg noise decay.
// Hospital: easy battery / deadly accumulating noise. Route 9: scarce battery / forgiving noise.
// Metro: middling on both. Defaults (hospital) keep any unlisted route on the old uniform tuning.
const ROUTE_PROFILE = {
  hospital: { powerBias: +0.20, noiseCombatPenalty: 0.18, noiseDecayPerLeg: 0 }, // power common, tight halls carry sound + never clear
  metro:    { powerBias: -0.05, noiseCombatPenalty: 0.10, noiseDecayPerLeg: 1 }, // base tuning
  route9:   { powerBias: -0.25, noiseCombatPenalty: 0.05, noiseDecayPerLeg: 2 }, // almost no generators, sound disperses outdoors
};

// Haven cache (the relief at the end of the scarcity gauntlet — diegetic, placed in
// logical rooms). Replaces the old invisible battery floor.
const HAVEN_BATTERY_CACHE = 45; // battery packs in the ops building add this much
const HAVEN_SUPPLY_FLOOR  = 5;  // pantry tops food/water up to at least this

// ─── EXPLORATION as a player-paced "lead queue" ───────────────────────────────
// Each area (leg) holds an ordered list of LEADS the player works through at their own pace.
// Every exploration screen offers an "explore" option (reveal the next lead) and — once allowed
// — a "move on" option (leave the area). The route DISCOVERY is REQUIRED before leaving the
// first route: "move on" stays locked until it's found (the discovery sits on the required
// path). Memory fragments, extra encounters, and extra atmosphere AFTER the discovery are
// optional. When the queue is picked clean, only "move on" remains (forced). The lead
// descriptors are plain serializable objects (save/resume).
//   kind "atmo"      → a free atmospheric beat (drain? = applyTransitionDrain key fired)
//        "encounter" → an encounter; plan "power" (POWER_SOURCES) | "search" | "hazard"
//        "memory" | "discovery" → that scripted story beat (path legs only)
//        "calm"      → the one-per-run breather (CALM_BEAT): no drain, no encounter,
//                      no loot, no battery — pure pacing relief (path legs only)
const buildLeadQueue = (section) => {
  if (section === "crossing") return [
    { kind: "atmo" },
    { kind: "encounter", plan: "power" },
    { kind: "atmo", drain: "crossing_mid" },
    { kind: "encounter", plan: "hazard" },
    { kind: "encounter", plan: "search" },
    { kind: "atmo" },
  ];
  if (section === "haven") return [
    { kind: "atmo" }, { kind: "atmo" }, { kind: "atmo" }, { kind: "atmo" },
  ];
  return [ // path leg (hospital / metro / route9) — the discovery is REQUIRED: move-on stays
           // locked until it's found (story spine). The memory is an OPTIONAL post-discovery
           // find, so it sits after the discovery (skippable by leaving once the gate opens).
    { kind: "atmo" },
    { kind: "encounter", plan: "power" },
    { kind: "calm" },
    { kind: "encounter", plan: "hazard" },
    { kind: "atmo", drain: "path_mid" },
    { kind: "encounter", plan: "search" },
    { kind: "discovery" },
    { kind: "memory" },
    { kind: "atmo" },
  ];
};

// Encounter-bridge pools (the short narrator lead-in before an encounter). Picked at
// random + deduped per run (seenBridgesRef) — replaces the single fixed pair per path
// that made "then something blocks the way ahead." repeat every encounter.
const BRIDGES = {
  hospital: [
    ["you move deeper into the building.", "then something stops you."],
    ["a set of fire doors.", "you push through — and freeze."],
    ["the corridor bends.", "you're not alone."],
    ["another ward, lights still on.", "something's wrong here."],
    ["past an empty nurses' station.", "then movement ahead."],
    ["the hall narrows.", "something blocks the way."],
    ["a stairwell door, propped open.", "a sound on the other side."],
  ],
  metro: [
    ["you follow the tunnel down.", "then something stops you."],
    ["the tracks curve into the dark.", "and something's there."],
    ["past a dead train car.", "then movement ahead."],
    ["the platform opens up.", "you're not alone."],
    ["deeper under the city.", "something blocks the way."],
    ["your light catches the far wall.", "then you hear it."],
    ["a maintenance hatch hangs open.", "something shifts inside."],
  ],
  route9: [
    ["the road opens ahead.", "then you see it."],
    ["past a wall of stalled cars.", "something moves."],
    ["the highway stretches on.", "then it stops you cold."],
    ["over the rise.", "you're not alone."],
    ["the shoulder narrows.", "something's up ahead."],
    ["wind drags across the asphalt.", "then movement."],
    ["a jackknifed trailer blocks two lanes.", "and something behind it."],
  ],
  crossing: [
    ["the street narrows ahead.", "then something blocks the way."],
    ["around the next corner.", "and you're not alone."],
    ["between two dead buildings.", "something moves."],
    ["across an empty intersection.", "then it stops you."],
    ["down a side street.", "something's there."],
    ["past a row of dark windows.", "then movement."],
    ["a collapsed storefront.", "a shape in the rubble."],
  ],
  haven: [ // haven has no encounters in the queue; kept for safety
    ["deeper into the compound.", "still nothing moves."],
    ["another quiet building.", "the lights stay on."],
  ],
};

// Explore-choice labels — varied, area-flavored wording, one function: reveal the next
// lead. Keyed by path for path legs, else by section. Picked at random for variety.
const EXPLORE_LABELS = {
  hospital: ["Search the next room.", "Push down the corridor.", "Check the ward ahead.", "Look for another way through.", "Keep searching."],
  metro:    ["Follow the tunnel further.", "Check the next platform.", "Push into the dark.", "Search along the tracks.", "Keep searching."],
  route9:   ["Keep up the highway.", "Check the next wreck.", "Push up the road.", "Search the shoulder.", "Keep searching."],
  crossing: ["Cut down the next street.", "Check the next block.", "Push on through the city.", "Search the buildings.", "Keep searching."],
  haven:    ["Look around.", "Into the next building.", "Check the next room.", "Keep searching."],
};
// Move-on label per section. Detected in handleChoice via /^move on/ (no other choice
// starts that way). Leaving = transition to the next area.
const MOVE_ON_LABEL = {
  path:     "Move on — head for the streets.",
  crossing: "Move on — find shelter before dark.",
  haven:    "Move on — go deeper.",
};
// "Nothing left here" lines for the forced-move-on screen (queue exhausted).
const EXPLORE_DONE = {
  path:     ["you've been through all of it.", "nothing else here."],
  crossing: ["you've covered the area.", "no reason to stay."],
  haven:    ["you've walked all of it.", "haven holds nothing else."],
};

// ─── The calm beat — one guaranteed breather per run (pacing, not resources) ──
// A held breath mid path-leg (the lead-queue slot between the two encounter
// leads): no drain, no encounter, no loot, and no battery — the beat is
// choiceless, so the per-tap charge site never sees it. Ellie's line
// deliberately breaks her clipped register — warmth, not information. Never
// fires in Phase 3 (lead queues exist only in the prologue legs).
const CALM_BEAT = {
  hospital: { msgs: ["a waiting room. dust thick on the chairs, sun through the blinds.", "for a minute, nothing moves.", "just your own breathing."] },
  metro:    { msgs: ["a stretch of empty platform. the rails hum, low and steady.", "for a minute, nothing moves.", "just your own breathing."] },
  route9:   { msgs: ["the road crests a rise. the valley below, still as a photograph.", "for a minute, nothing moves.", "just your own breathing."] },
  ellie: ["...you're doing okay. i mean it.", "...take a second. i'm not going anywhere."],
};

// ─── ENCOUNTER POOLS (8 per path, 9 crossing) ─────────────────────────────────
const ENCOUNTERS = {
  hospital: [
    { id:"patient_door",   msgs:["movement behind a patient room door.","slow. rhythmic."],
      choices:[{text:"Slip past quickly.",action:"SNEAK"},{text:"Stay still. Let it pass.",action:"WAIT"},{text:"Check the room. [risk]",action:"SEARCH"}] },
    { id:"elevator",       msgs:["an elevator dings somewhere above.","then silence."],
      choices:[{text:"Move now — take the stairs.",action:"SNEAK"},{text:"Stop and wait it out.",action:"WAIT"}] },
    { id:"generator_room", msgs:["generator room. loud enough to cover your movement.","supplies inside."],
      choices:[{text:"Go in fast. [risk]",action:"SEARCH"},{text:"Use the noise. Move through.",action:"SNEAK"},{text:"Too risky. Keep going.",action:"AVOID"}] },
    { id:"supply_closet",  msgs:["supply closet. lock's broken.","medical supplies visible."],
      choices:[{text:"Grab what you can. [risk]",action:"SEARCH"},{text:"Leave it.",action:"AVOID"}] },
    { id:"blood_trail",    msgs:["blood trail in the corridor.","recent. leads toward you."],
      choices:[{text:"Follow it to the source. [risk]",action:"SEARCH"},{text:"Go the other way.",action:"AVOID"}] },
    { id:"cafeteria",      msgs:["hospital cafeteria.","vending machines. mostly emptied."],
      choices:[{text:"Check what's left. [risk]",action:"SEARCH"},{text:"Move past quickly.",action:"SNEAK"},{text:"Watch the exits first.",action:"WAIT"}] },
    { id:"operating_room", msgs:["operating room lights flicker.","movement inside."],
      choices:[{text:"Slip past without looking.",action:"SNEAK"},{text:"Search it. [risk]",action:"SEARCH"},{text:"Take it on. [risk]",action:"FIGHT"}] },
    { id:"roof_access",    msgs:["stairwell door. sound from above.","heavy steps."],
      choices:[{text:"Slip past while it's above.",action:"SNEAK"},{text:"Wait for the steps to pass.",action:"WAIT"},{text:"Shove through — loud.",action:"FORCE"}] },
  ],
  metro: [
    { id:"tunnel_movement",    msgs:["movement in the tunnel.","past the platform edge. in the dark."],
      choices:[{text:"Back away quietly.",action:"SNEAK"},{text:"Hold still. Wait.",action:"WAIT"},{text:"Check with your light. [risk]",action:"SEARCH"}] },
    { id:"platform_lights",    msgs:["the platform lights cut out.","then back on.","something moved."],
      choices:[{text:"Don't move. Wait for the lights.",action:"WAIT"},{text:"Move while they're on.",action:"SNEAK"},{text:"Run for the next section. [risk]",action:"RUN"}] },
    { id:"maintenance_office", msgs:["maintenance office. door open.","tools and a battery pack visible."],
      choices:[{text:"Go in fast. [risk]",action:"SEARCH"},{text:"Keep moving.",action:"AVOID"}] },
    { id:"broadcast_speaker",  msgs:["emergency speaker crackles.","old broadcast. on loop."],
      choices:[{text:"Stop and listen.",action:"WAIT"},{text:"Pull it off the wall. [risk]",action:"FORCE"}] },
    { id:"flooded_section",    msgs:["platform flooded ahead.","knee-deep."],
      choices:[{text:"Wade through quietly.",action:"SNEAK"},{text:"Find another way around.",action:"AVOID"},{text:"Push through fast — loud.",action:"FORCE"}] },
    { id:"ticket_booth",       msgs:["ticket booth. glass broken.","supplies inside."],
      choices:[{text:"Search it. [risk]",action:"SEARCH"},{text:"Bypass it.",action:"SNEAK"},{text:"Wait and watch.",action:"WAIT"}] },
    { id:"service_corridor",   msgs:["service corridor. dark. tight.","something shuffles ahead."],
      choices:[{text:"Move carefully.",action:"SNEAK"},{text:"Back out. Go around.",action:"AVOID"},{text:"Take it on. [risk]",action:"FIGHT"}] },
    { id:"turnstile_blockage", msgs:["turnstiles blocked.","something piled against them."],
      choices:[{text:"Climb over quietly.",action:"SNEAK"},{text:"Force through. Loud.",action:"FORCE"},{text:"Wait and listen.",action:"WAIT"}] },
  ],
  route9: [
    { id:"car_alarm",    msgs:["you brush a car.","it starts beeping."],
      choices:[{text:"Run for it. [risk]",action:"RUN"},{text:"Find the source — silence it.",action:"SNEAK"},{text:"Freeze. Wait it out.",action:"WAIT"}] },
    { id:"road_walker",  msgs:["a figure on the road ahead.","it turns toward you."],
      choices:[{text:"Slip off the road.",action:"SNEAK"},{text:"Back away slow.",action:"AVOID"},{text:"Take it down. [risk]",action:"FIGHT"}] },
    { id:"highway_wreck",msgs:["a wreck blocking two lanes.","supplies visible in the cab."],
      choices:[{text:"Climb over quietly.",action:"SNEAK"},{text:"Go around. Slower but safe.",action:"AVOID"},{text:"Search the cab. [risk]",action:"SEARCH"}] },
    { id:"abandoned_checkpoint_small",msgs:["smaller checkpoint. barrier arm down.","someone left fast."],
      choices:[{text:"Slip under. Quick.",action:"SNEAK"},{text:"Check the booth. [risk]",action:"SEARCH"},{text:"Go around.",action:"AVOID"}] },
    { id:"fuel_truck",   msgs:["fuel truck parked across the median.","cab unlocked."],
      choices:[{text:"Search the cab. [risk]",action:"SEARCH"},{text:"Take the long way around.",action:"AVOID"}] },
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
      choices:[{text:"Use the smoke — move fast.",action:"SNEAK"},{text:"Go around it.",action:"AVOID"}] },
    { id:"rooftop",          msgs:["a silhouette on a rooftop.","still. watching."],
      choices:[{text:"Keep moving — don't look up.",action:"AVOID"},{text:"Wave. Identify yourself. [risk]",action:"FORCE"}] },
    { id:"floor_above",      msgs:["movement on the floor above.","heavy. slow."],
      choices:[{text:"Move quickly and quietly.",action:"SNEAK"},{text:"Stay still and wait.",action:"WAIT"},{text:"Check it out. [risk]",action:"SEARCH"}] },
    { id:"noise_drawn", minNoise:2, msgs:["your noise drew something.","it's close."],
      choices:[{text:"Run. [risk]",action:"RUN"},{text:"Hide. Go quiet.",action:"WAIT"},{text:"Stand and fight. [risk]",action:"FIGHT"}] },
    { id:"house_generator",  msgs:["a house with a generator running.","light in the windows."],
      choices:[{text:"Search it carefully. [risk]",action:"SEARCH"},{text:"Keep moving.",action:"AVOID"}] },
    { id:"crashed_bus",      msgs:["bus crashed into a storefront.","might be supplies inside."],
      choices:[{text:"Search the bus. [risk]",action:"SEARCH"},{text:"Go around.",action:"AVOID"}] },
    { id:"emergency_shelter",msgs:["emergency shelter sign.","door still open."],
      choices:[{text:"Go in. [risk]",action:"SEARCH"},{text:"Keep moving.",action:"AVOID"}] },
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

const ELLIE_DEFLECT = ["not now.", "does it matter? keep moving.", "i just do. go."];

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

// Ellie reacts to noise (she can hear you through the phone — canon-safe). Escalates from
// caution at the 2-cross to genuine fear at the 4-cross. Stacks with the narrator's
// "something answers." so her fear and the world's response land in the same beat.
const ELLIE_NOISE = {
  rising: ["you're making noise. ease off.", "too loud. quiet down.", "they can hear that. careful."],
  high:   ["you have to get quiet. now.", "stop. please. they're listening.", "that's too much noise — they'll find you."],
};

const OFFLINE_LINES = [
  { text: "the screen goes dark.", delay: 0 },
  { text: "battery dead.", delay: 1800 },
  { text: "signal lost.", delay: 3200 },
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
  "Head for Mercy General. [power still on]": "hospital",
  "Take Harwick Metro. [underground]": "metro",
  "Follow Route 9. [open highway]": "route9",
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

// ─── Encounter odds — SINGLE SOURCE OF TRUTH ──────────────────────────────────
// The resolver rolls against these AND the choice-button risk tags are computed
// from them, so a balance tweak here can never make the tags lie. penalty is the
// route's noiseCombatPenalty (routeProfile() is component-scope, so it's a param).
const pSneak = (noise) => noise <= 1 ? 0.92 : noise <= 3 ? 0.68 : 0.38;
const pRun   = (noise) => noise <= 3 ? 0.75 : 0.48;
const pFight = (dmg, noise, penalty) =>
  Math.max(0.1, Math.min(0.95, 0.45 + dmg * 0.08 - (noise >= 4 ? penalty : 0)));

// Tier vocabulary: LOW/MED/HIGH = a gamble's live odds; COSTLY = a guaranteed
// price (no roll). Boundaries land clean on today's numbers (bat FIGHT .69 → MED
// by intent; nothing computes to exactly 0.70), so no epsilon.
const tierForP = (p) => (p >= 0.70 ? "LOW" : p >= 0.45 ? "MED" : "HIGH");

// null = no tag (safe/neutral options stay visually quiet so the tagged ones
// carry the tension).
const riskTier = (action, { noise, dmg, penalty }) => {
  switch (action) {
    case "SNEAK":  return tierForP(pSneak(noise));
    case "RUN":    return tierForP(pRun(noise));
    case "FIGHT":  return tierForP(pFight(dmg, noise, penalty));
    case "SEARCH": return "MED";    // flat 0.80 payout, but the 0.20 fail bites
    case "FORCE":  return "COSTLY"; // no roll — a guaranteed price, not a gamble
    default:       return null;     // WAIT / AVOID / OBSERVE / DISTRACT
  }
};

// Display-only decoration: swap an authored [risk] for the live tier; inject a
// trailing tag on an untagged gamble (SNEAK/RUN/FIGHT) only when its odds have
// degraded to MED/HIGH — the quiet option stays quiet while it's genuinely
// favorable. stripMarkers removes ALL [...] tokens, so the resolver's
// stripped-text action dispatch is unaffected by any of this.
const RISK_TOKEN_RE = /\s*\[risk\]/i; // data carries at most one [risk] per choice
const decorateChoiceText = (text, action, odds) => {
  const tier = riskTier(action, odds);
  if (!tier) return RISK_TOKEN_RE.test(text) // defensive: no null-tier action carries [risk] today
    ? text.replace(RISK_TOKEN_RE, "").replace(/\s{2,}/g, " ").trim()
    : text;
  if (RISK_TOKEN_RE.test(text)) return text.replace(RISK_TOKEN_RE, ` [${tier}]`).trim();
  const gamble = action === "SNEAK" || action === "RUN" || action === "FIGHT";
  return gamble && (tier === "MED" || tier === "HIGH") ? `${text} [${tier}]` : text;
};

// Battery is the master clock. The phone is on the whole game, so advancing a beat
// costs power — one place owns the rate. Exceptions: phase1 is a pre-charger set-piece
// (not a clock yet), and pure story beats (memory flash, discovery) aren't traversal.
// Continues ("·") are charged 0 by the caller. Tune this rate in the M7 balance pass.
// Phase 3 — "battery is exploration" (softened survival, STORY.md §4). Movement between map
// nodes costs a little power; powered nodes (gate yard, generator) top you back to a floor.
// Deliberately non-punishing in 3A — no offline-death in Phase 3 yet (the tool-drain model
// — radio / flashlight — lands in a later phase).
const PHASE3_MOVE_COST   = 2;   // % battery per node move
const PHASE3_POWER_FLOOR = 60;  // a powered node tops a low battery back up to this

// ─── Phase 3 — the rest of the week (Days 4–7) + the shelter rule ───────────────────
// Phase 3 plays out over four days. Days 4–6 are investigation days: each has a DAYLIGHT
// budget (node-moves) that ticks down as you explore. As the light fails you must reach a
// SHELTER (one safe room per region + Haven's dorms) and bed down — the night turns the day
// (food/water cost; a safe rest heals). Get caught in the open at nightfall and you're hurt
// (HP, clamped ≥1) and forced to hole up where you are — non-lethal, matching Phase 3's
// softness. Day 7 is the final day: no clock, no night — you finish up and face the finale.
const PHASE3_START_DAY = 4;   // Phase 3 opens on Day 4 (the prologue ends Day 3, at Haven)
const PHASE3_FINAL_DAY = 7;   // the last day of the week — the ending; no nightfall clock
const PHASE3_DAYLIGHT  = 14;  // node-moves of daylight per investigation day (tuning knob)
const PHASE3_ENCOUNTER_RATE = 0.34; // chance the half-connected block a Phase-3 move (tuning knob)
const DAY_GATE_MS = 17 * 60 * 1000;
const EARLY_WAKE_MIN_MS = 2 * 60 * 1000; // "force yourself up" appears after this much of the night
// Real-time day gates are BUILT but DORMANT during development (Jharek, 2026-07-03): testers
// shouldn't hit 17-minute walls while the mechanic's final design is pending. The whole system
// (resting screen, countdown, early wake) stays wired — add ?gates to the URL to preview it,
// or flip this to `true` to ship it for real.
const DAY_GATES_ENABLED = typeof location !== "undefined" && /[?&]gates\b/.test(location.search);
const GATE_BYPASS = (() => {
  try { return !!import.meta.env?.DEV || (typeof location !== "undefined" && /[?&]debug/.test(location.search)); }
  catch (e) { return false; }
})();
const fmtCountdown = (ms) => {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = String(total % 60).padStart(2, "0");
  return `${m}:${s}`;
};
const PHASE3_DUSK      = 3;   // daylight ≤ this → "the light is failing"; shelter/bed-down offered
const PHASE3_REST_HEAL = 2;   // HP recovered by a safe night's rest at a shelter
const PHASE3_CAUGHT_HP = 2;   // HP lost (clamped ≥1) when nightfall catches you in the open
const BED_DOWN_LABEL = (day) => `▸ Bed down for the night — end day ${day}`;

// ─── Phase 3 encounters — the half-connected ────────────────────────────────────────
// Reuses the prologue's encounter engine (resolveEncounterChoice). By Phase 3 you KNOW these are
// people — minds half-pulled into the Signal, bodies still moving — so the framing is quieter and
// worse. Non-lethal here (HP floors at 1 in the resolver). Actions reuse SNEAK/WAIT/AVOID/FIGHT/RUN.
const PHASE3_ENCOUNTERS = [
  { id:"p3_wanderer", msgs:["someone stands in the corridor ahead.","they sway. they don't see you. not really."],
    choices:[{text:"Slip past — quiet.",action:"SNEAK"},{text:"Wait for them to drift off.",action:"WAIT"},{text:"Put them down. *they're already gone.* [risk]",action:"FIGHT"}] },
  { id:"p3_kneeling", msgs:["a figure on its knees by a window.","facing the light. it doesn't turn."],
    choices:[{text:"Leave them. Go around.",action:"AVOID"},{text:"Move past, slow.",action:"SNEAK"}] },
  { id:"p3_cluster", msgs:["three of them in the dark, close together.","heads tilted the same way, listening to something you can't hear."],
    choices:[{text:"Back off. Find another way.",action:"AVOID"},{text:"Slip through while they're still.",action:"SNEAK"},{text:"Take them on. [risk]",action:"FIGHT"}] },
  { id:"p3_follower", msgs:["footsteps behind you.","matching yours. slow. patient."],
    choices:[{text:"Lose them — move quiet.",action:"SNEAK"},{text:"Turn and face it. [risk]",action:"FIGHT"},{text:"Run.",action:"RUN"}] },
  { id:"p3_door", msgs:["something on the other side of a door.","a hand pressed flat to the glass. not pushing. just resting there."],
    choices:[{text:"Don't open it. Move on.",action:"AVOID"},{text:"Ease past it.",action:"SNEAK"}] },
  { id:"p3_caller", msgs:["one of them says your name.","just once. in a voice that almost fits."],
    choices:[{text:"Keep walking. it isn't them.",action:"AVOID"},{text:"Slip away before it says it again.",action:"SNEAK"},{text:"End it. [risk]",action:"FIGHT"}] },
  { id:"p3_huddle", msgs:["a stairwell, half-blocked.","bodies that still breathe, packed in close like they're cold."],
    choices:[{text:"Climb over, careful.",action:"SNEAK"},{text:"Go back, find another route.",action:"AVOID"}] },
];

const beatBatteryCost = (phase) => {
  if (phase === "phase1") return 0;
  if (phase === "p2_memory_frag" || phase === "p2_discovery") return 0;
  if (phase === "phase3") return PHASE3_MOVE_COST; // a map move (drain applied per choice in handleChoice)
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
      // Risk tiers — EXACT match only: "[open highway]" contains "high", so
      // substring matching here would repaint the route-branch button.
      else if (low === "low")                      color = "#4a9e6b";
      else if (low === "med" || low === "costly")  color = "#c8a020";
      else if (low === "high")                     color = "#8b4a4a";
      // Risk / warning (legacy [risk] kept as fallback: pre-feature saves can
      // restore literal [risk] choice strings — they should still render sanely)
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
const getChoiceKind = (choice) => {
  const text = stripMarkers(choice).toLowerCase();
  if (choice === "·") return "continue";
  if (
    /\[(?:risk|\+noise)\]/i.test(choice) ||
    text.includes("loud") ||
    text.includes("force through") ||
    text.includes("run.") ||
    text.includes("stand and fight") ||
    text.includes("take it on") ||
    text.includes("put it down")
  ) return "risk";
  if (
    text.endsWith("?") ||
    text.startsWith("ask ") ||
    text.startsWith("text back") ||
    text.startsWith("text ellie") ||
    text.startsWith("how do you know") ||
    text === "ellie"
  ) return "dialogue";
  if (text.includes("charger") || text.includes("save") || text.includes("load")) return "utility";
  return "action";
};

const choiceButtonStyle = (kind, index = 0, overrides = {}) => {
  const tones = {
    dialogue: { border:"#244a32", color:"#8fca9a", shadow:"0 0 11px rgba(74,158,107,0.16)" },
    risk:     { border:"#4a351b", color:"#c89a58", shadow:"0 0 11px rgba(200,154,88,0.12)" },
    utility:  { border:"#244a2c", color:"#3a8a50", shadow:"0 0 10px rgba(74,158,107,0.10)" },
    action:   { border:"#1c1c1c", color:"#c8b98a", shadow:"none" },
  };
  const tone = tones[kind] || tones.action;
  return {
    background:"transparent",
    border:`1px solid ${tone.border}`,
    color:tone.color,
    boxShadow:tone.shadow,
    padding:"clamp(0.6rem, 2.4vw, 0.75rem) 0.9rem",
    textAlign:"left",
    cursor:"pointer",
    fontFamily:"inherit",
    fontSize:"clamp(0.8rem, 3.4vw, 0.85rem)",
    fontWeight:300,
    letterSpacing:"0.04em",
    lineHeight:"1.5",
    transition:"border-color 0.15s, color 0.15s, box-shadow 0.15s",
    animation:`choiceIn 0.24s ease ${Math.min(index, 5) * 45}ms both`,
    ...overrides,
  };
};

const FONT_IMPORT = "@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400&display=swap');";
const KEYFRAMES_FI = "@keyframes fi{from{opacity:0;transform:translateY(3px)}to{opacity:1;transform:none}}@keyframes choiceIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}@media(prefers-reduced-motion:reduce){*{animation-duration:0.001ms!important;animation-iteration-count:1!important;transition-duration:0.001ms!important}}";

// Responsive gameplay-HUD styles (injected into the chat screen's <style>). Static sizing/spacing
// lives here so the header can shrink on phones via media queries; state-driven bits (colors,
// animations, conditional borders) stay inline. Desktop ≈ current look; mobile = compact phone strip.
const HUD_CSS = `
.ds-hud{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);align-items:start;gap:0.5rem;padding:calc(0.4rem + env(safe-area-inset-top)) 1rem 0.55rem;border-bottom:1px solid #111;flex-shrink:0}
.ds-hud-side{display:flex;align-items:center;gap:0.5rem;white-space:nowrap;min-width:0;margin-top:0.2rem}
.ds-hud-right{justify-content:flex-end}
.ds-hud-mid{display:flex;flex-direction:column;align-items:center;gap:0.15rem}
.ds-batt-pct{font-size:0.7rem;letter-spacing:0.03em}
.ds-contact-id{display:flex;flex-direction:column;align-items:center;gap:0.2rem}
.ds-avatar{width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#0a0f0a;font-size:0.78rem;transition:border-color .8s,color .8s,box-shadow .8s;flex-shrink:0}
.ds-name{color:#c8b896;font-size:0.7rem;letter-spacing:0.16em;transition:color .8s,text-shadow .8s}
.ds-status{color:#6a6a6a;font-size:0.56rem;letter-spacing:0.07em}
.ds-vitals{display:flex;gap:1rem;padding:0.38rem 1rem;align-items:center;flex-wrap:wrap;font-size:0.66rem;letter-spacing:0.09em;flex-shrink:0}
.ds-equip{display:flex;gap:1rem;padding:0.25rem 1rem;border-bottom:1px solid #111;font-size:0.64rem;letter-spacing:0.09em;flex-shrink:0;flex-wrap:wrap}
.ds-battwarn{padding:0.4rem 1rem;background:#0e0404;border-top:1px solid #2a0a0a;font-size:0.65rem;letter-spacing:0.1em;color:#8b2020}
.ds-actionbar{display:flex;justify-content:center;align-items:center;gap:0.6rem;padding:0.45rem 0.75rem calc(0.45rem + env(safe-area-inset-bottom));border-top:1px solid #111;flex-shrink:0}
.ds-actionbar button{flex:0 0 auto;min-height:44px;background:transparent;border:1px solid #1c1c1c;color:#7a7a7a;font-family:inherit;font-size:0.64rem;letter-spacing:0.14em;cursor:pointer;transition:border-color .15s,color .15s}
@media(max-width:480px){
.ds-hud{padding-left:0.6rem;padding-right:0.6rem;gap:0.35rem}
.ds-avatar{width:24px;height:24px;font-size:0.72rem}
.ds-vitals{gap:0.55rem;font-size:0.62rem;padding:0.34rem 0.6rem;flex-wrap:wrap}
.ds-equip{gap:0.6rem;font-size:0.56rem;padding:0.22rem 0.75rem}
.ds-battwarn{font-size:0.6rem;padding:0.32rem 0.75rem}
.choice-btn{padding:0.65rem 0.75rem!important;font-size:0.78rem!important;line-height:1.45!important}
}`;

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
  const heights = [5, 8, 12, 16];
  return (
    <svg width="28" height="16" viewBox="0 0 28 16" style={{ display:"block", flexShrink:0 }} aria-hidden="true">
      {heights.map((h, i) => {
        const on = i < lit;
        return (
          <rect key={i} x={i * 6.8} y={16 - h} width="4.6" height={h} rx="1.6"
            fill={on ? "#4a9e6b" : "#282828"}
            style={{
              filter: on ? "drop-shadow(0 0 4px rgba(74,158,107,0.6))" : "none",
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
  if (m.from === "question_note") {
    // One box for however many threads a beat opened: kind "batch" carries cards[];
    // legacy single cards (and old saves) render through the same path as a batch of one.
    const cards = m.kind === "batch" ? m.cards || [] : [m];
    const allNew = cards.every(c => c.kind === "new");
    const header = allNew ? (cards.length > 1 ? "NEW QUESTIONS" : "NEW QUESTION")
      : cards.every(c => c.kind !== "new") ? (cards.length > 1 ? "QUESTIONS UPDATED" : "QUESTION UPDATED")
      : "CASE FILE UPDATED";
    return (
      <div style={{ alignSelf:"center", textAlign:"center", padding:"0.55rem 1.2rem", border:"1px solid #3a2f1a", background:"#0a0805", animation:"fi 0.8s ease" }}>
        <div style={{ color:"#c8a020", fontSize:"0.62rem", letterSpacing:"0.14em" }}>{header}</div>
        {cards.map((c, i) => (
          <div key={i} style={i === 0 ? { marginTop:"0.25rem" } : { marginTop:"0.4rem", paddingTop:"0.4rem", borderTop:"1px solid #241d10" }}>
            {c.kind === "new" ? (
              <div style={{ color:"#c8b896", fontSize:"0.8rem", fontStyle:"italic" }}>{c.newText}</div>
            ) : (
              <>
                <div style={{ color:"#5a5246", fontSize:"0.72rem", fontStyle:"italic", textDecoration:"line-through" }}>{c.oldText}</div>
                <div style={{ color:"#c8b896", fontSize:"0.8rem", fontStyle:"italic", marginTop:"0.1rem" }}>{c.newText}</div>
              </>
            )}
          </div>
        ))}
        {m.hint && <div style={{ color:"#6a5a30", fontSize:"0.58rem", letterSpacing:"0.12em", marginTop:"0.5rem" }}>tap CASE FILE to review</div>}
      </div>
    );
  }
  if (m.from === "truth_note")
    return (
      <div style={{ alignSelf:"center", textAlign:"center", padding:"0.7rem 1.4rem", border:"1px solid #5a3a1a", background:"#0d0703", boxShadow:"0 0 18px rgba(200,120,40,0.18)", animation:"fi 1s ease" }}>
        <div style={{ color:"#c87a40", fontSize:"0.62rem", letterSpacing:"0.2em", textShadow:"0 0 8px rgba(200,122,64,0.5)" }}>TRUTH UNCOVERED</div>
        <div style={{ color:"#e0c89a", fontSize:"0.86rem", fontStyle:"italic", marginTop:"0.3rem", letterSpacing:"0.04em" }}>{m.title}</div>
      </div>
    );
  return (
    <div style={{ alignSelf:m.from==="ellie"?"flex-start":"flex-end", maxWidth:"82%", padding:"0.55rem 0.9rem", background:m.from==="ellie"?"#0d0d0d":"#0b110b", border:`1px solid ${m.from==="ellie"?"#222222":"#1c2a1c"}`, color:m.from==="ellie"?"#d8c79b":"#79b580", fontSize:"clamp(0.85rem, 3.6vw, 0.92rem)", lineHeight:"1.7", fontWeight:300, animation:"fi 0.35s ease" }}>
      {m.from==="player" ? parseText(m.text,"sent") : parseText(m.text,"msg")}
    </div>
  );
});

export default function DeadSignal({ presentation = "mobile", edition = "full", onDemoExit = null } = {}) {
  const isDesktopDemo = presentation === "desktopDemo";
  const isDay1Demo = edition === "day1Demo";
  const [screen, setScreen]             = useState(isDay1Demo ? "intro" : "menu");
  const [shownLines, setShownLines]     = useState([]);
  const [showNotif, setShowNotif]       = useState(false);
  const [offlineLines, setOfflineLines] = useState([]);
  const [endingLines, setEndingLines]   = useState([]);   // Phase 3F — the definitive ending screen
  const [endingKind, setEndingKind]     = useState(null); // "accept" | "refuse"
  const [deathLines, setDeathLines]     = useState([]);   // Priority 1 — death screen
  const [deathCause, setDeathCause]     = useState(null); // "injury" | "starvation" | "dehydration"
  const [muted, setMuted]               = useState(false); // audio — user mute preference (persisted)
  const [volume, setVolume]             = useState(70);    // audio — user volume 0–100 (persisted)
  const [optionsFrom, setOptionsFrom]   = useState("menu"); // where Options was opened from: "menu" | "chat"
  const [boardSection, setBoardSection] = useState(null);   // case-file accordion: open section id (null = all collapsed)
  const [boardItem, setBoardItem]       = useState(null);   // expanded item within the open section
  const [slotsFrom, setSlotsFrom]       = useState("menu"); // where the slots screen was opened from: "menu" | "chat"
  const [audioReady, setAudioReady]     = useState(false); // audio — true once unlocked by a user gesture
  const [slots, setSlots]               = useState([null, null, null]); // P4 — 3 save slots (meta or null)
  const [slotMode, setSlotMode]         = useState("start"); // slot screen mode: "start" | "load"
  const [slotConfirm, setSlotConfirm]   = useState(null);    // { index, action } two-tap confirm on the slot screen
  const [menuOpen, setMenuOpen]         = useState(false); // pause / save-load-exit menu
  const [menuMsg, setMenuMsg]           = useState("");    // transient confirmation in the menu
  const [menuNote, setMenuNote]         = useState("");    // transient note on the main menu (e.g. Story teaser)
  const [confirmReset, setConfirmReset] = useState(false); // two-tap confirm for the pause-menu "reset this run"
  const [confirmPrologueRestart, setConfirmPrologueRestart] = useState(false); // two-tap confirm — Phase 3 "restart prologue · keep progress"
  const [optConfirm, setOptConfirm]     = useState(false); // two-tap confirm for Options "reset all data"
  const [showRestart, setShowRestart]   = useState(false);
  const [raisedQuestions, setRaisedQuestions] = useState([]); // case-file OPEN QUESTIONS surfaced this run
  const [lastMessage, setLastMessage]   = useState("");
  const [messages, setMessages]         = useState([]);
  const [choices, setChoices]           = useState([]);
  const [isTyping, setIsTyping]         = useState(false);
  const [contactName, setContactName]   = useState("KIM");
  const [resources, setResources]       = useState({ battery: 9, water: 0, food: 0, charger: null, hp: 10 });
  const [weapon, setWeapon]             = useState(null);
  const [noise, setNoise]               = useState(0);
  const [exchangePhase, setExchangePhase]       = useState(0);
  const [day1Scene, setDay1Scene]               = useState("opening");
  const [day1Visited, setDay1Visited]           = useState([]);
  const [day1Flags, setDay1Flags]               = useState([]);
  const [chosenPath, setChosenPath]             = useState(null);
  const [gamePhase, setGamePhase]               = useState("phase1");
  const [currentPath, setCurrentPath]           = useState(null);
  const [p2BeatIndex, setP2BeatIndex]           = useState(0);
  const [aiExchangeCount, setAiExchangeCount]   = useState(0);
  const [aiExchangeTarget, setAiExchangeTarget] = useState(7);
  const [fragFired, setFragFired]               = useState(false);
  const [calmFired, setCalmFired]               = useState(false);
  const [currentEncounter, setCurrentEncounter] = useState(null);
  const [selectedFragment, setSelectedFragment] = useState(null);
  const [recoveredMemories, setRecoveredMemories] = useState([]);
  const [sigFlicker, setSigFlicker] = useState(false);
  const [battPulse, setBattPulse]   = useState(false); // P6c — battery pickup HUD flourish
  const [dayThree, setDayThree]     = useState(false);
  const [havenFinalIndex, setHavenFinalIndex] = useState(0);
  // ── Phase 3 — the open investigation (hub & spoke from Haven; STORY.md §5). ──
  const [currentPhase3Region, setCurrentPhase3Region]     = useState(null); // active region id (e.g. "haven")
  const [currentPhase3Node, setCurrentPhase3Node]         = useState(null); // active node id (e.g. "gate_yard")
  const [visitedPhase3Nodes, setVisitedPhase3Nodes]       = useState([]);   // ["region:node", …] explored this run
  const [discoveredTruths, setDiscoveredTruths]           = useState([]);   // region truth ids paid off (none in 3A)
  const [phase3UnlockedRegions, setPhase3UnlockedRegions] = useState([]);   // region ids the player can travel to
  const [phase3Day, setPhase3Day] = useState(PHASE3_START_DAY);             // Phase 3 day-of-week (4–7)
  const [daylight, setDaylight]   = useState(PHASE3_DAYLIGHT);              // node-moves of light left today
  const [gateWakeAt, setGateWakeAt] = useState(null);                      // real-time day-gate unlock timestamp (null = none)
  const [gateReason, setGateReason] = useState(null);                      // "day1" | "phase3" | "phase3_night"
  const [nowTick, setNowTick]       = useState(0);                         // 1s clock that drives the resting-screen countdown

  const pendingRef          = useRef([]);
  const dialogueRef         = useRef([]);   // timers owned by scheduleMessages (C3 — kept separate from pendingRef)
  const idRef               = useRef(0);    // monotonic id source (H1 — avoids Date.now() key collisions)
  const bottomRef           = useRef(null);
  const chatScrollRef       = useRef(null);
  const chatScrollTopRef    = useRef(0);
  const restoreChatScrollRef = useRef(false);
  const suppressNextAutoScrollRef = useRef(false);
  const chatStartedRef      = useRef(false);
  const resourcesRef        = useRef(resources);
  const screenRef           = useRef(screen);
  const weaponRef           = useRef(weapon);
  const noiseRef            = useRef(noise);
  const gamePhaseRef        = useRef(gamePhase);
  const day1SceneRef        = useRef(day1Scene);
  const day1VisitedRef      = useRef(day1Visited);
  const day1FlagsRef        = useRef(day1Flags);
  const currentPathRef      = useRef(currentPath);
  const aiCountRef          = useRef(aiExchangeCount);
  const aiTargetRef         = useRef(aiExchangeTarget);
  const fragFiredRef        = useRef(fragFired);
  const calmFiredRef        = useRef(calmFired);
  const currentEncounterRef = useRef(currentEncounter);
  const selectedFragmentRef  = useRef(selectedFragment);
  const recoveredMemoriesRef = useRef(recoveredMemories);
  const lastEncounterIdRef   = useRef(null);
  const shelterForcedRef     = useRef(false);
  const pendingStoryBeatRef  = useRef(null);
  const returnToPhaseRef    = useRef("p2_ai");
  const havenFinalRef       = useRef(HAVEN_FINAL_SEQUENCE); // P5 — path-aware final sequence for this run
  const havenVisitedRef     = useRef([]); // Haven hub — destination ids already investigated this run
  const discoveryFoundRef   = useRef(false); // route discovery found this run — gates "move on" off the first route
  const pendingQuestionCardsRef = useRef([]);   // QUESTION cards awaiting the batch flush (simultaneous raises share one box)
  const qFlushArmedRef          = useRef(false); // fallback flush timer armed (choiceless flows; the stable-point effect is primary)
  const pendingCaseFileHintRef  = useRef(false); // once-per-slot "tap FILE" nudge rides the next flushed card
  const seenEncountersRef   = useRef(new Set()); // P6a — encounter ids seen this run (reduce repetition)
  const seenBeatsRef        = useRef(new Set()); // exploration beats shown this run (prefer unseen)
  const seenBridgesRef      = useRef(new Set()); // encounter-bridge variants shown this run (prefer unseen)
  const leadQueueRef        = useRef([]);        // current area's ordered lead descriptors (player-paced exploration)
  const leadCursorRef       = useRef(0);         // how many leads consumed in the current area (synchronous cursor)
  const lastStateLineRef    = useRef(null);      // last STATE_LINES key fired (avoid back-to-back repeats)
  const activeSlotRef       = useRef(null);  // P4 — slot index (0–2) the in-progress run auto-saves to
  const activeProfileRef    = useRef(isDay1Demo ? { playthroughs:0, fragments:[], clues:[], complete:false } : null);  // per-slot progression profile for the active run (playthroughs/fragments/clues)
  const raisedQuestionsRef  = useRef([]);    // case-file OPEN QUESTIONS raised this run (by story beat)
  const legacyMemoriesRef   = useRef(null);  // one-time migration: legacy global ds_memories, used to seed a resumed v:1 save
  const mutedRef            = useRef(false); // audio — mirror of `muted` for the one-time unlock listener
  const currentPhase3RegionRef = useRef(null); // Phase 3 — mirrors for async timers / handlers
  const currentPhase3NodeRef   = useRef(null);
  const visitedPhase3NodesRef  = useRef([]);
  const discoveredTruthsRef    = useRef([]);
  const phase3UnlockedRef      = useRef([]);
  const phase3DayRef           = useRef(PHASE3_START_DAY); // Phase 3 day clock (mirror)
  const daylightRef            = useRef(PHASE3_DAYLIGHT);  // daylight remaining today (mirror)
  const gateWakeAtRef          = useRef(null);             // day-gate unlock timestamp (mirror)
  const gateReasonRef          = useRef(null);             // day-gate continuation target (mirror)
  const gateHealRef            = useRef(0);                // dawn heal deferred behind the gate (early wake forfeits)
  const lastPhase3EncounterIdRef = useRef(null);          // last half-connected encounter (dedupe)
  const phase3PendingDestRef     = useRef(null);          // node to enter after a Phase-3 encounter resolves
  const phase3SearchedRef        = useRef(new Set());     // "region:node" rooms already searched this run

  resourcesRef.current      = resources;
  screenRef.current         = screen;
  weaponRef.current         = weapon;
  noiseRef.current          = noise;
  gamePhaseRef.current      = gamePhase;
  day1SceneRef.current      = day1Scene;
  day1VisitedRef.current    = day1Visited;
  day1FlagsRef.current      = day1Flags;
  currentPathRef.current    = currentPath;
  aiCountRef.current        = aiExchangeCount;
  aiTargetRef.current       = aiExchangeTarget;
  fragFiredRef.current      = fragFired;
  calmFiredRef.current      = calmFired;
  currentEncounterRef.current  = currentEncounter;
  selectedFragmentRef.current  = selectedFragment;
  recoveredMemoriesRef.current = recoveredMemories;
  currentPhase3RegionRef.current = currentPhase3Region;
  currentPhase3NodeRef.current   = currentPhase3Node;
  visitedPhase3NodesRef.current  = visitedPhase3Nodes;
  discoveredTruthsRef.current    = discoveredTruths;
  phase3UnlockedRef.current       = phase3UnlockedRegions;
  phase3DayRef.current            = phase3Day;
  daylightRef.current             = daylight;
  gateWakeAtRef.current           = gateWakeAt;
  gateReasonRef.current           = gateReason;

  // ── Pausable timers ────────────────────────────────────────────────────────────
  // Every gameplay timer goes through setT() instead of raw setTimeout, so the dialogue
  // can be frozen (and resumed mid-beat) when the player opens the pause menu / leaves
  // the chat. Each record tracks its remaining time; pause clears the OS timer and banks
  // the remainder, resume re-arms it. clearT is robust to a raw id (screen-cinematic
  // effects still use plain setTimeout) so clearPending can clear a mixed bag.
  const timersRef = useRef(new Set());
  const pausedRef = useRef(false);
  const setT = (fn, delay) => {
    const rec = { fn, remaining: delay, fireAt: Date.now() + delay, id: 0 };
    if (!pausedRef.current) rec.id = setTimeout(() => { timersRef.current.delete(rec); fn(); }, delay);
    timersRef.current.add(rec);
    return rec;
  };
  const clearT = (rec) => {
    if (rec == null) return;
    if (typeof rec === "number") { clearTimeout(rec); return; } // legacy raw id
    clearTimeout(rec.id); timersRef.current.delete(rec);
  };
  const pauseTimers = () => {
    if (pausedRef.current) return;
    pausedRef.current = true;
    const now = Date.now();
    timersRef.current.forEach(rec => { clearTimeout(rec.id); rec.remaining = Math.max(0, rec.fireAt - now); });
  };
  const resumeTimers = () => {
    if (!pausedRef.current) return;
    pausedRef.current = false;
    const now = Date.now();
    timersRef.current.forEach(rec => {
      rec.fireAt = now + rec.remaining;
      rec.id = setTimeout(() => { timersRef.current.delete(rec); rec.fn(); }, rec.remaining);
    });
  };

  const clearPending = () => {
    pendingRef.current.forEach(clearT); pendingRef.current = [];
    dialogueRef.current.forEach(clearT); dialogueRef.current = [];
    // Pending question cards deliberately survive this: the fallback flush timer may die here,
    // but the stable-point effect re-flushes them — a fast tap can no longer lose a card.
    qFlushArmedRef.current = false;
  };

  // Freeze the dialogue whenever the bare chat isn't the foreground — the pause menu, or a
  // detour to Options / Load / Case File — and continue mid-beat on return. Game-driven
  // screens (offline/dead/complete) are reached by a timer firing, so their chat timers are
  // already spent or cleared; pauseTimers only touches live tracked timers, so it's a no-op there.
  useEffect(() => {
    if (screen === "chat" && !menuOpen) resumeTimers(); else pauseTimers();
  }, [screen, menuOpen]);
  // Dev-only: validate the Phase 3 invisible map once on mount (warns on broken exits/dead ends).
  useEffect(() => { try { if (import.meta.env?.DEV) validatePhase3Map(); } catch (e) {} }, []);
  // Dev-only Day-1 router audit (same idiom): every label the Day-1 menus can emit must route
  // to a real action — detectDay1Action matches on substrings, so a reworded label silently
  // falls through to OPENING and replays the opening beat instead of its scene. Menu builders
  // are pure reads (flags empty at mount = the fresh-run variants); the flag-set rewordings
  // aren't producible here, so they're listed explicitly.
  useEffect(() => {
    try {
      if (!import.meta.env?.DEV) return;
      [...day1HubChoices(), ...day1InspectChoices(), ...day1RequiredChoices(), ...day1OptionalChoices(),
       "Sleep until morning.", "Back to sleep prep.", "Check the radio static.",
       "Found a city map. *It says Harwick.* [pick up map]", ...DAY1_ROUTE_CHOICES,
      ].forEach(l => { if (detectDay1Action(l) === "OPENING") console.warn(`[Day1] label routes to OPENING (unhandled): "${l}"`); });
    } catch (e) {}
  }, []);
  const nextId = (prefix) => `${prefix}${idRef.current++}`;

  // Drop a QUESTION card into the chat, staggered so simultaneous raises (e.g. the name
  // reveal opening three threads) appear ~1.4s apart instead of stacking in one frame.
  // Question cards coalesce: simultaneous raises (the name reveal opens three threads at once;
  // signal_core raises three; the 143 record fires two updates) share ONE box instead of a
  // staggered stack splitting the dialogue. The flush lands at the stable point (choices shown,
  // typing settled — the same trigger as the autosave), so the burst reads uninterrupted; the
  // armed setT is only a fallback for choiceless flows.
  const flushQuestionCards = () => {
    const cards = pendingQuestionCardsRef.current;
    if (!cards.length) return;
    pendingQuestionCardsRef.current = [];
    qFlushArmedRef.current = false;
    const hint = pendingCaseFileHintRef.current;
    pendingCaseFileHintRef.current = false;
    const body = cards.length === 1 ? { ...cards[0] } : { kind: "batch", cards };
    setMessages(p => [...p, { id: nextId("q"), from: "question_note", ...body, ...(hint ? { hint: true } : {}) }]);
  };
  const armQuestionFlushFallback = () => {
    qFlushArmedRef.current = true;
    pendingRef.current.push(setT(() => {
      if (!pendingQuestionCardsRef.current.length) { qFlushArmedRef.current = false; return; }
      // Unfired timers = the burst (or a chained beat) is still streaming — hold the box so it
      // lands after the dialogue, not through it. isTyping can't gate this: it flickers false
      // between messages mid-burst.
      if (timersRef.current.size > 0) { armQuestionFlushFallback(); return; }
      flushQuestionCards();
    }, 3000));
  };
  const announceQuestion = (card) => {
    pendingQuestionCardsRef.current = [...pendingQuestionCardsRef.current, card];
    if (!qFlushArmedRef.current) armQuestionFlushFallback();
  };

  // Drop a TRUTH UNCOVERED card — a region's earned payoff (Phase 3). Caller schedules the timing
  // (it lands right after the truth node's beats, with the Signal sting). One per region.
  const announceTruth = (id) => {
    setMessages(p => [...p, { id: nextId("truth"), from: "truth_note", truthId: id, title: (PHASE3_TRUTHS[id]?.title || id) }]);
  };

  // Case file — surface an OPEN QUESTION when its story beat hits (dedupe; mirror ref→state)
  // and announce it in-chat as a NEW QUESTION card so the player follows the mystery as it
  // builds. Evolution keys (kim143/haven143) aren't base questions → no NEW card (the UPDATED
  // card is emitted at the 143 record instead).
  const raiseQuestion = (key) => {
    if (raisedQuestionsRef.current.includes(key)) return;
    raisedQuestionsRef.current = [...raisedQuestionsRef.current, key];
    setRaisedQuestions(raisedQuestionsRef.current);
    if (BASE_QUESTION_TEXT[key]) announceQuestion({ kind: "new", newText: BASE_QUESTION_TEXT[key] });
  };

  // Story-beat side effects, tagged on Haven beats via `effect`. Called just after a
  // tagged beat finishes rendering. "signal" = the Signal makes itself heard (distortion +
  // HUD glitch). "record143" = the impossible count: that, plus the question evolutions
  // (haven143/kim143) and a sparse in-chat QUESTION UPDATED card for the headline one.
  const fireBeatEffect = (effect) => {
    if (effect !== "signal" && effect !== "record143") return;
    audioEngine.signal();
    setSigFlicker(true);
    pendingRef.current.push(setT(() => setSigFlicker(false), 1100));
    if (effect === "record143") {
      raiseQuestion("haven143");
      raiseQuestion("kim143");
      // Both evolutions get an in-chat UPDATED card (kim→143 was previously silent), staggered.
      announceQuestion({ oldText: "Why is Haven empty?", newText: "Where are the 143?" });
      announceQuestion({ oldText: "Who was Kim?", newText: "Was Kim one of the 143?" });
    }
  };

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
    if (gamePhase === "phase3" || gamePhase === "phase3_finale") return PHASE3_REGIONS[currentPhase3Region]?.label || "The Haven";
    if (dayThree || gamePhase.startsWith("haven")) return "The Haven";
    if (gamePhase === "shelter")     return "Shelter";
    if (gamePhase === "p2_ai_cross") return "Crossing Harwick";
    if (currentPath === "hospital")  return "Hospital";
    if (currentPath === "metro")     return "Metro tunnels";
    if (currentPath === "route9")    return "Highway checkpoint";
    if (gamePhase === "phase1" && exchangePhase < 10) return "Harwick apartment";
    return "Harwick";
  };
  // Uppercase current-area name for the in-chat location strip (null = don't show the
  // strip, e.g. the apartment in phase1). Encounters borrow their leg's label via returnToPhase.
  const areaLabel = () => {
    const gp = gamePhase;
    if (gp === "phase3" || gp === "phase3_finale") return (PHASE3_REGIONS[currentPhase3Region]?.label || "The Haven").toUpperCase();
    if (gp === "encounter" && returnToPhaseRef.current === "phase3") return (PHASE3_REGIONS[currentPhase3Region]?.label || "The Haven").toUpperCase();
    if (dayThree || gp.startsWith("haven")) return "THE HAVEN";
    if (gp === "shelter") return "SHELTER";
    if (gp === "p2_ai_cross" || (gp === "encounter" && returnToPhaseRef.current === "p2_ai_cross")) return "CROSSING HARWICK";
    if (["p2_scripted", "p2_ai", "p2_memory_frag", "p2_discovery", "encounter"].includes(gp))
      return currentPath === "metro" ? "METRO TUNNELS" : currentPath === "route9" ? "HIGHWAY" : "HOSPITAL";
    return null; // phase1 (the apartment) and anything else → no strip
  };
  const snapshotDay = () =>
    (gamePhase === "phase3" || gamePhase === "phase3_finale") ? phase3Day
    : (dayThree || gamePhase.startsWith("haven")) ? 3
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
    aiExchangeCount, aiExchangeTarget, fragFired, calmFired,
    day1: { scene: day1SceneRef.current, visited: day1VisitedRef.current, flags: day1FlagsRef.current },
    currentEncounter, selectedFragment, dayThree, havenFinalIndex,
    recoveredMemories, // this run's cumulative collection (profile + new this run)
    raisedQuestions: raisedQuestionsRef.current, // case-file OPEN QUESTIONS surfaced so far
    pendingStoryBeat: pendingStoryBeatRef.current,
    returnToPhase: returnToPhaseRef.current,
    lastEncounterId: lastEncounterIdRef.current,
    havenFinal: havenFinalRef.current,
    havenVisited: havenVisitedRef.current, // Haven hub — rooms investigated
    discoveryFound: discoveryFoundRef.current, // route discovery found (move-on gate)
    seenEncounters: [...seenEncountersRef.current],
    shelterForced: shelterForcedRef.current,
    leadQueue: leadQueueRef.current, leadCursor: leadCursorRef.current, // player-paced exploration position
    // Phase 3 — the investigation: which region/node, what's explored, truths, unlocked spokes.
    phase3Region: currentPhase3RegionRef.current,
    phase3Node: currentPhase3NodeRef.current,
    visitedPhase3Nodes: visitedPhase3NodesRef.current,
    discoveredTruths: discoveredTruthsRef.current,
    phase3Unlocked: phase3UnlockedRef.current,
    phase3Day: phase3DayRef.current, daylight: daylightRef.current, // Phase 3 day/night clock
    gateWakeAt: gateWakeAtRef.current, // real-time day-gate unlock timestamp (absolute ms)
    gateReason: gateReasonRef.current,
    gateHeal: gateHealRef.current || 0, // dawn heal riding the gate (survives quit-and-resume)
    phase3Searched: [...phase3SearchedRef.current], phase3PendingDest: phase3PendingDestRef.current,
    meta: { day: snapshotDay(), location: locationLabel(), hp: resources.hp, battery: resources.battery, savedAt: Date.now() },
  });
  // The full per-slot record written to storage.
  const buildSlotData = (profile, run) => ({ v: 2, profile: profile || emptyProfile(), run: run || null });
  // A run body is resumable only if it's real progress with a sane schema.
  const validRun = (r) => !!r && r.gamePhase && r.resources && typeof r.resources.battery === "number"
    && (r.gamePhase !== "phase1" || !!r.gateWakeAt || !!r.day1?.flags?.length || !!r.day1?.visited?.length || !!r.day1?.scene);
  const capVisibleChoices = (choiceList, source = "unknown") => {
    if (!Array.isArray(choiceList) || choiceList.length <= HARD_CHOICE_CAP) return choiceList;
    if (GATE_BYPASS) {
      console.warn("[DeadSignal] choice list exceeds the hard cap — tail choices are unreachable", {
        source,
        count: choiceList.length,
        max: HARD_CHOICE_CAP,
        choices: choiceList,
      });
    }
    return choiceList.slice(0, HARD_CHOICE_CAP);
  };
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
    havenVisitedRef.current   = Array.isArray(run.havenVisited) ? run.havenVisited : [];
    discoveryFoundRef.current = !!run.discoveryFound;
    currentPhase3RegionRef.current = run.phase3Region || null;
    currentPhase3NodeRef.current   = run.phase3Node || null;
    visitedPhase3NodesRef.current  = Array.isArray(run.visitedPhase3Nodes) ? run.visitedPhase3Nodes : [];
    discoveredTruthsRef.current    = Array.isArray(run.discoveredTruths) ? run.discoveredTruths : [];
    phase3UnlockedRef.current      = Array.isArray(run.phase3Unlocked) ? run.phase3Unlocked : [];
    phase3DayRef.current = typeof run.phase3Day === "number" ? run.phase3Day : PHASE3_START_DAY;
    daylightRef.current  = typeof run.daylight  === "number" ? run.daylight  : PHASE3_DAYLIGHT;
    gateWakeAtRef.current = typeof run.gateWakeAt === "number" ? run.gateWakeAt : null;
    gateReasonRef.current = run.gateReason || null;
    gateHealRef.current = typeof run.gateHeal === "number" ? run.gateHeal : 0;
    day1SceneRef.current = run.day1?.scene || "opening";
    day1VisitedRef.current = Array.isArray(run.day1?.visited) ? run.day1.visited : [];
    day1FlagsRef.current = Array.isArray(run.day1?.flags) ? run.day1.flags : [];
    phase3SearchedRef.current = new Set(Array.isArray(run.phase3Searched) ? run.phase3Searched : []);
    phase3PendingDestRef.current = run.phase3PendingDest || null;
    lastPhase3EncounterIdRef.current = null;
    seenEncountersRef.current = new Set(run.seenEncounters || []);
    seenBeatsRef.current = new Set(); lastStateLineRef.current = null; // run-local, not persisted
    shelterForcedRef.current  = !!run.shelterForced;
    // Player-paced exploration position. Rebuild for the current section if a legacy
    // (pre-redesign) save lacks it, so old mid-exploration saves don't soft-lock.
    {
      const gp = run.gamePhase || "phase1";
      const sec = gp === "p2_ai_cross" ? "crossing" : gp.startsWith("haven") ? "haven" : "path";
      leadQueueRef.current = Array.isArray(run.leadQueue) ? run.leadQueue : buildLeadQueue(sec);
      leadCursorRef.current = typeof run.leadCursor === "number" ? run.leadCursor : 0;
    }
    chatStartedRef.current    = true; // prevent the chat-start effect from re-firing exchange 0
    // state
    setMessages(run.messages || []); setChoices(capVisibleChoices(run.choices || [], "resumeSlot")); setLastMessage(run.lastMessage || "");
    setResources(run.resources); setWeapon(run.weapon || null); setNoise(run.noise || 0);
    setContactName(run.contactName || "KIM");
    setGamePhase(run.gamePhase || "phase1"); setChosenPath(run.chosenPath || null);
    setCurrentPath(run.currentPath || null); setExchangePhase(run.exchangePhase || 0);
    setDay1Scene(day1SceneRef.current); setDay1Visited(day1VisitedRef.current); setDay1Flags(day1FlagsRef.current);
    setP2BeatIndex(run.p2BeatIndex || 0); setAiExchangeCount(run.aiExchangeCount || 0);
    setAiExchangeTarget(run.aiExchangeTarget || 7);
    setFragFired(!!run.fragFired); setCalmFired(!!run.calmFired); setCurrentEncounter(run.currentEncounter || null);
    setSelectedFragment(run.selectedFragment || null); setDayThree(!!run.dayThree);
    setHavenFinalIndex(run.havenFinalIndex || 0);
    setCurrentPhase3Region(currentPhase3RegionRef.current); setCurrentPhase3Node(currentPhase3NodeRef.current);
    setVisitedPhase3Nodes(visitedPhase3NodesRef.current); setDiscoveredTruths(discoveredTruthsRef.current);
    setPhase3UnlockedRegions(phase3UnlockedRef.current);
    setPhase3Day(phase3DayRef.current); setDaylight(daylightRef.current);
    setGateWakeAt(gateWakeAtRef.current); setGateReason(gateReasonRef.current);
    // memories: prefer the run's own cumulative set; else committed profile; else legacy global
    setRecoveredMemories(run.recoveredMemories || legacyMemoriesRef.current || memsFromProfile(slot.profile));
    raisedQuestionsRef.current = run.raisedQuestions || []; setRaisedQuestions(raisedQuestionsRef.current);
    setIsTyping(false); setShowNotif(false); setShownLines([]); setMenuOpen(false);
    if (gateWakeAtRef.current && !DAY_GATES_ENABLED) {
      // Gates dormant: a save parked on the resting screen resumes straight through the
      // dawn — wakeFromGate applies the restored gateHeal and plays the continuation.
      setScreen("chat");
      wakeFromGate(false);
    } else {
      setScreen(gateWakeAtRef.current ? "resting" : "chat");
    }
  };

  // ─── Pause menu actions (manual save / load / exit) ────────────────────────────
  const menuSave = async () => {
    const ok = await saveRun();
    setMenuMsg(ok ? "game saved." : "nothing to save yet.");
    pendingRef.current.push(setT(() => setMenuMsg(""), 1800));
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

  // Set the user volume (0–100), apply it to the engine, and persist it.
  const setVol = (v) => {
    const clamped = Math.max(0, Math.min(100, Math.round(v)));
    setVolume(clamped);
    audioEngine.setVolume(clamped / 100);
    (async () => { try { await window.storage.set("ds_volume", JSON.stringify(clamped)); } catch (e) {} })();
  };

  // Restore the mute + volume preferences on mount, applying the (possibly default)
  // volume to the engine so the slider and the actual loudness start in sync.
  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get("ds_muted");
        if (r?.value) { const m = JSON.parse(r.value); setMuted(!!m); mutedRef.current = !!m; audioEngine.setMuted(!!m); }
      } catch (e) {}
      let v = 70;
      try {
        const rv = await window.storage.get("ds_volume");
        if (rv?.value) { const parsed = JSON.parse(rv.value); if (typeof parsed === "number") v = Math.max(0, Math.min(100, parsed)); }
      } catch (e) {}
      setVolume(v);
      audioEngine.setVolume(v / 100);
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

  useEffect(() => {
    if (screen !== "intro") return; // re-fires every time screen returns to "intro"
    setShownLines([]); setShowNotif(false); // start the cinematic clean — never stack lines
    const ids = [];
    INTRO_LINES.forEach(({ text, delay }) => ids.push(setTimeout(() => setShownLines(p => [...p, text]), delay)));
    ids.push(setTimeout(() => setShowNotif(true), NOTIF_DELAY));
    ids.forEach(id => pendingRef.current.push(id));
    return () => ids.forEach(clearTimeout); // C2 — cancel on screen change/unmount
  }, [screen]);

  useEffect(() => {
    if (!isDay1Demo) return;
    if (screen === "menu" || screen === "slots" || screen === "story") {
      clearPending();
      setMenuOpen(false);
      setScreen("intro");
    }
  }, [isDay1Demo, screen]);

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
    setDay1Scene("opening"); day1SceneRef.current = "opening";
    markDay1Flag(DAY1_FLAGS.STARTED);
    const first = DAY1_OPENING;
    setIsTyping(true);
    scheduleMessages(first.msgs, first.choices, first.from || "ellie");
  }, [screen]);

  useEffect(() => {
    if (screen !== "offline") return;
    setOfflineLines([]); // reset on entry so a re-trigger can't stack duplicate lines
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
    setDeathLines([]); // reset on entry so a re-trigger can't stack duplicate lines
    const lines = DEATH_LINES[deathCause] || DEATH_LINES.injury;
    const ids = [];
    lines.forEach(({ text, delay }) => ids.push(setTimeout(() => setDeathLines(p => [...p, text]), delay)));
    const lastDelay = lines.length ? lines[lines.length - 1].delay : 0;
    ids.push(setTimeout(() => setShowRestart(true), lastDelay + 1600));
    return () => ids.forEach(clearTimeout);
  }, [screen, deathCause]);

  useLayoutEffect(() => {
    if (screen !== "chat" || !restoreChatScrollRef.current) return;
    const el = chatScrollRef.current;
    if (el) el.scrollTop = Math.min(chatScrollTopRef.current, Math.max(0, el.scrollHeight - el.clientHeight));
    restoreChatScrollRef.current = false;
  }, [screen]);

  useEffect(() => {
    if (screen !== "chat") return;
    if (suppressNextAutoScrollRef.current) {
      suppressNextAutoScrollRef.current = false;
      return;
    }
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isTyping, choices, screen]);

  useEffect(() => {
    if (screen !== "resting") return;
    setNowTick(Date.now());
    const id = setInterval(() => setNowTick(Date.now()), 500);
    return () => clearInterval(id);
  }, [screen]);
  // Persist the gate from a post-render effect (NOT synchronously in startDayGate) so the snapshot
  // captures the fresh, post-night state (resources/day already applied) rather than a stale closure.
  useEffect(() => { if (screen === "resting" && gateWakeAtRef.current) saveRun(); }, [screen, gateWakeAt]);

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

  // Question-card flush at the stable point — the burst is done, choices are up, so the
  // batched box lands after the dialogue instead of splitting it. Runs before the autosave
  // effect; the flushed message itself gets persisted at the next stable point.
  useEffect(() => {
    if (screen === "chat" && choices.length > 0 && !isTyping) flushQuestionCards();
  }, [screen, choices, isTyping]);

  // P4 — save at stable decision points (choices shown, animation settled).
  useEffect(() => {
    if (screen === "chat" && choices.length > 0 && !isTyping) saveRun();
  }, [screen, choices, isTyping]);

  // Terminal screens resolve the active slot's profile (the per-slot progression):
  // death / offline → discard the in-progress run, KEEP the accumulated profile
  // (a single failure no longer erases fragments earned in earlier playthroughs).
  // The prologue's win-merge lives in beginPhase3 (mergeRunIntoProfile) — it auto-flows into Phase 3.
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
    }
  }, [screen]);

  // `onShown(text, index)` fires exactly when each message is appended — lets
  // callers hook an event to a message render instead of a magic delay (P6d).
  const scheduleMessages = (msgs, choiceList, msgType = "ellie", onShown = null) => {
    // C3 — clear only this queue's own timers, leaving addMsg/bridge timers (pendingRef) intact.
    dialogueRef.current.forEach(clearT); dialogueRef.current = [];
    let t = 350;

    if (msgs.length === 0) {
      // No messages — still need to clear typing indicator
      dialogueRef.current.push(setT(() => setIsTyping(false), t));
      t += 50;
    }

    msgs.forEach((text, i) => {
      dialogueRef.current.push(setT(() => setIsTyping(msgType !== "narrator"), t));
      t += msgType === "narrator" ? 1200 : Math.min(500 + text.length * 22, 1800);
      dialogueRef.current.push(setT(() => {
        setIsTyping(false);
        setMessages(p => [...p, { id: nextId("e"), from: msgType, text }]);
        audioEngine.blip(); // ultra-quiet incoming-message blip (ellie/narrator only)
        onShown?.(text, i);
      }, t));
      t += msgType === "narrator" ? 400 : 280;
    });
    const visibleChoices = capVisibleChoices(choiceList, `scheduleMessages:${msgType}`);
    if (visibleChoices?.length) dialogueRef.current.push(setT(() => setChoices(visibleChoices), t + 80));
    return t;
  };

  // P6c — brief battery-pickup HUD flourish.
  const pulseBattery = () => {
    setBattPulse(true);
    pendingRef.current.push(setT(() => setBattPulse(false), 1400));
  };

  const addMsg = (from, text, delay = 0) => {
    pendingRef.current.push(setT(() => setMessages(p => [...p, { id: nextId(from), from, text }]), delay));
  };

  // audio — soft confirm on a net gain, duller thud on a loss, from a resource delta.
  const stingForDelta = (d) => {
    const pos = d.food > 0 || d.water > 0 || d.hp > 0 || d.battery > 0;
    const neg = d.food < 0 || d.water < 0 || d.hp < 0 || d.battery < 0;
    if (pos) audioEngine.gain(); else if (neg) audioEngine.loss();
  };

  // Current route's identity profile (power/noise tuning). Keys off currentPathRef, which
  // holds the chosen route through the crossing too. Defaults to hospital for an unset route.
  const routeProfile = () => ROUTE_PROFILE[currentPathRef.current] || ROUTE_PROFILE.hospital;

  // Risk legibility — an encounter's choices mapped to their tagged display
  // strings, from the SAME inputs the resolver will read at the tap (nothing
  // mutates noise/weapon between presentation and resolution). Pure map: never
  // mutates c.text — the pools are module-scope objects shared across runs.
  const tagEncounterChoices = (enc) =>
    enc.choices.map(c => decorateChoiceText(c.text, c.action, {
      noise:   noiseRef.current,
      dmg:     weaponRef.current ? weaponRef.current.damage : 0,
      penalty: routeProfile().noiseCombatPenalty,
    }));

  // Resource drain at section transitions and mid-legs. The steady squeeze that
  // makes searching matter (supply economy). Code owns every number.
  // Returns the {food, water} deltas it applied so a same-tick caller can fold them
  // into its starvation snapshot — setResources is async, so resourcesRef won't reflect
  // this drain until the next render (otherwise a mid-leg drain that zeroes a vital
  // wouldn't cost HP until the *following* choice).
  const applyTransitionDrain = (type) => {
    let dFood = 0, dWater = 0;
    if (type === "path_start") {
      dFood = -1; dWater = -1;
      setResources(p => ({ ...p, food: Math.max(0, p.food - 1), water: Math.max(0, p.water - 1) }));
      addMsg("system", "moving out · [-1 Food] [-1 Water]", 500);
    }
    if (type === "path_mid") {
      dWater = -1;
      setResources(p => ({ ...p, water: Math.max(0, p.water - 1) }));
      addMsg("system", "the climb wears on you · [-1 Water]", 500);
    }
    if (type === "crossing_start") {
      dFood = -1; dWater = -1;
      setResources(p => ({ ...p, food: Math.max(0, p.food - 1), water: Math.max(0, p.water - 1) }));
      addMsg("system", "crossing harwick · [-1 Food] [-1 Water]", 500);
    }
    if (type === "crossing_mid") {
      dFood = -1; dWater = -1;
      setResources(p => ({ ...p, food: Math.max(0, p.food - 1), water: Math.max(0, p.water - 1) }));
      addMsg("system", "the miles add up · [-1 Food] [-1 Water]", 500);
    }
    // Per-leg noise relief — route-aware (see ROUTE_PROFILE). route9 (2) clears the air each
    // leg; metro (1) softens by one; hospital (0) gives NO relief, so loud play accumulates
    // across the whole route. This is the recovery the noise model leans on alongside the
    // forced-fight reset, so loudness ebbs between legs instead of ratcheting up for the run.
    const noiseDecay = routeProfile().noiseDecayPerLeg;
    if ((type === "path_start" || type === "crossing_start") && noiseDecay > 0 && noiseRef.current > 0) {
      setNoise(n => Math.max(0, n - noiseDecay));
      addMsg("system", `the noise dies down · noise -${noiseDecay}`, 900);
    }
    // Only sound the loss if a resource actually drops (not already at 0).
    const cur = resourcesRef.current;
    const willDrop = type === "path_mid" ? cur.water > 0 : (cur.food > 0 || cur.water > 0);
    if (willDrop) audioEngine.loss();
    return { food: dFood, water: dWater };
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
      // Ellie's battery lines carry a pool (vary her worry); narrator keys stay fixed.
      const line = STATE_LINES[stateKey];
      return line.pool ? { from: line.from, msgs: pickRandom(line.pool), choices: line.choices } : line;
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
  // Encounter-bridge picker — random + deduped (seenBridgesRef), replacing the fixed
  // per-path pair that made the lead-in line repeat. `bridgeKey` is a BRIDGES key
  // (hospital/metro/route9/crossing/haven).
  const pickBridge = (bridgeKey) => {
    const pool = BRIDGES[bridgeKey] || BRIDGES.crossing;
    const seen = seenBridgesRef.current;
    let fresh  = pool.filter(b => !seen.has(b));
    if (!fresh.length) { seen.clear(); fresh = pool; }
    const b = pickRandom(fresh);
    seen.add(b);
    return b;
  };
  // The explore-label key (path legs flavor by path; crossing/haven by section).
  const exploreLabelKey = (section, path) => section === "crossing" ? "crossing" : section === "haven" ? "haven" : path;

  const localBeat = (batteryOverride = null, phaseOverride = null) => {
    const res     = resourcesRef.current;
    const path    = currentPathRef.current || "hospital";
    const phase   = phaseOverride || gamePhaseRef.current;
    const section = phase === "p2_ai" ? "path"
                  : phase === "p2_ai_cross" ? "crossing" : "haven";
    const bridgeKey = section === "crossing" ? "crossing" : section === "haven" ? "haven" : path;
    const moveOnKey = section === "haven" ? "haven" : section === "crossing" ? "crossing" : "path";
    const beat    = pickExploreBeat(path, section, res);
    const effectiveBattery = batteryOverride !== null ? batteryOverride : res.battery;

    const pending = pendingStoryBeatRef.current;

    if (effectiveBattery <= 0) {
      scheduleMessages(beat.msgs, null, beat.from);
      pendingRef.current.push(setT(() => setScreen("offline"), beat.msgs.length * 2000 + 1500)); // C2 — cancelable

    } else if (pending) {
      // Resolve the current action first — show the beat with no choices
      pendingStoryBeatRef.current = null;
      const aiMsgTime = scheduleMessages(beat.msgs, null, beat.from);
      const path = currentPathRef.current || "hospital"; // H4 — never index data maps with null

      // After the beat finishes, bridge into the queued story beat
      pendingRef.current.push(setT(() => {

        if (pending.type === "memory") {
          const bridgeTime = scheduleMessages(["you keep walking.", "then the world slips sideways."], null, "narrator");
          pendingRef.current.push(setT(() => {
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
          pendingRef.current.push(setT(() => {
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
          pendingRef.current.push(setT(() => setChoices([
            "Sleep here. [-1 Food] [-1 Water]",
            "Barricade the door first. [+1 Noise] [-1 Food] [-1 Water]",
            "Keep moving. [danger]",
          ]), 11000));

        } else if (pending.type === "haven_final") {
          setGamePhase("haven_final");
          setHavenFinalIndex(0);
          havenFinalRef.current = HAVEN_FINAL_SEQUENCE;
          const ft = scheduleMessages(HAVEN_FINAL_SEQUENCE[0].msgs, HAVEN_FINAL_SEQUENCE[0].choices, "narrator");
          if (HAVEN_FINAL_SEQUENCE[0].effect) pendingRef.current.push(setT(() => fireBeatEffect(HAVEN_FINAL_SEQUENCE[0].effect), ft + 200));

        } else if (pending.type === "encounter") {
          const enc = pending.enc;
          // Random, deduped bridge for this area (no more single fixed pair per path).
          const encBridge = pickBridge(bridgeKey);
          const bridgeTime = scheduleMessages(encBridge, null, "narrator");
          pendingRef.current.push(setT(() => {
            setCurrentEncounter(enc);
            returnToPhaseRef.current = gamePhaseRef.current;
            setGamePhase("encounter");
            scheduleMessages(enc.msgs, tagEncounterChoices(enc), "narrator");
          }, bridgeTime + 300));

        } else if (pending.type === "calm") {
          // The one-per-run breather: choiceless (no tap → no battery charge),
          // auto-flows back to the nav screen after the held breath.
          const calm = CALM_BEAT[path] || CALM_BEAT.hospital;
          const ct = scheduleMessages(calm.msgs, null, "narrator");
          addMsg("ellie", pickRandom(CALM_BEAT.ellie), ct + 900);
          pendingRef.current.push(setT(() => { setIsTyping(true); localBeat(); }, ct + 2600));
        }

      }, aiMsgTime + 600));

    } else {
      // Nav screen — atmosphere + the two player-paced choices (explore further / move on).
      // When the area's lead queue is picked clean, only "move on" remains (forced).
      const queue     = leadQueueRef.current || [];
      const exhausted = leadCursorRef.current >= queue.length;
      const moveOn    = MOVE_ON_LABEL[moveOnKey];
      // Story spine: on the FIRST route, "move on" stays locked until the route discovery is
      // found (the discovery sits on the required path, so exploring always reaches it). The
      // crossing gates lightly — two leads (one atmo + the power source) before "move on"
      // appears, so the leg can't be skipped in a single tap and the battery lifeline is at
      // least encountered. Haven never gates. After a gate opens, the rest stays optional.
      const gated     = (section === "path" && !discoveryFoundRef.current)
                     || (section === "crossing" && leadCursorRef.current < 2);
      if (exhausted) {
        scheduleMessages(EXPLORE_DONE[moveOnKey] || ["nothing else here."], [moveOn], "narrator");
      } else {
        // The explore button reads from the beat's OWN choices so it correlates with the scene
        // ("handprints on a door window." → "Back away."). EXPLORE_LABELS is only the fallback
        // for any beat that lacks contextual choices.
        const fallbackLabels = EXPLORE_LABELS[exploreLabelKey(section, path)] || EXPLORE_LABELS.crossing;
        const exploreLabel   = pickRandom(Array.isArray(beat.choices) && beat.choices.length ? beat.choices : fallbackLabels);
        scheduleMessages(beat.msgs, gated ? [exploreLabel] : [exploreLabel, moveOn], beat.from);
      }
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
        const ok = Math.random() < pSneak(curNoise);
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
          if (item === "battery") { dBatt = 10; outcome = "you found a battery pack."; }
          else {
            // A consumable find (food/water) is redirected to whichever vital you're shorter
            // on, so a good run can't starve/dehydrate purely because the RNG kept handing
            // back the resource you didn't need. Ties keep the table's own roll; battery
            // finds are untouched. The table still governs how often a spot pays consumable
            // vs battery vs nothing — this only steers which consumable.
            const give = curRes.food < curRes.water ? "food" : curRes.water < curRes.food ? "water" : item;
            if (give === "food") { dFood = 1; outcome = "you found food."; }
            else                 { dWater = 1; outcome = "you found water."; }
            // Food/water restores HP if injured
            if (curRes.hp < 10) dHp = 1;
          }
          reactionKey = "search_found";
        } else {
          outcome = dCharger > 0 ? "nothing useful, but the charger's topped up." : "you disturbed something.";
          reactionKey = "search_fail"; dNoise = 2; dHp = -1;
        }
        break;
      }
      case "WAIT":    { outcome = "you waited. it passed."; reactionKey = "wait"; break; }
      case "DISTRACT":{ if (curRes.food > 0) { dFood = -1; outcome = "it goes for the food. you slip past."; } else { outcome = "nothing to throw. you slip past anyway."; } reactionKey = "distract"; dNoise = 1; break; }
      case "RUN": {
        const ok = Math.random() < pRun(curNoise);
        if (ok) { outcome = "you ran. made it."; reactionKey = "run_success"; dNoise = 1; }
        else    { outcome = "you got away. dropped something."; reactionKey = "run_fail"; dFood = -1; dWater = -1; dNoise = 2; }
        break;
      }
      case "OBSERVE": { outcome = "you look. more questions than answers."; reactionKey = "observe"; raiseQuestion("harwick"); break; }
      case "FORCE":   { outcome = "you forced through."; reactionKey = "force"; dHp = -2; dNoise = 2; break; }
      case "FIGHT": {
        // Weapon-driven combat. Damage raises the odds of a clean kill and cuts the
        // bleed on a loss. Unarmed is desperate. Fighting is loud either way.
        const dmg = weaponRef.current ? weaponRef.current.damage : 0;
        const ok  = Math.random() < pFight(dmg, curNoise, routeProfile().noiseCombatPenalty);
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
    // Phase 3 is non-lethal — floor HP at 1 there (you get hurt, not killed).
    const hpFloor = returnToPhaseRef.current === "phase3" ? 1 : 0;
    setResources(prev => ({
      ...prev,
      hp:      Math.max(hpFloor, Math.min(10, prev.hp + dHp)),
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
    // When a fight leaves you badly hurt, her voice changes — fear, not a scripted line.
    // (Reads pre-update curRes.hp + dHp; setResources hasn't applied yet.)
    const hpAfter = Math.max(hpFloor, Math.min(10, curRes.hp + dHp));
    const reactionPool = (reactionKey === "fight_loss" && hpAfter <= 3)
      ? ["you're hurt bad. i know. keep moving — don't you stop.", "stay with me. please. you're okay. you're okay."]
      : (ENCOUNTER_REACTIONS[reactionKey] || ["keep moving."]);
    addMsg("ellie", pickRandom(reactionPool), reactionDelay);

    // Noise crossings — Ellie's caution (2) escalates to fear (4); narrator lines stay.
    if (prevNoise < 2 && newNoise >= 2) addMsg("ellie", pickRandom(ELLIE_NOISE.rising), reactionDelay + 700);
    if (prevNoise < 4 && newNoise >= 4) addMsg("ellie", pickRandom(ELLIE_NOISE.high), reactionDelay + 700);
    if (prevNoise < 4 && newNoise >= 4) addMsg("narrator", "something answers.", reactionDelay + 700);
    if (prevNoise < 5 && newNoise >= 5) addMsg("narrator", "you hear footsteps. more than one set.", reactionDelay + 700);

    pendingRef.current.push(setT(() => {
      const returnPhase = returnToPhaseRef.current;
      lastEncounterIdRef.current = encounter.id;
      setGamePhase(returnPhase); gamePhaseRef.current = returnPhase;
      setCurrentEncounter(null);
      setIsTyping(true);
      if (returnPhase === "phase3") {
        // Back to the map. The encounter cost a beat of daylight; then arrive at the node we were
        // heading to (presentPhase3Node there runs the night check with the post-encounter light).
        spendDaylight();
        const dest = phase3PendingDestRef.current; phase3PendingDestRef.current = null;
        if (dest) enterPhase3Node(dest); else presentPhase3Node();
      } else {
        localBeat(null, returnPhase); // resume exploration in the phase we returned to
      }
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

  const markDay1Flag = (flag) => {
    if (!flag || day1FlagsRef.current.includes(flag)) return false;
    day1FlagsRef.current = [...day1FlagsRef.current, flag];
    setDay1Flags(day1FlagsRef.current);
    return true;
  };
  const markDay1Visited = (place) => {
    if (!place || day1VisitedRef.current.includes(place)) return false;
    day1VisitedRef.current = [...day1VisitedRef.current, place];
    setDay1Visited(day1VisitedRef.current);
    return true;
  };
  const day1Has = (flag) => day1FlagsRef.current.includes(flag);
  const day1ReadyForSleep = () => DAY1_REQUIRED.every(day1Has);
  const day1MissingPrep = () => {
    const miss = [];
    if (!day1Has(DAY1_FLAGS.CHARGER)) miss.push("charge the phone");
    if (!day1Has(DAY1_FLAGS.SUPPLIES)) miss.push("pack food and water");
    if (!day1Has(DAY1_FLAGS.DOOR)) miss.push("secure the door");
    if (!day1Has(DAY1_FLAGS.ELLIE)) miss.push("answer ellie");
    if (!day1Has(DAY1_FLAGS.BROADCAST)) miss.push("find the radio signal");
    return miss;
  };
  const day1RequiredChoices = () => {
    const choices = [];
    if (!day1Has(DAY1_FLAGS.CHARGER)) choices.push("Search the bedroom.");
    if (!day1Has(DAY1_FLAGS.SUPPLIES)) choices.push("Search the kitchen.");
    if (!day1Has(DAY1_FLAGS.ELLIE)) choices.push("Text back: who are you?");
    else if (!day1Has(DAY1_FLAGS.BROADCAST)) choices.push("Check the radio static.");
    if (!day1Has(DAY1_FLAGS.DOOR)) choices.push("Secure the hallway door.");
    return choices;
  };
  const day1OptionalChoices = () => {
    const choices = [];
    if (!day1Has(DAY1_FLAGS.BATHROOM)) choices.push("Search the bathroom.");
    if (!day1Has(DAY1_FLAGS.WINDOW)) choices.push("Look through the window.");
    if (!day1Has(DAY1_FLAGS.STAIRWELL)) choices.push("Crack the door to the stairwell.");
    return choices;
  };
  const day1InspectChoices = () => {
    // The door stays on the required hub list only — repeating it here pushed "Back" off the
    // 4-choice menu exactly when it was fullest. Optionals (≤3) + Back always fit.
    const choices = [...day1OptionalChoices()];
    choices.push(day1ReadyForSleep() ? "Back to sleep prep." : "Back to essentials.");
    return choices;
  };
  const day1HubChoices = () => {
    if (day1ReadyForSleep()) return ["Sleep until morning.", ...day1OptionalChoices()].slice(0, MAX_VISIBLE_CHOICES);

    const untouchedOpening = !day1Has(DAY1_FLAGS.CHARGER) && !day1Has(DAY1_FLAGS.SUPPLIES) && !day1Has(DAY1_FLAGS.ELLIE);
    if (untouchedOpening) {
      return ["Search the bedroom.", "Search the kitchen.", "Text back: who are you?", "Inspect the apartment."];
    }

    const choices = day1RequiredChoices().slice(0, MAX_VISIBLE_CHOICES);
    if (choices.length < MAX_VISIBLE_CHOICES && day1OptionalChoices().length) choices.push("Inspect the apartment.");
    if (choices.length < MAX_VISIBLE_CHOICES) choices.push("Try to sleep.");
    return choices.slice(0, MAX_VISIBLE_CHOICES);
  };
  const showDay1Hub = (msgs = ["the apartment waits.", "what do you check?"], from = "narrator", onShown = null) => {
    setDay1Scene("apartment"); day1SceneRef.current = "apartment";
    return scheduleMessages(msgs, day1HubChoices(), from, onShown);
  };
  const nudgeCaseFileHint = () => {
    if (activeProfileRef.current && !activeProfileRef.current.caseFileHintSeen) {
      activeProfileRef.current.caseFileHintSeen = true;
      // Rides the next flushed question card as an in-box footer (the nudge site always
      // raises a question in the same beat, so a card is always pending).
      pendingCaseFileHintRef.current = true;
    }
  };
  const startDay2Morning = () => {
    setGamePhase("phase1"); gamePhaseRef.current = "phase1";
    setExchangePhase(10);
    // A silent night resets the street's attention — Day-1 noise (the door scrape, the
    // stairwell) doesn't follow you into the route legs, whose encounter odds were tuned
    // from a noise-0 start. The in-the-moment scares already landed.
    setNoise(0);
    setDay1Scene("day2_map"); day1SceneRef.current = "day2_map";
    setChoices([]); setIsTyping(true);
    scheduleMessages(["morning. still there?", "those coordinates from the radio point north through harwick.", "find a map. we need to know what you can reach from here."], ["Found a city map. *It says Harwick.* [pick up map]"], "ellie");
  };
  const detectDay1Action = (choice) => {
    const c = stripMarkers(choice).toLowerCase();
    if (DAY1_ROUTE_CHOICES.includes(choice)) return "BRANCH";
    if (c.includes("city map") || c.includes("harwick")) return "MAP";
    if (c.includes("inspect the apartment")) return "INSPECT";
    if (c.includes("back to essentials") || c.includes("back to sleep prep") || c.includes("keep working")) return "HUB";
    if (c.includes("bedroom")) return "BEDROOM";
    if (c.includes("kitchen")) return "KITCHEN";
    if (c.includes("bathroom")) return "BATHROOM";
    if (c.includes("window")) return "WINDOW";
    if (c.includes("hallway door")) return "DOOR";
    if (c.includes("broadcast") || c.includes("radio") || c.includes("static") || c.includes("signal")) return "BROADCAST";
    if (c.includes("stairwell")) return "STAIRWELL";
    if (c.includes("who is texting") || c.includes("who are you") || c.includes("text back") || c.includes("ellie")) return "ELLIE";
    if (c.includes("sleep")) return "SLEEP";
    return "OPENING";
  };
  const handleDay1Choice = (choice, newBattery) => {
    const action = detectDay1Action(choice);
    markDay1Flag(DAY1_FLAGS.STARTED);

    if (day1SceneRef.current === "day2_route" || action === "BRANCH") {
      const detected = detectPath(choice);
      setCurrentPath(detected); setChosenPath(choice);
      setGamePhase("p2_scripted"); gamePhaseRef.current = "p2_scripted";
      setP2BeatIndex(0);
      scheduleMessages(PATH_BEATS[detected][0].msgs, PATH_BEATS[detected][0].choices, "ellie");
      return;
    }

    if (day1SceneRef.current === "day2_map" || action === "MAP") {
      markDay1Flag(DAY1_FLAGS.MAP);
      addMsg("system", "city map found — harwick", 700);
      setDay1Scene("day2_route"); day1SceneRef.current = "day2_route";
      pendingRef.current.push(setT(() => scheduleMessages(["you study the map.", "where do you go?"], DAY1_ROUTE_CHOICES, "narrator"), 950));
      return;
    }

    if (action === "OPENING") {
      raiseQuestion("memory");
      nudgeCaseFileHint();
      showDay1Hub(["no memory at all?", "like you just woke up there with no idea how you got in?", "look around. charger, food, water, door. start there."], "ellie");
      return;
    }

    if (action === "HUB") {
      showDay1Hub(["you pull the list back into order.", "one thing at a time."], "narrator");
      return;
    }

    if (action === "INSPECT") {
      markDay1Visited("apartment");
      setDay1Scene("inspect"); day1SceneRef.current = "inspect";
      scheduleMessages(["you move through the apartment slowly.", "small rooms. bad angles. too many sounds from the hall.", "what do you check?"], day1InspectChoices(), "narrator");
      return;
    }

    if (action === "BEDROOM") {
      const first = markDay1Visited("bedroom");
      if (!day1Has(DAY1_FLAGS.CHARGER)) {
        markDay1Flag(DAY1_FLAGS.CHARGER);
        const ch = Math.min(100, newBattery + CHARGER_FIND);
        setResources(p => ({ ...p, battery: ch, charger: 0 }));
        addMsg("system", `portable charger drained into phone · battery ${ch}%`, 700);
        addMsg("system", "charger empty — recharge it at a power source", 1400);
        pendingRef.current.push(setT(() => showDay1Hub(["the bedroom is not yours.", "a coat on the chair. shoes by the bed. none of it fits the blank in your head.", "under the bed: a portable charger, warm like it was just used."], "narrator"), 1700));
      } else {
        showDay1Hub(first ? ["the bedroom holds still.", "nothing here knows you."] : ["the bedroom again.", "the charger cable is already in your bag."], "narrator");
      }
      return;
    }

    if (action === "KITCHEN") {
      const first = markDay1Visited("kitchen");
      if (!day1Has(DAY1_FLAGS.SUPPLIES)) {
        markDay1Flag(DAY1_FLAGS.SUPPLIES);
        setResources(p => ({ ...p, food: START_SUPPLY, water: START_SUPPLY }));
        addMsg("system", `supplies gathered · food ${START_SUPPLY} · water ${START_SUPPLY}`, 700);
        pendingRef.current.push(setT(() => showDay1Hub(["the kitchen smells like dust and old metal.", "cans in the lower cabinet. bottled water under the sink.", "enough to leave, if you have to."], "narrator"), 1100));
      } else {
        showDay1Hub(first ? ["the kitchen is stripped quiet."] : ["the kitchen again.", "you already packed what would carry."], "narrator");
      }
      return;
    }

    if (action === "BATHROOM") {
      const first = markDay1Visited("bathroom");
      if (!day1Has(DAY1_FLAGS.BATHROOM)) {
        markDay1Flag(DAY1_FLAGS.BATHROOM);
        raiseQuestion("memory");
        showDay1Hub(["the bathroom mirror is cracked.", "your reflection looks like someone warned it and left.", "an empty prescription bottle sits in the sink. the label has been soaked clean."], "narrator");
      } else {
        showDay1Hub(first ? ["the bathroom light never comes on."] : ["the bathroom again.", "the blank label gives you nothing back."], "narrator");
      }
      return;
    }

    if (action === "WINDOW") {
      const first = markDay1Visited("window");
      if (!day1Has(DAY1_FLAGS.WINDOW)) {
        markDay1Flag(DAY1_FLAGS.WINDOW);
        raiseQuestion("harwick");
        showDay1Hub(["you lift the curtain with two fingers.", "harwick below: cars left open, traffic lights dead, a shape standing in the crosswalk too long.", "then it turns its head.", "you let the curtain fall."], "narrator");
      } else {
        showDay1Hub(first ? ["you keep back from the glass."] : ["the curtain stays closed.", "good."], "narrator");
      }
      return;
    }

    if (action === "DOOR") {
      const first = markDay1Visited("door");
      if (!day1Has(DAY1_FLAGS.DOOR)) {
        markDay1Flag(DAY1_FLAGS.DOOR);
        setNoise(n => Math.min(5, n + 1));
        addMsg("system", "door secured · noise +1", 700);
        pendingRef.current.push(setT(() => showDay1Hub(["you drag the table across the hall-facing door.", "the legs scrape louder than you want.", "something in the building knocks once. not at your door. near it."], "narrator"), 1050));
      } else {
        showDay1Hub(first ? ["the hallway door is thin."] : ["the table holds against the door.", "for now."], "narrator");
      }
      return;
    }

    if (action === "STAIRWELL") {
      const first = markDay1Visited("stairwell");
      if (!day1Has(DAY1_FLAGS.STAIRWELL)) {
        markDay1Flag(DAY1_FLAGS.STAIRWELL);
        setNoise(n => Math.min(5, n + 1));
        raiseQuestion("kim"); raiseQuestion("call");
        addMsg("system", "risk taken · noise +1", 700);
        pendingRef.current.push(setT(() => showDay1Hub(["you open the door only a handspan.", "cold stairwell air slides in.", "below, on the landing, a woman lies very still.", "you do not go down."], "narrator"), 1050));
      } else {
        showDay1Hub(first ? ["the stairwell breathes cold through the frame."] : ["you listen at the stairwell.", "nothing moves. that is not better."], "narrator");
      }
      return;
    }

    if (action === "ELLIE") {
      if (!day1Has(DAY1_FLAGS.ELLIE)) {
        markDay1Flag(DAY1_FLAGS.ELLIE);
        raiseQuestion("kim"); raiseQuestion("ellie"); raiseQuestion("call");
        // P6d — the header flips KIM→ELLIE the instant "name's ellie" actually renders,
        // tied to the message text (not the tap that asked the question).
        showDay1Hub(["okay.", "name's ellie.", "i found this phone in our stairwell two days ago.", "it belonged to kim. she was already gone.", "i didn't think anyone was going to answer it."], "ellie",
          (text) => {
            if (/ellie/i.test(text)) setContactName("ELLIE");
            if (/answer it/i.test(text)) addMsg("narrator", "somewhere in the apartment, under the quiet, a voice repeats through static.", 0);
          });
      } else {
        showDay1Hub(["still me.", "still not a great time for introductions.", "find the static. that's the part that matters tonight."], "ellie");
      }
      return;
    }

    if (action === "BROADCAST") {
      markDay1Flag(DAY1_FLAGS.BROADCAST);
      setDay1Scene("apartment"); day1SceneRef.current = "apartment";
      setChoices([]); setIsTyping(true);
      let t = 500;
      addMsg("narrator", "the sound comes from a little shortwave radio on the shelf.", t); t += 1500;
      addMsg("narrator", "the volume is almost dead, but the voice keeps looping.", t); t += 1700;
      addMsg("narrator", "coordinates. a promise of somewhere left.", t); t += 1500;
      addMsg("ellie", "you hear it too.", t); t += 1200;
      addMsg("ellie", "that's the signal i've been following.", t); t += 1500;
      addMsg("ellie", "we move when it's light. tonight, you keep that door shut.", t); t += 1300;
      pendingRef.current.push(setT(() => {
        setIsTyping(false);
        setChoices(capVisibleChoices(day1HubChoices(), "day1:broadcast"));
      }, t));
      return;
    }

    if (action === "SLEEP") {
      if (!day1ReadyForSleep()) {
        const missing = day1MissingPrep();
        showDay1Hub(["you lie down.", "the door feels too thin. the phone too close to dying.", `not yet: ${missing.join(", ")}.`], "narrator");
        return;
      }
      clearPending(); setChoices([]); setIsTyping(false);
      setDay1Scene("sleep"); day1SceneRef.current = "sleep";
      setExchangePhase(10);
      let t = 600;
      addMsg("narrator", "you make the apartment as quiet as you can.", t); t += 1600;
      addMsg("ellie", "get some rest. i'll wake you.", t); t += 1800;
      addMsg("narrator", "night falls.", t); t += 1500;
      addMsg("narrator", "day one ends.", t); t += 1500;
      pendingRef.current.push(setT(() => {
        if (isDay1Demo) setScreen("demoComplete");
        else startDayGate("day1");
      }, t + 900));
      return;
    }

    showDay1Hub();
  };

  // Pick the encounter for a revealed "encounter" lead (plan = power/search/hazard).
  // Reuses the pool-filter + seen-dedupe logic; returns a pendingStoryBeat or null.
  const pickEncounterBeat = (section, path, plan) => {
    const pool = (ENCOUNTERS[section === "path" ? path : "crossing"] || ENCOUNTERS.crossing)
      .filter(e => (e.minNoise || 0) <= noiseRef.current && e.id !== lastEncounterIdRef.current);
    let matching;
    if (plan === "power") matching = pool.filter(e => POWER_SOURCES.has(e.id));
    else { const wantSearch = plan === "search"; matching = pool.filter(e => e.choices.some(c => c.action === "SEARCH") === wantSearch); }
    // Route-aware power frequency (the core of route identity). Hospital (powerBias > 0)
    // PROMOTES a non-power lead into a power lead so battery rarely bites; route9
    // (powerBias < 0) DEMOTES some explicit power leads back into ordinary encounters so the
    // player is always hunting the next charge. Each roll only lands when the pool allows it,
    // and an empty result still falls back to `pool` below — never soft-locks the queue.
    const powerBias = routeProfile().powerBias;
    if (powerBias > 0 && plan !== "power" && Math.random() < powerBias) {
      const powerLeads = pool.filter(e => POWER_SOURCES.has(e.id));
      if (powerLeads.length) matching = powerLeads;
    } else if (powerBias < 0 && plan === "power" && Math.random() < -powerBias) {
      matching = pool.filter(e => !POWER_SOURCES.has(e.id));
    }
    const choicesPool = matching.length ? matching : pool;
    const unseen = choicesPool.filter(e => !seenEncountersRef.current.has(e.id)); // P6a
    const finalPool = unseen.length ? unseen : choicesPool;
    if (!finalPool.length) return null;
    const enc = pickRandom(finalPool);
    seenEncountersRef.current.add(enc.id);
    return { type: "encounter", enc };
  };

  // Leave the current area (player tapped "Move on", or the queue was forced empty).
  // Each section transitions to the next: path → crossing, crossing → shelter, haven → finale.
  const moveOnFrom = (section) => {
    if (section === "path") {
      const path = currentPathRef.current || "hospital";
      applyTransitionDrain("crossing_start");
      setGamePhase("p2_ai_cross");
      leadQueueRef.current = buildLeadQueue("crossing"); leadCursorRef.current = 0;
      setAiExchangeCount(0);
      pendingRef.current.push(setT(() => {
        const exitLine = {
          hospital: ["you slip out of mercy general.", "harwick's streets open ahead."],
          metro:    ["you climb back up to the street.", "harwick opens ahead."],
          route9:   ["you leave the highway behind.", "harwick's streets close in."],
        }[path] || ["you move on.", "harwick's streets open ahead."];
        const t = scheduleMessages(exitLine, null, "narrator");
        pendingRef.current.push(setT(() => { setIsTyping(true); localBeat(null, "p2_ai_cross"); }, t + 300));
      }, 600));
    } else if (section === "crossing") {
      pendingStoryBeatRef.current = { type: "shelter" };
      setIsTyping(true);
      localBeat(null, "p2_ai_cross"); // bridges into the shelter set-piece
    } else if (section === "haven") {
      pendingStoryBeatRef.current = { type: "haven_final" };
      setIsTyping(true);
      localBeat(null, "haven_ai"); // bridges into the finale
    }
  };

  // ─── Haven hub — named-destination navigation (Phase-3 foundation) ─────────────
  // Renders the destination menu: the rooms not yet investigated + the always-present
  // "to the heart of it" (the gated crack/ending). Reusing the chat choice list, so it
  // autosaves and resumes like any other decision point.
  const showHavenMenu = (delay = 600) => {
    const remaining = HAVEN_DESTINATIONS.filter(d => !havenVisitedRef.current.includes(d.id));
    const prompt = remaining.length
      ? ["the compound spreads out around you.", "where do you look?"]
      : ["you've walked all of it.", "only one place left."];
    const labels = remaining.length
      ? [...remaining.slice(0, HARD_CHOICE_CAP - 1).map(d => d.label), HEART_LABEL]
      : [HEART_LABEL];
    const t = scheduleMessages(prompt, labels, "narrator");
    return t + delay;
  };

  // ─── Phase 3 navigation — the invisible map made playable (mirrors showHavenMenu) ────
  const phase3Node = (region, node) => PHASE3_REGIONS[region]?.nodes?.[node] || null;

  // Present the current node's exits as the chat choice list. Hidden region exits (places
  // the player hasn't earned the name of) are filtered. Reuses scheduleMessages → autosaves.
  const showPhase3Exits = () => {
    const region = currentPhase3RegionRef.current;
    const node = phase3Node(region, currentPhase3NodeRef.current);
    if (!node) return 0;
    // As the light fails on an investigation day, flag nearby shelters and offer bed-down (the
    // shelter rule). The final day has no clock, so dusk never triggers there.
    const dusk = phase3DayRef.current < PHASE3_FINAL_DAY && daylightRef.current <= PHASE3_DUSK;
    // Hidden region exits (places not yet heard of) appear once their region is unlocked.
    const entries = (node.exits || [])
      .filter(e => !e.hidden || (e.region && phase3UnlockedRef.current.includes(e.region)))
      .map(e => {
        const dest = e.to ? phase3Node(region, e.to) : null;
        return {
          label: dusk && dest?.shelter ? `${e.label} [shelter]` : e.label,
          // A cut exit is an unreachable place. Region exits and the doors that lead to them
          // (dest kind "exit") are load-bearing — only plain in-region rooms may be hidden.
          droppable: !!e.to && dest?.kind !== "exit",
        };
      });
    const priorityLabels = [];
    // The finale call — at the Haven hub, once all 4 truths are uncovered, the phone rings.
    if (region === "haven" && currentPhase3NodeRef.current === "gate_yard" && discoveredTruthsRef.current.length >= 4) {
      priorityLabels.push(FINALE_CHOICE);
    }
    // Bed down — only at a shelter, only as the light fails (resting early at one is safe).
    if (dusk && node.shelter) priorityLabels.push(BED_DOWN_LABEL(phase3DayRef.current));
    // Over the cap → drop droppable exits from the tail (validatePhase3Map audits the worst case).
    let overflow = priorityLabels.length + entries.length - HARD_CHOICE_CAP;
    for (let i = entries.length - 1; i >= 0 && overflow > 0; i--) {
      if (!entries[i].droppable) continue;
      if (GATE_BYPASS) console.warn(`[Phase3] ${region}.${currentPhase3NodeRef.current}: cap hides "${entries[i].label}"`);
      entries.splice(i, 1); overflow--;
    }
    const labels = [...priorityLabels, ...entries.map(en => en.label)].slice(0, HARD_CHOICE_CAP);
    // Optional search — a room you haven't picked over yet, while there's daylight to spare.
    const searched = phase3SearchedRef.current.has(`${region}:${currentPhase3NodeRef.current}`);
    if (!dusk && node.kind === "room" && !node.truth && !searched && labels.length < HARD_CHOICE_CAP) labels.push("▸ Search the room [1 light]");
    return scheduleMessages([], labels, "narrator");
  };

  // Enter a node: (per-move battery drain is applied by handleChoice's generic drain via
  // beatBatteryCost("phase3")). Here: top up at powered nodes, raise the node's Case File
  // hooks, stream its beats (+ a sparse Ellie crack on first visit), mark visited, re-show
  // exits. `first` = a region's entry node (an arrival, not a move).
  const enterPhase3Node = (nodeId, { first = false } = {}) => {
    const region = currentPhase3RegionRef.current;
    const node = phase3Node(region, nodeId);
    if (!node) { showPhase3Exits(); return; }
    // Reconcile truth-gated unlocks (silent) — covers resumed saves whose truth predates this feature.
    discoveredTruthsRef.current.forEach(tr => {
      const opens = TRUTH_UNLOCKS[tr];
      if (opens && !phase3UnlockedRef.current.includes(opens)) {
        phase3UnlockedRef.current = [...phase3UnlockedRef.current, opens];
        setPhase3UnlockedRegions(phase3UnlockedRef.current);
      }
    });
    if (discoveredTruthsRef.current.length >= 2 && !phase3UnlockedRef.current.includes("annex")) {
      phase3UnlockedRef.current = [...phase3UnlockedRef.current, "annex"];
      setPhase3UnlockedRegions(phase3UnlockedRef.current);
    }
    const key = `${region}:${nodeId}`;
    const firstVisit = !visitedPhase3NodesRef.current.includes(key);
    currentPhase3NodeRef.current = nodeId; setCurrentPhase3Node(nodeId);
    if (firstVisit) {
      visitedPhase3NodesRef.current = [...visitedPhase3NodesRef.current, key];
      setVisitedPhase3Nodes(visitedPhase3NodesRef.current);
      // Case File hooks — questions announce a NEW QUESTION card; silent keys only gate facts.
      if (node.caseFile?.raise) node.caseFile.raise.forEach(k => raiseQuestion(k));
    }

    // Route-aware nodes (records_office) pull their first-visit beat from a per-path map so the
    // text matches what the player actually found on their leg (file/face · log/voice · order/name).
    let beatMsgs, beatFrom = "narrator";
    if (firstVisit && node.routeRecords) {
      beatMsgs = PHASE3_RECORDS[currentPathRef.current] || PHASE3_RECORDS.hospital;
    } else {
      const beat = (firstVisit ? node.onEnter : (node.revisit || node.onEnter))?.[0];
      beatMsgs = beat?.msgs || ["..."]; beatFrom = beat?.from || "narrator";
    }
    let t = scheduleMessages(beatMsgs, null, beatFrom);

    // Powered node — top a low battery back to the floor ("battery is exploration", soft).
    if (node.power && resourcesRef.current.battery < PHASE3_POWER_FLOOR) {
      pendingRef.current.push(setT(() => {
        setResources(p => ({ ...p, battery: Math.max(p.battery, PHASE3_POWER_FLOOR) }));
        addMsg("system", `you pull a charge · battery ${PHASE3_POWER_FLOOR}%`, 0);
        pulseBattery();
      }, t));
      t += 700;
    }

    // Region unlock — investigating a node can open a new spoke (its lead points there). Set the
    // unlock immediately; the in-chat NEW LEAD card lands after this node's beats.
    if (firstVisit && node.caseFile?.unlocks && !phase3UnlockedRef.current.includes(node.caseFile.unlocks)) {
      const rid = node.caseFile.unlocks;
      phase3UnlockedRef.current = [...phase3UnlockedRef.current, rid];
      setPhase3UnlockedRegions(phase3UnlockedRef.current);
      pendingRef.current.push(setT(() => addMsg("system", `▸ new lead · ${PHASE3_REGIONS[rid]?.label || rid} — reachable from the road`, 0), t));
      t += 900;
    }

    // Truth payoff — a region's one answer, delivered ONCE, only where it's earned (STORY.md §5).
    if (firstVisit && node.truth && !discoveredTruthsRef.current.includes(node.truth)) {
      discoveredTruthsRef.current = [...discoveredTruthsRef.current, node.truth];
      setDiscoveredTruths(discoveredTruthsRef.current);
      pendingRef.current.push(setT(() => {
        setSigFlicker(true); audioEngine.signal(); announceTruth(node.truth);
        pendingRef.current.push(setT(() => setSigFlicker(false), 1300));
      }, t));
      t += 1000;
      // Progress signal toward the finale gate (all 4 region truths). Gives the open
      // investigation a visible finish line; at 4, point the player back to the gate where
      // the call waits (the finale only appears at Haven's gate yard once all 4 are known).
      const tn = discoveredTruthsRef.current.length;
      pendingRef.current.push(setT(() => addMsg("system",
        tn >= 4 ? "▸ all four truths uncovered — return to the gate yard, where the call waits" : `▸ ${tn} of 4 truths uncovered`, 0), t));
      t += 900;
      // A truth can open the next spoke (TRUTH_UNLOCKS) — the NEW LEAD lands after the truth card.
      const opens = TRUTH_UNLOCKS[node.truth];
      if (opens && !phase3UnlockedRef.current.includes(opens)) {
        phase3UnlockedRef.current = [...phase3UnlockedRef.current, opens];
        setPhase3UnlockedRegions(phase3UnlockedRef.current);
        pendingRef.current.push(setT(() => addMsg("system", `▸ new lead · ${PHASE3_REGIONS[opens]?.label || opens} — reachable from the road`, 0), t));
        t += 900;
      }
      // Count-gated: the Research Annex opens once 2 truths are uncovered (STORY.md §5, "late").
      if (discoveredTruthsRef.current.length >= 2 && !phase3UnlockedRef.current.includes("annex")) {
        phase3UnlockedRef.current = [...phase3UnlockedRef.current, "annex"];
        setPhase3UnlockedRegions(phase3UnlockedRef.current);
        pendingRef.current.push(setT(() => addMsg("system", `▸ new lead · ${PHASE3_REGIONS.annex.label} — reachable from the road`, 0), t));
        t += 900;
      }
    }

    // Ellie's crack (first visit only) lands after the narrator beat, then the exits return.
    // presentPhase3Node (not showPhase3Exits) — it checks the day clock and may trigger nightfall.
    if (firstVisit && node.ellie) {
      pendingRef.current.push(setT(() => {
        setIsTyping(true);
        const et = scheduleMessages(node.ellie, null, "ellie");
        pendingRef.current.push(setT(() => { setIsTyping(true); presentPhase3Node(); }, et + 700));
      }, t + 700));
    } else {
      pendingRef.current.push(setT(() => { setIsTyping(true); presentPhase3Node(); }, t + 700));
    }
  };

  // ─── Phase 3 day clock — daylight, nightfall and the shelter rule ──────────────────
  // Spend a move of daylight (no clock on the final day). Called on each real map move.
  const spendDaylight = () => {
    if (phase3DayRef.current >= PHASE3_FINAL_DAY) return;
    const nd = daylightRef.current - 1;
    daylightRef.current = nd; setDaylight(nd);
  };

  // After arriving at a node, decide what to present: keep exploring, or — once the light is
  // gone — bed down. At a shelter you rest cleanly; caught in the open you're hurt and forced
  // to hole up (non-lethal). The final day has no night, so it's always just the exits.
  const presentPhase3Node = () => {
    const node = phase3Node(currentPhase3RegionRef.current, currentPhase3NodeRef.current);
    if (!node) { showPhase3Exits(); return; }
    if (phase3DayRef.current >= PHASE3_FINAL_DAY) { showPhase3Exits(); return; }
    if (daylightRef.current <= 0) { restNight(!node.shelter); return; }
    showPhase3Exits();
  };

  // Bed down for the night → the survival cost, the day turns, daylight refills, then dawn.
  // `caught` = nightfall caught you away from a shelter (HP penalty, no heal).
  const restNight = (caught) => {
    clearPending(); setChoices([]); setIsTyping(false);
    const day = phase3DayRef.current;
    let t = 600;
    if (caught) {
      addMsg("narrator", "the dark comes down with you still in the open.", t); t += 1800;
      addMsg("narrator", "you find a doorway, a stairwell — anything — and wait it out.", t); t += 1800;
    } else {
      addMsg("narrator", "you hole up for the night. doors checked, the dark kept out.", t); t += 1800;
    }
    addMsg("narrator", "night falls.", t); t += 1500;
    addMsg("narrator", `day ${day} ends.`, t); t += 1500;
    // Survival cost (non-lethal). Shown from a snapshot; applied via a functional update.
    const r = resourcesRef.current;
    const seg = [];
    seg.push(r.food  > 0 ? "food -1"  : "no food · hp -1");
    seg.push(r.water > 0 ? "water -1" : "no water · hp -1");
    if (caught) seg.push(`caught out · hp -${PHASE3_CAUGHT_HP}`);
    setResources(p => {
      let f = p.food, w = p.water, h = p.hp;
      if (f > 0) f -= 1; else h = Math.max(1, h - 1);
      if (w > 0) w -= 1; else h = Math.max(1, h - 1);
      if (caught) h = Math.max(1, h - PHASE3_CAUGHT_HP);
      return { ...p, food: f, water: w, hp: h };
    });
    addMsg("system", "shelter · " + seg.join(" · "), t); t += 500;
    audioEngine.loss();
    // Turn the day, refill the light.
    const nextDay = day + 1;
    phase3DayRef.current = nextDay; setPhase3Day(nextDay);
    daylightRef.current = PHASE3_DAYLIGHT; setDaylight(PHASE3_DAYLIGHT);
    // The night passes in real time behind the gate; the dawn beat plays via wakeFromGate.
    // The rest heal is the night's REWARD — it rides the gate and lands at dawn, so waking
    // early forfeits it. Caught-out nights have no heal to forfeit (the penalty landed above).
    pendingRef.current.push(setT(() => startDayGate("phase3_night", caught ? 0 : PHASE3_REST_HEAL), t + 900));
  };

  // ─── Day transition ────────────────────────────────────────────────────────────────
  const startDayGate = (reason = "phase3_night", heal = 0) => {
    gateReasonRef.current = reason; setGateReason(reason);
    gateHealRef.current = heal; // the dawn heal riding on this gate (0 = nothing deferred)
    // Gates dormant (dev): the night resolves instantly through the verified wake path —
    // same heal, captions, and dawn continuation, minus the real-time wall.
    if (!DAY_GATES_ENABLED) { setChoices([]); setIsTyping(false); wakeFromGate(false); return; }
    const wakeAt = Date.now() + DAY_GATE_MS;
    gateWakeAtRef.current = wakeAt; setGateWakeAt(wakeAt);
    setNowTick(Date.now());
    setChoices([]); setIsTyping(false);
    setScreen("resting");
  };
  // Wake from a day-gate and continue. The continuation is derived from state (not a stored
  // callback): the prologue→Phase-3 gate has no node yet → start Day 4 at the gate yard; a night
  // gate → the dawn beat for the (already-advanced) day, then the current node's exits.
  const wakeFromGate = (early = false) => {
    const reason = gateReasonRef.current;
    const heal = gateHealRef.current || 0;
    gateHealRef.current = 0;
    gateWakeAtRef.current = null; setGateWakeAt(null);
    gateReasonRef.current = null; setGateReason(null);
    setScreen("chat"); setIsTyping(true);
    // The deferred rest heal lands at dawn; forcing yourself up early forfeits it.
    if (early && heal) {
      addMsg("system", "short sleep · no rest", 400);
    } else if (heal) {
      setResources(p => ({ ...p, hp: Math.min(10, p.hp + heal) }));
      addMsg("system", `rested · hp +${heal}`, 400);
    } else if (early) {
      addMsg("narrator", "you barely slept.", 400); // day-1 / handoff / caught nights: no heal at stake
    }
    if (reason === "day1") {
      startDay2Morning();
      return;
    }
    if (currentPhase3NodeRef.current == null) {
      const t = scheduleMessages(["day 4.", "you wake at haven. the floodlights never went out.", "you start remembering by looking. so look."], null, "narrator");
      pendingRef.current.push(setT(() => {
        setIsTyping(true);
        const et = scheduleMessages(["you've got a few days. after that i don't think it waits anymore."], null, "ellie");
        pendingRef.current.push(setT(() => { setIsTyping(true); enterPhase3Node("gate_yard", { first: true }); }, et + 700));
      }, t + 700));
    } else {
      const day = phase3DayRef.current;
      if (day >= PHASE3_FINAL_DAY) {
        const t = scheduleMessages([`day ${day}. the last day.`, "the week's run out. no more nights after this one."], null, "narrator");
        pendingRef.current.push(setT(() => {
          setIsTyping(true);
          const et = scheduleMessages(["finish what's left.", "then come to the gate. i'll be there."], null, "ellie");
          pendingRef.current.push(setT(() => { setIsTyping(true); presentPhase3Node(); }, et + 700));
        }, t + 700));
      } else {
        const t = scheduleMessages([`day ${day}.`, "morning. you made it through the night."], null, "narrator");
        pendingRef.current.push(setT(() => { setIsTyping(true); presentPhase3Node(); }, t + 700));
      }
    }
  };

  // Sometimes the half-connected block a Phase-3 move. Fire an encounter (reusing the combat
  // engine) before arriving at `dest`; resolveEncounterChoice routes back via its phase3 branch.
  // Skipped at dusk (that time is for reaching shelter) and right at a shelter / truth node.
  const maybePhase3Encounter = (dest) => {
    if (daylightRef.current <= PHASE3_DUSK) return false;       // dusk → reach shelter, don't fight
    if (Math.random() >= PHASE3_ENCOUNTER_RATE) return false;
    const destNode = phase3Node(currentPhase3RegionRef.current, dest);
    if (destNode?.shelter || destNode?.truth) return false;    // don't ambush at a safe room / payoff
    const pool = PHASE3_ENCOUNTERS.filter(e => e.id !== lastPhase3EncounterIdRef.current);
    const enc  = pickRandom(pool.length ? pool : PHASE3_ENCOUNTERS);
    lastPhase3EncounterIdRef.current = enc.id;
    phase3PendingDestRef.current = dest;
    returnToPhaseRef.current = "phase3";
    setCurrentEncounter(enc); currentEncounterRef.current = enc;
    setGamePhase("encounter"); gamePhaseRef.current = "encounter";
    setIsTyping(true);
    scheduleMessages(enc.msgs, tagEncounterChoices(enc), "narrator");
    return true;
  };

  // Optional node search — costs a beat of daylight for a chance at food/water (a reason to
  // scavenge against the nightly drain). Once per node per run.
  const handlePhase3Search = () => {
    const key = `${currentPhase3RegionRef.current}:${currentPhase3NodeRef.current}`;
    phase3SearchedRef.current = new Set([...phase3SearchedRef.current, key]);
    spendDaylight();
    const r = Math.random();
    let line, sys = null;
    if (r < 0.42)      { setResources(p => ({ ...p, food:  p.food  + 1 })); line = ["you go through the room.", "something sealed, still good. you pocket it."]; sys = "searched · food +1"; audioEngine.gain(); }
    else if (r < 0.78) { setResources(p => ({ ...p, water: p.water + 1 })); line = ["a back shelf, a dropped bag.", "a bottle, unbroken. you take it."];          sys = "searched · water +1"; audioEngine.gain(); }
    else               { line = ["you search the room.", "stripped. nothing left worth carrying."]; audioEngine.loss(); }
    const t = scheduleMessages(line, null, "narrator");
    if (sys) addMsg("system", sys, t);
    pendingRef.current.push(setT(() => { setIsTyping(true); presentPhase3Node(); }, t + (sys ? 900 : 600)));
  };

  // Resolve a movement choice against the current node's exits. `to` = an in-region move;
  // `region` = a spoke exit (locked in 3A → terse "not yet" beat, no transition).
  const handlePhase3Choice = (choice) => {
    const sm = stripMarkers(choice);
    if (sm === stripMarkers(FINALE_CHOICE)) { beginFinale(); return; }
    // Bed down for the night (the shelter rule) — turn the day. No daylight spent.
    if (/^▸ Bed down/.test(sm)) { restNight(false); return; }
    if (/^▸ Search/.test(sm))   { handlePhase3Search(); return; }
    const node = phase3Node(currentPhase3RegionRef.current, currentPhase3NodeRef.current);
    if (!node) { enterPhase3Node(PHASE3_REGIONS.haven.entryNode, { first: true }); return; }
    const picked = (node.exits || []).find(e => stripMarkers(e.label) === stripMarkers(choice));
    if (!picked) { showPhase3Exits(); return; }
    // A real move spends daylight; sometimes the half-connected block the way first.
    if (picked.to) { spendDaylight(); if (maybePhase3Encounter(picked.to)) return; enterPhase3Node(picked.to); return; }
    if (picked.region) {
      const target = PHASE3_REGIONS[picked.region];
      // Gate is driven by phase3UnlockedRegions (the data `locked` flag is just the initial state).
      const unlocked = phase3UnlockedRef.current.includes(picked.region)
        && target && Object.keys(target.nodes || {}).length > 0;
      if (!unlocked) {
        const lines = PHASE3_LOCKED_EXIT[picked.region] || ["not yet.", "you're not ready for that."];
        const t = scheduleMessages(lines, null, "narrator");
        pendingRef.current.push(setT(() => { setIsTyping(true); showPhase3Exits(); }, t + 700));
        return; // looking down the road costs no daylight — you didn't go
      }
      spendDaylight();
      currentPhase3RegionRef.current = picked.region; setCurrentPhase3Region(picked.region);
      if (maybePhase3Encounter(target.entryNode)) return;
      enterPhase3Node(target.entryNode, { first: true });
      return;
    }
    showPhase3Exits();
  };

  // Commit this run's fragments/clues into the slot profile, bump playthroughs, set the 100%
  // flag, and persist (run cleared — Phase 3 writes its own snapshot on the first menu).
  // Shared by the auto-flow handoff so prologue progress still records without a win screen.
  const mergeRunIntoProfile = () => {
    const prev = activeProfileRef.current || emptyProfile();
    const fragments = [...new Set([...(prev.fragments || []), ...recoveredMemoriesRef.current.filter(m => m.type === "fragment").map(m => m.name)])];
    const clues     = [...new Set([...(prev.clues     || []), ...recoveredMemoriesRef.current.filter(m => m.type === "discovery").map(m => m.name)])];
    const profile = { playthroughs: (prev.playthroughs || 0) + 1, fragments, clues, complete: fragments.length >= 9 && clues.length >= 3 };
    activeProfileRef.current = profile;
    const i = activeSlotRef.current;
    (async () => { try { if (i != null) await window.storage.set(slotKey(i), JSON.stringify(buildSlotData(profile, null))); } catch (e) {} await refreshSlots(); })();
    return profile;
  };

  // Auto-flow handoff into Phase 3 (STORY.md §7, revised): after the call dies, the prologue
  // commits and the player is dropped — alone — into Haven as the investigation hub. Resources
  // carry over ("battery is exploration"). No win screen; the pause is the canon "alone" beat.
  const beginPhase3 = () => {
    clearPending();
    mergeRunIntoProfile();
    currentPhase3RegionRef.current = "haven";  setCurrentPhase3Region("haven");
    currentPhase3NodeRef.current   = null;     setCurrentPhase3Node(null);
    visitedPhase3NodesRef.current  = [];       setVisitedPhase3Nodes([]);
    discoveredTruthsRef.current    = [];       setDiscoveredTruths([]);
    phase3UnlockedRef.current      = ["haven"];setPhase3UnlockedRegions(["haven"]);
    phase3DayRef.current = PHASE3_START_DAY; setPhase3Day(PHASE3_START_DAY); // the week resumes: Day 4
    daylightRef.current  = PHASE3_DAYLIGHT;  setDaylight(PHASE3_DAYLIGHT);
    setGamePhase("phase3"); gamePhaseRef.current = "phase3";
    setContactName("ELLIE");
    setSigFlicker(false); setIsTyping(false);
    setMessages([]); setChoices([]);
    setScreen("chat"); chatStartedRef.current = true;
    const t = scheduleMessages(["the screen goes dark.", "then it doesn't.", "you're still here.", "alone, in the light of the place that called you.", "you've been awake for three days.", "you find a bunk. you let yourself sleep."], null, "narrator");
    // The night passes instantly; the dawn beat plays via wakeFromGate
    // (Day 4 begins at the gate yard, since no Phase-3 node is set yet).
    pendingRef.current.push(setT(() => startDayGate("phase3"), t + 900));
  };

  // ─── Phase 3F — the finale flow (mirrors the prologue's call cadence) ────────────────
  // Play a flat line list with cumulative delays; returns the total time so callers can chain.
  const playFinaleLines = (lines, startDelay = 0) => {
    let d = startDelay;
    lines.forEach(ln => {
      addMsg(ln.from, ln.text, d);
      d += ln.from === "narrator" ? 1900 : ln.from === "system" ? 1400 : 2100;
    });
    return d;
  };
  // Persist which ending the player reached (the run is over → cleared to null).
  const recordEnding = (kind) => {
    const profile = { ...(activeProfileRef.current || emptyProfile()), ending: kind };
    activeProfileRef.current = profile;
    const i = activeSlotRef.current;
    (async () => { try { if (i != null) await window.storage.set(slotKey(i), JSON.stringify(buildSlotData(profile, null))); } catch (e) {} await refreshSlots(); })();
  };
  // The final call at Haven — pays off the held threads, then offers Accept / Refuse.
  const beginFinale = () => {
    clearPending();
    setGamePhase("phase3_finale"); gamePhaseRef.current = "phase3_finale";
    setChoices([]); setIsTyping(false);
    setSigFlicker(true); audioEngine.signal();
    pendingRef.current.push(setT(() => setSigFlicker(false), 1400));
    // The call IS the Ellie reveal — record it so the Case File marks Haven's truth (no region
    // node pays "what Ellie is" off, so without this it would read 4/5 uncovered forever).
    if (!discoveredTruthsRef.current.includes("ellie")) {
      discoveredTruthsRef.current = [...discoveredTruthsRef.current, "ellie"];
      setDiscoveredTruths(discoveredTruthsRef.current);
    }
    const t = playFinaleLines(FINALE_CONVERGENCE, 600);
    pendingRef.current.push(setT(() => announceTruth("ellie"), t + 200));
    pendingRef.current.push(setT(() => { setIsTyping(false); setChoices([ACCEPT_CHOICE, REFUSE_CHOICE]); }, t + 1600));
  };
  // Resolve the choice → play its sequence → the definitive ending screen.
  const handleFinaleChoice = (choice) => {
    clearPending(); setChoices([]); setIsTyping(false);
    const accept = stripMarkers(choice) === stripMarkers(ACCEPT_CHOICE);
    setSigFlicker(true); audioEngine.signal();
    pendingRef.current.push(setT(() => setSigFlicker(false), 1600));
    const t = playFinaleLines(accept ? FINALE_ACCEPT : FINALE_REFUSE, 500);
    recordEnding(accept ? "accept" : "refuse");
    pendingRef.current.push(setT(() => {
      setEndingLines(accept ? ACCEPT_ENDING_LINES : REFUSE_ENDING_LINES);
      setEndingKind(accept ? "accept" : "refuse");
      setScreen("ending");
    }, t + 1400));
  };
  // After an ending, walk back to the gate with the call still waiting — lets the player try the
  // other choice without replaying the whole game. The Phase 3 state (truths, region/node) is
  // still live in memory, so showPhase3Exits re-offers the finale (all 4 truths are still known).
  const resumeAfterEnding = () => {
    clearPending();
    setEndingLines([]); setEndingKind(null); setShowRestart(false);
    setGamePhase("phase3"); gamePhaseRef.current = "phase3";
    currentPhase3RegionRef.current = "haven"; setCurrentPhase3Region("haven");
    currentPhase3NodeRef.current = "gate_yard"; setCurrentPhase3Node("gate_yard");
    phase3DayRef.current = PHASE3_FINAL_DAY; setPhase3Day(PHASE3_FINAL_DAY); // the week's over — timeless final day
    setSigFlicker(false); setIsTyping(false); setChoices([]); setMessages([]);
    setScreen("chat"); chatStartedRef.current = true;
    const t = scheduleMessages(["the gate yard. the phone, still warm in your hand.", "the call is still there. it always will be."], null, "narrator");
    pendingRef.current.push(setT(() => { setIsTyping(true); showPhase3Exits(); }, t + 700));
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
    // (haven_approach is deliberately excluded and has NO offline/starvation check: by
    // design the approach can't strand you — the Haven cache moments away is the relief,
    // so the battery may visibly hit 0% here without going dark. Neglect stays lethal
    // earlier, in the crossing/legs. See the haven_approach handler.)
    if (newBattery <= 0 && ["p2_scripted", "shelter", "haven_final"].includes(gamePhaseRef.current)) {
      pendingRef.current.push(setT(() => setScreen("offline"), 1500));
      return;
    }

    // Phase 3 — map navigation. The generic drain above already charged the move; no offline
    // death in Phase 3 (non-punishing, STORY.md §4). enterPhase3Node owns recharge + beats.
    if (gamePhaseRef.current === "phase3") { handlePhase3Choice(choice); return; }
    if (gamePhaseRef.current === "phase3_finale") { handleFinaleChoice(choice); return; }

    if (gamePhaseRef.current === "p2_memory_frag") {
      const frag = selectedFragmentRef.current;
      const fragName = frag?.name || "Unknown";
      const isNewFrag = !recoveredMemoriesRef.current.some(m => m.name === fragName);
      if (isNewFrag) {
        setRecoveredMemories(prev => [...prev, { name: fragName, type: "fragment" }]);
      }
      const newCount = recoveredMemoriesRef.current.filter(m => m.type === "fragment").length + (isNewFrag ? 1 : 0);
      setSigFlicker(true);
      audioEngine.signal(); // a memory surfacing through the Signal — distortion artifact
      pendingRef.current.push(setT(() => setSigFlicker(false), 900));
      if (isNewFrag) {
        pendingRef.current.push(setT(() => {
          setMessages(p => [...p, { id:nextId("mem"), from:"memory_note", name:fragName, count:newCount, kind:"fragment" }]);
        }, 600));
      }
      setGamePhase("p2_ai");
      // Delay until the memory notification has rendered, then reground from the
      // flashback to the present before the next beat (no hard cut back to reality).
      pendingRef.current.push(setT(() => {
        const path = currentPathRef.current || "hospital";
        const reground = {
          hospital: ["you blink.", "the corridor again."],
          metro:    ["you blink.", "the tunnel again."],
          route9:   ["you blink.", "the road again."],
        }[path] || ["you blink.", "back to the present."];
        const t = scheduleMessages(reground, null, "narrator");
        pendingRef.current.push(setT(() => { setIsTyping(true); localBeat(null, "p2_ai"); }, t + 300));
      }, 1400));
      return;
    }

    if (gamePhaseRef.current === "phase1") {
      handleDay1Choice(choice, newBattery);
      return;
    }

    if (gamePhaseRef.current === "p2_scripted") {
      const path  = currentPathRef.current || "hospital"; // H4
      const beats = PATH_BEATS[path];
      const cur   = beats[p2BeatIndex];
      const next  = p2BeatIndex + 1;
      if (WEAPON_PICKUPS[cur?.onChoice]) equipWeapon(WEAPON_PICKUPS[cur.onChoice]);
      // When the player presses Ellie on her route knowledge ("How do you know …"),
      // she deflects rather than ignoring it — a terse dodge keeps the scared-survivor
      // voice and makes the silence feel chosen. It is NOT a crack/admission: the real
      // crack ("i don't know how i know any of this") is reserved for the Haven approach.
      const askedHow = /^how do you know/i.test(stripMarkers(choice));
      if (next < beats.length) {
        setP2BeatIndex(next);
        const nb = beats[next];
        const msgs = askedHow ? [pickRandom(ELLIE_DEFLECT), ...nb.msgs] : nb.msgs;
        scheduleMessages(msgs, nb.choices, "ellie");
      } else {
        // Path scripted complete — pick this run's fragment, drain water, start AI.
        // Prefer a fragment this slot hasn't collected yet (like the seen-encounter /
        // seen-beat "prefer unseen" pattern), so replaying a route makes progress toward
        // 100% instead of re-rolling an owned fragment and showing a flashback that
        // doesn't count. Falls back to the full pool once all three are collected.
        const fragPool = MEMORY_FRAGMENT_POOLS[path] || MEMORY_FRAGMENT_POOLS.hospital;
        const ownedFrags = new Set(recoveredMemoriesRef.current.filter(m => m.type === "fragment").map(m => m.name));
        const freshFrags = fragPool.filter(f => !ownedFrags.has(f.name));
        const chosenFrag = pickRandom(freshFrags.length ? freshFrags : fragPool);
        setSelectedFragment(chosenFrag);
        // The path leg is now a player-paced lead queue (buildLeadQueue). Reset the
        // exploration cursor and the one-shot memory guard, then show the first nav screen.
        const startLeg = () => {
          applyTransitionDrain("path_start");
          setFragFired(false); setCalmFired(false); setAiExchangeCount(0); setGamePhase("p2_ai");
          leadQueueRef.current = buildLeadQueue("path"); leadCursorRef.current = 0; // explore at your pace
          localBeat(null, "p2_ai"); // first nav screen of the path leg
        };
        if (askedHow) {
          // Dodge the final "how do you know" before moving out, then start the leg.
          setIsTyping(true);
          const t = scheduleMessages(["later. keep moving."], null, "ellie");
          pendingRef.current.push(setT(startLeg, t + 300));
        } else {
          startLeg();
        }
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
        pendingRef.current.push(setT(() => {
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
        addMsg("ellie", "i told you to stop.", 5600); // the slip — her fear sharpens for one line
        addMsg("ellie", "...i'm sorry. i'm just scared. keep going. i've got you.", 7100); // and she walks it back
        shelterForcedRef.current = true; // one-shot — this whole branch only fires the first "Keep moving"
        pendingRef.current.push(setT(() => {
          addMsg("narrator", "a doorway.", 200);
          addMsg("narrator", "dark inside. but quiet.", 1600);
          // setIsTyping(false) matters: handleChoice set it true, and the choice row only
          // renders when !isTyping — without the clear this path soft-locked on the dots.
          pendingRef.current.push(setT(() => { setIsTyping(false); setChoices([
            "Go inside. Sleep. [-1 Food] [-1 Water]",
            "Bar the door and sleep. [+1 Noise] [-1 Food] [-1 Water]",
          ]); }, 3800));
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
      pendingRef.current.push(setT(() => { setIsTyping(false); setChoices(["·"]); }, 5600));
      return;
    }

    if (gamePhaseRef.current === "haven_approach") {
      // No death check here — not starvation, not offline. If you've reached Haven's
      // doorstep, the cache (food, water, battery, weapon — moments away in haven_ai) is
      // your relief; dying of hunger OR a dead battery at the gate felt cheap. The battery
      // can still visibly bottom out (the HUD shows it on the edge), but the approach can't
      // strand you — the cache restocks it. Neglect stays lethal earlier, in the crossing/
      // legs (starvation is checked there; offline guards the AI legs via localBeat).
      const next = p2BeatIndex + 1;
      setP2BeatIndex(next);
      if (next < HAVEN_APPROACH_BEATS.length) {
        const nx = HAVEN_APPROACH_BEATS[next];
        const t = scheduleMessages(nx.msgs, nx.choices, nx.from || "narrator");
        if (nx.effect) pendingRef.current.push(setT(() => fireBeatEffect(nx.effect), t + 200));
      } else {
        raiseQuestion("haven"); // arrived — Haven is empty
        setGamePhase("haven_ai");
        havenVisitedRef.current = []; // Haven hub — nothing investigated yet
        // Haven cache — the relief at the end of the scarcity gauntlet. A stocked
        // compound, looted on the way in: a charging station (power), the pantry
        // (supplies), security (weapon). You must SURVIVE to here to get it.
        addMsg("narrator", "a charging station inside the gate.", 800);
        addMsg("narrator", "a rack of charged battery packs by the dead terminals.", 1900);
        setResources(p => ({ ...p, battery: Math.min(100, p.battery + HAVEN_BATTERY_CACHE), charger: p.charger === null ? null : Math.min(100, p.charger + 40) }));
        addMsg("system", `battery packs · +${HAVEN_BATTERY_CACHE}% · charger refilled`, 2700); pulseBattery();
        addMsg("narrator", "the pantry off the dining hall. still stocked.", 3900);
        setResources(p => ({ ...p, food: Math.max(p.food, HAVEN_SUPPLY_FLOOR), water: Math.max(p.water, HAVEN_SUPPLY_FLOOR) }));
        addMsg("system", `supplies restocked · food & water to ${HAVEN_SUPPLY_FLOOR}`, 4700);
        addMsg("narrator", "a security office. a weapon locker, forced but not emptied.", 5900);
        equipWeapon("machete", 6700);
        // Hand off to the hub menu (named destinations) once the cache lines have landed.
        pendingRef.current.push(setT(() => { setIsTyping(true); showHavenMenu(); }, 7900));
      }
      return;
    }

    if (gamePhaseRef.current === "haven_ai") {
      // Haven hub — pick a destination to investigate, or head to the heart of it (the crack).
      if (/heart of it/i.test(choice)) {
        // Gated ending: the only way out. Render the 143 board crack, fire record143, then
        // the haven_final handler runs the incoming-call sequence on the next tap.
        setGamePhase("haven_final"); setHavenFinalIndex(0);
        havenFinalRef.current = HAVEN_FINAL_SEQUENCE;
        const t = scheduleMessages(HAVEN_FINAL_SEQUENCE[0].msgs, HAVEN_FINAL_SEQUENCE[0].choices, "narrator");
        if (HAVEN_FINAL_SEQUENCE[0].effect) pendingRef.current.push(setT(() => fireBeatEffect(HAVEN_FINAL_SEQUENCE[0].effect), t + 200));
        return;
      }
      // A destination — show its reveal, mark visited, then re-show the (shrunken) menu.
      const dest = HAVEN_DESTINATIONS.find(d => stripMarkers(d.label) === stripMarkers(choice));
      if (!dest) { showHavenMenu(); return; } // defensive — re-show the menu
      if (!havenVisitedRef.current.includes(dest.id)) havenVisitedRef.current = [...havenVisitedRef.current, dest.id];
      const path = currentPathRef.current || "hospital";
      const msgs = dest.path ? (HAVEN_RECORDS_BEAT[path] || HAVEN_RECORDS_BEAT.hospital) : dest.msgs;
      const t = scheduleMessages(msgs, null, dest.from || "narrator");
      if (dest.effect) pendingRef.current.push(setT(() => fireBeatEffect(dest.effect), t + 200));
      if (dest.after) {
        // Ellie's reaction lands after the narrator beat, then the menu returns.
        pendingRef.current.push(setT(() => {
          setIsTyping(true);
          const t2 = scheduleMessages(dest.after, null, "ellie");
          pendingRef.current.push(setT(() => { setIsTyping(true); showHavenMenu(); }, t2 + 700));
        }, t + 500));
      } else {
        pendingRef.current.push(setT(() => { setIsTyping(true); showHavenMenu(); }, t + 700));
      }
      return;
    }

    if (gamePhaseRef.current === "haven_final") {
      const seq  = havenFinalRef.current;
      const next = havenFinalIndex + 1;
      setHavenFinalIndex(next);
      if (next < seq.length) {
        const t = scheduleMessages(seq[next].msgs, seq[next].choices, "narrator");
        if (seq[next].effect) pendingRef.current.push(setT(() => fireBeatEffect(seq[next].effect), t + 200));
      } else {
        // Incoming call
        setChoices([]); setIsTyping(false);
        setSigFlicker(true);
        addMsg("narrator", "the phone vibrates.", 800);
        addMsg("system", "INCOMING CALL  —  ELLIE", 2400);
        addMsg("narrator", "you answer.", 4000);
        pendingRef.current.push(setT(() => { setSigFlicker(false); setIsTyping(true); }, 5400));
        pendingRef.current.push(setT(() => {
          setIsTyping(false);
          setMessages(p => [...p, { id:nextId("e"), from:"ellie", text:"..." }]);
        }, 7000));
        pendingRef.current.push(setT(() => setIsTyping(true), 8200));
        pendingRef.current.push(setT(() => {
          setIsTyping(false);
          setSigFlicker(true);
          audioEngine.signal(); // the Signal, right up against the words — that sound = Ellie/the Signal
          setMessages(p => [...p, { id:nextId("e"), from:"ellie", text:"i remember you." }]);
          pendingRef.current.push(setT(() => setSigFlicker(false), 1000));
        }, 9800));
        // First crack, not the answer: the call drops on the player. No explanation.
        addMsg("narrator", "the line goes dead.", 11400);
        addMsg("narrator", "click.", 12800);
        // Auto-flow into Phase 3: the prologue commits, then Haven opens as the investigation
        // hub (no win screen — the silence after "click." is the canon "player alone" beat).
        pendingRef.current.push(setT(() => beginPhase3(), 15200));
      }
      return;
    }

    if (gamePhaseRef.current === "p2_ai" || gamePhaseRef.current === "p2_ai_cross") {
      const path    = currentPathRef.current;
      const section = gamePhaseRef.current === "p2_ai" ? "path" : "crossing";

      // "Move on" → leave the area now (player-paced). No other choice starts with "Move on".
      if (/^move on\b/i.test(stripMarkers(choice))) { moveOnFrom(section); return; }

      // "Explore" → reveal the next lead from this area's queue (advance the cursor).
      const queue = leadQueueRef.current || [];
      const idx   = leadCursorRef.current;
      leadCursorRef.current = idx + 1;
      setAiExchangeCount(leadCursorRef.current); // mirror to state for save snapshots
      const lead  = queue[idx]; // undefined only if somehow past the end

      const drain = lead?.drain ? applyTransitionDrain(lead.drain) : { food: 0, water: 0 }; // mid-leg squeeze

      let pendingBeat = null;
      if (noiseRef.current >= 3 && (!lead || lead.kind === "atmo" || lead.kind === "calm" || lead.kind === "encounter")) {
        // Loud → they found you. Forced fight (never overrides a memory/discovery beat).
        // The planned lead is NOT consumed — rewind the cursor so it replays on the next
        // explore (otherwise a cornered fight could silently eat the leg's guaranteed
        // power-source lead, the battery lifeline). No loop risk: the fight resets noise to 0.
        // A calm lead also yields: the fight fires first, then the breather replays after —
        // earned relief, and the one-per-run beat can't be eaten.
        leadCursorRef.current = idx; setAiExchangeCount(idx);
        pendingBeat = { type: "encounter", enc: CORNERED_ENCOUNTER };
      } else if (lead?.kind === "memory" && !fragFiredRef.current) {
        setFragFired(true);
        pendingBeat = { type: "memory" };
      } else if (lead?.kind === "discovery") {
        pendingBeat = { type: "discovery" };
      } else if (lead?.kind === "calm" && !calmFiredRef.current) {
        setCalmFired(true);
        pendingBeat = { type: "calm" };
      } else if (lead?.kind === "encounter") {
        pendingBeat = pickEncounterBeat(section, path, lead.plan);
      }
      // lead.kind === "atmo" (or null) → no story beat; localBeat renders the next nav screen.
      // Noise is a "how loud have you been" meter: only loud actions (search/force/fight)
      // raise it; recovery comes from a forced fight (resets to 0) and the leg transition (−1).

      pendingStoryBeatRef.current = pendingBeat;

      // Fix #5 — apply any loot marker before the beat; effBattery folds in the
      // drain plus any [+N Battery] loot.
      const loot = applyChoiceLoot(choice, newBattery);
      const effBattery = loot.newBattery;

      // Priority 1 — starvation/dehydration on the loot-adjusted vitals, with the
      // mid-leg transition drain (above) folded in — applyTransitionDrain's setResources
      // is async, so it isn't in resourcesRef/loot yet this tick.
      const snapFood  = Math.max(0, loot.newFood  + drain.food);
      const snapWater = Math.max(0, loot.newWater + drain.water);
      const survHp = applyStarvation({ food: snapFood, water: snapWater, hp: loot.newHp });
      if (survHp <= 0) { triggerDeath(snapFood <= 0 ? "starvation" : "dehydration"); return; }

      localBeat(effBattery); // gamePhaseRef is correct mid-section, no override needed
      return;
    }

    if (gamePhaseRef.current === "p2_discovery") {
      discoveryFoundRef.current = true; // story spine secured — "move on" off the first route now unlocks
      const path = currentPathRef.current || "hospital"; // H4
      const smsgs = { DISCOVERY_HOSPITAL:"patient file found. the name is yours.", DISCOVERY_METRO:"broadcast log. haven named two weeks before any of this.", DISCOVERY_ROUTE9:"deployment order found. personnel reassigned to project haven." };
      const discoveryNames = { DISCOVERY_HOSPITAL:"Patient File", DISCOVERY_METRO:"Broadcast Log", DISCOVERY_ROUTE9:"Project Haven" };
      const dName = discoveryNames[DISCOVERY_BEATS[path].onChoice] || "Unknown";
      const isNewClue = !recoveredMemoriesRef.current.some(m => m.name === dName);
      if (isNewClue) {
        setRecoveredMemories(prev => [...prev, { name: dName, type: "discovery" }]);
      }
      const newCount = recoveredMemoriesRef.current.filter(m => m.type === "discovery").length + (isNewClue ? 1 : 0);
      setSigFlicker(true);
      pendingRef.current.push(setT(() => setSigFlicker(false), 900));

      // System message and notification — let these land visually before returning.
      addMsg("system", smsgs[DISCOVERY_BEATS[path].onChoice], 600);
      if (isNewClue) {
        pendingRef.current.push(setT(() => {
          setMessages(p => [...p, { id:nextId("disc"), from:"memory_note", name:dName, count:newCount, kind:"discovery" }]);
        }, 1400));
      }

      // Recording the discovery (the required story spine) returns the player to the nav
      // screen and UNLOCKS "move on" (discoveryFoundRef is now true). The discovery is mid-
      // queue, not last: the optional memory + atmosphere leads may still remain after it, so
      // the player can keep exploring for those or leave now.
      pendingRef.current.push(setT(() => {
        setGamePhase("p2_ai");
        setIsTyping(true);
        localBeat(null, "p2_ai");
      }, 2400));
      return;
    }
  };

  // Pure run-state reset — no save/screen side effects (shared by restart + new run).
  const resetRunState = () => {
    clearPending();
    chatStartedRef.current = false;
    lastEncounterIdRef.current = null;
    pendingStoryBeatRef.current = null;
    seenEncountersRef.current = new Set(); havenFinalRef.current = HAVEN_FINAL_SEQUENCE;
    havenVisitedRef.current = []; discoveryFoundRef.current = false;
    seenBeatsRef.current = new Set(); lastStateLineRef.current = null;
    seenBridgesRef.current = new Set(); leadQueueRef.current = []; leadCursorRef.current = 0;
    raisedQuestionsRef.current = []; setRaisedQuestions([]);
    setMessages([]); setChoices([]); setIsTyping(false); setSigFlicker(false); setBattPulse(false);
    setResources({ battery: 9, water: 0, food: 0, charger: null, hp: 10 });
    setWeapon(null); setNoise(0);
    setExchangePhase(0); setContactName("KIM"); setChosenPath(null);
    setDay1Scene("opening"); day1SceneRef.current = "opening";
    setDay1Visited([]); day1VisitedRef.current = [];
    setDay1Flags([]); day1FlagsRef.current = [];
    setGamePhase("phase1"); setCurrentPath(null); setP2BeatIndex(0);
    setAiExchangeCount(0); setAiExchangeTarget(7); setFragFired(false); setCalmFired(false);
    setCurrentEncounter(null); setSelectedFragment(null); setDayThree(false);
    setHavenFinalIndex(0); shelterForcedRef.current = false;
    // Phase 3 — clear the investigation so a fresh prologue run starts clean.
    setCurrentPhase3Region(null); currentPhase3RegionRef.current = null;
    setCurrentPhase3Node(null);   currentPhase3NodeRef.current = null;
    setVisitedPhase3Nodes([]);    visitedPhase3NodesRef.current = [];
    setDiscoveredTruths([]);      discoveredTruthsRef.current = [];
    setPhase3UnlockedRegions([]); phase3UnlockedRef.current = [];
    setPhase3Day(PHASE3_START_DAY); phase3DayRef.current = PHASE3_START_DAY;
    setDaylight(PHASE3_DAYLIGHT);   daylightRef.current  = PHASE3_DAYLIGHT;
    setGateWakeAt(null);            gateWakeAtRef.current = null;
    setGateReason(null);            gateReasonRef.current = null;
    gateHealRef.current = 0;
    phase3SearchedRef.current = new Set(); phase3PendingDestRef.current = null; lastPhase3EncounterIdRef.current = null;
    setEndingLines([]); setEndingKind(null);
    // recoveredMemories intentionally NOT reset — persists across runs
    setOfflineLines([]); setShowRestart(false); setLastMessage("");
    setDeathLines([]); setDeathCause(null);
    setShownLines([]); setShowNotif(false); setMenuOpen(false); setMenuMsg(""); setMenuNote("");
  };

  // audio — wrap a menu-button handler so it plays the distinct menu-tap click.
  const withMenuSound = (fn) => () => { audioEngine.tapMenu(); fn?.(); };
  const openCaseFile = () => {
    if (chatScrollRef.current) chatScrollTopRef.current = chatScrollRef.current.scrollTop;
    setBoardSection(null); setBoardItem(null); // fresh collapsed view each visit
    setScreen("board");
  };
  const closeCaseFile = () => {
    restoreChatScrollRef.current = true;
    suppressNextAutoScrollRef.current = true;
    setScreen("chat");
  };

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

  const renderCaseFileContent = ({ compact = false } = {}) => {
    const cFrags = new Set(recoveredMemories.filter(m => m.type === "fragment").map(m => m.name));
    const cClues = new Set(recoveredMemories.filter(m => m.type === "discovery").map(m => m.name));
    const reached = dayThree || gamePhase.startsWith("haven") || gamePhase === "phase3";
    const facts = BOARD_FACTS.filter(f => f.reveal(cClues, reached, raisedQuestions));
    const contradictions = BOARD_CONTRADICTIONS.filter(x => x.reveal(cClues, reached, raisedQuestions));
    const openQ = BOARD_QUESTIONS.filter(q => raisedQuestions.includes(q.key));
    const openSection = (id) => { setBoardItem(null); setBoardSection(boardSection === id ? null : id); };
    const secRow = (id, label, count) => (
      <button key={id} className="cb" onClick={withMenuSound(()=>openSection(id))}
        style={{ width:"100%", display:"flex", justifyContent:"space-between", alignItems:"center", background:"transparent", border:`1px solid ${boardSection===id ? "#1d3a22" : "#1c1c1c"}`, color: boardSection===id ? "#9aba9a" : "#7a8a7e", fontFamily:"inherit", fontSize:compact ? "0.58rem" : "0.62rem", letterSpacing:"0.14em", padding:"0.55rem 0.7rem", cursor:"pointer", transition:"border-color 0.15s, color 0.15s", marginTop:"0.4rem", flexShrink:0 }}>
        <span>{boardSection===id ? "▾" : "▸"}&nbsp;&nbsp;{label}</span>
        {count != null && <span style={{ color:"#3f4a42", letterSpacing:"0.08em" }}>{count}</span>}
      </button>
    );
    const panel = (children) => (
      <div style={{ flex:compact ? "0 1 auto" : 1, minHeight:0, maxHeight:compact ? "30vh" : undefined, overflowY:"auto", overscrollBehavior:"contain", border:"1px solid #141a15", borderTop:"none", padding:"0.45rem 0.7rem 0.7rem" }}>{children}</div>
    );
    const subHead = (label) => (
      <div style={{ color:"#5a7a64", fontSize:"0.56rem", letterSpacing:"0.2em", margin:"0.75rem 0 0.35rem" }}>{label}</div>
    );
    const itemRow = (id, glyph, label, detail, opts = {}) => {
      const openIt = boardItem === id;
      return (
        <div key={id}>
          <button className="cb" onClick={withMenuSound(()=>setBoardItem(openIt ? null : id))}
            style={{ width:"100%", display:"flex", justifyContent:"space-between", alignItems:"center", gap:"0.5rem", background:"transparent", border:"none", color: opts.color || "#c8b896", fontFamily:"inherit", fontSize:"0.62rem", letterSpacing:"0.06em", padding:"0.34rem 0.15rem", cursor:"pointer", textAlign:"left", transition:"color 0.15s" }}>
            <span>{glyph} {label}</span>
            <span style={{ color:"#333333", flexShrink:0 }}>{openIt ? "▾" : "▸"}</span>
          </button>
          {openIt && <div style={{ color: opts.detailColor || "#8a8a7a", fontSize:"0.57rem", lineHeight:1.55, padding:"0.05rem 0.2rem 0.5rem 1.05rem", fontStyle: opts.italic ? "italic" : "normal", animation:"fi 0.35s ease" }}>{detail}</div>}
        </div>
      );
    };
    const lockedRow = (key, glyph, label = "---") => (
      <div key={key} style={{ color:"#2f2f2f", fontSize:"0.62rem", letterSpacing:"0.06em", padding:"0.34rem 0.15rem" }}>{glyph} {label}</div>
    );

    return (
      <div style={{ width:compact ? "100%" : "min(380px,100%)", flex:compact ? "initial" : 1, minHeight:0, display:"flex", flexDirection:"column", animation:"fi 0.8s ease forwards" }}>
        <div style={{ fontSize:compact ? "0.72rem" : "0.8rem", fontWeight:600, letterSpacing:"0.26em", color:"#6a6a6a", textAlign:"center", marginBottom:"0.3rem", flexShrink:0 }}>CASE FILE</div>
        <div style={{ textAlign:"center", color:"#3a5a44", fontSize:"0.56rem", letterSpacing:"0.14em", flexShrink:0 }}>what you've pieced together</div>
        <div style={{ textAlign:"center", color:"#4f5f55", fontSize:"0.6rem", letterSpacing:"0.12em", margin:"0.55rem 0 0.15rem", flexShrink:0 }}>
          <span style={{ color:"#7a9a82" }}>● {cFrags.size}/9</span>&nbsp;&nbsp;·&nbsp;&nbsp;<span style={{ color:"#5a8a94" }}>◉ {cClues.size}/3</span>
          {discoveredTruths.length > 0 && <>&nbsp;&nbsp;·&nbsp;&nbsp;<span style={{ color:"#a8763f" }}>◆ {discoveredTruths.length}/4</span></>}
        </div>

        {secRow("mem", "MEMORIES", `${cFrags.size}/9`)}
        {boardSection === "mem" && panel(<>
          {ALL_FRAGMENT_NAMES.map((n, i) => cFrags.has(n)
            ? itemRow(`mem:${n}`, "●", n, (FRAGMENT_BY_NAME[n]?.msgs || []).map((m, j) => <div key={j}>{m}</div>), { color:"#9aba9a", detailColor:"#6a8a72", italic:true })
            : lockedRow(`memlock${i}`, "▧"))}
        </>)}

        {secRow("clue", "CLUES", `${cClues.size}/3`)}
        {boardSection === "clue" && panel(<>
          {BOARD_CLUES.map((cl, i) => cClues.has(cl.name)
            ? itemRow(`clue:${cl.name}`, "◉", cl.name, cl.note, { color:"#7accd4", detailColor:"#5a6a6e" })
            : lockedRow(`cluelock${i}`, "◉", "???"))}
        </>)}

        {discoveredTruths.length > 0 && secRow("truth", "TRUTHS", `${discoveredTruths.length}/4`)}
        {boardSection === "truth" && discoveredTruths.length > 0 && panel(<>
          {discoveredTruths.map(id => itemRow(`truth:${id}`, "◆", PHASE3_TRUTHS[id]?.title || id, PHASE3_TRUTHS[id]?.line || "", { color:"#c87a40", detailColor:"#b89a6a", italic:true }))}
          {Array.from({ length: Math.max(0, 4 - discoveredTruths.length) }).map((_, i) => lockedRow(`truthlock${i}`, "◇"))}
        </>)}

        {secRow("world", "PEOPLE & PLACES", null)}
        {boardSection === "world" && panel(<>
          {subHead("PEOPLE")}
          {BOARD_PEOPLE.map(p => itemRow(`person:${p.name}`, "·", p.name,
            typeof p.note === "function" ? p.note(cClues, reached, raisedQuestions, discoveredTruths) : p.note,
            { color:"#c8b896", detailColor:"#8a8a7a" }))}
          {subHead("LOCATIONS")}
          {(() => {
            const shown = REGIONS.filter(r => r.reveal(cClues, reached, currentPath) || phase3UnlockedRegions.includes(r.key));
            return (<>
              {shown.length === 0 && <div style={{ color:"#3a3a3a", fontSize:"0.57rem" }}>no leads yet.</div>}
              {shown.map((r, i) => itemRow(`loc:${r.key || i}`, "▪",
                <>{r.name}{discoveredTruths.includes(r.truthId || r.truth) && <span style={{ color:"#c87a40" }}>&nbsp;◆</span>}</>,
                <>
                  <div style={{ color:"#4a6a54" }}>the truth about {r.truth}{discoveredTruths.includes(r.truthId || r.truth) ? " - uncovered." : "."}</div>
                  {r.blurb && <div style={{ marginTop:"0.15rem" }}>{r.blurb}</div>}
                </>,
                { color:"#c8b896", detailColor:"#8a8a7a" }))}
              {shown.length < REGIONS.length && <div style={{ color:"#3a3a3a", fontSize:"0.55rem", fontStyle:"italic", marginTop:"0.25rem" }}>more to find.</div>}
            </>);
          })()}
        </>)}

        {secRow("inv", "INVESTIGATION", `${openQ.length}`)}
        {boardSection === "inv" && panel(<>
          {subHead("KNOWN FACTS")}
          {facts.length ? facts.map((f, i) => <div key={i} style={{ color:"#8aaa90", fontSize:"0.57rem", letterSpacing:"0.03em", marginBottom:"0.3rem", lineHeight:1.5 }}>› {f.text}</div>)
            : <div style={{ color:"#3a3a3a", fontSize:"0.57rem" }}>nothing proven yet.</div>}
          {contradictions.length > 0 && <>
            {subHead("CONTRADICTIONS")}
            {contradictions.map((x, i) => (
              <div key={i} style={{ border:"1px solid #3a1f1f", background:"#0a0505", padding:"0.45rem 0.6rem", marginBottom:"0.45rem" }}>
                {x.known.map((k, j) => (
                  <div key={j} style={{ color:"#8aaa90", fontSize:"0.55rem", letterSpacing:"0.03em" }}>
                    <span style={{ color:"#4a6a54" }}>KNOWN&nbsp;</span>{k}
                  </div>
                ))}
                <div style={{ color:"#c87a40", fontSize:"0.6rem", letterSpacing:"0.04em", marginTop:"0.2rem", fontStyle:"italic" }}>
                  <span style={{ color:"#8b4a4a", fontStyle:"normal" }}>! CONTRADICTION&nbsp;</span>{x.q}
                </div>
              </div>
            ))}
          </>}
          {subHead("OPEN QUESTIONS")}
          {openQ.length ? openQ.map((q, i) => {
              const evolved = q.evolved && raisedQuestions.includes(q.evolved.key);
              return (
                <div key={i} style={{ color:"#7a6a5a", fontSize:"0.57rem", letterSpacing:"0.03em", marginBottom:"0.3rem", fontStyle:"italic", lineHeight:1.5 }}>
                  {evolved
                    ? <><span style={{ color:"#4a463e", textDecoration:"line-through" }}>? {q.text}</span><br/><span style={{ color:"#c8a878" }}>↳ {q.evolved.text}</span></>
                    : <>? {q.text}</>}
                </div>
              );
            })
            : <div style={{ color:"#3a3a3a", fontSize:"0.57rem" }}>no questions yet.</div>}
        </>)}
      </div>
    );
  };

  const restartDay1Demo = () => {
    resetRunState();
    activeSlotRef.current = null;
    activeProfileRef.current = emptyProfile();
    setRecoveredMemories([]);
    setBoardSection(null);
    setBoardItem(null);
    setScreen("intro");
  };

  // Return to the title (terminal screens already resolved the slot's profile).
  const handleRestart = () => {
    if (isDay1Demo) {
      restartDay1Demo();
      return;
    }
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
    raisedQuestionsRef.current = []; setRaisedQuestions([]); // questions re-surface as beats replay
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
  const area       = areaLabel(); // current-area name for the location strip (null = hide)
  // "Use charger" is a free action on normal choice screens (not encounters, not
  // continue-only beats) while the reservoir has charge and the phone isn't near full.
  const chargerAmt    = Math.min(CHARGER_TRANSFER, resources.charger || 0, 100 - resources.battery);
  // Phase 3 softens survival (no offline death; powered nodes auto-refill), so the battery
  // alarm + charger action are just noise there — suppress them while keeping the ambient meter.
  const inPhase3      = gamePhase === "phase3" || gamePhase === "phase3_finale" || (gamePhase === "encounter" && returnToPhaseRef.current === "phase3");
  const canUseCharger = chargerAmt > 0 && resources.battery < 90 && gamePhase !== "encounter" && !inPhase3 && !(choices.length === 1 && choices[0] === "·");
  const signalLevel =
    dayThree ? 5 :
    ["p2_ai_cross","shelter","haven_approach","haven_ai","haven_final"].includes(gamePhase) ? 4 :
    gamePhase === "p2_discovery"    ? 3 :
    ["p2_scripted","p2_ai","p2_memory_frag","encounter"].includes(gamePhase) ? 2 : 1;
  const displayDay =
    inPhase3 ? phase3Day :
    dayThree ? 3 :
    (gamePhase.startsWith("p2") || gamePhase === "encounter" || gamePhase === "shelter") ? 2 :
    exchangePhase >= 10 ? 2 : 1;
  const contactStatus = (dayThree || ["p2_ai_cross","shelter"].includes(gamePhase))
    ? "unknown · unstable"
    : "unknown · unverified";
  const font       = "'IBM Plex Mono', 'Courier New', monospace";
  const flashAnim  = "flash 0.9s ease infinite";
  const menuBtn    = { background:"transparent", border:"1px solid #1c1c1c", color:"#c8b98a", padding:"0.55rem 0.9rem", textAlign:"left", cursor:"pointer", fontFamily:"inherit", fontSize:"0.74rem", letterSpacing:"0.06em", transition:"border-color 0.15s, color 0.15s" };
  const hasAnySave = slots.some(Boolean); // P4 — at least one occupied slot

  const railRow = (label, value, color = "#d9c88f") => (
    <>
      <span>{label}</span>
      <strong style={{ color }}>{value}</strong>
    </>
  );
  const missingPrep = day1MissingPrep();
  const demoObjective = day1ReadyForSleep()
    ? "sleep until morning"
    : missingPrep.length ? missingPrep[0] : choices.length ? "answer the phone" : "stay alive";
  const DesktopStatusRail = () => (
    <aside className="play-rail play-rail--left ds-status-rail">
      <p className="eyebrow">demo controls</p>
      <h2>Day {displayDay} / {area || "Apartment"}</h2>
      <div className="rail-stats">
        {railRow("contact", contactName)}
        {railRow("status", contactStatus, "#8d927f")}
        <span>signal</span>
        <strong><SignalBars level={signalLevel} flicker={sigFlicker || noise >= 4} /></strong>
        {railRow("battery", `${resources.battery}%`, battColor)}
        {railRow("hp", `${resources.hp}/10${injuryLbl ? ` ${injuryLbl}` : ""}`, hpColor)}
        {railRow("water", resources.water, watColor)}
        {railRow("food", resources.food, fooColor)}
        {resources.charger !== null && railRow("charger", resources.charger > 0 ? `${resources.charger}%` : "needs power", resources.charger > 0 ? "#3a6b40" : "#484848")}
        {noise > 0 && railRow("noise", `${noise}/5`, noiseColor)}
        {weapon && railRow("weapon", `${weapon.shortName} ${weapon.damage}dmg`, "#8a7a58")}
        {railRow("objective", demoObjective, "#6aba8a")}
      </div>
      <div className="rail-actions">
        <button type="button" onClick={withMenuSound(()=>{ setMenuMsg(""); setConfirmReset(false); setMenuOpen(true); })}>Menu</button>
        <button type="button" onClick={withMenuSound(restartDay1Demo)}>Restart Demo</button>
        {onDemoExit && <button type="button" onClick={withMenuSound(onDemoExit)}>Exit Demo</button>}
      </div>
    </aside>
  );
  const renderDesktopFrame = (children, { mode = "chat" } = {}) => (
    <section className="play-stage ds-real-demo-stage" data-demo-mode={mode} aria-label="Dead Signal playable browser demo">
      <DesktopStatusRail />
      <div className={`signal-terminal ds-terminal-game ds-terminal-game--${mode}`}>
        {children}
      </div>
      <aside className="play-rail play-rail--right ds-case-rail">
        {renderCaseFileContent({ compact:true })}
      </aside>
    </section>
  );

  // Intro cinematic skip: cancel the pending line timers and jump straight to the
  // NEW MESSAGE prompt. Helps the replay loop (the intro plays on every new run).
  const skipIntro = () => {
    if (showNotif) return;
    clearPending();
    setShownLines(INTRO_LINES.map(l => l.text));
    setShowNotif(true);
  };
  if (screen === "intro") {
    const introScreen = (
    <div onClick={skipIntro}
      style={{ background:"#070707", height:isDesktopDemo ? "100%" : "100dvh", overflowY:"auto", overscrollBehavior:"contain", fontFamily:font, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"clamp(1.25rem, 5vw, 2.5rem)", userSelect:"none", cursor: showNotif ? "default" : "pointer" }}>
      <style>{`${FONT_IMPORT}${KEYFRAMES_FI}@keyframes pu{0%,100%{opacity:1}50%{opacity:.2}}.rb:hover{border-color:#4a9e6b!important;color:#4a9e6b!important}`}</style>
      <div style={{ display:"flex", flexDirection:"column", gap:"0.1rem", textAlign:"center" }}>
        {shownLines.map((l,i) => <p key={i} style={{ color:"#c8b98a", fontSize:"0.9rem", lineHeight:"2.1", letterSpacing:"0.05em", animation:"fi 0.9s ease forwards", margin:0, fontWeight:300 }}>{l}</p>)}
      </div>
      {!showNotif && (
        <p style={{ position:"fixed", bottom:"calc(1.2rem + env(safe-area-inset-bottom))", color:"#2e2e2e", fontSize:"0.58rem", letterSpacing:"0.18em", margin:0 }}>tap to skip</p>
      )}
      {showNotif && (
        <button onClick={(e)=>{ e.stopPropagation(); if(screenRef.current!=="intro")return; audioEngine.tapResponse(); clearPending(); setScreen("chat"); }}
          style={{ marginTop:"2.8rem", padding:"0.7rem 1.5rem", border:"1px solid #1d3a22", color:"#4a9e6b", fontSize:"0.7rem", letterSpacing:"0.16em", animation:"pu 1.3s ease infinite", background:"transparent", cursor:"pointer", fontFamily:"inherit" }}>
          ▸&nbsp;&nbsp;NEW MESSAGE — KIM
        </button>
      )}
    </div>
    );
    return isDesktopDemo ? renderDesktopFrame(introScreen, { mode:"intro" }) : introScreen;
  }

  // ─── Main Menu — landing hub (Start / Resume / Story) ──────────────────────────
  if (screen === "demoComplete") {
    const completeScreen = (
      <div style={{ background:"#070707", height:isDesktopDemo ? "100%" : "100dvh", overflowY:"auto", overscrollBehavior:"contain", fontFamily:font, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"clamp(1.25rem, 5vw, 2.5rem)", userSelect:"none", textAlign:"center" }}>
        <style>{`${FONT_IMPORT}${KEYFRAMES_FI}.rb:hover{border-color:#4a9e6b!important;color:#4a9e6b!important}`}</style>
        <div style={{ color:"#4a9e6b", fontSize:"0.66rem", letterSpacing:"0.24em", marginBottom:"0.7rem", textShadow:"0 0 8px rgba(74,158,107,0.4)" }}>DAY 1 COMPLETE</div>
        <p style={{ color:"#c8b98a", fontSize:"0.92rem", lineHeight:1.8, letterSpacing:"0.04em", maxWidth:"28rem", margin:"0 0 2rem" }}>Night falls over the apartment. The next morning waits in the full version.</p>
        <div style={{ display:"flex", flexWrap:"wrap", gap:"0.7rem", justifyContent:"center" }}>
          <button className="rb" onClick={withMenuSound(restartDay1Demo)} style={{ background:"transparent", border:"1px solid #1d3a22", color:"#4a9e6b", padding:"0.7rem 1.2rem", fontFamily:"inherit", fontSize:"0.68rem", letterSpacing:"0.14em", cursor:"pointer", transition:"all 0.2s" }}>REPLAY DAY 1</button>
          {onDemoExit && (
            <button className="rb" onClick={withMenuSound(onDemoExit)} style={{ background:"transparent", border:"1px solid #2a2a2a", color:"#7a7a7a", padding:"0.7rem 1.2rem", fontFamily:"inherit", fontSize:"0.68rem", letterSpacing:"0.14em", cursor:"pointer", transition:"all 0.2s" }}>EXIT DEMO</button>
          )}
        </div>
      </div>
    );
    return isDesktopDemo ? renderDesktopFrame(completeScreen, { mode:"complete" }) : completeScreen;
  }

  if (screen === "menu") return (
    <div style={{ background:"#070707", height:"100dvh", overflowY:"auto", overscrollBehavior:"contain", fontFamily:font, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"clamp(1.25rem, 5vw, 2.5rem)", userSelect:"none" }}>
      <style>{`${FONT_IMPORT}${KEYFRAMES_FI}@keyframes sigpulse{0%,100%{opacity:0.78}50%{opacity:1}}.rb:hover{border-color:#4a9e6b!important;color:#4a9e6b!important}`}</style>
      {/* Logo: DEAD (powered-down grey) + SIGNAL (live green glow), one word */}
      <div style={{ fontSize:"2.4rem", fontWeight:700, letterSpacing:"0.12em", marginBottom:"3rem", animation:"fi 1.2s ease forwards" }}>
        <span style={{ color:"#4a4a4a" }}>DEAD</span><span style={{ color:"#4a9e6b", textShadow:"0 0 10px rgba(74,158,107,0.6), 0 0 26px rgba(74,158,107,0.25)", animation:"sigpulse 3s ease infinite" }}>SIGNAL</span>
      </div>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"stretch", gap:"0.7rem", width:"min(260px, 100%)" }}>
        <button className="rb" onClick={withMenuSound(()=>{ setSlotMode("start"); setSlotConfirm(null); setSlotsFrom("menu"); setScreen("slots"); })}
          style={{ background:"transparent", border:"1px solid #1d3a22", color:"#4a9e6b", padding:"0.7rem 1rem", fontFamily:"inherit", fontSize:"0.72rem", letterSpacing:"0.16em", textAlign:"center", cursor:"pointer", transition:"all 0.2s" }}>
          ▸&nbsp;&nbsp;START
        </button>
        {hasAnySave && (
          <button className="rb" onClick={withMenuSound(()=>{ setSlotMode("load"); setSlotConfirm(null); setSlotsFrom("menu"); setScreen("slots"); })}
            style={{ background:"transparent", border:"1px solid #2a2a2a", color:"#9a9a9a", padding:"0.7rem 1rem", fontFamily:"inherit", fontSize:"0.72rem", letterSpacing:"0.16em", textAlign:"center", cursor:"pointer", transition:"all 0.2s" }}>
            ▸&nbsp;&nbsp;LOAD
          </button>
        )}
        <button className="rb" onClick={withMenuSound(()=>{ setMenuNote(""); setScreen("story"); })}
          style={{ background:"transparent", border:"1px solid #2a2a2a", color:"#6a6a6a", padding:"0.7rem 1rem", fontFamily:"inherit", fontSize:"0.72rem", letterSpacing:"0.16em", textAlign:"center", cursor:"pointer", transition:"all 0.2s" }}>
          ▸&nbsp;&nbsp;STORY
        </button>
        <button className="rb" onClick={withMenuSound(()=>{ setMenuNote(""); setOptConfirm(false); setConfirmReset(false); setOptionsFrom("menu"); setScreen("options"); })}
          style={{ background:"transparent", border:"1px solid #2a2a2a", color:"#6a6a6a", padding:"0.7rem 1rem", fontFamily:"inherit", fontSize:"0.72rem", letterSpacing:"0.16em", textAlign:"center", cursor:"pointer", transition:"all 0.2s" }}>
          ▸&nbsp;&nbsp;OPTIONS
        </button>
        <div style={{ minHeight:"0.9rem", textAlign:"center", color:"#505050", fontSize:"0.58rem", letterSpacing:"0.14em", marginTop:"0.3rem" }}>{menuNote}</div>
      </div>
    </div>
  );

  // ─── Story — static pre-game lore page (no spoilers; the guide stays unnamed). Reached
  // from the main menu's STORY button; BACK → menu. Scrollable like the Case File. ──────────
  if (screen === "story") {
    const ssec = (label) => (
      <div style={{ color:"#4a9e6b", fontSize:"0.6rem", letterSpacing:"0.2em", marginTop:"1.4rem", marginBottom:"0.5rem" }}>{label}</div>
    );
    const body = { color:"#c8b98a", fontSize:"0.74rem", lineHeight:1.75, fontWeight:300, letterSpacing:"0.01em", margin:0, opacity:0.92 };
    return (
      <div style={{ background:"#070707", height:"100dvh", position:"relative", overflow:"hidden", fontFamily:font, userSelect:"none" }}>
        <style>{`${FONT_IMPORT}${KEYFRAMES_FI}.rb:hover{border-color:#4a9e6b!important;color:#4a9e6b!important}`}</style>
        {/* BACK sits OUTSIDE the masked scroller (an ancestor mask would capture a fixed child). */}
        <button className="rb" onClick={withMenuSound(()=>{ setScreen("menu"); })}
          style={{ position:"absolute", top:"calc(0.6rem + env(safe-area-inset-top))", left:"0.7rem", zIndex:20, background:"rgba(7,7,7,0.85)", border:"1px solid #2a2a2a", color:"#7a7a7a", padding:"0.32rem 0.7rem", fontFamily:"inherit", fontSize:"0.62rem", letterSpacing:"0.14em", cursor:"pointer", transition:"all 0.2s" }}>
          ◂ BACK
        </button>
        <div style={{ boxSizing:"border-box", height:"100%", overflowY:"auto", overscrollBehavior:"contain", display:"flex", flexDirection:"column", alignItems:"center", padding:"calc(2.6rem + env(safe-area-inset-top)) clamp(1rem,4vw,2rem) calc(1.5rem + env(safe-area-inset-bottom))", maskImage:"linear-gradient(to bottom, transparent 0, black 14px)", WebkitMaskImage:"linear-gradient(to bottom, transparent 0, black 14px)" }}>
        <div style={{ width:"min(380px,100%)", margin:"auto 0", animation:"fi 0.8s ease forwards", paddingTop:"0.4rem", paddingBottom:"0.5rem" }}>
          {/* Transmission header — styled like a recovered signal log */}
          <div style={{ border:"1px solid #1d3a22", background:"#010a04", padding:"0.85rem 1rem", textAlign:"center" }}>
            <div style={{ color:"#4a9e6b", fontSize:"0.62rem", letterSpacing:"0.22em", textShadow:"0 0 8px rgba(74,158,107,0.35)" }}>— TRANSMISSION RECOVERED —</div>
            <div style={{ color:"#6aba8a", fontSize:"0.66rem", letterSpacing:"0.16em", marginTop:"0.35rem" }}>GREATER HARWICK</div>
            <div style={{ color:"#3a5a44", fontSize:"0.56rem", letterSpacing:"0.12em", marginTop:"0.2rem" }}>status: dark · 72h</div>
          </div>

          {ssec("THE SITUATION")}
          <p style={body}>Harwick went dark three days ago. Power gone, streets emptied, and whatever moves out there now isn't what it used to be. Your phone is almost dead.</p>

          {ssec("THE VOICE")}
          <p style={body}>You woke with no memory of how you got here. A stranger texts the phone beside you — a way out, if you keep moving and keep the line alive.</p>

          {ssec("THE GOAL")}
          <p style={body}>A broadcast loops the same coordinates: somewhere still standing. Haven. Cross the city, keep the battery alive, reach it.</p>

          <div style={{ marginTop:"2rem", textAlign:"center", color:"#3a3a3a", fontSize:"0.58rem", letterSpacing:"0.14em", fontStyle:"italic" }}>
            …carrier lost…&nbsp;&nbsp;·&nbsp;&nbsp;keep the signal alive.
          </div>
        </div>
        </div>
      </div>
    );
  }

  // ─── Options — the single settings hub (audio, run reset, full wipe). Reachable from
  // the main menu and the in-game pause menu; `optionsFrom` decides where BACK returns. ──
  if (screen === "options") {
    const fromChat   = optionsFrom === "chat";
    const showRunReset = fromChat && activeSlotRef.current != null;
    const optBack = withMenuSound(() => {
      setOptConfirm(false); setConfirmReset(false);
      if (fromChat) { setScreen("chat"); setMenuOpen(true); } // back to the pause overlay
      else setScreen("menu");
    });
    return (
    <div style={{ background:"#070707", height:"100dvh", overflowY:"auto", overscrollBehavior:"contain", fontFamily:font, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"clamp(1.25rem, 5vw, 2.5rem)", userSelect:"none" }}>
      <style>{`${FONT_IMPORT}${KEYFRAMES_FI}.rb:hover{border-color:#4a9e6b!important;color:#4a9e6b!important}.dz:hover{border-color:#7a2424!important;color:#ff8a8a!important}`}</style>
      <div style={{ fontSize:"0.78rem", fontWeight:600, letterSpacing:"0.26em", marginBottom:"2rem", color:"#6a6a6a", animation:"fi 0.8s ease forwards" }}>OPTIONS</div>
      <div style={{ display:"flex", flexDirection:"column", gap:"0.7rem", width:"min(300px, 100%)" }}>

        {/* AUDIO — volume slider + mute, the single home for sound control. */}
        <div style={{ border:"1px solid #1d3a22", padding:"0.9rem 0.85rem", display:"flex", flexDirection:"column", gap:"0.7rem", animation:"fi 0.8s ease forwards" }}>
          <span style={{ color:"#4a9e6b", fontSize:"0.58rem", letterSpacing:"0.18em" }}>AUDIO</span>
          <div style={{ display:"flex", alignItems:"center", gap:"0.7rem" }}>
            <button onClick={toggleMute} title={muted ? "unmute" : "mute"} aria-label={muted ? "unmute" : "mute"}
              style={{ background:"transparent", border:"1px solid #1c1c1c", display:"inline-flex", alignItems:"center", justifyContent:"center", padding:"0.3rem 0.45rem", cursor:"pointer", flexShrink:0 }}>
              {speakerIcon(muted ? "#5a5a5a" : "#4a9e6b")}
            </button>
            <input type="range" min="0" max="100" value={volume} disabled={muted}
              onChange={(e)=>setVol(Number(e.target.value))}
              aria-label="volume"
              style={{ flex:1, accentColor:"#4a9e6b", cursor: muted ? "default" : "pointer", opacity: muted ? 0.35 : 1 }} />
            <span style={{ color: muted ? "#5a5a5a" : "#3a6b40", fontSize:"0.6rem", letterSpacing:"0.06em", width:"2.6rem", textAlign:"right" }}>{muted ? "muted" : `${volume}%`}</span>
          </div>
        </div>

        {/* Reset THIS run — only mid-run (opened from the pause menu). Two-tap confirm;
            wipes only the active slot (run + its fragments/clues). */}
        {showRunReset && (
          <div style={{ border:`1px solid ${confirmReset ? "#5a2020" : "#3a2020"}`, padding:"0.9rem 0.85rem", display:"flex", flexDirection:"column", gap:"0.55rem", animation:"fi 0.8s ease forwards" }}>
            <span style={{ color:"#a87a7a", fontSize:"0.58rem", letterSpacing:"0.18em" }}>RESET THIS RUN</span>
            <span style={{ color:"#7a6a6a", fontSize:"0.6rem", letterSpacing:"0.04em", lineHeight:1.6 }}>Wipes this run's save and the fragments and clues collected in this slot. Other slots are untouched.</span>
            <button onClick={withMenuSound(async ()=>{ if (confirmReset) { const i = activeSlotRef.current; if (i != null) await deleteSlot(i); resetRunState(); setConfirmReset(false); setOptConfirm(false); setScreen("menu"); } else setConfirmReset(true); })}
              style={{ background:"transparent", border:`1px solid ${confirmReset ? "#5a2020" : "#3a2020"}`, color: confirmReset ? "#e08a8a" : "#a87a7a", padding:"0.6rem", fontFamily:"inherit", fontSize:"0.66rem", letterSpacing:"0.12em", cursor:"pointer", transition:"all 0.2s" }}>
              {confirmReset ? "⚠ TAP AGAIN — RESET THIS RUN" : "RESET THIS RUN"}
            </button>
          </div>
        )}

        <div style={{ border:"1px solid #3a1414", padding:"0.9rem 0.85rem", display:"flex", flexDirection:"column", gap:"0.55rem", animation:"fi 0.8s ease forwards" }}>
          <span style={{ color:"#8b3030", fontSize:"0.58rem", letterSpacing:"0.18em" }}>DANGER ZONE</span>
          <span style={{ color:"#7a6a6a", fontSize:"0.6rem", letterSpacing:"0.04em", lineHeight:1.6 }}>Erases all three save slots and every collected fragment and clue. This cannot be undone.</span>
          <button className="dz" onClick={withMenuSound(()=>{ if (optConfirm) handleFullReset(); else setOptConfirm(true); })}
            style={{ background:"transparent", border:`1px solid ${optConfirm ? "#7a2424" : "#5a2020"}`, color: optConfirm ? "#ff8a8a" : "#c85050", padding:"0.6rem", fontFamily:"inherit", fontSize:"0.66rem", letterSpacing:"0.12em", cursor:"pointer", transition:"all 0.2s" }}>
            {optConfirm ? "⚠ TAP AGAIN — ERASE EVERYTHING" : "RESET ALL DATA"}
          </button>
        </div>
        <button className="rb" onClick={optBack}
          style={{ marginTop:"0.6rem", background:"transparent", border:"1px solid #2a2a2a", color:"#6a6a6a", padding:"0.55rem", fontFamily:"inherit", fontSize:"0.66rem", letterSpacing:"0.16em", textAlign:"center", cursor:"pointer", transition:"all 0.2s" }}>
          ◂ BACK
        </button>
      </div>
    </div>
    );
  }

  // ─── Investigation board / Case file — the persistent detective notebook. Opened from
  // the pause menu mid-run; reflects the active slot's collected memories/clues. BACK → chat.
  if (screen === "board") {
    const cFrags = new Set(recoveredMemories.filter(m => m.type === "fragment").map(m => m.name));
    const cClues = new Set(recoveredMemories.filter(m => m.type === "discovery").map(m => m.name));
    const reached = dayThree || gamePhase.startsWith("haven") || gamePhase === "phase3";
    const facts = BOARD_FACTS.filter(f => f.reveal(cClues, reached, raisedQuestions));
    const contradictions = BOARD_CONTRADICTIONS.filter(x => x.reveal(cClues, reached, raisedQuestions));
    const openQ = BOARD_QUESTIONS.filter(q => raisedQuestions.includes(q.key));
    // Accordion: one section open at a time; the open panel takes the remaining height and
    // scrolls INSIDE itself — the page never moves (one screen, zero page scroll).
    const openSection = (id) => { setBoardItem(null); setBoardSection(boardSection === id ? null : id); };
    const secRow = (id, label, count) => (
      <button key={id} className="cb" onClick={withMenuSound(()=>openSection(id))}
        style={{ width:"100%", display:"flex", justifyContent:"space-between", alignItems:"center", background:"transparent", border:`1px solid ${boardSection===id ? "#1d3a22" : "#1c1c1c"}`, color: boardSection===id ? "#9aba9a" : "#7a8a7e", fontFamily:"inherit", fontSize:"0.62rem", letterSpacing:"0.14em", padding:"0.55rem 0.7rem", cursor:"pointer", transition:"border-color 0.15s, color 0.15s", marginTop:"0.4rem", flexShrink:0 }}>
        <span>{boardSection===id ? "▾" : "▸"}&nbsp;&nbsp;{label}</span>
        {count != null && <span style={{ color:"#3f4a42", letterSpacing:"0.08em" }}>{count}</span>}
      </button>
    );
    const panel = (children) => (
      <div style={{ flex:1, minHeight:0, overflowY:"auto", overscrollBehavior:"contain", border:"1px solid #141a15", borderTop:"none", padding:"0.45rem 0.7rem 0.7rem" }}>{children}</div>
    );
    const subHead = (label) => (
      <div style={{ color:"#5a7a64", fontSize:"0.56rem", letterSpacing:"0.2em", margin:"0.75rem 0 0.35rem" }}>{label}</div>
    );
    // An expandable item row: tap flips the chevron and reveals the detail block inline.
    const itemRow = (id, glyph, label, detail, opts = {}) => {
      const openIt = boardItem === id;
      return (
        <div key={id}>
          <button className="cb" onClick={withMenuSound(()=>setBoardItem(openIt ? null : id))}
            style={{ width:"100%", display:"flex", justifyContent:"space-between", alignItems:"center", gap:"0.5rem", background:"transparent", border:"none", color: opts.color || "#c8b896", fontFamily:"inherit", fontSize:"0.62rem", letterSpacing:"0.06em", padding:"0.34rem 0.15rem", cursor:"pointer", textAlign:"left", transition:"color 0.15s" }}>
            <span>{glyph} {label}</span>
            <span style={{ color:"#333333", flexShrink:0 }}>{openIt ? "▾" : "▸"}</span>
          </button>
          {openIt && <div style={{ color: opts.detailColor || "#8a8a7a", fontSize:"0.57rem", lineHeight:1.55, padding:"0.05rem 0.2rem 0.5rem 1.05rem", fontStyle: opts.italic ? "italic" : "normal", animation:"fi 0.35s ease" }}>{detail}</div>}
        </div>
      );
    };
    const lockedRow = (key, glyph, label = "———") => (
      <div key={key} style={{ color:"#2f2f2f", fontSize:"0.62rem", letterSpacing:"0.06em", padding:"0.34rem 0.15rem" }}>{glyph} {label}</div>
    );
    return (
      <div style={{ background:"#070707", height:"100dvh", position:"relative", overflow:"hidden", fontFamily:font, userSelect:"none" }}>
        <style>{`${FONT_IMPORT}${KEYFRAMES_FI}.rb:hover{border-color:#4a9e6b!important;color:#4a9e6b!important}.cb:hover{border-color:#4a9e6b!important;color:#4a9e6b!important}`}</style>
        <button className="rb" onClick={withMenuSound(closeCaseFile)}
          style={{ position:"absolute", top:"calc(0.6rem + env(safe-area-inset-top))", left:"0.7rem", zIndex:20, background:"rgba(7,7,7,0.85)", border:"1px solid #2a2a2a", color:"#7a7a7a", padding:"0.32rem 0.7rem", fontFamily:"inherit", fontSize:"0.62rem", letterSpacing:"0.14em", cursor:"pointer", transition:"all 0.2s" }}>
          ◂ BACK
        </button>
        {/* One fixed page: header + section rows are static chrome; only an open panel scrolls.
            border-box is load-bearing: height:100% + padding would otherwise exceed the shell
            (no global box-sizing reset in this app) and push the bottom rows off-screen. */}
        <div style={{ boxSizing:"border-box", height:"100%", display:"flex", flexDirection:"column", alignItems:"center", padding:"calc(2.6rem + env(safe-area-inset-top)) clamp(1rem,4vw,2rem) calc(0.9rem + env(safe-area-inset-bottom))" }}>
          <div style={{ width:"min(380px,100%)", flex:1, minHeight:0, display:"flex", flexDirection:"column", animation:"fi 0.8s ease forwards" }}>
            <div style={{ fontSize:"0.8rem", fontWeight:600, letterSpacing:"0.26em", color:"#6a6a6a", textAlign:"center", marginBottom:"0.3rem", flexShrink:0 }}>CASE FILE</div>
            <div style={{ textAlign:"center", color:"#3a5a44", fontSize:"0.56rem", letterSpacing:"0.14em", flexShrink:0 }}>what you've pieced together</div>
            <div style={{ textAlign:"center", color:"#4f5f55", fontSize:"0.6rem", letterSpacing:"0.12em", margin:"0.55rem 0 0.15rem", flexShrink:0 }}>
              <span style={{ color:"#7a9a82" }}>◈ {cFrags.size}/9</span>&nbsp;&nbsp;·&nbsp;&nbsp;<span style={{ color:"#5a8a94" }}>◉ {cClues.size}/3</span>
              {discoveredTruths.length > 0 && <>&nbsp;&nbsp;·&nbsp;&nbsp;<span style={{ color:"#a8763f" }}>◆ {discoveredTruths.length}/4</span></>}
            </div>

            {secRow("mem", "MEMORIES", `${cFrags.size}/9`)}
            {boardSection === "mem" && panel(<>
              {ALL_FRAGMENT_NAMES.map((n, i) => cFrags.has(n)
                ? itemRow(`mem:${n}`, "◈", n, (FRAGMENT_BY_NAME[n]?.msgs || []).map((m, j) => <div key={j}>{m}</div>), { color:"#9aba9a", detailColor:"#6a8a72", italic:true })
                : lockedRow(`memlock${i}`, "▦"))}
            </>)}

            {secRow("clue", "CLUES", `${cClues.size}/3`)}
            {boardSection === "clue" && panel(<>
              {BOARD_CLUES.map((cl, i) => cClues.has(cl.name)
                ? itemRow(`clue:${cl.name}`, "◉", cl.name, cl.note, { color:"#7accd4", detailColor:"#5a6a6e" })
                : lockedRow(`cluelock${i}`, "◉", "???"))}
            </>)}

            {/* TRUTHS — hidden until the first one is earned (no early spoiler that there are 4). */}
            {discoveredTruths.length > 0 && secRow("truth", "TRUTHS", `${discoveredTruths.length}/4`)}
            {boardSection === "truth" && discoveredTruths.length > 0 && panel(<>
              {discoveredTruths.map(id => itemRow(`truth:${id}`, "◆", PHASE3_TRUTHS[id]?.title || id, PHASE3_TRUTHS[id]?.line || "", { color:"#c87a40", detailColor:"#b89a6a", italic:true }))}
              {Array.from({ length: Math.max(0, 4 - discoveredTruths.length) }).map((_, i) => lockedRow(`truthlock${i}`, "◇"))}
            </>)}

            {secRow("world", "PEOPLE & PLACES", null)}
            {boardSection === "world" && panel(<>
              {subHead("PEOPLE")}
              {BOARD_PEOPLE.map(p => itemRow(`person:${p.name}`, "·", p.name,
                typeof p.note === "function" ? p.note(cClues, reached, raisedQuestions, discoveredTruths) : p.note,
                { color:"#c8b896", detailColor:"#8a8a7a" }))}
              {subHead("LOCATIONS")}
              {(() => {
                const shown = REGIONS.filter(r => r.reveal(cClues, reached, currentPath) || phase3UnlockedRegions.includes(r.key));
                return (<>
                  {shown.length === 0 && <div style={{ color:"#3a3a3a", fontSize:"0.57rem" }}>no leads yet.</div>}
                  {shown.map((r, i) => itemRow(`loc:${r.key || i}`, "▪",
                    <>{r.name}{discoveredTruths.includes(r.truthId || r.truth) && <span style={{ color:"#c87a40" }}>&nbsp;◆</span>}</>,
                    <>
                      <div style={{ color:"#4a6a54" }}>the truth about {r.truth}{discoveredTruths.includes(r.truthId || r.truth) ? " — uncovered." : "."}</div>
                      {r.blurb && <div style={{ marginTop:"0.15rem" }}>{r.blurb}</div>}
                    </>,
                    { color:"#c8b896", detailColor:"#8a8a7a" }))}
                  {shown.length < REGIONS.length && <div style={{ color:"#3a3a3a", fontSize:"0.55rem", fontStyle:"italic", marginTop:"0.25rem" }}>more to find.</div>}
                </>);
              })()}
            </>)}

            {secRow("inv", "INVESTIGATION", `${openQ.length}`)}
            {boardSection === "inv" && panel(<>
              {subHead("KNOWN FACTS")}
              {facts.length ? facts.map((f, i) => <div key={i} style={{ color:"#8aaa90", fontSize:"0.57rem", letterSpacing:"0.03em", marginBottom:"0.3rem", lineHeight:1.5 }}>› {f.text}</div>)
                : <div style={{ color:"#3a3a3a", fontSize:"0.57rem" }}>nothing proven yet.</div>}
              {contradictions.length > 0 && <>
                {subHead("CONTRADICTIONS")}
                {contradictions.map((x, i) => (
                  <div key={i} style={{ border:"1px solid #3a1f1f", background:"#0a0505", padding:"0.45rem 0.6rem", marginBottom:"0.45rem" }}>
                    {x.known.map((k, j) => (
                      <div key={j} style={{ color:"#8aaa90", fontSize:"0.55rem", letterSpacing:"0.03em" }}>
                        <span style={{ color:"#4a6a54" }}>KNOWN&nbsp;</span>{k}
                      </div>
                    ))}
                    <div style={{ color:"#c87a40", fontSize:"0.6rem", letterSpacing:"0.04em", marginTop:"0.2rem", fontStyle:"italic" }}>
                      <span style={{ color:"#8b4a4a", fontStyle:"normal" }}>⚠ CONTRADICTION&nbsp;</span>{x.q}
                    </div>
                  </div>
                ))}
              </>}
              {subHead("OPEN QUESTIONS")}
              {openQ.length ? openQ.map((q, i) => {
                  const evolved = q.evolved && raisedQuestions.includes(q.evolved.key);
                  return (
                    <div key={i} style={{ color:"#7a6a5a", fontSize:"0.57rem", letterSpacing:"0.03em", marginBottom:"0.3rem", fontStyle:"italic", lineHeight:1.5 }}>
                      {evolved
                        ? <><span style={{ color:"#4a463e", textDecoration:"line-through" }}>? {q.text}</span><br/><span style={{ color:"#c8a878" }}>↳ {q.evolved.text}</span></>
                        : <>? {q.text}</>}
                    </div>
                  );
                })
                : <div style={{ color:"#3a3a3a", fontSize:"0.57rem" }}>no questions yet.</div>}
            </>)}
          </div>
        </div>
      </div>
    );
  }

  // ─── Slot screen — 3 save profiles. Each tracks playthroughs + fragments/clues.
  if (screen === "slots") return (
    <div style={{ background:"#070707", height:"100dvh", overflowY:"auto", overscrollBehavior:"contain", fontFamily:font, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"clamp(1.25rem, 5vw, 2.5rem)", userSelect:"none" }}>
      <style>{`${FONT_IMPORT}${KEYFRAMES_FI}.rb:hover{border-color:#4a9e6b!important;color:#4a9e6b!important}.del:hover{border-color:#5a2020!important;color:#e08a8a!important}`}</style>
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
        <button className="rb" onClick={withMenuSound(()=>{ setSlotConfirm(null); if (slotsFrom === "chat") { setScreen("chat"); setMenuOpen(true); } else setScreen("menu"); })}
          style={{ marginTop:"0.6rem", background:"transparent", border:"1px solid #2a2a2a", color:"#6a6a6a", padding:"0.55rem", fontFamily:"inherit", fontSize:"0.66rem", letterSpacing:"0.16em", textAlign:"center", cursor:"pointer", transition:"all 0.2s" }}>
          ◂ BACK
        </button>
      </div>
    </div>
  );

  if (screen === "resting") {
    const remaining = Math.max(0, (gateWakeAt || 0) - (nowTick || Date.now()));
    const ready = remaining <= 0;
    const canForceWake = !ready && DAY_GATE_MS - remaining >= EARLY_WAKE_MIN_MS;
    // gateHeal is fixed for the life of the gate, so a render-time ref read is stable here.
    // Phase-3 nights defer a heal unless nightfall caught you in the open — its absence
    // doubles as the caught-out discriminator (for the flavor and the [no rest] tag).
    const healAtStake = gateHealRef.current > 0;
    const caughtOut = gateReason === "phase3_night" && !healAtStake;
    const dayLabel = gateReason === "day1" ? "day two" : `day ${phase3Day}`;
    const flavor =
      gateReason === "day1" ? "ellie: get some rest. i'll wake you."
      : gateReason === "phase3" ? "three days awake. the bunk takes you before you finish the thought."
      : caughtOut ? "a doorway is not a shelter. you keep your eyes open."
      : remaining > (DAY_GATE_MS * 2) / 3 ? "first watch. the building settles around you."
      : remaining > DAY_GATE_MS / 3 ? "the small hours. nothing moves."
      : "near dawn. the dark starts to thin.";
    return (
      <div style={{ background:"#070707", height:"100dvh", overflowY:"auto", overscrollBehavior:"contain", fontFamily:font, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"calc(clamp(1.25rem, 5vw, 2.5rem) + env(safe-area-inset-top)) clamp(1rem, 4vw, 2rem) calc(clamp(1.25rem, 5vw, 2.5rem) + env(safe-area-inset-bottom))", userSelect:"none" }}>
        <style>{`${FONT_IMPORT}${KEYFRAMES_FI}@keyframes pu{0%,100%{opacity:1}50%{opacity:.3}}.rb:hover{border-color:#4a9e6b!important;color:#4a9e6b!important}`}</style>
        <button onClick={toggleMute} title={muted ? "unmute" : "mute"} aria-label={muted ? "unmute" : "mute"}
          style={{ position:"fixed", top:"calc(0.6rem + env(safe-area-inset-top))", right:"0.7rem", zIndex:20, background:"rgba(7,7,7,0.85)", border:"1px solid #1c1c1c", display:"inline-flex", alignItems:"center", justifyContent:"center", padding:"0.3rem 0.45rem", cursor:"pointer" }}>
          {speakerIcon(muted ? "#5a5a5a" : "#4a9e6b")}
        </button>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"0.9rem", textAlign:"center", animation:"fi 1s ease forwards" }}>
          <p style={{ color:"#3a3a3a", fontSize:"0.62rem", letterSpacing:"0.22em", margin:0 }}>-- NIGHT --</p>
          <p style={{ color:"#c8b98a", fontSize:"0.95rem", letterSpacing:"0.06em", margin:0, fontWeight:300 }}>{caughtOut ? "you wait it out." : "you sleep."}</p>
          <p style={{ color:"#4a4a4a", fontSize:"0.6rem", letterSpacing:"0.14em", margin:0 }}>{dayLabel} waits.</p>
          {ready ? (
            <p style={{ color:"#6aba8a", fontSize:"0.9rem", letterSpacing:"0.1em", margin:"0.4rem 0 0", textShadow:"0 0 10px rgba(74,158,107,0.4)" }}>morning.</p>
          ) : (
            <>
              <p style={{ color:"#d8c79b", fontSize:"0.78rem", letterSpacing:"0.04em", opacity:0.75, margin:0, fontStyle:"italic" }}>{flavor}</p>
              <div style={{ marginTop:"0.6rem", color:"#4a9e6b", fontSize:"1.6rem", letterSpacing:"0.14em", fontVariantNumeric:"tabular-nums", textShadow:"0 0 12px rgba(74,158,107,0.3)" }}>{fmtCountdown(remaining)}</div>
              <p style={{ color:"#3a3a3a", fontSize:"0.58rem", letterSpacing:"0.1em", margin:"0.2rem 0 0", maxWidth:"22rem", lineHeight:1.6 }}>the night passes in real time. you can close the app.</p>
            </>
          )}
        </div>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"0.7rem", marginTop:"2.8rem" }}>
          {ready && (
            <button className="rb" onClick={withMenuSound(()=>wakeFromGate(false))} style={{ background:"transparent", border:"1px solid #1d3a22", color:"#4a9e6b", padding:"0.7rem 1.6rem", fontFamily:"inherit", fontSize:"0.72rem", letterSpacing:"0.16em", cursor:"pointer", animation:"pu 1.4s ease infinite", transition:"all 0.2s" }}>wake - continue</button>
          )}
          {canForceWake && (
            <button className="rb" onClick={withMenuSound(()=>wakeFromGate(true))} style={{ background:"transparent", border:"1px solid #3a331d", color:"#8a7a50", padding:"0.55rem 1.3rem", fontFamily:"inherit", fontSize:"0.66rem", letterSpacing:"0.12em", cursor:"pointer", transition:"all 0.2s" }}>{healAtStake ? "force yourself up [no rest]" : "force yourself up"}</button>
          )}
          {!ready && GATE_BYPASS && (
            <button className="rb" onClick={withMenuSound(()=>wakeFromGate(false))} style={{ background:"transparent", border:"1px solid #3a3a3a", color:"#606060", padding:"0.5rem 1.3rem", fontFamily:"inherit", fontSize:"0.66rem", letterSpacing:"0.12em", cursor:"pointer", transition:"all 0.2s" }}>skip (dev)</button>
          )}
          <button className="rb" onClick={withMenuSound(()=>{ setScreen("menu"); })} style={{ background:"transparent", border:"1px solid #2a2a2a", color:"#505050", padding:"0.5rem 1.3rem", fontFamily:"inherit", fontSize:"0.66rem", letterSpacing:"0.12em", cursor:"pointer", transition:"all 0.2s" }}>exit to title</button>
        </div>
      </div>
    );
  }

  if (screen === "offline" || screen === "dead" || screen === "ending") {
    const lines  = screen === "offline" ? offlineLines : screen === "dead" ? deathLines : endingLines;
    const colors = screen === "offline"
      ? (i) => i === 0 ? "#2a2a2a" : "#8b2020"
      : screen === "dead"
      ? (i) => i === 0 ? "#a83232" : "#7a1f1f"
      : () => (endingKind === "accept" ? "#6a9a78" : "#7a7a82");
    return (
      <div style={{ background:"#070707", height:"100dvh", overflowY:"auto", overscrollBehavior:"contain", fontFamily:font, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"clamp(1.25rem, 5vw, 2.5rem)", userSelect:"none" }}>
        <style>{`${FONT_IMPORT}${KEYFRAMES_FI}.rb:hover{border-color:#4a9e6b!important;color:#4a9e6b!important}`}</style>
        <div style={{ display:"flex", flexDirection:"column", gap:"0.1rem", textAlign:"center" }}>
          {lines.map((l,i) => <p key={i} style={{ color:colors(i), fontSize:"0.9rem", lineHeight:"2.2", letterSpacing:"0.06em", animation:"fi 1s ease forwards", margin:0, fontWeight:300 }}>{l}</p>)}
          {screen === "offline" && lastMessage && lines.length >= 3 && (
            <p style={{ color:"#1a1a1a", fontSize:"0.68rem", marginTop:"1.5rem", letterSpacing:"0.06em", fontWeight:300 }}>last sent: "{lastMessage}"</p>
          )}
          {screen === "ending" && (
            <p style={{ color: endingKind === "accept" ? "#3a5a44" : "#4a4a52", fontSize:"0.66rem", marginTop:"1.6rem", letterSpacing:"0.18em", opacity:0, animation:"fi 1.2s ease 1.4s forwards" }}>— you {endingKind === "accept" ? "accepted" : "refused"} —</p>
          )}
        </div>
        {(showRestart || screen === "ending") && (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"0.7rem", marginTop:"3rem", ...(screen === "ending" ? { opacity:0, animation:"fi 1.4s ease 3s forwards" } : {}) }}>
            {/* Ending: step back to the gate and pick the other choice without replaying the game. */}
            {screen === "ending" && (
              <button className="rb" onClick={withMenuSound(resumeAfterEnding)} style={{ background:"transparent", border:"1px solid #3a3a3a", color:"#606060", padding:"0.65rem 1.5rem", fontFamily:"inherit", fontSize:"0.72rem", letterSpacing:"0.12em", cursor:"pointer", transition:"all 0.2s" }}>▸&nbsp;&nbsp;back to the gate — choose again</button>
            )}
            <button className="rb" onClick={withMenuSound(handleRestart)} style={{ background:"transparent", border:"1px solid #2a2a2a", color:"#505050", padding:"0.55rem 1.5rem", fontFamily:"inherit", fontSize:"0.68rem", letterSpacing:"0.12em", cursor:"pointer", transition:"all 0.2s" }}>▸&nbsp;&nbsp;return to title</button>
          </div>
        )}
      </div>
    );
  }

  // ─── Gameplay header pieces (responsive via HUD_CSS classes; state-driven bits stay inline) ──
  // The header's center slot is the contact identity (FILE/menu moved to the bottom action
  // bar): nothing competes for the slot, so the avatar/name/status stay dead-centered.
  const TopHud = () => (
    <div className="ds-hud">
      <div className="ds-hud-side">
        <SignalBars level={signalLevel} flicker={sigFlicker || noise >= 4} />
      </div>
      <div className="ds-hud-mid">
        <div className="ds-contact-id">
          <div className="ds-avatar" style={{ border:`1px solid ${contactName==="ELLIE"?"#4a9e6b":"#2f8a58"}`, color:contactName==="ELLIE"?"#2a6a40":"#1e4a2a", boxShadow:contactName==="ELLIE"?"0 0 9px rgba(74,158,107,0.25)":"0 0 6px rgba(47,138,88,0.18)" }}>◉</div>
          <span className="ds-name" style={{ textShadow:contactName==="ELLIE"?"0 0 8px rgba(200,185,138,0.28)":"none" }}>{contactName}</span>
        </div>
        <span className="ds-status">{contactStatus}</span>
      </div>
      <div className="ds-hud-side ds-hud-right">
        <span style={{ display:"inline-flex", alignItems:"center", gap:"0.28rem", animation: battPulse ? "battpop 0.6s ease" : battAnim }}>
          <svg width="24" height="12" viewBox="0 0 24 12" style={{ display:"block", flexShrink:0, filter: battPulse ? "drop-shadow(0 0 5px rgba(74,158,107,0.9))" : resources.battery <= 10 ? "drop-shadow(0 0 3px rgba(180,40,40,0.6))" : "none" }}>
            <rect x="0.7" y="0.7" width="18.6" height="10.6" rx="2" fill="none" stroke={battPulse ? "#7fffa0" : battColor} strokeWidth="1.1"/>
            <rect x="19.6" y="3" width="2.8" height="6" rx="0.7" fill={battPulse ? "#7fffa0" : battColor}/>
            <rect x="2" y="2" width={Math.max(0,Math.round((resources.battery/100)*15.5))} height="8" rx="0.8" fill={battPulse ? "#7fffa0" : battColor}/>
          </svg>
          <span className="ds-batt-pct" style={{ color: battPulse ? "#7fffa0" : battColor, textShadow: battPulse ? "0 0 8px rgba(74,158,107,0.8)" : resources.battery <= 10 ? "0 0 6px rgba(180,40,40,0.5)" : "none" }}>{resources.battery}%</span>
        </span>
      </div>
    </div>
  );

  // The bottom action bar — case file + pause, thumb-sized, always visible on the chat
  // screen (dialogue can stream for a while; menu access must not depend on choices).
  const BottomBar = () => (
    <div className="ds-actionbar">
      <button className="cb" onClick={withMenuSound(openCaseFile)} title="case file" aria-label="case file" style={{ padding:"0 1.6rem" }}>CASE FILE</button>
      <button className="cb" onClick={withMenuSound(()=>{ setMenuMsg(""); setConfirmReset(false); setMenuOpen(true); })} title="menu" aria-label="menu" style={{ width:"56px", fontSize:"0.95rem" }}>☰</button>
    </div>
  );

  const ResourceStrip = () => (
    <div className="ds-vitals" style={{ borderBottom: showRow2 ? "none" : "1px solid #111" }}>
      <span style={{ color:"#4a9e6b" }}>DAY {displayDay}</span>
      <span style={{ color:hpColor, animation:resources.hp<=2?flashAnim:"none" }}>HP {resources.hp}/10{injuryLbl ? ` · ${injuryLbl}` : ""}</span>
      <span style={{ color:watColor }}>WATER {resources.water}</span>
      <span style={{ color:fooColor }}>FOOD {resources.food}</span>
      {/* Phase 3 day clock — daylight left to reach shelter (the final day has no night). */}
      {inPhase3 && gamePhase !== "phase3_finale" && (phase3Day >= PHASE3_FINAL_DAY
        ? <span style={{ color:"#c87a40", letterSpacing:"0.08em" }}>FINAL DAY</span>
        : <span style={{ color: daylight<=PHASE3_DUSK?"#8b2020":daylight<=5?"#7a6020":"#3a7a52", animation: daylight<=PHASE3_DUSK?flashAnim:"none" }}>LIGHT {daylight}</span>)}
    </div>
  );

  const EquipmentStrip = () => showRow2 ? (
    <div className="ds-equip">
      {weapon && <span style={{ color:"#8a7a58" }}>{weapon.shortName} ·{weapon.damage}dmg</span>}
      {noise > 0 && <span style={{ color:noiseColor, animation:noise>=4?flashAnim:"none" }}>noise {noise}/5</span>}
      {resources.charger !== null && <span style={{ color:resources.charger>0?"#3a6b40":"#484848" }}>charger {resources.charger>0?`${resources.charger}%`:"needs power"}</span>}
    </div>
  ) : null;

  const BatteryWarning = () => (resources.battery<=10 && resources.battery>0 && !inPhase3) ? (
    <div className={`ds-battwarn${resources.battery<=5 ? " ds-crit" : ""}`} style={{ animation:battAnim }}>▸ battery critical — {resources.charger===null ? "find a charger" : "find power"}</div>
  ) : null;

  const gameRootStyle = {
    background:"#070707",
    height:isDesktopDemo ? "100%" : "100dvh",
    minHeight:0,
    fontFamily:font,
    color:"#d8c79b",
    display:"flex",
    flexDirection:"column",
    width:"100%",
    maxWidth:isDesktopDemo ? "none" : "620px",
    margin:"0 auto",
    overflow:"hidden",
  };
  const messagePaneStyle = {
    flex:1,
    overflowY:"auto",
    overscrollBehavior:"contain", // transcript scroll never chains into a page bounce
    padding:isDesktopDemo ? "0.9rem clamp(1rem, 2.2vw, 2rem)" : "0.6rem 0.9rem",
    display:"flex",
    flexDirection:"column",
    gap:isDesktopDemo ? "0.55rem" : "0.4rem",
    minHeight:0,
    // Messages fade as they scroll under the HUD instead of hard-clipping mid-line.
    maskImage:"linear-gradient(to bottom, transparent 0, black 14px)",
    WebkitMaskImage:"linear-gradient(to bottom, transparent 0, black 14px)",
  };
  const choicesPaneStyle = {
    // The action bar below owns the bottom safe-area now.
    padding:isDesktopDemo ? "0.8rem clamp(1rem, 2.2vw, 2rem) 1rem" : "0.6rem 1rem 0.7rem",
    borderTop:"1px solid #111",
    display:"flex",
    flexDirection:"column",
    gap:isDesktopDemo ? "0.65rem" : "0.5rem",
    flexShrink:0,
  };

  const gamePanel = (
    <div className={isDesktopDemo ? "demo-game--desktop" : undefined} data-edition={edition} style={gameRootStyle}>
      <style>{`${FONT_IMPORT}${KEYFRAMES_FI}@keyframes pu{0%,100%{opacity:1}50%{opacity:.3}}@keyframes flash{0%,100%{opacity:1}50%{opacity:.2}}@keyframes slowflash{0%,100%{opacity:1}50%{opacity:.08}}@keyframes sigflicker{0%,100%{opacity:1}40%{opacity:.05}65%{opacity:.7}}@keyframes sigpulse{0%,100%{opacity:0.75}50%{opacity:1}}@keyframes battpop{0%{transform:scale(1)}30%{transform:scale(1.28)}100%{transform:scale(1)}}.cb:hover{border-color:#4a9e6b!important;color:#4a9e6b!important}::-webkit-scrollbar{width:2px}::-webkit-scrollbar-track{background:#070707}::-webkit-scrollbar-thumb{background:#242424}${HUD_CSS}`}</style>
      <AudioDebug />

      {/* Gameplay header — responsive pieces (see HUD_CSS). TopHud = signal · contact identity
          (centered) · battery. Then vitals, optional equipment. Mobile compacts via @media. */}
      {!isDesktopDemo && TopHud()}
      {!isDesktopDemo && ResourceStrip()}
      {!isDesktopDemo && EquipmentStrip()}

      {/* Location strip — current area (hidden in the phase-1 apartment) */}
      {area && (
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"0.6rem", padding:"0.3rem 1rem", borderBottom:"1px solid #111", flexShrink:0 }}>
          <span style={{ flex:1, height:"1px", background:"linear-gradient(90deg, transparent, #1d3a22)" }} />
          <span style={{ color:"#4a9e6b", fontSize:"0.58rem", letterSpacing:"0.22em", whiteSpace:"nowrap", textShadow:"0 0 7px rgba(74,158,107,0.3)" }}>◇&nbsp;{area}</span>
          <span style={{ flex:1, height:"1px", background:"linear-gradient(90deg, #1d3a22, transparent)" }} />
        </div>
      )}

      {/* Messages */}
      <div ref={chatScrollRef} className="ds-message-pane" style={messagePaneStyle}>
        {messages.map(m => <MessageRow key={m.id} m={m} />)}
        {isTyping && <div style={{ alignSelf:"flex-start", padding:"0.55rem 0.9rem", background:"#0d0d0d", border:"1px solid #222", color:"#333", fontSize:"clamp(0.85rem, 3.6vw, 0.92rem)", animation:"pu 1.1s ease infinite" }}>· · ·</div>}
        <div ref={bottomRef} />
      </div>

      {BatteryWarning()}

      {choices.length>0 && !isTyping && (
        <div className="ds-choices-pane" style={choicesPaneStyle}>
          {canUseCharger && (
            <button className="cb" onClick={useCharger}
              style={choiceButtonStyle("utility", 0, { fontSize:"clamp(0.72rem, 3vw, 0.78rem)" })}>
              Use the charger [+{chargerAmt}% Battery]
            </button>
          )}
          {choices.map((c,i) => {
            if (c === "·") {
              return <button key={i} className="cb" onClick={()=>handleChoice(c)} style={{ background:"transparent", border:"none", color:"#252525", padding:"0.85rem", textAlign:"center", cursor:"pointer", fontFamily:"inherit", fontSize:"1.5rem", letterSpacing:"0.4em", width:"100%", transition:"color 0.15s" }}>· · ·</button>;
            }
            const kind = getChoiceKind(c);
            return (
              <button key={i} className={`cb choice-btn choice-${kind}`} onClick={()=>handleChoice(c)} style={choiceButtonStyle(kind, i + (canUseCharger ? 1 : 0))}>
                {parseText(c,"button")}
              </button>
            );
          })}
        </div>
      )}

      {!isDesktopDemo && BottomBar()}

      {/* Pause menu — save / load / exit / restart. Sits above the chat as an overlay. */}
      {menuOpen && (
        <div onClick={()=>{ setMenuOpen(false); setConfirmReset(false); setConfirmPrologueRestart(false); setMenuMsg(""); }}
          style={{ position:"fixed", inset:0, background:"rgba(3,5,3,0.82)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:50, fontFamily:font }}>
          <div onClick={e=>e.stopPropagation()}
            style={{ background:"#080a08", border:"1px solid #1d3a22", padding:"1.4rem 1.3rem", width:"260px", display:"flex", flexDirection:"column", gap:"0.55rem", boxShadow:"0 0 40px rgba(0,0,0,0.8)" }}>
            <div style={{ color:"#4a9e6b", fontSize:"0.66rem", letterSpacing:"0.24em", textAlign:"center", marginBottom:"0.5rem", textShadow:"0 0 8px rgba(74,158,107,0.4)" }}>— PAUSED —</div>
            <button className="cb" onClick={withMenuSound(()=>{ setMenuOpen(false); setConfirmReset(false); setConfirmPrologueRestart(false); setMenuMsg(""); })} style={menuBtn}>Resume</button>
            {isDay1Demo && <button className="cb" onClick={withMenuSound(restartDay1Demo)} style={menuBtn}>Restart demo</button>}
            {isDay1Demo && onDemoExit && <button className="cb" onClick={withMenuSound(onDemoExit)} style={menuBtn}>Exit demo</button>}
            {/* Load — opens the save-slots screen in load mode, same as the main-menu LOAD.
                The run is autosaved at every decision point, so leaving to it is safe. */}
            {!isDay1Demo && <button className="cb" onClick={withMenuSound(()=>{ setMenuOpen(false); setMenuMsg(""); setSlotMode("load"); setSlotConfirm(null); setSlotsFrom("chat"); setScreen("slots"); })} style={menuBtn}>Load</button>}
            {!isDay1Demo && <button className="cb" onClick={withMenuSound(menuSave)} style={menuBtn}>Save game</button>}
            {!isDay1Demo && <button className="cb" onClick={withMenuSound(menuSaveExit)} style={menuBtn}>Save &amp; exit to title</button>}
            {/* Phase 3 only — replay the prologue from the start while KEEPING this slot's
                profile (fragments/clues toward 100%). Two-tap, since it abandons Haven progress.
                Restores the collect-toward-100% loop the auto-flow handoff otherwise blocks. */}
            {!isDay1Demo && gamePhase === "phase3" && (
              <button className="cb" onClick={withMenuSound(()=>{
                if (confirmPrologueRestart) { setConfirmPrologueRestart(false); setMenuOpen(false); setMenuMsg(""); const i = activeSlotRef.current; if (i != null) beginRun(i, { fresh:false }); }
                else { setConfirmPrologueRestart(true); setMenuMsg("this abandons Haven · keeps fragments/clues"); }
              })} style={{ ...menuBtn, color: confirmPrologueRestart ? "#c8a840" : undefined, borderColor: confirmPrologueRestart ? "#5a4a20" : undefined }}>
                {confirmPrologueRestart ? "restart prologue — confirm?" : "restart prologue · keep progress"}
              </button>
            )}
            {/* Options — audio (volume + mute) and "reset this run" live here now. */}
            <button className="cb" onClick={withMenuSound(()=>{ setMenuOpen(false); setMenuMsg(""); setOptConfirm(false); setConfirmReset(false); setOptionsFrom("chat"); setScreen("options"); })} style={menuBtn}>Options</button>
            <div style={{ minHeight:"0.9rem", textAlign:"center", color:"#4a9e6b", fontSize:"0.58rem", letterSpacing:"0.12em", marginTop:"0.2rem" }}>{menuMsg}</div>
          </div>
        </div>
      )}
    </div>
  );
  if (isDesktopDemo) return renderDesktopFrame(gamePanel, { mode:"chat" });
  return gamePanel;
}
