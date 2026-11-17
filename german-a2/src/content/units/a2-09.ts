import type { Unit } from '../types';

const unit: Unit = {
  id: 'a2-09',
  level: 'A2',
  order: 21,
  title: 'Work & applications',
  titleDe: 'Arbeit und Bewerbung',
  goal: 'Make polite requests at work, give advice, and talk about job applications using zu- and um … zu-infinitives.',
  grammar: [
    {
      heading: 'Konjunktiv II for politeness',
      body:
        'Konjunktiv II softens requests and wishes — the German equivalent of "would / could". A bare imperative or "Ich will…" sounds blunt to Germans.\n\n' +
        'Most verbs: **würde + infinitive** (end of clause). Six verbs use their own form instead: hätte, wäre, könnte, müsste, sollte, (möchte). Endings are like the Präteritum: ich = er, du -st, wir/sie -n, ihr -t.',
      table: {
        head: ['Person', 'werden → würde', 'haben → hätte', 'sein → wäre', 'können → könnte'],
        rows: [
          ['ich', 'würde', 'hätte', 'wäre', 'könnte'],
          ['du', 'würdest', 'hättest', 'wärst', 'könntest'],
          ['er / sie / es', 'würde', 'hätte', 'wäre', 'könnte'],
          ['wir', 'würden', 'hätten', 'wären', 'könnten'],
          ['ihr', 'würdet', 'hättet', 'wärt', 'könntet'],
          ['sie / Sie', 'würden', 'hätten', 'wären', 'könnten'],
        ],
      },
      examples: [
        { de: 'Könnten Sie mir bitte helfen?', en: 'Could you please help me?' },
        { de: 'Ich hätte gern einen Termin am Montag.', en: "I'd like an appointment on Monday." },
        { de: 'Das wäre super!', en: 'That would be great!' },
      ],
    },
    {
      heading: 'What to use when',
      body: 'Advice: **sollte** = should, **müsste** = ought to / would have to (slightly stronger). Trap: "I would like" → **Ich möchte / Ich würde gern**, never "Ich will" in polite situations.',
      table: {
        head: ['Function', 'Form', 'Example'],
        rows: [
          ['Polite request', 'Könnten / Würden Sie …?', 'Würden Sie das Fenster zumachen?'],
          ['Wish / ordering', 'Ich hätte gern … / Ich würde gern …', 'Ich würde gern mehr verdienen.'],
          ['Advice', 'Du solltest / Sie sollten …', 'Du solltest dich bewerben.'],
          ['Stronger advice', 'Sie müssten …', 'Sie müssten das Formular noch unterschreiben.'],
          ['Polite suggestion', 'Wir könnten …', 'Wir könnten morgen telefonieren.'],
          ['Imagining', 'Es wäre schön, wenn …', 'Das wäre ideal.'],
        ],
      },
    },
    {
      heading: 'zu + infinitive',
      body:
        'After many verbs, adjectives and nouns, a second verb comes as **zu + infinitive at the end**, usually after a comma. Think English "to": I forgot **to call**.\n\n' +
        '**Separable verbs:** zu goes between prefix and stem as one word: anrufen → **anzurufen**, aufräumen → **aufzuräumen**.\n\n' +
        '**No zu** after modals (können, müssen, wollen…), werden, and lassen: Ich muss arbeiten.',
      table: {
        head: ['Trigger', 'Example'],
        rows: [
          ['anfangen / beginnen', 'Ich habe angefangen, Deutsch zu lernen.'],
          ['aufhören', 'Er hat aufgehört zu rauchen.'],
          ['vergessen', 'Vergiss nicht, mich anzurufen!'],
          ['versuchen', 'Ich versuche, pünktlich zu sein.'],
          ['Zeit / Lust haben', 'Ich habe keine Zeit, die E-Mail zu schreiben.'],
          ['Es ist wichtig / leicht / schwer', 'Es ist wichtig, Erfahrung zu sammeln.'],
          ['Es macht Spaß', 'Es macht Spaß, im Team zu arbeiten.'],
        ],
      },
      examples: [
        { de: 'Hast du Lust, heute Abend auszugehen?', en: 'Do you feel like going out tonight?' },
        { de: 'Es ist nicht leicht, eine Wohnung zu finden.', en: "It isn't easy to find a flat." },
      ],
    },
    {
      heading: 'um … zu = in order to',
      body:
        'Purpose: **um** right after the comma, **zu + infinitive** at the end. Use it when both parts have the same subject; the um-clause has no subject of its own.\n\n' +
        'Trap: English "I\'m learning German to work in Berlin" — the bare "to" here means purpose, so German needs **um … zu**, not just zu.',
      table: {
        head: ['Main clause', 'um', '… middle …', 'zu + infinitive'],
        rows: [
          ['Ich lerne Deutsch,', 'um', 'in Berlin', 'zu arbeiten.'],
          ['Sie macht ein Praktikum,', 'um', 'Erfahrung', 'zu sammeln.'],
          ['Ich rufe an,', 'um', 'einen Termin', 'zu vereinbaren.'],
          ['Er steht früh auf,', 'um', 'den Bus nicht', 'zu verpassen.'],
        ],
      },
      examples: [
        { de: 'Ich spare Geld, um ein Auto zu kaufen.', en: "I'm saving money to buy a car." },
        { de: 'Um die Stelle zu bekommen, braucht man gute Deutschkenntnisse.', en: 'To get the job you need good German.' },
      ],
    },
  ],
  vocab: [
    { id: 'a2-09-bewerbung', de: 'Bewerbung', en: 'application (for a job)', pos: 'noun', gender: 'die', plural: 'Bewerbungen', example: { de: 'Ich habe schon zehn Bewerbungen geschrieben.', en: 'I have already written ten applications.' } },
    { id: 'a2-09-sich-bewerben', de: 'sich bewerben', en: 'to apply (um + Akk = for a job; bei + Dat = at a company)', pos: 'verb', forms: 'bewirbt sich · bewarb sich · hat sich beworben', example: { de: 'Sie bewirbt sich bei einer Firma in Stuttgart.', en: 'She is applying to a company in Stuttgart.' } },
    { id: 'a2-09-lebenslauf', de: 'Lebenslauf', en: 'CV / résumé', pos: 'noun', gender: 'der', plural: 'Lebensläufe', example: { de: 'Bitte schicken Sie uns Ihren Lebenslauf.', en: 'Please send us your CV.' } },
    { id: 'a2-09-vorstellungsgespraech', de: 'Vorstellungsgespräch', en: 'job interview', pos: 'noun', gender: 'das', plural: 'Vorstellungsgespräche', example: { de: 'Morgen habe ich ein Vorstellungsgespräch.', en: 'Tomorrow I have a job interview.' } },
    { id: 'a2-09-stelle', de: 'Stelle', en: 'job / position', pos: 'noun', gender: 'die', plural: 'Stellen', example: { de: 'Die Stelle ist ab Oktober frei.', en: 'The position is available from October.' } },
    { id: 'a2-09-anzeige', de: 'Anzeige', en: 'advertisement / ad', pos: 'noun', gender: 'die', plural: 'Anzeigen', example: { de: 'Ich habe die Anzeige im Internet gesehen.', en: 'I saw the ad online.' } },
    { id: 'a2-09-gehalt', de: 'Gehalt', en: 'salary', pos: 'noun', gender: 'das', plural: 'Gehälter', example: { de: 'Das Gehalt ist nicht schlecht.', en: "The salary isn't bad." } },
    { id: 'a2-09-kollege', de: 'Kollege', en: 'colleague (m.) — n-noun: den/dem Kollegen', pos: 'noun', gender: 'der', plural: 'Kollegen', example: { de: 'Mein Kollege kommt aus Spanien.', en: 'My colleague is from Spain.' } },
    { id: 'a2-09-kollegin', de: 'Kollegin', en: 'colleague (f.)', pos: 'noun', gender: 'die', plural: 'Kolleginnen', example: { de: 'Meine Kollegin hilft mir oft.', en: 'My colleague often helps me.' } },
    { id: 'a2-09-chef', de: 'Chef', en: 'boss (m.); f. die Chefin, -nen', pos: 'noun', gender: 'der', plural: 'Chefs', example: { de: 'Der Chef ist heute nicht im Büro.', en: "The boss isn't in the office today." } },
    { id: 'a2-09-abteilung', de: 'Abteilung', en: 'department', pos: 'noun', gender: 'die', plural: 'Abteilungen', example: { de: 'Ich arbeite in der Abteilung Marketing.', en: 'I work in the marketing department.' } },
    { id: 'a2-09-firma', de: 'Firma', en: 'company / firm', pos: 'noun', gender: 'die', plural: 'Firmen', example: { de: 'Die Firma hat 200 Mitarbeiter.', en: 'The company has 200 employees.' } },
    { id: 'a2-09-arbeitgeber', de: 'Arbeitgeber', en: 'employer', pos: 'noun', gender: 'der', plural: 'Arbeitgeber', example: { de: 'Mein Arbeitgeber bezahlt den Deutschkurs.', en: 'My employer pays for the German course.' } },
    { id: 'a2-09-termin', de: 'Termin', en: 'appointment', pos: 'noun', gender: 'der', plural: 'Termine', example: { de: 'Ich hätte gern einen Termin am Freitag.', en: "I'd like an appointment on Friday." } },
    { id: 'a2-09-besprechung', de: 'Besprechung', en: 'meeting (at work)', pos: 'noun', gender: 'die', plural: 'Besprechungen', example: { de: 'Die Besprechung dauert bis elf.', en: 'The meeting lasts until eleven.' } },
    { id: 'a2-09-erfahrung', de: 'Erfahrung', en: 'experience', pos: 'noun', gender: 'die', plural: 'Erfahrungen', example: { de: 'Haben Sie Erfahrung im Verkauf?', en: 'Do you have experience in sales?' } },
    { id: 'a2-09-praktikum', de: 'Praktikum', en: 'internship', pos: 'noun', gender: 'das', plural: 'Praktika', example: { de: 'Ich mache ein Praktikum bei einer Bank.', en: "I'm doing an internship at a bank." } },
    { id: 'a2-09-ausbildung', de: 'Ausbildung', en: 'vocational training / apprenticeship', pos: 'noun', gender: 'die', plural: 'Ausbildungen', example: { de: 'Er macht eine Ausbildung zum Koch.', en: "He's training to be a chef." } },
    { id: 'a2-09-kenntnisse', de: 'Kenntnis', en: 'knowledge (usu. plural: Deutschkenntnisse, Computerkenntnisse)', pos: 'noun', gender: 'die', plural: 'Kenntnisse', example: { de: 'Gute Englischkenntnisse sind wichtig.', en: 'Good English skills are important.' } },
    { id: 'a2-09-ueberstunde', de: 'Überstunde', en: 'hour of overtime', pos: 'noun', gender: 'die', plural: 'Überstunden', example: { de: 'Diese Woche habe ich viele Überstunden gemacht.', en: 'This week I did a lot of overtime.' } },
    { id: 'a2-09-vertrag', de: 'Vertrag', en: 'contract', pos: 'noun', gender: 'der', plural: 'Verträge', example: { de: 'Der Vertrag ist auf ein Jahr befristet.', en: 'The contract is limited to one year.' } },
    { id: 'a2-09-teilzeit', de: 'Teilzeit', en: 'part-time (in Teilzeit arbeiten); opposite: Vollzeit', pos: 'noun', gender: 'die', plural: '-', example: { de: 'Sie arbeitet in Teilzeit.', en: 'She works part-time.' } },
    { id: 'a2-09-verdienen', de: 'verdienen', en: 'to earn', pos: 'verb', example: { de: 'Wie viel verdient man als Krankenpfleger?', en: 'How much does a nurse earn?' } },
    { id: 'a2-09-kuendigen', de: 'kündigen', en: 'to quit (a job) / give notice; to cancel (a contract)', pos: 'verb', example: { de: 'Er hat letzte Woche gekündigt.', en: 'He handed in his notice last week.' } },
    { id: 'a2-09-einstellen', de: 'einstellen', en: 'to hire / employ', pos: 'verb', forms: 'stellt ein · stellte ein · hat eingestellt', example: { de: 'Die Firma stellt zwei neue Mitarbeiter ein.', en: 'The company is hiring two new employees.' } },
    { id: 'a2-09-anfangen', de: 'anfangen', en: 'to begin / start (+ zu)', pos: 'verb', forms: 'fängt an · fing an · hat angefangen', example: { de: 'Ich fange am ersten Mai an.', en: 'I start on the first of May.' } },
    { id: 'a2-09-aufhoeren', de: 'aufhören', en: 'to stop (+ zu / mit + Dat)', pos: 'verb', forms: 'hört auf · hörte auf · hat aufgehört', example: { de: 'Hör auf, so laut zu sein!', en: 'Stop being so loud!' } },
    { id: 'a2-09-versuchen', de: 'versuchen', en: 'to try (+ zu)', pos: 'verb', example: { de: 'Ich versuche, mehr Deutsch zu sprechen.', en: "I'm trying to speak more German." } },
    { id: 'a2-09-erledigen', de: 'erledigen', en: 'to get done / deal with', pos: 'verb', example: { de: 'Ich muss heute noch viel erledigen.', en: 'I still have a lot to get done today.' } },
    { id: 'a2-09-unterschreiben', de: 'unterschreiben', en: 'to sign', pos: 'verb', forms: 'unterschreibt · unterschrieb · hat unterschrieben', example: { de: 'Bitte unterschreiben Sie hier.', en: 'Please sign here.' } },
    { id: 'a2-09-ausfuellen', de: 'ausfüllen', en: 'to fill in (a form)', pos: 'verb', forms: 'füllt aus · füllte aus · hat ausgefüllt', example: { de: 'Füllen Sie bitte das Formular aus.', en: 'Please fill in the form.' } },
    { id: 'a2-09-bescheid-sagen', de: 'Bescheid sagen', en: 'to let sb know (+ Dat)', pos: 'phrase', example: { de: 'Sag mir bitte Bescheid, wenn du fertig bist.', en: "Please let me know when you're done." } },
    { id: 'a2-09-selbststaendig', de: 'selbstständig', en: 'self-employed; independent', pos: 'adj', example: { de: 'Meine Mutter ist selbstständig.', en: 'My mother is self-employed.' } },
    { id: 'a2-09-zuverlaessig', de: 'zuverlässig', en: 'reliable', pos: 'adj', example: { de: 'Wir suchen eine zuverlässige Mitarbeiterin.', en: "We're looking for a reliable (female) employee." } },
    { id: 'a2-09-flexibel', de: 'flexibel', en: 'flexible', pos: 'adj', example: { de: 'Die Arbeitszeiten sind flexibel.', en: 'The working hours are flexible.' } },
  ],
  drills: [
    { id: 'a2-09-d01', type: 'cloze', text: '___ Sie mir bitte helfen?', answers: [['Könnten', 'Würden', 'Können']], en: 'Could you please help me?' },
    { id: 'a2-09-d02', type: 'choice', prompt: 'Im Café: „Ich ___ gern einen Kaffee.“', options: ['hätte', 'habe', 'hatte', 'hätten'], correct: 0, explain: 'Ich hätte gern … = polite way to order.' },
    { id: 'a2-09-d03', type: 'choice', prompt: 'Das ___ super! (would be)', options: ['wäre', 'würde', 'hätte', 'war'], correct: 0 },
    { id: 'a2-09-d04', type: 'cloze', text: 'Du ___ mehr schlafen.', answers: [['solltest', 'müsstest']], en: 'You should sleep more.', explain: 'Advice → sollte (Konjunktiv II of sollen).' },
    { id: 'a2-09-d05', type: 'translate', prompt: 'Could you call me back? (formal)', answers: ['Könnten Sie mich zurückrufen?', 'Könnten Sie mich bitte zurückrufen?', 'Würden Sie mich zurückrufen?', 'Würden Sie mich bitte zurückrufen?', 'Können Sie mich zurückrufen?', 'Können Sie mich bitte zurückrufen?'] },
    { id: 'a2-09-d06', type: 'translate', prompt: 'I would like to speak to Ms Schneider.', answers: ['Ich würde gern mit Frau Schneider sprechen', 'Ich würde gerne mit Frau Schneider sprechen', 'Ich möchte mit Frau Schneider sprechen', 'Ich möchte gern mit Frau Schneider sprechen', 'Ich möchte gerne mit Frau Schneider sprechen'], explain: 'Not "Ich will" — too direct.' },
    { id: 'a2-09-d07', type: 'translate', prompt: 'You should write your CV in German. (informal)', answers: ['Du solltest deinen Lebenslauf auf Deutsch schreiben'] },
    { id: 'a2-09-d08', type: 'translate', prompt: 'Would you have time tomorrow? (formal)', answers: ['Hätten Sie morgen Zeit?'] },
    { id: 'a2-09-d09', type: 'cloze', text: 'Ich habe keine Zeit, die E-Mail ___ ___.', answers: [['zu'], ['schreiben']], en: "I don't have time to write the e-mail." },
    { id: 'a2-09-d10', type: 'choice', prompt: 'Ich muss heute länger ___.', options: ['arbeiten', 'zu arbeiten', 'um zu arbeiten', 'gearbeitet'], correct: 0, explain: 'Modal verbs take the bare infinitive — no zu.' },
    { id: 'a2-09-d11', type: 'cloze', text: 'Vergiss nicht, deine Mutter ___!', answers: [['anzurufen']], en: "Don't forget to call your mother!", explain: 'Separable verb: zu goes between prefix and stem → an-zu-rufen.' },
    { id: 'a2-09-d12', type: 'cloze', text: 'Er hat aufgehört ___ ___.', answers: [['zu'], ['rauchen']], en: 'He has stopped smoking.', hint: 'rauchen', explain: 'English -ing after "stop" → zu + infinitive in German.' },
    { id: 'a2-09-d13', type: 'translate', prompt: 'It is important to learn German.', answers: ['Es ist wichtig, Deutsch zu lernen', 'Deutsch zu lernen ist wichtig'] },
    { id: 'a2-09-d14', type: 'order', en: "I'm trying to find a job.", words: ['Ich', 'versuche,', 'eine', 'Stelle', 'zu', 'finden'] },
    { id: 'a2-09-d15', type: 'translate', prompt: 'I have started to learn German.', answers: ['Ich habe angefangen, Deutsch zu lernen', 'Ich habe begonnen, Deutsch zu lernen'] },
    { id: 'a2-09-d16', type: 'order', en: "It isn't easy to find a flat.", words: ['Es', 'ist', 'nicht', 'leicht,', 'eine', 'Wohnung', 'zu', 'finden'] },
    { id: 'a2-09-d17', type: 'choice', prompt: 'Which sentence is correct?', options: ['Ich habe vergessen, das Fenster zuzumachen.', 'Ich habe vergessen, das Fenster zu zumachen.', 'Ich habe vergessen, zu das Fenster zumachen.', 'Ich habe zu vergessen, das Fenster zumachen.'], correct: 0, explain: 'zumachen is separable: zu + zu + machen → zuzumachen, at the end.' },
    { id: 'a2-09-d18', type: 'choice', prompt: 'Ich lerne Deutsch, ___ in München zu arbeiten.', options: ['um', 'weil', 'dass', 'für'], correct: 0, explain: 'Purpose + zu-infinitive → um … zu. Trap: not "für".' },
    { id: 'a2-09-d19', type: 'cloze', text: 'Ich stehe früh auf, um pünktlich im Büro ___.', answers: [['zu sein']], en: 'I get up early to be at the office on time.' },
    { id: 'a2-09-d20', type: 'translate', prompt: 'Do you have time to help me? (informal)', answers: ['Hast du Zeit, mir zu helfen?'], explain: 'helfen + Dativ → mir.' },
    { id: 'a2-09-d21', type: 'order', en: 'Could you please fill in the form? (formal)', words: ['Könnten', 'Sie', 'bitte', 'das', 'Formular', 'ausfüllen'] },
    { id: 'a2-09-d22', type: 'translate', prompt: 'Ananya is doing an internship to gain experience.', answers: ['Ananya macht ein Praktikum, um Erfahrung zu sammeln', 'Ananya macht ein Praktikum, um Erfahrungen zu sammeln'] },
    { id: 'a2-09-d23', type: 'translate', prompt: "I'm going to Germany to study.", answers: ['Ich gehe nach Deutschland, um zu studieren', 'Ich fahre nach Deutschland, um zu studieren', 'Ich ziehe nach Deutschland, um zu studieren', 'Um zu studieren, gehe ich nach Deutschland'] },
    { id: 'a2-09-d24', type: 'order', en: 'She does overtime to earn more money.', words: ['Sie', 'macht', 'Überstunden,', 'um', 'mehr', 'Geld', 'zu', 'verdienen'] },
    { id: 'a2-09-d25', type: 'translate', prompt: 'He forgot to sign the contract.', answers: ['Er hat vergessen, den Vertrag zu unterschreiben', 'Er vergaß, den Vertrag zu unterschreiben'] },
    { id: 'a2-09-d26', type: 'translate', prompt: 'I would like to apply for the position.', answers: ['Ich möchte mich um die Stelle bewerben', 'Ich möchte mich gern um die Stelle bewerben', 'Ich würde mich gern um die Stelle bewerben', 'Ich würde mich gerne um die Stelle bewerben', 'Ich möchte mich auf die Stelle bewerben', 'Ich würde mich gern auf die Stelle bewerben', 'Ich würde mich gerne auf die Stelle bewerben'], explain: 'sich bewerben um (or auf) + Akk; reflexive pronoun after the conjugated verb.' },
  ],
};

export default unit;
