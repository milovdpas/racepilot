export const en = {
  common: {
    dismiss: "Dismiss",
    edit: "Edit",
    remove: "Remove",
    toggleTheme: "Toggle theme",
    cancel: "Cancel",
    save: "Save",
    delete: "Delete",
    add: "Add",
    appName: "RacePilot",
    appTagline: "Training tracker",
    createPlan: "Create a plan",
    decrease: "Decrease",
    increase: "Increase",
    now: "Now",
    gotIt: "Got it",
    close: "Close",
    example: "Example",
  },
  nav: {
    dashboard: "Dashboard",
    plan: "Plan",
    calendar: "Calendar",
    offDays: "Off days",
    stats: "Stats",
    settings: "Settings",
    theme: "Theme",
  },
  sport: {
    run: "Run",
    bike: "Bike",
    swim: "Swim",
    runPlural: "Running",
    bikePlural: "Cycling",
    swimPlural: "Swimming",
  },
  // Intensity only, with no sport in it: the badge already shows a sport icon,
  // and "Easy Run" on a swim was simply wrong.
  workoutType: {
    easy: "Easy",
    tempo: "Tempo",
    interval: "Interval",
    long: "Long",
    recovery: "Recovery",
  },
  phase: {
    base: "Base",
    build: "Build",
    peak: "Peak",
    taper: "Taper",
    race: "Race",
    reduced: "Reduced",
  },
  dashboard: {
    title: "Dashboard",
    subtitle: "Your road to the start line.",
    daysToGo: "days to go",
    goalLine: "{{goal}} · {{pace}}",
    goalLineBackyard: "{{goal}} · {{loop}} loop",
    throughBlock: "You're <b>{{pct}}%</b> through your training block.",
    planComplete: "Plan complete",
    workoutsRatio: "{{done}}/{{total}} workouts",
    totalDistance: "Total distance",
    longest: "longest {{distance}}",
    thisWeek: "This week",
    ofPlanned: "of {{distance}} planned",
    thisMonth: "This month",
    doneRatio: "{{done}}/{{total}} done",
    upcoming: "Upcoming workouts",
    viewPlan: "View plan",
    caughtUp: "No upcoming workouts - you're all caught up! 🎉",
    recent: "Recently completed",
    noPlanTitle: "No plan yet",
    noPlanBody: "Create your first training plan to get started.",
  },
  workoutRow: {
    custom: "custom",
    flexible: "Flexible",
  },
  completeWorkout: {
    title: "Log this session",
    desc: "We pre-filled your planned target - adjust it to what you actually did.",
    confirm: "Log & complete",
    planned: "Planned: {{distance}} · {{pace}}",
  },
  plan: {
    title: "Training plan",
    subtitle: "Your training block, grouped by week.",
    addWorkout: "Add workout",
    week: "Week {{n}}",
    thisWeek: "this week",
    weekMeta: "{{range}} · {{distance}} · {{done}}/{{total}} done",
    restWeek: "Rest week - nothing scheduled.",
    pickDay: "Pick a day",
    finishedTitle: "Plan complete 🏁",
    finishedBody:
      "{{race}} is behind you: {{runs}} sessions, {{distance}} logged. Start your next plan and bring this training along as context.",
    createNext: "Create next plan",
  },
  workoutForm: {
    editTitle: "Edit workout",
    addTitle: "Add workout",
    editDesc: "Update planned targets or log what you actually did.",
    addDesc: "Add a custom workout to your plan.",
    modePlan: "Plan",
    modeLog: "Log",
    date: "Date",
    type: "Type",
    sport: "Sport",
    titleLabel: "Title",
    titlePlaceholder: "e.g. 6×800m intervals",
    distance: "Distance ({{unit}})",
    paceLabel: "Pace (mm:ss {{unit}})",
    durationMin: "Duration (mm:ss)",
    computeHint: "Fill in distance + either duration or pace - the third is calculated automatically.",
    notes: "Notes",
    notesPlaceholder: "How did it feel?",
    completed: "Completed",
    flexible: "Flexible (complete any day in a window)",
    windowStart: "Window start",
    windowEnd: "Window end",
    startTime: "Started at (optional)",
  },
  calendar: {
    exportIcs: "Add to calendar",
    exported: "Calendar file downloaded",
    title: "Calendar",
    subtitle: "Your training month at a glance.",
    today: "Today",
    prev: "Previous",
    next: "Next",
    viewMonth: "Month",
    viewWeek: "Week",
    viewDay: "Day",
    viewAgenda: "Agenda",
    agendaEmpty: "No workouts scheduled in this plan yet.",
    weather: "Weather",
    offDayLabel: "Off day",
    legend:
      "Tap a day to see or edit its workouts. Faded dots are planned; solid dots are completed.",
    flexLegend:
      "Vacations and flexible workouts show as bars spanning their days. The underline on a flexible bar marks the day it's currently planned - tap the bar to change it.",
    workoutsScheduled_one: "{{count}} workout scheduled",
    workoutsScheduled_other: "{{count}} workouts scheduled",
    nothingScheduled: "Nothing scheduled this day.",
    addWorkout: "Add workout",
  },
  offDays: {
    title: "Off days",
    subtitle: "Periods that may limit training.",
    intro:
      "Vacations, trips and other periods that limit training. These show on your calendar and travel with your exported plan as context.",
    emptyTitle: "No off days yet",
    emptyBody: "Add a vacation or trip so it's factored into your training.",
    addTitle: "Add off day",
    editTitle: "Edit off day",
    dialogDesc: "Describe the period and whether any training is possible.",
    titleLabel: "Title",
    titlePlaceholder: "e.g. Vacation to Ghent",
    from: "From",
    to: "To",
    note: "Note (training possibility)",
    notePlaceholder: "e.g. Likely no training / very limited running",
  },
  stats: {
    title: "Statistics",
    subtitle: "Your training, by the numbers.",
    totalDistance: "Total distance",
    ofPlanned: "of {{distance}} planned",
    longestRun: "Longest session",
    avgPace: "Avg pace",
    avgSpeed: "Avg speed",
    runsCompleted: "Sessions completed",
    pctOfPlan: "{{pct}}% of plan",
    weeklyMileage: "Weekly volume",
    historyTitle: "Volume history",
    historySub:
      "Every logged session by calendar week - including sessions from before this plan and from your other plans.",
    splitPaces: "Split paces",
    splitPacesSub:
      "{{title}} · {{date}} - fastest {{fastest}}, slowest {{slowest}}.",
    overall: "Overall",
    overallSub:
      "The only totals that survive being added across sports - distance and pace stay per sport below.",
    bySport: "By sport",
    bySportSub: "Distance is per sport; time is the only total that means anything when they mix.",
    totalTime: "Total time",
    hours: "{{h}}h {{m}}m",
    longRunProgression: "Longest session per week",
    longRunHint: "Your longest session each week, building to a peak then tapering for race day.",
    planned: "Planned",
    actual: "Actual",
  },
  settings: {
    groupPlan: "Your plan",
    groupData: "Edit or export plan",
    groupProfile: "About you",
    groupFeatures: "Features",
    groupApp: "Appearance",
    title: "Settings",
    subtitle: "Preferences, theme, and your data.",
    plans: "Plans",
    activePlan: "Active plan",
    addPlan: "Add plan",
    deleteThisPlan: "Delete this plan",
    deletePlanTitle: "Delete plan?",
    deletePlanDesc:
      "This permanently removes “{{name}}” and its logged progress. This cannot be undone.",
    raceDetails: "Race details",
    trainingPrefs: "Training preferences",
    planName: "Plan name",
    raceName: "Race name",
    raceDistance: "Race distance ({{unit}})",
    startDate: "Start date",
    raceDate: "Race date",
    goalLabel: "Goal label",
    goalPace: "Goal pace (mm:ss {{unit}})",
    raceDateNote: "Changing the race date updates race details only - use the AI plan tools to reshape the schedule.",
    appearance: "Display & units",
    language: "Language",
    themeLight: "Light",
    themeDark: "Dark",
    themeSystem: "System",
    data: "Data",
    dataIntro:
      "Everything is stored locally in your browser. Export all your plans to back up or to hand the schema to an agent.",
    exportJson: "Export JSON",
    copyJson: "Copy JSON",
    copied: "Copied",
    importFile: "Import file",
    pasteJson: "Paste plan JSON here, or",
    importPasted: "Import pasted JSON",
    aiTitle: "Edit your plan with AI",
    aiIntro:
      "Export your JSON, paste it to an AI chatbot with the prompt below, then import the result. The AI can freely reshuffle upcoming workouts, but the prompt keeps your race date fixed and your completed workouts untouched.",
    copyPrompt: "Copy prompt",
    aiPrompt: `Here is my training plan as JSON.

Change I want: [describe your change here - e.g. "I'm at a festival from 2026-08-14 to 2026-08-16 and can't train; move, shorten or remove those workouts and adjust the surrounding days so the build still makes sense"].

The plan has an "offDays" list (vacations/trips with a note on whether I can train). Respect it: avoid scheduling hard or long sessions during those periods, and don't remove an off day unless I ask.

You MAY freely reschedule, add, remove or modify any PLANNED (not-yet-completed) future workout to make this work.

Each workout has PLANNED targets ("plannedDistanceKm", "plannedPace") and, once I've done it, LOGGED actuals ("actualDistanceKm", "actualPace", "durationMin" in minutes, optional "startTime" as "HH:mm", optional "weather" = {tempC, condition, ...}, and optional "splits" = per-kilometer pacing [{km, pace "mm:ss", elevM}]). Use "splits" to see how the run was paced (even splits, positive/negative split, a blow-up late on, hills via elevM). Compare planned vs actual to judge how the training is actually going (e.g. consistently slower/shorter than planned, or hard sessions done in heat) and adapt upcoming workouts accordingly.

You MUST follow these rules:
- The JSON may carry an "activities" list: sessions I ACTUALLY did, imported from my Strava data export, including training done outside this plan - { id, date, sport, distanceKm, movingSec, pace, elevGainM? }, newest first. Read it alongside the completed workouts to judge my current form; it is often the better evidence, because it covers training this plan never saw and it exists even when I have logged nothing here yet. Return the list UNCHANGED: it is a record of the past, not part of the plan, and nothing in it is yours to edit or remove.
- NEVER change the race date. Keep "raceDate" exactly the same and keep the race-day workout on its date. The race date is fixed.
- NEVER alter a completed workout: any workout with "completed": true must stay exactly as-is, including its "id", "completed", "actualDistanceKm", "actualPace", "durationMin", "startTime", "weather" and "splits" (don't lose my logged progress).
- Keep the JSON structure valid (plans, weeks, workouts). If you move a workout to a different week, also move its id into that week's "workoutIds", and keep each workout's "date" inside its week's start/end range.
- Return the complete updated JSON only, nothing else.
- IMPORTANT - give me the result as a downloadable .json FILE so I can attach it directly. If you can't create a file, put the ENTIRE JSON in a single \`\`\`json code block, including the very first { and the very last } - never split it or leave characters out.

JSON (paste below, or attach the exported .json file):
[paste your exported JSON here]`,
    importedOk: "Plans imported successfully.",
    importFailed:
      "Import failed - the JSON may have been copied incompletely. Copy the AI's whole response (including the first { and last }), or use the .json file with Import file.",
    planDeleted: "Plan deleted.",
    support: "Support",
    supportDesc:
      "This app is free and runs entirely in your browser. If it helps your training, you can leave a small tip.",
    buyMeAWater: "Buy me a water",
  },
  sync: {
    title: "Cloud sync",
    notConfigured:
      "Google Drive sync isn't configured for this deployment. Your data is saved locally in this browser.",
    connected: "Connected",
    reconnectNeeded: "Reconnect needed",
    reconnecting: "Reconnecting…",
    syncing: "Syncing…",
    lastSynced: "Last synced {{time}}",
    backingUp: "Backing up to your hidden Drive app folder.",
    reauthHint: "Sign-in expired - reconnect to resume syncing.",
    syncNow: "Sync now",
    reconnect: "Reconnect",
    disconnect: "Disconnect",
    connectBody:
      "Connect your Google account to back up your progress to Drive and sync it across devices. Without it, data stays local to this browser.",
    connect: "Connect Google Drive",
  },
  onboarding: {
    planTitle: "Welcome! 👋",
    planBody:
      "Let's get you to the start line. Want to build your training plan now?",
    createPlan: "Create my plan",
    lookAround: "Just look around",
    driveTitle: "Sync across devices?",
    driveBody:
      "Connect Google Drive to back up your progress and pick up your plan on any device.",
    connect: "Connect Google Drive",
    notNow: "Not now",
    weatherTitle: "Show weather?",
    weatherBody:
      "See the forecast in your calendar and capture the conditions for each session. Uses your device location.",
    enableWeather: "Enable weather",
    splitsTitle: "Log a run from a screenshot?",
    splitsBody:
      "Upload a Strava screenshot when logging a run and it fills itself in: distance, pace, start time, and the pace for every kilometer. It runs on your device, so the image is never uploaded.",
    enableSplits: "Enable scanning",
  },
  moved: {
    title: "RacePilot has moved 🏃",
    body: "This version is no longer updated. The app now lives at {{url}}. Same app, same features, and everything new lands there first.",
    dataTitle: "Take your training with you",
    dataBody:
      "Your plans are stored by this browser, for this address only, so they don't follow you automatically. Export them here, then use Settings → Data → Import file on the new site.",
    export: "Export my plans",
    stay: "Not now",
    go: "Go to the new site",
  },
  nextPlan: {
    title: "Race done! 🏁",
    body: "Nice work on {{name}}. Want to plan your next race and take this block's training along as context?",
    create: "Plan my next race",
  },
  weather: {
    title: "Weather",
    notConfigured:
      "Weather isn't configured for this deployment. Add an OpenWeather key to enable it.",
    enable: "Show weather",
    enableBody:
      "Use your location to record the weather conditions of each session you log. Toggle the calendar display from the calendar's legend.",
    locationDenied:
      "Location access was denied - allow it in your browser to use weather.",
    locationUnavailable: "Couldn't get your location. Try again.",
  },
  install: {
    title: "Install the app",
    body: "Add RacePilot to your home screen so it opens like a normal app, full screen and without browser chrome. It also keeps working without a signal.",
    action: "Install app",
    iosStep1: "Tap the Share button in Safari.",
    iosStep2: "Scroll down and choose \"Add to Home Screen\".",
    iosStep3: "Tap \"Add\" - RacePilot then opens like a normal app.",
  },
  units: {
    storedNote:
      "Your training is always stored the same way, so this only changes what you see.",
    country: "Country",
    countryUnset: "Not set",
    measure: "Distance and pace",
    metric: "Kilometers",
    imperial: "Miles",
    followsCountry: "Following your country. Pick one above to override it.",
    explicit: "Set by you. Your country would default to {{country}}.",
  },
  athlete: {
    runner: "Road runner",
    runnerDesc: "5K to marathon",
    trail: "Trail runner",
    trailDesc: "Hills and technical terrain",
    ultra: "Ultra runner",
    ultraDesc: "Beyond the marathon",
    triathlete: "Triathlete",
    triathleteDesc: "Swim, bike, run",
    cyclist: "Cyclist",
    cyclistDesc: "Road, gravel or track",
    swimmer: "Swimmer",
    swimmerDesc: "Pool or open water",
    promptTitle: "What do you train for?",
    promptBody:
      "Pick everything that applies and RacePilot will only show you what's relevant. You can change this any time in Settings.",
    cardTitle: "Your sports",
    cardBody: "What you train for. Shapes which race formats and features you see.",
    none: "Not set - everything is shown.",
  },
  examples: {
    marathon: "Marathon plan",
    marathonDesc: "A real 16-week road marathon block, splits and all.",
    trail: "Trail 50K plan",
    trailDesc: "Twelve weeks of hills and long days on the trails.",
    ultra: "100 km ultra plan",
    ultraDesc: "Sixteen weeks built on back-to-back long runs.",
    cycling: "Cycling plan",
    cyclingDesc: "Twelve weeks building to a 120 km ride, in km/h.",
    swimming: "Swimming plan",
    swimmingDesc: "Ten weeks in the pool, paced per 100 m.",
    triathlon: "Triathlon plan",
    triathlonDesc: "Twelve weeks of swim, bike and run, with weekly bricks.",
    backyard: "Backyard ultra plan",
    backyardDesc: "Fourteen weeks of loop practice for a 20-yard goal.",
    addTitle: "Try an example plan",
    addBody:
      "Example plans are someone else's training, there to explore. They're never used as context when an AI writes yours.",
    showAll: "Show {{count}} more",
    showFewer: "Show fewer",
    added: "Added",
    comingSoon:
      "No example plan for {{sports}} yet. Multi-sport races need linked race-day sessions, which is the next big step.",
  },
  welcome: {
    continue: "Continue",
    back: "Back",
    privacyTitle: "Free, and yours",
    privacySubtitle:
      "Before anything else, here's what happens to your training data.",
    tourTitle: "What you get",
    tourSubtitle: "Four things RacePilot does well.",
    profileTitle: "What do you train for?",
    profileSubtitle: "So we only show you what's relevant.",
    watchTitle: "Do you train with a watch?",
    watchSubtitle: "So a planned session can end up on your wrist.",
    featuresTitle: "Optional extras",
    featuresSubtitle: "All off by default. Turn on what you want.",
    finishTitle: "Ready when you are",
    finishSubtitle: "Build your own plan, or look around with an example first.",
    profileHint:
      "Optional - skip it and everything stays visible. You can change this in Settings.",
    watchHint:
      "Optional, and changeable in Settings. It only decides which instructions you are shown.",
    exploreWith: "Look around with the {{plan}}",
    privacy: {
      free: "Completely free",
      freeBody: "No subscription, no trial, no ads.",
      local: "Stored in your browser",
      localBody: "There's no account and no database. Your training lives on this device.",
      drive: "Your Drive, if you want it",
      driveBody: "Turn on sync and the file goes to your own Google Drive. We never hold a copy.",
      noTracking: "No trackers",
      noTrackingBody: "No analytics, no advertising, nothing to consent to.",
      readMore: "Read the full privacy page",
    },
    tour: {
      plan: "A plan around your week",
      planBody: "Pick your training days and target. Build it yourself, or have an AI write it and import the result.",
      calendar: "A calendar that fits a phone",
      calendarBody: "Month, week, day, or a scrolling agenda of just your training days.",
      log: "Log a run in seconds",
      logBody: "Distance, duration and pace solve for each other - and your splits can be read straight off a screenshot.",
      stats: "Numbers that mean something",
      statsBody: "Weekly volume, long-run progression and pace trends for the block you're in.",
    },
    finish: {
      create: "Create my plan",
      createBody: "Answer a few questions and get a plan built around your week.",
      explore: "Look around first",
      exploreBody: "Load an example plan and click through a real training block.",
    },
  },
  features: {
    title: "Features",
    subtitle: "Optional extras you can switch on.",
  },
  debug: {
    title: "Debug info",
    desc:
      "What the app worked out about this device, for checking that things like country detection landed the way you expect. Nothing here is sent anywhere.",
    replayPrompts: "Ask the one-time prompts again",
    copy: "Copy debug info",
    version: "Version {{version}}",
    tapsToGo_one: "({{count}} more)",
    tapsToGo_other: "({{count}} more)",
  },
  steps: {
    title: "Structure",
    optional: "optional",
    count_one: "{{count}} block",
    count_other: "{{count}} blocks",
    hint:
      "Break the session into steps and your watch can guide you through it. Worth doing for intervals and tempo work; a plain easy run needs nothing here.",
    step: "Step",
    times: "Repeats",
    min: "min or m:ss",
    minutesShort: "{{count}} min",
    pacePlaceholder: "Target {{unit}} (optional)",
    addStep: "Add step",
    addRepeat: "Add repeat",
    addToRepeat: "Add a step to this repeat",
    moveUp: "Move up",
    moveDown: "Move down",
    remove: "Remove",
    total: "Steps add up to {{total}} {{unit}}.",
    mismatch: "The workout says {{planned}}.",
    useTotal: "Use the step total",
    role: {
      warmup: "Warm up",
      work: "Work",
      recovery: "Recovery",
      cooldown: "Cool down",
    },
  },
  export: {
    sendToWatch: "Send to watch",
    title: "Send to your watch",
    desc_one: "One workout, ready to take with you.",
    desc_other: "{{count}} workouts, ready to take with you.",
    target: "Target {{pace}}",
    done: "Exported",
    failed: "That export did not work. Please try again.",
    "fit-file": "Workout file (.fit)",
    "fit-fileBody":
      "A real structured workout: your watch counts the steps down and holds you to each target.",
    "ics-file": "Calendar (.ics)",
    "ics-fileBody":
      "Adds your training to any calendar, and to your wrist through it. A reminder of what to do, not a workout the watch guides you through.",
    followUp: {
      garmin:
        "Connect your watch to a computer, copy the file into GARMIN/NEWFILES, then unplug. Garmin Connect cannot import workouts, so the cable is the only way in.",
      coros: "Import the file in COROS Training Hub, then sync your watch.",
      wahoo: "Import the file in the Wahoo app, then sync your device.",
      apple:
        "Open the file in an app that imports workouts to Apple Watch, such as WatchFit.",
      generic: "Copy the file to your watch the way your device expects.",
      calendar:
        "Open the file to add it to your calendar. Most watches then show it on your wrist.",
    },
  },
  upgradePlan: {
    promptTitle: "Your watch can do more with this plan",
    promptBody:
      "Some sessions have no step breakdown yet, so they would reach your watch as one block at an average pace. This fixes that in three steps.",
    title: "Add structure to this plan",
    body_one:
      "{{count}} upcoming session has no step breakdown, so it exports as one block at an average pace. An AI can read the titles and fill that in.",
    body_other:
      "{{count}} upcoming sessions have no step breakdown, so they export as one block at an average pace. An AI can read the titles and fill that in.",
    export: "Export the plan",
    import: "Import the result",
    stepExport: "Export your plan",
    stepPrompt: "Paste it to an AI with this",
    stepImport: "Bring the result back",
    orPaste: "Or paste the JSON the AI gave you:",
    importPasted: "Import pasted JSON",
    andMore_one: "and {{count}} more",
    andMore_other: "and {{count}} more",
    only: "Add \"steps\" to exactly these workouts and change nothing else in the file:",
    copy: "Copy the prompt",
    prompt: `Here is my training plan as JSON.

Add a "steps" array to every workout whose title describes a structured session: intervals, tempo blocks, anything with a warmup or a cooldown. Leave plain easy runs, long runs and recovery runs alone; a single distance at a single pace needs no steps and adding them there is only noise.

Each entry in "steps" is one of two shapes:

  { "kind": "step", "role": "warmup|work|recovery|cooldown",
    "distanceKm": <number> OR "durationSec": <number>,   // exactly one, never both
    "pace": "mm:ss",            // optional, per kilometer, same format as plannedPace
    "paceRangeSec": <number> }  // optional, +/- seconds per kilometer

  { "kind": "repeat", "times": <number>, "steps": [ ...steps... ] }

Repeats do not nest: a repeat contains plain steps only.

For example, a workout titled "6x800m @ 4:10" becomes:

  "steps": [
    { "kind": "step", "role": "warmup", "distanceKm": 2, "pace": "6:00" },
    { "kind": "repeat", "times": 6, "steps": [
      { "role": "work", "distanceKm": 0.8, "pace": "4:10" },
      { "role": "recovery", "distanceKm": 0.4, "pace": "7:00" }
    ] },
    { "kind": "step", "role": "cooldown", "distanceKm": 2 }
  ]

Rules:
- Do NOT change "plannedDistanceKm". It stays the total for the session. Make the distance-based steps add up to roughly that total instead, adjusting the warmup and cooldown if you need to.
- Do NOT change any other field, add or remove workouts, or renumber anything. The only thing you are adding is "steps".
- Every pace stays in "mm:ss" per kilometer, whatever units the title uses.
- "plannedDistanceKm" and "plannedPace" are the truth; the title can be out of date. If the title asks for more than the total allows, for example "6x800m" in a 5 km session, scale the session to fit: fewer reps, or a shorter block, at the pace the workout actually says. Do not exceed the total to satisfy a title.
- If a title genuinely does not say enough to build steps from, leave that workout untouched rather than inventing a session I did not plan.
- Give me the result as a downloadable .json FILE so I can attach it directly. If you can't create a file, put the ENTIRE JSON in a single json code block, including the very first { and the very last } - never split it or leave characters out.`,
  },
  watch: {
    title: "Your watch",
    body: "So the export tells you what to do with the file, in the words your own device uses.",
    promptTitle: "Which watch do you train with?",
    promptBody:
      "RacePilot can turn a planned session into a workout your watch guides you through. Tell it what you wear and it will give you the right steps.",
    notSet: "No watch selected yet.",
    garmin: "Garmin",
    garminDesc: "Forerunner, Fenix, Venu and the rest",
    coros: "COROS",
    corosDesc: "Pace, Apex, Vertix",
    wahoo: "Wahoo",
    wahooDesc: "ELEMNT, Rival",
    apple: "Apple Watch",
    appleDesc: "Needs a helper app to import",
    polar: "Polar",
    polarDesc: "Calendar only, no workout import",
    suunto: "Suunto",
    suuntoDesc: "Calendar only, no workout import",
    other: "Something else",
    otherDesc: "You will get the calendar",
    none: "No watch",
    noneDesc: "Do not offer this at all",
  },
  splitScanner: {
    title: "Screenshot scanner",
    enable: "Fill in a run from a screenshot",
    enableBody:
      "When logging a run, upload a Strava screenshot and it is read for you: distance, pace, time and the per-kilometer splits. It runs on your device, so the image is never uploaded and is discarded after scanning.",
    scanButton: "Scan screenshot(s)",
    scanning: "Scanning…",
    scanningOf: "Scanning {{at}} of {{of}}…",
    scanned_one: "Scanned {{count}} split",
    scanned_other: "Scanned {{count}} splits",
    scannedSummary: "Filled in the run details",
    scannedBoth_one: "Filled in the run details and {{count}} split",
    scannedBoth_other: "Filled in the run details and {{count}} splits",
    scanFailed:
      "Couldn't read that image. Make sure either the splits table or the run's distance and pace are fully visible.",
    fieldLabel: "From a screenshot",
    hint:
      "One screenshot shows either the run's totals or its splits, never both. Pick both at once, or scan them one after the other.",
    statusDetails: "Run details",
    statusDetailsDone: "distance, pace and time",
    statusSplits: "Splits",
    statusSplitsDone_one: "{{count}} kilometer",
    statusSplitsDone_other: "{{count}} kilometers",
    statusPending: "not scanned yet",
    splitsTitle: "Splits",
    clear: "Clear splits",
    helpTitle: "Which screenshot?",
    helpBody:
      "Either works. Screenshot a run's summary, the part showing distance, average pace and moving time, and those fields are filled in. Screenshot the “Splits” table and every kilometer's pace is read instead.",
    exampleCaption: "Example of what to capture",
    tip1: "For splits, make sure the whole table is visible, including the last partial kilometer.",
    tip2: "For the summary, keep the units in shot. The numbers are found by their “km”, “mi” or “/km” label, so a screenshot cropped through them reads as nothing at all.",
    tip3: "Extra content around it (the map, the pace chart, best efforts) is fine, because it gets ignored.",
    tip4: "Works in any language, in miles or kilometers, and in light or dark mode.",
    tip5: "Pick both screenshots at once, or scan them one after the other. Each fills in what it can and leaves the rest alone.",
    // Column labels as Strava's English app shows them, so the example matches.
    mockHeading: "Splits",
    mockKm: "Km",
    mockPace: "Pace",
    mockElev: "Elev",
  },
  activityImport: {
    hint: "Take the zip Strava emails you, or the activities.csv inside it. Only that one file is read, on your device, and nothing is ever uploaded.",
    howToTitle: "How to get your export",
    howToStep1: "Open your account settings:",
    howToStep2:
      'Find "Download your account", choose Get Started, then request your archive.',
    howToStep3:
      "Strava emails you a zip, usually within a few minutes. Come back here and add it.",
    howToWeb:
      "This only works on the Strava website. The Strava mobile app cannot export your data.",
    zipNoCsv:
      "That zip has no activities.csv in it. Make sure it is the export Strava emailed you, not a folder of activities.",
    zipUnreadable:
      "That zip could not be opened. Unzip it yourself and pick activities.csv from inside instead.",
    added_one: "Imported {{count}} activity.",
    added_other: "Imported {{count}} activities.",
    skipped_one: "{{count}} was not a run, ride or swim.",
    skipped_other: "{{count}} were not runs, rides or swims.",
    nothingFound:
      "No activities found. Pick activities.csv from the export, not one of the files in the activities folder.",
    failed: "That file could not be read. It should be the Strava export zip, or the activities.csv from inside it.",
  },
  wizard: {
    title: "Create a plan",
    back: "Back",
    next: "Next",
    stepRace: "Race",
    stepOffDays: "Off days",
    stepTraining: "Training",
    stepAi: "Generate with AI",
    // Step 1
    planName: "Plan name",
    planNamePlaceholder: "e.g. Berlin Marathon",
    raceName: "Race name",
    raceNamePlaceholder: "e.g. Marathon",
    raceDistance: "Race distance ({{unit}})",
    distanceCustom: "Custom (km)",
    raceDate: "Race date",
    startDate: "When do you start this plan?",
    startDateHint: "The plan is built from this date - not today.",
    goalQ: "What's your goal?",
    goalFinish: "Just finish",
    goalTime: "Target time",
    goalPace: "Target pace",
    goalTimePlaceholder: "e.g. 3:45:00",
    goalPacePlaceholder: "e.g. 5:20 {{unit}}",
    // Step 2
    offDaysIntro:
      "Add vacations, trips or busy periods that will limit your training. The AI will plan around them.",
    calendarSoon: "Connect Google Calendar (coming soon)",
    // Step 3
    sportQ: "Which sport is this plan for?",
    raceTypeQ: "What kind of race is it?",
    raceType: {
      standard: "Standard race",
      standardDesc: "A set distance you cover once, like a 10K or a gran fondo.",
      backyard: "Backyard ultra",
      backyardDesc:
        "A loop repeated every hour, on the hour, until one athlete is left.",
      multisport: "Multi-sport",
      multisportDesc: "Several sports back to back, like a triathlon or duathlon.",
    },
    raceFormat: "Race format",
    preset: {
      sprint: "Sprint",
      olympic: "Olympic",
      half: "70.3",
      full: "140.6",
      duathlon: "Duathlon",
    },
    legDistance: "{{sport}} distance ({{unit}})",
    legTransition: "Transition {{n}} (minutes)",
    transitionShort: "T{{n}}",
    legsTotal: "{{distance}} total, plus {{transition}} min in transition.",
    loopKm: "Loop distance ({{unit}})",
    targetYards: "Target yards",
    backyardDerived: "{{hours}} yards = {{hours}} hours · {{distance}} total",
    previousPlans: "Previous plans as context",
    previousPlansHint:
      "Attach earlier training so the AI can see how you actually progressed. Saves entering recent runs by hand.",
    planFinished: "finished",
    planInProgress: "in progress",
    planRuns: "{{runs}} sessions · {{distance}} logged",
    showAllPlans: "Show all {{count}} plans",
    showLess: "Show less",
    historyInUse_one: "The AI will use your imported training history: {{count}} activity, {{from}} to {{to}}.",
    historyInUse_other: "The AI will use your imported training history: {{count}} activities, {{from}} to {{to}}.",
    importActivities: "Add from Strava export",
    latestRuns: "Your recent sessions",
    latestRunsHint:
      "Optional - gives the AI a sense of your current fitness. Add a few recent sessions.",
    addRun: "Add session",
    runSport: "Sport",
    runDistance: "Distance ({{unit}})",
    runTimePlaceholder: "Total time (e.g. 50:43)",
    daysPerWeek: "Training days per week",
    trainingDaysQ: "Which days do you want to train?",
    flexibleDays: "I'm flexible - no fixed days",
    planningModeQ: "How should workouts be scheduled?",
    planningExact: "Exact dates",
    planningExactDesc: "Each workout is pinned to a specific day.",
    planningFlexible: "Flexible periods",
    planningFlexibleDesc:
      "Each workout gets a window (e.g. Mon–Wed) and you pick the exact day.",
    targetQ: "Distance you want to run comfortably before the race",
    targetUnknown: "I don't know - let the AI decide",
    targetKm: "Target distance (km)",
    // Step 4
    aiIntro:
      "Your plan request is ready. Hand it to an AI chatbot to build the full schedule:",
    aiStep1: "1. Copy the prompt and paste it into your AI chatbot.",
    aiStep2: "2. Export the plan request and attach that file to the same chat.",
    aiStep3: "3. The AI returns a plan as JSON - it may ask a few questions first.",
    aiStep4: "4. Paste or import that JSON below and press Complete plan.",
    exportRequest: "Export request (JSON)",
    copyRequest: "Copy request",
    copyPrompt: "Copy prompt",
    copied: "Copied",
    importLabel: "Paste the AI's plan below, or",
    importFile: "Import file",
    completePlan: "Complete plan",
    created: "Plan created",
    completeError:
      "Couldn't read that as a plan - it may have been copied incompletely. Copy the AI's whole response (including the first { and last }), or attach the .json file.",
    aiPrompt: `You are building a running training plan for me. I'll attach a plan-request JSON describing my race and preferences. Read it, then output a plan in EXACTLY the JSON schema below so I can import it into my app.

What the attached plan-request fields mean:
- race.name: what to call the plan. race.raceName: the race's name.
- race.distanceKm: the race distance in kilometers.
- race.type "multisport": a triathlon or duathlon. race.legs[] gives the legs IN RACE ORDER, each with { sport, distanceKm, transitionMin }. transitionMin is the time spent AFTER that leg (T1, T2), so the last leg has none. Ignore race.sport for these; the legs name the sports.
  - Build a week that trains all of them, and schedule at least one BRICK each week (a bike session followed immediately by a run, as two workouts on the same date, bike first). Set "sport" on every workout.
  - Race day is one workout PER LEG, all on race.date, each with "sport" set and "raceLegIndex" 0, 1, 2... in race order. Do NOT emit a single combined race workout: the app tracks the race as finished only when every leg is.
  - Do not create workouts for transitions. They are part of the race clock, not training, and a transition workout would corrupt every distance total.
- race.sport: "run", "bike" or "swim". Write sessions for THAT sport: an interval session on a bike is intervals on a bike, not a run. Set "sport" on a workout only when it differs from race.sport (e.g. a cross-training ride in a running plan); leave it off otherwise and it inherits.
- IMPORTANT: "plannedPace" is ALWAYS minutes and seconds per KILOMETER, for every sport, because that is how the app stores it. So a 30 km/h ride is "2:00" and a 1:45/100m swim is "17:30". Do not emit km/h or per-100m in that field. You may of course write km/h or per-100m inside the workout TITLE, where it reads naturally.
- athlete: where I am and which units I read. EVERY number in this request is metric (km, min/km) regardless of athlete.units - that is the wire format. If athlete.units is "imperial", write the plan's workout TITLES and NOTES in miles and min/mile (1 mi = 1.609344 km), but still emit "plannedDistanceKm" and "plannedPace" as kilometers and min/km in the JSON. Use athlete.country for seasons and typical weather.
- race.date: race day (YYYY-MM-DD).
- startDate: the date I'll begin this plan (YYYY-MM-DD). Build week 1 from this date - do NOT assume today's date.
- race.type: "standard" (one continuous race over a set distance) or "backyard" (see below).
- goal: my race goal - { type: "finish" | "time" | "pace" | "yards", value }. "finish" = just complete it; "time" = target finish time (value); "pace" = target pace per km (value); "yards" = target number of backyard yards (value). Use it to set "goalPace"/"goalLabel" and the plan's intensity.

If race.type is "backyard", this is a BACKYARD ULTRA and the usual fixed-distance race logic does NOT apply:
- The format: I run a fixed loop (race.loopKm, usually 6.706 km) every hour, ON THE HOUR. Finish the loop faster and the remaining time is my rest. Anyone who fails to start or finish a loop is out; the last runner standing wins. One "yard" = one loop = one hour, so race.targetYards is both my distance goal and my duration goal (e.g. 24 yards = 24 hours = about 161 km).
- Train time on feet, not speed. There is no finish time and no single peak long run to taper from.
- Build toward my target with: long back-to-back runs on consecutive days; "mock backyards" (several loops started on the hour, progressively more yards); at least some running at night and on tired legs; and deliberate practice at eating, drinking and changing kit inside the short rest between loops.
- "goalPace" should be an easy, repeatable loop pace that still banks useful rest each hour (finishing a loop in roughly 40-50 minutes is typical), NOT a race pace. "goalLabel" should read like "24 yards".
- Taper into race week, but the peak sessions are duration and repeated loops rather than one long distance.
- offDays[]: periods I can't fully train - { start, end, title, note }. The "note" says how limited it is (e.g. no training / very limited / reduced).
- latestRuns[]: my recent sessions - { sport, distanceKm, durationMin (TOTAL time, in minutes), pace (min/km for every sport, derived from distance + total time), date }. Use these to estimate my current fitness in EACH sport; 40 km means something very different on a bike than on foot. If this AND trainingHistory are both empty, ask me about my fitness.
- trainingHistory (only when I have imported my activity log): the shape of what I have ACTUALLY been training - { from, to, sessions, weeks, sessionsPerWeek, avgWeeklyKm, peakWeeklyKm, longestKm, recentWeeklyKm (the weeks since my history begins, at most 8, oldest first, where a 0 is a week I did not train), recentSessions (my last 10 in full), bySport (sessions, totalKm, longestKm, typicalPace per sport) }. This is stronger evidence than latestRuns, because it is my whole recent block rather than a few sessions I typed in. Use it to set the STARTING weekly volume and to judge how fast I can safely ramp: do not open the plan far above avgWeeklyKm, and do not exceed peakWeeklyKm early. Zeros in recentWeeklyKm are real gaps, so treat a recent run of them as time off to build back from rather than as a taper.
- previousPlans[]: my earlier training blocks, as READ-ONLY history. Each has { name, raceName, raceDistanceKm, raceDate, startDate, goalPace, goalLabel, weeks, summary, weeklyMileage[], completedRuns[] }.
  - summary: { completionPct (how much of that plan I actually did), completedRuns, totalKm, plannedTotalKm, longestRunKm, averagePace, peakWeekKm }.
  - weeklyMileage[]: { week, plannedKm, actualKm } - planned vs actual per week, so you can see adherence and how volume ramped.
  - completedRuns[]: only the runs I actually logged - { date, type, title, plannedDistanceKm, plannedPace, distanceKm, pace, durationMin, startTime, tempC, condition, splits, elevM, notes }. "splits" is per-kilometer pace where the FIRST entry is km 1, the second km 2, and so on; "elevM" (when present) is the matching elevation change per kilometer.
  Use this to judge my real training load, how consistently I hit planned paces, how my long runs progressed, and a realistic goal for the new race.
- training.daysPerWeek: how many days per week I want to run.
- training.trainingDays: the weekdays I prefer to run (e.g. ["Monday","Wednesday"]). null means I'm flexible - choose sensible days yourself.
- training.flexibleDays: true if I have no fixed training days.
- training.planningMode: "exact" = pin each workout to a specific day; "flexible" = give each workout a window and I'll pick the exact day.
- training.targetDistanceKm: the longest SINGLE long run I want to comfortably reach before race day (NOT my weekly volume). null means you decide based on the race distance.

Output schema (return exactly this shape, nothing else):
{
  "plans": {
    "<planId>": {
      "id": "<planId>",
      "name": "<plan name>",
      "raceName": "<race name>",
      "raceDistanceKm": <number>,
      "raceDate": "YYYY-MM-DD",
      "goalPace": "mm:ss",            // per km
      "goalLabel": "<short goal>",
      "version": 1,
      "createdAt": "<ISO datetime>",
      "offDays": [ { "id": "...", "start": "YYYY-MM-DD", "end": "YYYY-MM-DD", "title": "...", "note": "..." } ],
      "weeks": [ { "weekNumber": 1, "startDate": "YYYY-MM-DD(Monday)", "endDate": "YYYY-MM-DD(Sunday)", "phase": "base|build|peak|taper|race|reduced", "label": "optional", "workoutIds": ["..."] } ],
      "workouts": {
        "<workoutId>": {
          "id": "<workoutId>", "date": "YYYY-MM-DD", "type": "easy|tempo|interval|long|recovery",
          "title": "...", "weekNumber": 1, "plannedDistanceKm": <number>, "plannedPace": "mm:ss",
          "completed": false
          // OPTIONAL "steps": the session broken down, so my watch can guide me
          // through it. Add it whenever the session HAS structure - intervals,
          // tempo blocks, anything with a warmup - and leave it out for a plain
          // easy or long run, where it would only be noise. Two shapes:
          //   { "kind": "step", "role": "warmup|work|recovery|cooldown",
          //     "distanceKm": <number> OR "durationSec": <number>,   // exactly one
          //     "pace": "mm:ss",            // optional, per km, same as plannedPace
          //     "paceRangeSec": <number> }  // optional, +/- seconds per km
          //   { "kind": "repeat", "times": <number>, "steps": [ ...steps... ] }
          // e.g. 6x800m: [ {"kind":"step","role":"warmup","distanceKm":2,"pace":"6:00"},
          //   {"kind":"repeat","times":6,"steps":[
          //     {"role":"work","distanceKm":0.8,"pace":"4:10"},
          //     {"role":"recovery","distanceKm":0.4,"pace":"7:00"}]},
          //   {"kind":"step","role":"cooldown","distanceKm":2,"pace":"6:00"} ]
          // For flexible scheduling also add: "flexible": true, "windowStart": "YYYY-MM-DD", "windowEnd": "YYYY-MM-DD"
          // New plans set "completed": false. Once I log a run the app fills in actuals:
          // "actualDistanceKm", "actualPace" ("mm:ss"), "durationMin" (number), optional
          // "startTime" ("HH:mm"), optional "weather" {tempC, condition, ...} and optional
          // "splits" [{km, pace, elevM}] - leave these out for new plans.
        }
      }
    }
  },
  "activePlanId": "<planId>"
}

Rules:
- Weeks run Monday→Sunday. Week 1 starts from "startDate"; the final week's long run is the race on raceDate.
- Schedule workouts on my preferred training days; if I said I'm flexible, choose sensible days.
- If planningMode is "flexible": set "flexible": true with "windowStart"/"windowEnd" on each workout, and keep its "date" inside that window.
- Respect "offDays": avoid hard/long sessions in those periods (none/limited/reduced per the note).
- Build long runs progressively to my target distance, then taper into race week.
- Use my latest runs to estimate fitness and paces. Set every workout "completed": false.
- If my goal time/pace isn't provided, infer a sensible "goalPace"/"goalLabel" from my latest runs and the race distance (or ask me first).
- Each workout's id must appear in its week's "workoutIds", and its "date" must fall within that week.
- "plannedDistanceKm" stays the total for the session. When you add "steps", make the distance-based steps add up to roughly that total, and never change "plannedDistanceKm" to match the steps instead.
- "previousPlans" is history to learn from, NOT a template. Return ONLY the new plan in "plans" - never copy a previous plan, its weeks or its workouts into your output. Every id you emit must be brand new and unique.
- Give me the result as a downloadable .json FILE so I can attach it directly. If you can't create a file, put the ENTIRE JSON in a single \`\`\`json code block, including the very first { and the very last } - never split it or leave characters out.
- Ask me any clarifying questions first, then return ONLY the JSON.`,
  },
};

export type Dict = typeof en;
