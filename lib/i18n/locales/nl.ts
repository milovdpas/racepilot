import type { Dict } from "./en";

export const nl: Dict = {
  common: {
    cancel: "Annuleren",
    save: "Opslaan",
    delete: "Verwijderen",
    add: "Toevoegen",
    appName: "RacePilot",
    appTagline: "Trainingstracker",
    createPlan: "Maak een plan",
    decrease: "Verlagen",
    increase: "Verhogen",
    now: "Nu",
    gotIt: "Duidelijk",
    example: "Voorbeeld",
  },
  nav: {
    dashboard: "Dashboard",
    plan: "Plan",
    calendar: "Kalender",
    offDays: "Vrije dagen",
    stats: "Statistieken",
    settings: "Instellingen",
    theme: "Thema",
  },
  sport: {
    run: "Lopen",
    bike: "Fietsen",
    swim: "Zwemmen",
    runPlural: "Hardlopen",
    bikePlural: "Fietsen",
    swimPlural: "Zwemmen",
  },
  workoutType: {
    easy: "Rustig",
    tempo: "Tempo",
    interval: "Interval",
    long: "Lang",
    recovery: "Herstel",
  },
  phase: {
    base: "Basis",
    build: "Opbouw",
    peak: "Piek",
    taper: "Afbouw",
    race: "Wedstrijd",
    reduced: "Verminderd",
  },
  dashboard: {
    title: "Dashboard",
    subtitle: "Op weg naar de startstreep.",
    daysToGo: "dagen te gaan",
    goalLine: "{{goal}} · {{pace}}",
    goalLineBackyard: "{{goal}} · ronde van {{loop}}",
    throughBlock: "Je bent <b>{{pct}}%</b> door je trainingsblok.",
    planComplete: "Plan voltooid",
    workoutsRatio: "{{done}}/{{total}} trainingen",
    totalDistance: "Totale afstand",
    longest: "langste {{distance}}",
    thisWeek: "Deze week",
    ofPlanned: "van {{distance}} gepland",
    thisMonth: "Deze maand",
    doneRatio: "{{done}}/{{total}} gedaan",
    upcoming: "Aankomende trainingen",
    viewPlan: "Bekijk plan",
    caughtUp: "Geen aankomende trainingen - je bent helemaal bij! 🎉",
    recent: "Onlangs voltooid",
    noPlanTitle: "Nog geen plan",
    noPlanBody: "Maak je eerste trainingsplan om te beginnen.",
  },
  workoutRow: {
    custom: "eigen",
    flexible: "Flexibel",
  },
  completeWorkout: {
    title: "Training vastleggen",
    desc: "We hebben je geplande doel ingevuld - pas het aan naar wat je werkelijk deed.",
    confirm: "Vastleggen & voltooien",
    planned: "Gepland: {{distance}} · {{pace}}",
  },
  plan: {
    title: "Trainingsplan",
    subtitle: "Je trainingsblok, gegroepeerd per week.",
    addWorkout: "Training toevoegen",
    week: "Week {{n}}",
    thisWeek: "deze week",
    weekMeta: "{{range}} · {{distance}} · {{done}}/{{total}} gedaan",
    restWeek: "Rustweek - niets gepland.",
    pickDay: "Kies een dag",
    finishedTitle: "Plan afgerond 🏁",
    finishedBody:
      "{{race}} zit erop: {{runs}} trainingen, {{distance}} vastgelegd. Begin je volgende plan en neem deze training mee als context.",
    createNext: "Volgend plan maken",
  },
  workoutForm: {
    editTitle: "Training bewerken",
    addTitle: "Training toevoegen",
    editDesc: "Pas geplande doelen aan of leg vast wat je echt deed.",
    addDesc: "Voeg een eigen training toe aan je plan.",
    modePlan: "Inplannen",
    modeLog: "Loggen",
    date: "Datum",
    type: "Type",
    sport: "Sport",
    titleLabel: "Titel",
    titlePlaceholder: "bijv. 6×800m intervallen",
    distance: "Afstand ({{unit}})",
    paceLabel: "Tempo (mm:ss {{unit}})",
    durationMin: "Duur (mm:ss)",
    computeHint: "Vul afstand + duur óf tempo in - de derde wordt automatisch berekend.",
    notes: "Notities",
    notesPlaceholder: "Hoe voelde het?",
    completed: "Voltooid",
    flexible: "Flexibel (voltooi op elke dag binnen een periode)",
    windowStart: "Begin periode",
    windowEnd: "Einde periode",
    startTime: "Gestart om (optioneel)",
  },
  calendar: {
    title: "Kalender",
    subtitle: "Je trainingsmaand in één oogopslag.",
    today: "Vandaag",
    prev: "Vorige",
    next: "Volgende",
    viewMonth: "Maand",
    viewWeek: "Week",
    viewDay: "Dag",
    viewAgenda: "Agenda",
    agendaEmpty: "Nog geen trainingen ingepland in dit plan.",
    weather: "Weer",
    offDayLabel: "Vrije dag",
    legend:
      "Tik op een dag om de trainingen te bekijken of bewerken. Vage stippen zijn gepland; volle stippen zijn voltooid.",
    flexLegend:
      "Vakanties en flexibele trainingen verschijnen als balken over hun dagen. De onderstreping op een flexibele balk markeert de dag waarop hij nu gepland staat - tik op de balk om dit te wijzigen.",
    workoutsScheduled_one: "{{count}} training gepland",
    workoutsScheduled_other: "{{count}} trainingen gepland",
    nothingScheduled: "Niets gepland deze dag.",
    addWorkout: "Training toevoegen",
  },
  offDays: {
    title: "Vrije dagen",
    subtitle: "Periodes die je training kunnen beperken.",
    intro:
      "Vakanties, reizen en andere periodes die je training beperken. Deze verschijnen op je kalender en gaan als context mee met je geëxporteerde plan.",
    emptyTitle: "Nog geen vrije dagen",
    emptyBody: "Voeg een vakantie of reis toe zodat er rekening mee wordt gehouden.",
    addTitle: "Vrije dag toevoegen",
    editTitle: "Vrije dag bewerken",
    dialogDesc: "Beschrijf de periode en of er getraind kan worden.",
    titleLabel: "Titel",
    titlePlaceholder: "bijv. Vakantie naar Gent",
    from: "Van",
    to: "Tot",
    note: "Notitie (trainingsmogelijkheid)",
    notePlaceholder: "bijv. Waarschijnlijk geen training / zeer beperkt hardlopen",
  },
  stats: {
    title: "Statistieken",
    subtitle: "Je training, in cijfers.",
    totalDistance: "Totale afstand",
    ofPlanned: "van {{distance}} gepland",
    longestRun: "Langste training",
    avgPace: "Gem. tempo",
    avgSpeed: "Gem. snelheid",
    runsCompleted: "Voltooide trainingen",
    pctOfPlan: "{{pct}}% van plan",
    weeklyMileage: "Weekvolume",
    historyTitle: "Volumegeschiedenis",
    historySub:
      "Elke vastgelegde training per kalenderweek - inclusief trainingen van vóór dit plan en uit je andere plannen.",
    splitPaces: "Tempo per kilometer",
    splitPacesSub:
      "{{title}} · {{date}} - snelste {{fastest}}, langzaamste {{slowest}}.",
    overall: "Totaal",
    overallSub:
      "De enige totalen die kloppen als je sporten optelt - afstand en tempo blijven hieronder per sport.",
    bySport: "Per sport",
    bySportSub: "Afstand is per sport; tijd is het enige totaal dat iets zegt als ze door elkaar lopen.",
    totalTime: "Totale tijd",
    hours: "{{h}}u {{m}}m",
    longRunProgression: "Langste training per week",
    longRunHint: "Je langste training per week, opbouwend naar je piek en daarna afbouwend richting wedstrijddag.",
    planned: "Gepland",
    actual: "Werkelijk",
  },
  settings: {
    title: "Instellingen",
    subtitle: "Voorkeuren, thema en je gegevens.",
    plans: "Plannen",
    activePlan: "Actief plan",
    addPlan: "Plan toevoegen",
    deleteThisPlan: "Dit plan verwijderen",
    deletePlanTitle: "Plan verwijderen?",
    deletePlanDesc:
      "Dit verwijdert “{{name}}” en de bijbehorende voortgang permanent. Dit kan niet ongedaan worden gemaakt.",
    raceDetails: "Wedstrijdgegevens",
    trainingPrefs: "Trainingsvoorkeuren",
    planName: "Plannaam",
    raceName: "Wedstrijdnaam",
    raceDistance: "Wedstrijdafstand ({{unit}})",
    startDate: "Startdatum",
    raceDate: "Wedstrijddatum",
    goalLabel: "Doel-label",
    goalPace: "Doeltempo (mm:ss {{unit}})",
    raceDateNote:
      "Het wijzigen van de wedstrijddatum werkt alleen de wedstrijdgegevens bij - gebruik de AI-plantools om het schema aan te passen.",
    appearance: "Weergave & eenheden",
    language: "Taal",
    themeLight: "Licht",
    themeDark: "Donker",
    themeSystem: "Systeem",
    data: "Gegevens",
    dataIntro:
      "Alles wordt lokaal in je browser opgeslagen. Exporteer al je plannen als back-up of om het schema aan een AI te geven.",
    exportJson: "JSON exporteren",
    copyJson: "JSON kopiëren",
    copied: "Gekopieerd",
    importFile: "Bestand importeren",
    pasteJson: "…of plak JSON",
    importPasted: "Geplakte JSON importeren",
    aiTitle: "Je plan aanpassen met AI",
    aiIntro:
      "Exporteer je JSON, plak het in een AI-chatbot met de prompt hieronder en importeer het resultaat. De AI mag aankomende trainingen vrij verschuiven, maar de prompt houdt je wedstrijddatum vast en je voltooide trainingen onaangeroerd.",
    copyPrompt: "Prompt kopiëren",
    aiPrompt: `Hier is mijn trainingsplan als JSON.

Gewenste wijziging: [beschrijf hier je wijziging - bijv. "Ik ben op een festival van 2026-08-14 tot 2026-08-16 en kan niet trainen; verplaats, verkort of verwijder die trainingen en pas de omliggende dagen aan zodat de opbouw logisch blijft"].

Het plan heeft een "offDays"-lijst (vakanties/reizen met een notitie of ik kan trainen). Respecteer deze: plan geen zware of lange trainingen tijdens die periodes, en verwijder een vrije dag niet tenzij ik erom vraag.

Je MAG elke GEPLANDE (nog niet voltooide) toekomstige training vrij verplaatsen, toevoegen, verwijderen of aanpassen om dit voor elkaar te krijgen.

Elke training heeft GEPLANDE doelen ("plannedDistanceKm", "plannedPace") en, zodra ik hem gedaan heb, VASTGELEGDE werkelijke waarden ("actualDistanceKm", "actualPace", "durationMin" in minuten, optioneel "startTime" als "HH:mm", optioneel "weather" = {tempC, condition, ...}, en optioneel "splits" = tempo per kilometer [{km, pace "mm:ss", elevM}]). Gebruik "splits" om te zien hoe de loop verdeeld was (gelijkmatig, positieve/negatieve split, inzakken aan het eind, heuvels via elevM). Vergelijk gepland met werkelijk om te beoordelen hoe de training echt verloopt (bijv. structureel langzamer/korter dan gepland, of zware sessies in de hitte) en pas de komende trainingen daarop aan.

Je MOET je aan deze regels houden:
- WIJZIG NOOIT de wedstrijddatum. Houd "raceDate" exact hetzelfde en houd de wedstrijddag-training op zijn datum. De wedstrijddatum staat vast.
- WIJZIG NOOIT een voltooide training: elke training met "completed": true moet exact zo blijven, inclusief "id", "completed", "actualDistanceKm", "actualPace", "durationMin", "startTime", "weather" en "splits" (zodat ik mijn vastgelegde voortgang niet verlies).
- Houd de JSON-structuur geldig (plans, weeks, workouts). Als je een training naar een andere week verplaatst, verplaats dan ook zijn id naar de "workoutIds" van die week, en houd de "date" van elke training binnen het start/eind-bereik van zijn week.
- Geef alleen de volledige bijgewerkte JSON terug, niets anders.
- BELANGRIJK - geef het resultaat als een downloadbaar .json-BESTAND zodat ik het direct kan toevoegen. Als je geen bestand kunt maken, zet dan de VOLLEDIGE JSON in één \`\`\`json-codeblok, inclusief de allereerste { en de allerlaatste } - splits het nooit en laat geen tekens weg.

JSON (plak hieronder, of voeg het geëxporteerde .json-bestand toe):
[plak hier je geëxporteerde JSON]`,
    importedOk: "Plannen succesvol geïmporteerd.",
    importFailed:
      "Importeren mislukt - de JSON is mogelijk onvolledig gekopieerd. Kopieer het hele antwoord van de AI (inclusief de eerste { en laatste }), of gebruik het .json-bestand met Bestand importeren.",
    planDeleted: "Plan verwijderd.",
    support: "Steun",
    supportDesc:
      "Deze app is gratis en draait volledig in je browser. Vind je hem nuttig voor je training? Dan mag je iets in het potje doen.",
    buyMeAWater: "Trakteer me op water",
  },
  sync: {
    title: "Cloudsynchronisatie",
    notConfigured:
      "Google Drive-synchronisatie is niet geconfigureerd voor deze omgeving. Je gegevens worden lokaal in deze browser opgeslagen.",
    connected: "Verbonden",
    reconnectNeeded: "Opnieuw verbinden nodig",
    reconnecting: "Opnieuw verbinden…",
    syncing: "Synchroniseren…",
    lastSynced: "Laatst gesynchroniseerd {{time}}",
    backingUp: "Back-up naar je verborgen Drive-appmap.",
    reauthHint: "Aanmelding verlopen - verbind opnieuw om te blijven synchroniseren.",
    syncNow: "Nu synchroniseren",
    reconnect: "Opnieuw verbinden",
    disconnect: "Verbinding verbreken",
    connectBody:
      "Verbind je Google-account om je voortgang naar Drive te back-uppen en te synchroniseren tussen apparaten. Zonder dit blijven gegevens lokaal in deze browser.",
    connect: "Verbind Google Drive",
  },
  onboarding: {
    planTitle: "Welkom! 👋",
    planBody:
      "Op naar de startstreep. Wil je nu je trainingsplan opbouwen?",
    createPlan: "Maak mijn plan",
    lookAround: "Even rondkijken",
    driveTitle: "Synchroniseren tussen apparaten?",
    driveBody:
      "Verbind Google Drive om je voortgang te back-uppen en je plan op elk apparaat te zien.",
    connect: "Verbind Google Drive",
    notNow: "Niet nu",
    weatherTitle: "Weer tonen?",
    weatherBody:
      "Zie de voorspelling in je kalender en leg de omstandigheden van elke training vast. Gebruikt de locatie van je apparaat.",
    enableWeather: "Weer inschakelen",
    splitsTitle: "Tussentijden scannen?",
    splitsBody:
      "Upload bij het vastleggen van een loop je Strava-screenshot met tussentijden; het tempo van elke kilometer wordt er automatisch uit gelezen. Het draait op je apparaat, dus de afbeelding wordt nooit geüpload.",
    enableSplits: "Scannen inschakelen",
  },
  nextPlan: {
    title: "Wedstrijd volbracht! 🏁",
    body: "Goed gedaan met {{name}}. Wil je je volgende wedstrijd plannen en de training van dit blok meenemen als context?",
    create: "Volgende wedstrijd plannen",
  },
  weather: {
    title: "Weer",
    notConfigured:
      "Weer is niet geconfigureerd voor deze omgeving. Voeg een OpenWeather-sleutel toe om het in te schakelen.",
    enable: "Weer tonen",
    enableBody:
      "Gebruik je locatie om de weersomstandigheden van elke training die je vastlegt op te slaan. De kalenderweergave schakel je in via de legenda van de kalender.",
    locationDenied:
      "Locatietoegang geweigerd - sta het toe in je browser om weer te gebruiken.",
    locationUnavailable: "Kon je locatie niet ophalen. Probeer opnieuw.",
  },
  install: {
    title: "App installeren",
    body: "Zet RacePilot op je beginscherm, zodat de app schermvullend opent zonder browserbalken. Hij blijft ook werken zonder verbinding.",
    action: "App installeren",
    iosStep1: "Tik op de deelknop in Safari.",
    iosStep2: "Scrol omlaag en kies \"Zet op beginscherm\".",
    iosStep3: "Tik op \"Voeg toe\" - RacePilot opent daarna als een gewone app.",
  },
  units: {
    storedNote:
      "Je training wordt altijd hetzelfde opgeslagen, dus dit verandert alleen wat je ziet.",
    country: "Land",
    countryUnset: "Niet ingesteld",
    measure: "Afstand en tempo",
    metric: "Kilometers",
    imperial: "Mijlen",
    followsCountry: "Volgt je land. Kies hierboven om dat te overschrijven.",
    explicit: "Door jou ingesteld. Je land zou standaard {{country}} geven.",
  },
  athlete: {
    runner: "Hardloper",
    runnerDesc: "5 km tot marathon",
    trail: "Trailloper",
    trailDesc: "Heuvels en technisch terrein",
    ultra: "Ultraloper",
    ultraDesc: "Verder dan de marathon",
    triathlete: "Triatleet",
    triathleteDesc: "Zwemmen, fietsen, lopen",
    cyclist: "Wielrenner",
    cyclistDesc: "Weg, gravel of baan",
    swimmer: "Zwemmer",
    swimmerDesc: "Bad of open water",
    promptTitle: "Waar train je voor?",
    promptBody:
      "Kies alles wat van toepassing is, dan laat RacePilot alleen zien wat relevant is. Je kunt dit altijd aanpassen in instellingen.",
    cardTitle: "Jouw sporten",
    cardBody:
      "Waar je voor traint. Bepaalt welke wedstrijdvormen en functies je ziet.",
    none: "Niet ingesteld - alles wordt getoond.",
  },
  examples: {
    marathon: "Marathonplan",
    marathonDesc: "Een echt marathonblok van 16 weken, inclusief splits.",
    trail: "Trail 50K-plan",
    trailDesc: "Twaalf weken heuvels en lange dagen op de trails.",
    ultra: "100 km ultraplan",
    ultraDesc: "Zestien weken opgebouwd rond lange duurlopen op elkaar.",
    cycling: "Fietsplan",
    cyclingDesc: "Twaalf weken opbouw naar een rit van 120 km, in km/u.",
    swimming: "Zwemplan",
    swimmingDesc: "Tien weken in het bad, tempo per 100 m.",
    triathlon: "Triatlonplan",
    triathlonDesc: "Twaalf weken zwemmen, fietsen en lopen, met wekelijkse bricks.",
    backyard: "Backyard-ultraplan",
    backyardDesc: "Veertien weken rondjes trainen richting 20 yards.",
    addTitle: "Probeer een voorbeeldplan",
    addBody:
      "Voorbeeldplannen zijn andermans training, puur om te bekijken. Ze worden nooit als context gebruikt als een AI jouw plan schrijft.",
    showAll: "Toon {{count}} meer",
    showFewer: "Toon minder",
    added: "Toegevoegd",
    comingSoon:
      "Nog geen voorbeeldplan voor {{sports}}. Meerdere sporten in één wedstrijd vragen gekoppelde wedstrijddagtrainingen, en dat is de volgende grote stap.",
  },
  welcome: {
    continue: "Verder",
    back: "Terug",
    privacyTitle: "Gratis, en van jou",
    privacySubtitle:
      "Eerst even dit: wat er met je trainingsgegevens gebeurt.",
    tourTitle: "Wat je krijgt",
    tourSubtitle: "Vier dingen die RacePilot goed doet.",
    profileTitle: "Waar train je voor?",
    profileSubtitle: "Zodat we alleen laten zien wat relevant is.",
    featuresTitle: "Optionele extra's",
    featuresSubtitle: "Standaard allemaal uit. Zet aan wat je wilt.",
    finishTitle: "Klaar wanneer jij dat bent",
    finishSubtitle:
      "Maak je eigen plan, of kijk eerst rond met een voorbeeld.",
    profileHint:
      "Optioneel - sla het over en alles blijft zichtbaar. Je kunt dit aanpassen in instellingen.",
    exploreWith: "Rondkijken met het {{plan}}",
    privacy: {
      free: "Helemaal gratis",
      freeBody: "Geen abonnement, geen proefperiode, geen advertenties.",
      local: "Opgeslagen in je browser",
      localBody:
        "Er is geen account en geen database. Je training staat op dit apparaat.",
      drive: "Jouw Drive, als je wilt",
      driveBody:
        "Zet synchronisatie aan en het bestand gaat naar je eigen Google Drive. Wij houden nooit een kopie.",
      noTracking: "Geen trackers",
      noTrackingBody:
        "Geen analytics, geen advertenties, niets om toestemming voor te geven.",
      readMore: "Lees de volledige privacypagina",
    },
    tour: {
      plan: "Een plan rond jouw week",
      planBody:
        "Kies je trainingsdagen en doel. Maak het zelf, of laat een AI het schrijven en importeer het resultaat.",
      calendar: "Een kalender die op een telefoon past",
      calendarBody:
        "Maand, week, dag, of een scrollende agenda met alleen je trainingsdagen.",
      log: "Een training in seconden loggen",
      logBody:
        "Afstand, tijd en tempo rekenen elkaar uit - en je splits worden zo van een screenshot gelezen.",
      stats: "Cijfers die iets zeggen",
      statsBody:
        "Weekvolume, opbouw van de lange duurloop en tempotrends voor het blok waar je in zit.",
    },
    finish: {
      create: "Maak mijn plan",
      createBody:
        "Beantwoord een paar vragen en krijg een plan rond jouw week.",
      explore: "Eerst rondkijken",
      exploreBody:
        "Laad een voorbeeldplan en klik door een echt trainingsblok.",
    },
  },
  features: {
    title: "Functies",
    subtitle: "Optionele extra's die je kunt inschakelen.",
  },
  splitScanner: {
    title: "Tussentijden-scanner",
    enable: "Tussentijden scannen uit screenshot",
    enableBody:
      "Upload bij het vastleggen van een loop je Strava-screenshot met tussentijden; de tempo's per kilometer worden er automatisch uit gelezen. Het draait op je apparaat, dus de afbeelding wordt nooit geüpload en wordt na het scannen weggegooid.",
    scanButton: "Screenshot scannen",
    scanning: "Scannen…",
    scanned_one: "{{count}} tussentijd gescand",
    scanned_other: "{{count}} tussentijden gescand",
    scanFailed:
      "Kon geen tussentijden uit die afbeelding lezen. Zorg dat de tussentijden-tabel zichtbaar is in de screenshot.",
    splitsTitle: "Tussentijden",
    clear: "Tussentijden wissen",
    helpTitle: "Welke screenshot?",
    helpBody:
      "Open in Strava een loop en maak een screenshot van de “Tussentijden”-tabel: het deel met elke kilometer en het tempo.",
    exampleCaption: "Voorbeeld van wat je vastlegt",
    tip1: "Zorg dat de hele tabel zichtbaar is, inclusief de laatste gedeeltelijke kilometer.",
    tip2: "Extra inhoud eromheen (de tempografiek, beste prestaties) is geen probleem, want dat wordt genegeerd.",
    tip3: "Werkt in elke taal en in lichte of donkere modus.",
    // Column labels as Strava's Dutch app shows them, so the example matches.
    mockHeading: "Tussentijden",
    mockKm: "Km",
    mockPace: "Tempo",
    mockElev: "Hoogte",
  },
  wizard: {
    title: "Een plan maken",
    back: "Terug",
    next: "Volgende",
    stepRace: "Wedstrijd",
    stepOffDays: "Vrije dagen",
    stepTraining: "Training",
    stepAi: "Genereren met AI",
    // Stap 1
    planName: "Plannaam",
    planNamePlaceholder: "bijv. Marathon van Berlijn",
    raceName: "Wedstrijdnaam",
    raceNamePlaceholder: "bijv. Marathon",
    raceDistance: "Wedstrijdafstand ({{unit}})",
    distanceCustom: "Aangepast (km)",
    raceDate: "Wedstrijddatum",
    startDate: "Wanneer start je dit plan?",
    startDateHint: "Het plan wordt vanaf deze datum opgebouwd - niet vanaf vandaag.",
    goalQ: "Wat is je doel?",
    goalFinish: "Gewoon uitlopen",
    goalTime: "Streeftijd",
    goalPace: "Streeftempo",
    goalTimePlaceholder: "bijv. 3:45:00",
    goalPacePlaceholder: "bijv. 5:20 {{unit}}",
    // Stap 2
    offDaysIntro:
      "Voeg vakanties, reizen of drukke periodes toe die je training beperken. De AI plant eromheen.",
    calendarSoon: "Verbind Google Agenda (binnenkort)",
    // Stap 3
    sportQ: "Voor welke sport is dit plan?",
    raceTypeQ: "Wat voor wedstrijd is het?",
    raceType: {
      standard: "Gewone wedstrijd",
      standardDesc:
        "Eén vaste afstand die je in één keer aflegt, zoals een 10K of gran fondo.",
      backyard: "Backyard ultra",
      backyardDesc:
        "Een ronde die je elk heel uur herhaalt, tot er één atleet over is.",
      multisport: "Meerdere sporten",
      multisportDesc: "Meerdere sporten achter elkaar, zoals een triatlon of duatlon.",
    },
    raceFormat: "Wedstrijdvorm",
    preset: {
      sprint: "Sprint",
      olympic: "Olympisch",
      half: "70.3",
      full: "140.6",
      duathlon: "Duatlon",
    },
    legDistance: "Afstand {{sport}} ({{unit}})",
    legTransition: "Wissel {{n}} (minuten)",
    transitionShort: "T{{n}}",
    legsTotal: "{{distance}} totaal, plus {{transition}} min wisseltijd.",
    loopKm: "Rondeafstand ({{unit}})",
    targetYards: "Doel in yards",
    backyardDerived: "{{hours}} yards = {{hours}} uur · {{distance}} totaal",
    previousPlans: "Eerdere plannen als context",
    previousPlansHint:
      "Voeg eerdere training toe zodat de AI ziet hoe je echt vooruit bent gegaan. Scheelt het handmatig invoeren van recente lopen.",
    planFinished: "afgerond",
    planInProgress: "loopt nog",
    planRuns: "{{runs}} trainingen · {{distance}} vastgelegd",
    showAllPlans: "Toon alle {{count}} plannen",
    showLess: "Toon minder",
    latestRuns: "Je recente trainingen",
    latestRunsHint:
      "Optioneel - geeft de AI een idee van je huidige conditie. Voeg een paar recente trainingen toe.",
    addRun: "Training toevoegen",
    runSport: "Sport",
    runDistance: "Afstand ({{unit}})",
    runTimePlaceholder: "Totale tijd (bijv. 50:43)",
    daysPerWeek: "Trainingsdagen per week",
    trainingDaysQ: "Op welke dagen wil je trainen?",
    flexibleDays: "Ik ben flexibel - geen vaste dagen",
    planningModeQ: "Hoe moeten trainingen worden ingepland?",
    planningExact: "Exacte datums",
    planningExactDesc: "Elke training staat vast op een specifieke dag.",
    planningFlexible: "Flexibele periodes",
    planningFlexibleDesc:
      "Elke training krijgt een periode (bijv. ma–wo) en jij kiest de exacte dag.",
    targetQ: "Afstand die je comfortabel wilt kunnen lopen vóór de wedstrijd",
    targetUnknown: "Ik weet het niet - laat de AI beslissen",
    targetKm: "Doelafstand (km)",
    // Stap 4
    aiIntro:
      "Je planaanvraag is klaar. Geef het aan een AI-chatbot om het volledige schema te bouwen:",
    aiStep1: "1. Exporteer de planaanvraag (of kopieer het) hieronder.",
    aiStep2: "2. Kopieer de prompt en plak het in je AI-chatbot, met het geëxporteerde bestand erbij.",
    aiStep3: "3. De AI geeft een plan terug als JSON - mogelijk stelt het eerst een paar vragen.",
    aiStep4: "4. Plak of voeg die JSON hieronder toe en druk op Plan voltooien.",
    exportRequest: "Aanvraag exporteren (JSON)",
    copyRequest: "Aanvraag kopiëren",
    copyPrompt: "Prompt kopiëren",
    copied: "Gekopieerd",
    importLabel: "Plak de plan-JSON van de AI",
    attachFile: "Bestand toevoegen",
    completePlan: "Plan voltooien",
    created: "Plan aangemaakt",
    completeError:
      "Kon dit niet als plan lezen - het is mogelijk onvolledig gekopieerd. Kopieer het hele antwoord van de AI (inclusief de eerste { en laatste }), of voeg het .json-bestand toe.",
    aiPrompt: `Je bouwt een hardloop-trainingsplan voor mij. Ik voeg een plan-aanvraag-JSON toe met mijn wedstrijd en voorkeuren. Lees het en geef daarna een plan terug in EXACT onderstaand JSON-schema zodat ik het in mijn app kan importeren.

Wat de velden in de bijgevoegde plan-aanvraag betekenen:
- race.name: hoe het plan moet heten. race.raceName: de naam van de wedstrijd.
- race.distanceKm: de wedstrijdafstand in kilometers.
- race.type "multisport": een triatlon of duatlon. race.legs[] geeft de onderdelen IN WEDSTRIJDVOLGORDE, elk met { sport, distanceKm, transitionMin } — transitionMin is de tijd NA dat onderdeel (T1, T2), dus het laatste heeft er geen. Negeer race.sport hierbij; de legs noemen de sporten.
  - Bouw een week die ze allemaal traint, en plan elke week minstens één BRICK (een fietstraining met direct daarna een looptraining, als twee trainingen op dezelfde datum, fiets eerst). Zet "sport" op elke training.
  - Wedstrijddag is één training PER ONDERDEEL, allemaal op race.date, elk met "sport" en met "raceLegIndex" 0, 1, 2... in wedstrijdvolgorde. Geef GEEN enkele gecombineerde wedstrijdtraining: de app ziet de wedstrijd pas als afgerond wanneer elk onderdeel dat is.
  - Maak geen trainingen voor de wissels. Die horen bij de wedstrijdklok, niet bij de training, en een wisseltraining zou elk afstandstotaal vervuilen.
- race.sport: "run", "bike" of "swim". Schrijf trainingen voor DIE sport: een intervaltraining op de fiets is interval op de fiets, geen looptraining. Zet "sport" alleen op een training als die afwijkt van race.sport (bijv. een fietstraining in een loopplan); laat het anders weg, dan erft hij.
- BELANGRIJK: "plannedPace" is ALTIJD minuten en seconden per KILOMETER, voor elke sport, want zo slaat de app het op. Een rit van 30 km/u is dus "2:00" en 1:45/100m zwemmen is "17:30". Geef in dat veld geen km/u of per-100m. In de TITEL van de training mag dat uiteraard wel.
- athlete: waar ik ben en welke eenheden ik lees. ELK getal in dit verzoek is metrisch (km, min/km), ongeacht athlete.units - dat is het wire-formaat. Als athlete.units "imperial" is, schrijf dan de TITELS en NOTITIES van de trainingen in mijlen en min/mijl (1 mi = 1,609344 km), maar geef "plannedDistanceKm" en "plannedPace" nog steeds in kilometers en min/km in de JSON. Gebruik athlete.country voor seizoenen en typisch weer.
- race.date: wedstrijddag (YYYY-MM-DD).
- startDate: de datum waarop ik dit plan begin (YYYY-MM-DD). Bouw week 1 vanaf deze datum - ga NIET uit van de datum van vandaag.
- race.type: "standard" (één aaneengesloten wedstrijd over een vaste afstand) of "backyard" (zie hieronder).
- goal: mijn wedstrijddoel - { type: "finish" | "time" | "pace" | "yards", value }. "finish" = gewoon uitlopen; "time" = streeftijd (value); "pace" = streeftempo per km (value); "yards" = aantal backyard-yards (value). Gebruik dit om "goalPace"/"goalLabel" en de intensiteit te bepalen.

Als race.type "backyard" is, gaat het om een BACKYARD ULTRA en geldt de gebruikelijke logica voor een vaste afstand NIET:
- Het format: ik loop een vaste ronde (race.loopKm, meestal 6,706 km) elk heel uur, precies op het uur. Wat ik sneller loop, is mijn rust. Wie een ronde niet start of niet uitloopt, ligt eruit; de laatste loper wint. Eén "yard" is één ronde en één uur, dus race.targetYards is tegelijk mijn afstands- en tijdsdoel (bijv. 24 yards = 24 uur = ongeveer 161 km).
- Train tijd op de benen, geen snelheid. Er is geen eindtijd en geen enkele piek-duurloop om naartoe af te bouwen.
- Bouw op richting mijn doel met: lange duurlopen op opeenvolgende dagen; "mock backyards" (meerdere rondes die telkens op het uur starten, met steeds meer yards); een deel van de training 's nachts en op vermoeide benen; en bewust oefenen met eten, drinken en omkleden in de korte rust tussen de rondes.
- "goalPace" moet een rustig, herhaalbaar rondetempo zijn dat elk uur genoeg rust overhoudt (een ronde in ongeveer 40-50 minuten is gebruikelijk), NIET een wedstrijdtempo. "goalLabel" moet iets als "24 yards" zijn.
- Bouw af richting de wedstrijdweek, maar de piektrainingen zijn duur en herhaalde rondes in plaats van één lange afstand.
- offDays[]: periodes waarin ik niet volledig kan trainen - { start, end, title, note }. De "note" zegt hoe beperkt (bijv. geen training / zeer beperkt / verminderd).
- latestRuns[]: mijn recente trainingen - { sport, distanceKm, durationMin (TOTALE tijd, in minuten), pace (min/km voor elke sport, afgeleid uit afstand + totale tijd), date }. Gebruik deze om mijn conditie per sport te schatten; 40 km betekent iets heel anders op de fiets dan lopend. Als dit leeg is, vraag me dan naar mijn conditie.
- previousPlans[]: mijn eerdere trainingsblokken, als ALLEEN-LEZEN historie. Elk blok heeft { name, raceName, raceDistanceKm, raceDate, startDate, goalPace, goalLabel, weeks, summary, weeklyMileage[], completedRuns[] }.
  - summary: { completionPct (hoeveel van dat plan ik echt heb gedaan), completedRuns, totalKm, plannedTotalKm, longestRunKm, averagePace, peakWeekKm }.
  - weeklyMileage[]: { week, plannedKm, actualKm } - gepland versus werkelijk per week, zodat je ziet hoe trouw ik was en hoe de omvang opliep.
  - completedRuns[]: alleen de lopen die ik echt heb vastgelegd - { date, type, title, plannedDistanceKm, plannedPace, distanceKm, pace, durationMin, startTime, tempC, condition, splits, elevM, notes }. "splits" is het tempo per kilometer waarbij de EERSTE waarde km 1 is, de tweede km 2, enzovoort; "elevM" (indien aanwezig) is het bijbehorende hoogteverschil per kilometer.
  Gebruik dit om mijn echte trainingsbelasting te beoordelen, hoe consistent ik geplande tempo's haalde, hoe mijn lange duurlopen opbouwden, en een realistisch doel voor de nieuwe wedstrijd.
- training.daysPerWeek: hoeveel dagen per week ik wil hardlopen.
- training.trainingDays: de weekdagen waarop ik wil lopen (bijv. ["Monday","Wednesday"]). null betekent dat ik flexibel ben - kies dan zelf logische dagen.
- training.flexibleDays: true als ik geen vaste trainingsdagen heb.
- training.planningMode: "exact" = elke training vast op een specifieke dag; "flexible" = geef elke training een periode en ik kies zelf de exacte dag.
- training.targetDistanceKm: de langste ENKELE lange duurloop die ik comfortabel wil halen vóór de wedstrijd (NIET mijn wekelijkse omvang). null betekent dat jij beslist op basis van de wedstrijdafstand.

Uitvoer-schema (geef precies deze vorm terug, niets anders):
{
  "plans": {
    "<planId>": {
      "id": "<planId>",
      "name": "<plannaam>",
      "raceName": "<wedstrijdnaam>",
      "raceDistanceKm": <getal>,
      "raceDate": "YYYY-MM-DD",
      "goalPace": "mm:ss",            // per km
      "goalLabel": "<kort doel>",
      "version": 1,
      "createdAt": "<ISO datetime>",
      "offDays": [ { "id": "...", "start": "YYYY-MM-DD", "end": "YYYY-MM-DD", "title": "...", "note": "..." } ],
      "weeks": [ { "weekNumber": 1, "startDate": "YYYY-MM-DD(maandag)", "endDate": "YYYY-MM-DD(zondag)", "phase": "base|build|peak|taper|race|reduced", "label": "optioneel", "workoutIds": ["..."] } ],
      "workouts": {
        "<workoutId>": {
          "id": "<workoutId>", "date": "YYYY-MM-DD", "type": "easy|tempo|interval|long|recovery",
          "title": "...", "weekNumber": 1, "plannedDistanceKm": <getal>, "plannedPace": "mm:ss",
          "completed": false
          // Voor flexibele planning voeg ook toe: "flexible": true, "windowStart": "YYYY-MM-DD", "windowEnd": "YYYY-MM-DD"
          // Nieuwe plannen zetten "completed": false. Zodra ik een training vastleg vult de app de werkelijke waarden in:
          // "actualDistanceKm", "actualPace" ("mm:ss"), "durationMin" (getal), optioneel
          // "startTime" ("HH:mm"), optioneel "weather" {tempC, condition, ...} en optioneel
          // "splits" [{km, pace, elevM}] - laat deze weg bij nieuwe plannen.
        }
      }
    }
  },
  "activePlanId": "<planId>"
}

Regels:
- Weken lopen maandag→zondag. Week 1 begint op "startDate"; de lange duurloop van de laatste week is de wedstrijd op raceDate.
- Plan trainingen op mijn voorkeursdagen; als ik flexibel ben, kies dan logische dagen.
- Als planningMode "flexible" is: zet "flexible": true met "windowStart"/"windowEnd" op elke training, en houd de "date" binnen die periode.
- Respecteer "offDays": vermijd zware/lange trainingen in die periodes (none/limited/reduced volgens de notitie).
- Bouw lange duurlopen geleidelijk op naar mijn doelafstand, en bouw daarna af richting de wedstrijdweek.
- Gebruik mijn laatste lopen om conditie en tempo's te schatten. Zet elke training op "completed": false.
- Als mijn doeltijd/-tempo niet is gegeven, leid dan een logische "goalPace"/"goalLabel" af uit mijn laatste lopen en de wedstrijdafstand (of vraag het me eerst).
- Het id van elke training moet in de "workoutIds" van zijn week staan, en de "date" moet binnen die week vallen.
- "previousPlans" is historie om van te leren, GEEN sjabloon. Geef in "plans" alleen het nieuwe plan terug - kopieer nooit een eerder plan, zijn weken of trainingen naar je uitvoer. Elk id dat je teruggeeft moet volledig nieuw en uniek zijn.
- Geef het resultaat als een downloadbaar .json-BESTAND zodat ik het direct kan toevoegen. Als je geen bestand kunt maken, zet dan de VOLLEDIGE JSON in één \`\`\`json-codeblok, inclusief de allereerste { en de allerlaatste } - splits het nooit en laat geen tekens weg.
- Stel eerst eventuele verduidelijkende vragen en geef daarna ALLEEN de JSON terug.`,
  },
};
