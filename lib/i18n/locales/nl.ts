import type { Dict } from "./en";

export const nl: Dict = {
  common: {
    dismiss: "Sluiten",
    edit: "Bewerken",
    remove: "Verwijderen",
    toggleTheme: "Thema wisselen",
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
    close: "Sluiten",
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
    exportIcs: "Aan agenda toevoegen",
    exported: "Agendabestand gedownload",
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
    groupPlan: "Je plan",
    groupData: "Plan bewerken of exporteren",
    groupProfile: "Over jou",
    groupFeatures: "Functies",
    groupApp: "Weergave",
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
    pasteJson: "Plak plan-JSON hier, of",
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
- De JSON kan een "activities"-lijst bevatten: trainingen die ik ECHT heb gedaan, geimporteerd uit mijn Strava-gegevensexport, inclusief training buiten dit plan - { id, date, sport, distanceKm, movingSec, pace, elevGainM? }, nieuwste eerst. Lees die naast de voltooide trainingen om mijn huidige vorm te beoordelen; vaak is het beter bewijs, want het dekt training die dit plan nooit heeft gezien en het bestaat ook als ik hier nog niets heb vastgelegd. Geef de lijst ONGEWIJZIGD terug: het is een verslag van het verleden, geen onderdeel van het plan, en niets erin mag je aanpassen of verwijderen.
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
      "Deze app is gratis en draait volledig in je browser. Vind je hem nuttig voor je training? Dan zou ik het heel nice vinden als je iets doneert.",
    buyMeAWater: "Trakteer me op een water",
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
    splitsTitle: "Een loop invullen uit een screenshot?",
    splitsBody:
      "Upload bij het vastleggen van een loop een Strava-screenshot; die vult zichzelf in: afstand, tempo, starttijd en het tempo van elke kilometer. Het draait op je apparaat, dus de afbeelding wordt nooit geüpload.",
    enableSplits: "Scannen inschakelen",
  },
  moved: {
    title: "RacePilot is verhuisd 🏃",
    body: "Deze versie wordt niet meer bijgewerkt. De app staat nu op {{url}}. Dezelfde app, dezelfde functies, en alles wat nieuw is verschijnt daar het eerst.",
    dataTitle: "Neem je training mee",
    dataBody:
      "Je plannen staan in deze browser en horen bij dit adres, dus ze gaan niet vanzelf mee. Exporteer ze hier en gebruik daarna Instellingen → Gegevens → Bestand importeren op de nieuwe site.",
    export: "Exporteer mijn plannen",
    stay: "Niet nu",
    go: "Ga naar de nieuwe site",
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
    watchTitle: "Train je met een horloge?",
    watchSubtitle: "Zodat een geplande sessie op je pols terechtkomt.",
    featuresTitle: "Optionele extra's",
    featuresSubtitle: "Standaard allemaal uit. Zet aan wat je wilt.",
    finishTitle: "Klaar wanneer jij dat bent",
    finishSubtitle:
      "Maak je eigen plan, of kijk eerst rond met een voorbeeld.",
    profileHint:
      "Optioneel - sla het over en alles blijft zichtbaar. Je kunt dit aanpassen in instellingen.",
    watchHint:
      "Optioneel, en aan te passen in Instellingen. Het bepaalt alleen welke uitleg je krijgt.",
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
  debug: {
    title: "Debug-info",
    desc:
      "Wat de app over dit apparaat heeft afgeleid, om te controleren of bijvoorbeeld landherkenning doet wat je verwacht. Hier wordt niets van verstuurd.",
    replayPrompts: "Stel de eenmalige vragen opnieuw",
    copy: "Debug-info kopiëren",
    version: "Versie {{version}}",
    tapsToGo_one: "(nog {{count}})",
    tapsToGo_other: "(nog {{count}})",
  },
  steps: {
    title: "Structuur",
    optional: "optioneel",
    count_one: "{{count}} blok",
    count_other: "{{count}} blokken",
    hint:
      "Deel de sessie op in stappen, dan kan je horloge je erdoorheen leiden. De moeite waard bij intervallen en tempowerk; een rustige duurloop heeft dit niet nodig.",
    step: "Stap",
    times: "Herhalingen",
    min: "min of m:ss",
    minutesShort: "{{count}} min",
    pacePlaceholder: "Doel {{unit}} (optioneel)",
    addStep: "Stap toevoegen",
    addRepeat: "Herhaling toevoegen",
    addToRepeat: "Stap aan deze herhaling toevoegen",
    moveUp: "Omhoog",
    moveDown: "Omlaag",
    remove: "Verwijderen",
    total: "Stappen komen samen op {{total}} {{unit}}.",
    mismatch: "De training zegt {{planned}}.",
    useTotal: "Gebruik het staptotaal",
    role: {
      warmup: "Warming-up",
      work: "Werk",
      recovery: "Herstel",
      cooldown: "Cooling-down",
    },
  },
  export: {
    sendToWatch: "Naar horloge sturen",
    title: "Naar je horloge sturen",
    desc_one: "Eén training, klaar om mee te nemen.",
    desc_other: "{{count}} trainingen, klaar om mee te nemen.",
    target: "Doel {{pace}}",
    done: "Geëxporteerd",
    failed: "Die export is niet gelukt. Probeer het opnieuw.",
    "fit-file": "Trainingsbestand (.fit)",
    "fit-fileBody":
      "Een echte gestructureerde training: je horloge telt de stappen af en houdt je aan elk doel.",
    "ics-file": "Agenda (.ics)",
    "ics-fileBody":
      "Zet je training in elke agenda, en zo ook op je pols. Een herinnering aan wat je gaat doen, geen training waar je horloge je doorheen leidt.",
    followUp: {
      garmin:
        "Sluit je horloge aan op een computer, kopieer het bestand naar GARMIN/NEWFILES en koppel het los. Garmin Connect kan trainingen niet importeren, dus de kabel is de enige weg.",
      coros: "Importeer het bestand in COROS Training Hub en synchroniseer je horloge.",
      wahoo: "Importeer het bestand in de Wahoo-app en synchroniseer je apparaat.",
      apple:
        "Open het bestand in een app die trainingen naar Apple Watch importeert, zoals WatchFit.",
      generic: "Kopieer het bestand naar je horloge zoals je apparaat dat verwacht.",
      calendar:
        "Open het bestand om het aan je agenda toe te voegen. De meeste horloges tonen het dan op je pols.",
    },
  },
  upgradePlan: {
    promptTitle: "Je horloge kan meer met dit plan",
    promptBody:
      "Een paar sessies hebben nog geen stappen, dus die komen als één blok op een gemiddeld tempo op je horloge. Dit lost dat in drie stappen op.",
    title: "Structuur aan dit plan toevoegen",
    body_one:
      "{{count}} komende sessie heeft geen stappen, dus die exporteert als één blok op een gemiddeld tempo. Een AI kan de titels lezen en dat invullen.",
    body_other:
      "{{count}} komende sessies hebben geen stappen, dus die exporteren als één blok op een gemiddeld tempo. Een AI kan de titels lezen en dat invullen.",
    export: "Plan exporteren",
    import: "Resultaat importeren",
    stepExport: "Exporteer je plan",
    stepPrompt: "Plak het bij een AI met dit erbij",
    stepImport: "Haal het resultaat terug",
    orPaste: "Of plak de JSON die de AI je gaf:",
    importPasted: "Geplakte JSON importeren",
    andMore_one: "en nog {{count}}",
    andMore_other: "en nog {{count}}",
    only: "Voeg \"steps\" toe aan precies deze trainingen en verander verder niets in het bestand:",
    copy: "Prompt kopiëren",
    prompt: `Hier is mijn trainingsplan als JSON.

Voeg een "steps"-array toe aan elke training waarvan de titel een gestructureerde sessie beschrijft: intervallen, tempoblokken, alles met een warming-up of cooling-down. Laat gewone duurlopen, lange duurlopen en herstelloopjes met rust; één afstand op één tempo heeft geen stappen nodig en ze daar toevoegen is alleen ruis.

Elk item in "steps" heeft een van twee vormen:

  { "kind": "step", "role": "warmup|work|recovery|cooldown",
    "distanceKm": <getal> OF "durationSec": <getal>,     // precies één, nooit allebei
    "pace": "mm:ss",            // optioneel, per kilometer, net als plannedPace
    "paceRangeSec": <getal> }   // optioneel, +/- seconden per kilometer

  { "kind": "repeat", "times": <getal>, "steps": [ ...steps... ] }

Herhalingen nesten niet: een herhaling bevat alleen gewone stappen.

Een training met de titel "6x800m @ 4:10" wordt bijvoorbeeld:

  "steps": [
    { "kind": "step", "role": "warmup", "distanceKm": 2, "pace": "6:00" },
    { "kind": "repeat", "times": 6, "steps": [
      { "role": "work", "distanceKm": 0.8, "pace": "4:10" },
      { "role": "recovery", "distanceKm": 0.4, "pace": "7:00" }
    ] },
    { "kind": "step", "role": "cooldown", "distanceKm": 2 }
  ]

Regels:
- Verander "plannedDistanceKm" NIET. Dat blijft het totaal van de sessie. Laat de stappen met een afstand daar ongeveer op uitkomen en pas zo nodig de warming-up en cooling-down aan.
- Verander verder NIETS, voeg geen trainingen toe of verwijder ze, en hernummer niets. Het enige wat je toevoegt is "steps".
- Elk tempo blijft "mm:ss" per kilometer, welke eenheden de titel ook gebruikt.
- "plannedDistanceKm" en "plannedPace" zijn leidend; de titel kan verouderd zijn. Vraagt de titel meer dan het totaal toelaat, bijvoorbeeld "6x800m" in een sessie van 5 km, schaal de sessie dan zodat het past: minder herhalingen, of een korter blok, op het tempo dat bij de training staat. Ga nooit over het totaal heen om een titel te volgen.
- Als een titel echt te weinig zegt om stappen van te maken, laat die training dan met rust in plaats van een sessie te verzinnen die ik niet gepland heb.
- Geef het resultaat als een downloadbaar .json-BESTAND zodat ik het direct kan bijvoegen. Kun je geen bestand maken, zet dan de HELE JSON in één json-codeblok, inclusief de allereerste { en de allerlaatste } - splits het nooit en laat geen tekens weg.`,
  },
  watch: {
    title: "Je horloge",
    body: "Zodat de export je vertelt wat je met het bestand moet doen, in de woorden van je eigen apparaat.",
    promptTitle: "Met welk horloge train je?",
    promptBody:
      "RacePilot kan van een geplande sessie een training maken waar je horloge je doorheen leidt. Vertel wat je draagt en je krijgt de juiste stappen.",
    notSet: "Nog geen horloge gekozen.",
    garmin: "Garmin",
    garminDesc: "Forerunner, Fenix, Venu en de rest",
    coros: "COROS",
    corosDesc: "Pace, Apex, Vertix",
    wahoo: "Wahoo",
    wahooDesc: "ELEMNT, Rival",
    apple: "Apple Watch",
    appleDesc: "Heeft een hulp-app nodig om te importeren",
    polar: "Polar",
    polarDesc: "Alleen agenda, geen import van trainingen",
    suunto: "Suunto",
    suuntoDesc: "Alleen agenda, geen import van trainingen",
    other: "Iets anders",
    otherDesc: "Je krijgt de agenda",
    none: "Geen horloge",
    noneDesc: "Bied dit helemaal niet aan",
  },
  splitScanner: {
    title: "Screenshot-scanner",
    enable: "Loop invullen uit een screenshot",
    enableBody:
      "Upload bij het vastleggen van een loop een Strava-screenshot; die wordt voor je gelezen: afstand, tempo, tijd en de tussentijden per kilometer. Het draait op je apparaat, dus de afbeelding wordt nooit geüpload en wordt na het scannen weggegooid.",
    scanButton: "Screenshot(s) scannen",
    scanning: "Scannen…",
    scanningOf: "{{at}} van {{of}} scannen…",
    scanned_one: "{{count}} tussentijd gescand",
    scanned_other: "{{count}} tussentijden gescand",
    scannedSummary: "Gegevens van de loop ingevuld",
    scannedBoth_one: "Gegevens en {{count}} tussentijd ingevuld",
    scannedBoth_other: "Gegevens en {{count}} tussentijden ingevuld",
    scanFailed:
      "Kon die afbeelding niet lezen. Zorg dat de tussentijden-tabel of de afstand en het tempo van de loop volledig zichtbaar zijn.",
    fieldLabel: "Uit een screenshot",
    hint:
      "Één screenshot laat of de totalen van de loop zien of de tussentijden, nooit allebei. Kies ze allebei tegelijk, of scan ze na elkaar.",
    statusDetails: "Gegevens",
    statusDetailsDone: "afstand, tempo en tijd",
    statusSplits: "Tussentijden",
    statusSplitsDone_one: "{{count}} kilometer",
    statusSplitsDone_other: "{{count}} kilometer",
    statusPending: "nog niet gescand",
    splitsTitle: "Tussentijden",
    clear: "Tussentijden wissen",
    helpTitle: "Welke screenshot?",
    helpBody:
      "Allebei werkt. Maak een screenshot van het overzicht van een loop, het deel met afstand, gemiddeld tempo en tijd, dan worden die velden ingevuld. Maak een screenshot van de “Tussentijden”-tabel, dan wordt het tempo van elke kilometer gelezen.",
    exampleCaption: "Voorbeeld van wat je vastlegt",
    tip1: "Zorg voor tussentijden dat de hele tabel zichtbaar is, inclusief de laatste gedeeltelijke kilometer.",
    tip2: "Houd bij het overzicht de eenheden in beeld. De getallen worden gevonden aan hun “km”, “mi” of “/km”, dus een screenshot dat daar doorheen is bijgesneden levert niets op.",
    tip3: "Extra inhoud eromheen (de kaart, de tempografiek, beste prestaties) is geen probleem, want dat wordt genegeerd.",
    tip4: "Werkt in elke taal, in mijlen of kilometers, en in lichte of donkere modus.",
    tip5: "Kies beide screenshots tegelijk, of scan ze na elkaar. Elk vult in wat het kan en laat de rest staan.",
    // Column labels as Strava's Dutch app shows them, so the example matches.
    mockHeading: "Tussentijden",
    mockKm: "Km",
    mockPace: "Tempo",
    mockElev: "Hoogte",
  },
  activityImport: {
    hint: "Kies de zip die Strava je mailt, of de activities.csv die erin zit. Alleen dat ene bestand wordt gelezen, op je eigen apparaat, en er wordt niets geupload.",
    howToTitle: "Zo krijg je je export",
    howToStep1: "Open je accountinstellingen:",
    howToStep2:
      'Zoek "Je account downloaden", kies Aan de slag en vraag je archief aan.',
    howToStep3:
      "Strava mailt je een zip, meestal binnen een paar minuten. Kom terug en voeg hem hier toe.",
    howToWeb:
      "Dit kan alleen op de Strava-website. De Strava-app kan je gegevens niet exporteren.",
    zipNoCsv:
      "Deze zip bevat geen activities.csv. Controleer of dit de export is die Strava je heeft gemaild, en niet een map met activiteiten.",
    zipUnreadable:
      "Deze zip kon niet worden geopend. Pak hem zelf uit en kies activities.csv die erin zit.",
    added_one: "{{count}} activiteit geimporteerd.",
    added_other: "{{count}} activiteiten geimporteerd.",
    skipped_one: "{{count}} was geen hardloop-, fiets- of zwemtraining.",
    skipped_other: "{{count}} waren geen hardloop-, fiets- of zwemtrainingen.",
    nothingFound:
      "Geen activiteiten gevonden. Kies activities.csv uit de export, niet een bestand uit de map activities.",
    failed: "Dit bestand kon niet worden gelezen. Kies de Strava-export zip, of de activities.csv die erin zit.",
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
    historyInUse_one: "De AI gebruikt je geimporteerde trainingsgeschiedenis: {{count}} activiteit, {{from}} tot {{to}}.",
    historyInUse_other: "De AI gebruikt je geimporteerde trainingsgeschiedenis: {{count}} activiteiten, {{from}} tot {{to}}.",
    importActivities: "Toevoegen uit Strava-export",
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
    aiStep1: "1. Kopieer de prompt en plak hem in je AI-chatbot.",
    aiStep2: "2. Exporteer de planaanvraag en voeg dat bestand toe aan hetzelfde gesprek.",
    aiStep3: "3. De AI geeft een plan terug als JSON - mogelijk stelt het eerst een paar vragen.",
    aiStep4: "4. Plak of importeer die JSON hieronder en druk op Plan voltooien.",
    exportRequest: "Aanvraag exporteren (JSON)",
    copyRequest: "Aanvraag kopiëren",
    copyPrompt: "Prompt kopiëren",
    copied: "Gekopieerd",
    importLabel: "Plak het plan van de AI hieronder, of",
    importFile: "Bestand importeren",
    completePlan: "Plan voltooien",
    created: "Plan aangemaakt",
    completeError:
      "Kon dit niet als plan lezen - het is mogelijk onvolledig gekopieerd. Kopieer het hele antwoord van de AI (inclusief de eerste { en laatste }), of voeg het .json-bestand toe.",
    aiPrompt: `Je bouwt een hardloop-trainingsplan voor mij. Ik voeg een plan-aanvraag-JSON toe met mijn wedstrijd en voorkeuren. Lees het en geef daarna een plan terug in EXACT onderstaand JSON-schema zodat ik het in mijn app kan importeren.

Wat de velden in de bijgevoegde plan-aanvraag betekenen:
- race.name: hoe het plan moet heten. race.raceName: de naam van de wedstrijd.
- race.distanceKm: de wedstrijdafstand in kilometers.
- race.type "multisport": een triatlon of duatlon. race.legs[] geeft de onderdelen IN WEDSTRIJDVOLGORDE, elk met { sport, distanceKm, transitionMin }. transitionMin is de tijd NA dat onderdeel (T1, T2), dus het laatste heeft er geen. Negeer race.sport hierbij; de legs noemen de sporten.
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
- latestRuns[]: mijn recente trainingen - { sport, distanceKm, durationMin (TOTALE tijd, in minuten), pace (min/km voor elke sport, afgeleid uit afstand + totale tijd), date }. Gebruik deze om mijn conditie per sport te schatten; 40 km betekent iets heel anders op de fiets dan lopend. Als dit EN trainingHistory allebei leeg zijn, vraag me dan naar mijn conditie.
- trainingHistory (alleen als ik mijn activiteitenlog heb geimporteerd): het beeld van wat ik ECHT heb getraind - { from, to, sessions, weeks, sessionsPerWeek, avgWeeklyKm, peakWeeklyKm, longestKm, recentWeeklyKm (de laatste 8 weken, oudste eerst, waarbij een 0 een week is waarin ik niet trainde), recentSessions (mijn laatste 10 volledig), bySport (sessions, totalKm, longestKm, typicalPace per sport) }. Dit is sterker bewijs dan latestRuns, want het is mijn hele recente blok in plaats van een paar trainingen die ik heb ingetypt. Gebruik het om het STARTvolume per week te bepalen en om te beoordelen hoe snel ik veilig kan opbouwen: begin het plan niet ver boven avgWeeklyKm en ga er vroeg niet overheen peakWeeklyKm. Nullen in recentWeeklyKm zijn echte gaten, dus behandel een recente reeks daarvan als rustperiode om vanaf op te bouwen, niet als taper.
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
          // OPTIONEEL "steps": de sessie opgedeeld, zodat mijn horloge me erdoorheen
          // kan leiden. Voeg het toe zodra een sessie STRUCTUUR heeft - intervallen,
          // tempoblokken, alles met een warming-up - en laat het weg bij een gewone
          // duurloop, waar het alleen ruis zou zijn. Twee vormen:
          //   { "kind": "step", "role": "warmup|work|recovery|cooldown",
          //     "distanceKm": <getal> OF "durationSec": <getal>,     // precies één
          //     "pace": "mm:ss",            // optioneel, per km, net als plannedPace
          //     "paceRangeSec": <getal> }   // optioneel, +/- seconden per km
          //   { "kind": "repeat", "times": <getal>, "steps": [ ...steps... ] }
          // bijv. 6x800m: [ {"kind":"step","role":"warmup","distanceKm":2,"pace":"6:00"},
          //   {"kind":"repeat","times":6,"steps":[
          //     {"role":"work","distanceKm":0.8,"pace":"4:10"},
          //     {"role":"recovery","distanceKm":0.4,"pace":"7:00"}]},
          //   {"kind":"step","role":"cooldown","distanceKm":2,"pace":"6:00"} ]
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
- "plannedDistanceKm" blijft het totaal van de sessie. Als je "steps" toevoegt, laat de stappen met een afstand samen ongeveer op dat totaal uitkomen, en pas nooit "plannedDistanceKm" aan om bij de stappen te passen.
- "previousPlans" is historie om van te leren, GEEN sjabloon. Geef in "plans" alleen het nieuwe plan terug - kopieer nooit een eerder plan, zijn weken of trainingen naar je uitvoer. Elk id dat je teruggeeft moet volledig nieuw en uniek zijn.
- Geef het resultaat als een downloadbaar .json-BESTAND zodat ik het direct kan toevoegen. Als je geen bestand kunt maken, zet dan de VOLLEDIGE JSON in één \`\`\`json-codeblok, inclusief de allereerste { en de allerlaatste } - splits het nooit en laat geen tekens weg.
- Stel eerst eventuele verduidelijkende vragen en geef daarna ALLEEN de JSON terug.`,
  },
};
