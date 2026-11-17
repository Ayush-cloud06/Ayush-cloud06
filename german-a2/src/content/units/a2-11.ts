import type { Unit } from '../types';

const unit: Unit = {
  id: 'a2-11',
  level: 'A2',
  order: 23,
  title: 'Travel & bookings',
  titleDe: 'Reisen und Buchungen',
  goal: 'Book rooms and tickets, describe people and things with relative clauses, and say when and for how long.',
  grammar: [
    {
      heading: 'Relative clauses',
      body:
        'A relative clause describes a noun: das Hotel, **das** wir gebucht haben. Three rules:\n\n' +
        '1. **Gender & number** of the pronoun come from the noun it refers to.\n' +
        '2. **Case** comes from the pronoun\'s job inside the relative clause (subject → Nom, object → Akk, after a dative verb/preposition → Dat).\n' +
        '3. **Verb goes to the end**, and the clause is closed off with commas.\n\n' +
        'Traps: English can drop "that/who" (the hotel we booked) — German never can. Use der/die/das, not "welche" (stiff) and never "was" for a noun.',
      table: {
        head: ['Case', 'Masculine', 'Feminine', 'Neuter', 'Plural'],
        rows: [
          ['Nominative', 'der', 'die', 'das', 'die'],
          ['Accusative', 'den', 'die', 'das', 'die'],
          ['Dative', 'dem', 'der', 'dem', 'denen'],
        ],
      },
      examples: [
        { de: 'Der Zug, der nach Köln fährt, hat Verspätung.', en: 'The train that goes to Cologne is delayed. (Nom: der Zug fährt)' },
        { de: 'Der Koffer, den ich gekauft habe, ist zu klein.', en: 'The suitcase (that) I bought is too small. (Akk: ich habe den Koffer gekauft)' },
        { de: 'Die Frau, der ich geholfen habe, kommt aus Wien.', en: 'The woman I helped is from Vienna. (Dat: helfen + Dat)' },
        { de: 'Das sind die Freunde, mit denen ich reise.', en: "These are the friends I'm travelling with. (mit + Dat, plural)" },
      ],
    },
    {
      heading: 'Time prepositions',
      body:
        'Biggest trap: **seit** + present tense for something that started in the past and is still going on. English "I have been living here for two years" = **Ich wohne seit zwei Jahren hier.** (Not Perfekt, not für!)\n\n' +
        '**vor** + Dat = ago, and it comes **before** the time: vor drei Tagen = three days ago. **für** is for a planned/limited duration.',
      table: {
        head: ['Preposition', 'Case', 'Meaning', 'Example'],
        rows: [
          ['seit', 'Dat', 'since / for (still ongoing)', 'Ich lerne seit einem Jahr Deutsch.'],
          ['vor', 'Dat', 'ago', 'Wir sind vor zwei Tagen angekommen.'],
          ['nach', 'Dat', 'after', 'Nach dem Frühstück fahren wir los.'],
          ['ab', 'Dat', 'from … on', 'Ab Montag habe ich Urlaub.'],
          ['bis', '(Akk)', 'until / by', 'Das Zimmer ist bis Freitag frei. / bis zum 3. Mai'],
          ['für', 'Akk', 'for (planned duration)', 'Wir fahren für eine Woche nach Wien.'],
          ['während', 'Gen', 'during (recognise)', 'während der Reise / während des Flugs'],
        ],
      },
      examples: [
        { de: 'Ich warte seit zwanzig Minuten auf den Bus.', en: "I've been waiting for the bus for twenty minutes." },
        { de: 'Vor einem Monat war ich in Dresden.', en: 'A month ago I was in Dresden.' },
      ],
    },
    {
      heading: 'n-declination (weak masculine nouns)',
      body:
        'A small group of masculine nouns adds **-(e)n** in every case except the nominative singular. Who: most masculines ending in **-e** (der Kunde, der Kollege, der Junge), many people nouns in **-ent / -ist / -ant** (der Student, der Tourist, der Praktikant), plus der Mensch, der Nachbar, der Herr.\n\n' +
        'Special: **Herr** → Herrn (sg.), Herren (pl.); **Name** → des Namens.',
      table: {
        head: ['Case', 'der Kunde', 'der Student', 'der Herr'],
        rows: [
          ['Nom', 'der Kunde', 'der Student', 'der Herr'],
          ['Akk', 'den Kunden', 'den Studenten', 'den Herrn'],
          ['Dat', 'dem Kunden', 'dem Studenten', 'dem Herrn'],
          ['Gen', 'des Kunden', 'des Studenten', 'des Herrn'],
          ['Plural', 'die Kunden', 'die Studenten', 'die Herren'],
        ],
      },
      examples: [
        { de: 'Kennst du den Jungen da drüben?', en: 'Do you know the boy over there?' },
        { de: 'Ich habe eine E-Mail an Herrn Fischer geschrieben.', en: 'I wrote an e-mail to Mr Fischer.' },
        { de: 'Können Sie dem Touristen helfen?', en: 'Can you help the tourist?' },
      ],
    },
  ],
  vocab: [
    { id: 'a2-11-unterkunft', de: 'Unterkunft', en: 'accommodation', pos: 'noun', gender: 'die', plural: 'Unterkünfte', example: { de: 'Wir suchen eine günstige Unterkunft in Berlin.', en: "We're looking for cheap accommodation in Berlin." } },
    { id: 'a2-11-buchung', de: 'Buchung', en: 'booking', pos: 'noun', gender: 'die', plural: 'Buchungen', example: { de: 'Ich möchte meine Buchung ändern.', en: "I'd like to change my booking." } },
    { id: 'a2-11-doppelzimmer', de: 'Doppelzimmer', en: 'double room (opp. das Einzelzimmer)', pos: 'noun', gender: 'das', plural: 'Doppelzimmer', example: { de: 'Ein Doppelzimmer kostet 90 Euro pro Nacht.', en: 'A double room costs 90 euros per night.' } },
    { id: 'a2-11-uebernachtung', de: 'Übernachtung', en: 'overnight stay', pos: 'noun', gender: 'die', plural: 'Übernachtungen', example: { de: 'Der Preis für eine Übernachtung mit Frühstück ist 75 Euro.', en: 'The price for one night with breakfast is 75 euros.' } },
    { id: 'a2-11-rezeption', de: 'Rezeption', en: 'reception (desk)', pos: 'noun', gender: 'die', plural: 'Rezeptionen', example: { de: 'Den Schlüssel bekommen Sie an der Rezeption.', en: "You'll get the key at reception." } },
    { id: 'a2-11-ankunft', de: 'Ankunft', en: 'arrival', pos: 'noun', gender: 'die', plural: 'Ankünfte', example: { de: 'Wann ist die Ankunft in Frankfurt?', en: 'When is the arrival in Frankfurt?' } },
    { id: 'a2-11-abfahrt', de: 'Abfahrt', en: 'departure (train, bus, car)', pos: 'noun', gender: 'die', plural: 'Abfahrten', example: { de: 'Die Abfahrt ist um 9:15 Uhr.', en: 'Departure is at 9:15.' } },
    { id: 'a2-11-abflug', de: 'Abflug', en: 'departure (flight)', pos: 'noun', gender: 'der', plural: 'Abflüge', example: { de: 'Der Abflug hat sich um eine Stunde verschoben.', en: 'The flight departure has been moved back an hour.' } },
    { id: 'a2-11-flughafen', de: 'Flughafen', en: 'airport', pos: 'noun', gender: 'der', plural: 'Flughäfen', example: { de: 'Wie komme ich am besten zum Flughafen?', en: "What's the best way to get to the airport?" } },
    { id: 'a2-11-gleis', de: 'Gleis', en: 'track / platform (number)', pos: 'noun', gender: 'das', plural: 'Gleise', example: { de: 'Der ICE nach München fährt von Gleis 7.', en: 'The ICE to Munich leaves from platform 7.' } },
    { id: 'a2-11-bahnsteig', de: 'Bahnsteig', en: 'platform', pos: 'noun', gender: 'der', plural: 'Bahnsteige', example: { de: 'Wir warten auf dem Bahnsteig.', en: "We're waiting on the platform." } },
    { id: 'a2-11-verspaetung', de: 'Verspätung', en: 'delay', pos: 'noun', gender: 'die', plural: 'Verspätungen', example: { de: 'Der Zug hat zwanzig Minuten Verspätung.', en: 'The train is twenty minutes late.' } },
    { id: 'a2-11-anschluss', de: 'Anschluss', en: 'connection (train / flight)', pos: 'noun', gender: 'der', plural: 'Anschlüsse', example: { de: 'Ich habe meinen Anschluss verpasst.', en: 'I missed my connection.' } },
    { id: 'a2-11-koffer', de: 'Koffer', en: 'suitcase', pos: 'noun', gender: 'der', plural: 'Koffer', example: { de: 'Mein Koffer ist zu schwer.', en: 'My suitcase is too heavy.' } },
    { id: 'a2-11-gepaeck', de: 'Gepäck', en: 'luggage', pos: 'noun', gender: 'das', plural: '-', example: { de: 'Wo kann ich mein Gepäck abgeben?', en: 'Where can I drop off my luggage?' } },
    { id: 'a2-11-reisepass', de: 'Reisepass', en: 'passport', pos: 'noun', gender: 'der', plural: 'Reisepässe', example: { de: 'Vergiss deinen Reisepass nicht!', en: "Don't forget your passport!" } },
    { id: 'a2-11-visum', de: 'Visum', en: 'visa', pos: 'noun', gender: 'das', plural: 'Visa', example: { de: 'Für Deutschland brauche ich ein Visum.', en: 'I need a visa for Germany.' } },
    { id: 'a2-11-sehenswuerdigkeit', de: 'Sehenswürdigkeit', en: 'sight / tourist attraction', pos: 'noun', gender: 'die', plural: 'Sehenswürdigkeiten', example: { de: 'Der Kölner Dom ist eine berühmte Sehenswürdigkeit.', en: 'Cologne Cathedral is a famous sight.' } },
    { id: 'a2-11-ausflug', de: 'Ausflug', en: 'trip / excursion', pos: 'noun', gender: 'der', plural: 'Ausflüge', example: { de: 'Am Sonntag machen wir einen Ausflug an den See.', en: "On Sunday we're going on a trip to the lake." } },
    { id: 'a2-11-aussicht', de: 'Aussicht', en: 'view', pos: 'noun', gender: 'die', plural: 'Aussichten', example: { de: 'Das Zimmer hat eine tolle Aussicht.', en: 'The room has a great view.' } },
    { id: 'a2-11-kunde', de: 'Kunde', en: 'customer (m.) — n-noun; f. die Kundin, -nen', pos: 'noun', gender: 'der', plural: 'Kunden', forms: 'den / dem / des Kunden', example: { de: 'Der Mitarbeiter hilft dem Kunden.', en: 'The employee is helping the customer.' } },
    { id: 'a2-11-tourist', de: 'Tourist', en: 'tourist (m.) — n-noun; f. die Touristin, -nen', pos: 'noun', gender: 'der', plural: 'Touristen', forms: 'den / dem / des Touristen', example: { de: 'Im Sommer kommen viele Touristen nach Heidelberg.', en: 'Lots of tourists come to Heidelberg in summer.' } },
    { id: 'a2-11-student', de: 'Student', en: 'student (m.) — n-noun; f. die Studentin, -nen', pos: 'noun', gender: 'der', plural: 'Studenten', forms: 'den / dem / des Studenten', example: { de: 'Das Zimmer vermieten wir an einen Studenten.', en: "We're renting the room to a student." } },
    { id: 'a2-11-herr', de: 'Herr', en: 'Mr / gentleman — n-noun', pos: 'noun', gender: 'der', plural: 'Herren', forms: 'den / dem / des Herrn', example: { de: 'Ich habe mit Herrn Weber telefoniert.', en: 'I spoke to Mr Weber on the phone.' } },
    { id: 'a2-11-junge', de: 'Junge', en: 'boy — n-noun', pos: 'noun', gender: 'der', plural: 'Jungen', forms: 'den / dem / des Jungen', example: { de: 'Wir haben den Jungen nach dem Weg gefragt.', en: 'We asked the boy the way.' } },
    { id: 'a2-11-mensch', de: 'Mensch', en: 'person / human being — n-noun', pos: 'noun', gender: 'der', plural: 'Menschen', forms: 'den / dem / des Menschen', example: { de: 'In Hamburg habe ich viele nette Menschen kennengelernt.', en: 'I met lots of nice people in Hamburg.' } },
    { id: 'a2-11-nachbar', de: 'Nachbar', en: 'neighbour (m.) — n-noun; f. die Nachbarin, -nen', pos: 'noun', gender: 'der', plural: 'Nachbarn', forms: 'den / dem / des Nachbarn', example: { de: 'Ich gebe dem Nachbarn meinen Schlüssel.', en: "I'm giving the neighbour my key." } },
    { id: 'a2-11-name', de: 'Name', en: 'name — n-noun (Gen: des Namens)', pos: 'noun', gender: 'der', plural: 'Namen', forms: 'den / dem Namen · des Namens', example: { de: 'Auf welchen Namen ist das Zimmer gebucht?', en: 'Under what name is the room booked?' } },
    { id: 'a2-11-umsteigen', de: 'umsteigen', en: 'to change (trains / buses)', pos: 'verb', forms: 'steigt um · stieg um · ist umgestiegen', example: { de: 'In Mannheim müssen Sie umsteigen.', en: 'You have to change in Mannheim.' } },
    { id: 'a2-11-reservieren', de: 'reservieren', en: 'to reserve', pos: 'verb', example: { de: 'Ich möchte einen Tisch für vier Personen reservieren.', en: "I'd like to reserve a table for four." } },
    { id: 'a2-11-stornieren', de: 'stornieren', en: 'to cancel (a booking)', pos: 'verb', example: { de: 'Kann ich die Buchung kostenlos stornieren?', en: 'Can I cancel the booking free of charge?' } },
    { id: 'a2-11-verpassen', de: 'verpassen', en: 'to miss (train, chance)', pos: 'verb', example: { de: 'Beeil dich, sonst verpassen wir den Zug!', en: "Hurry up, or we'll miss the train!" } },
    { id: 'a2-11-uebernachten', de: 'übernachten', en: 'to stay overnight', pos: 'verb', forms: 'übernachtet · übernachtete · hat übernachtet', example: { de: 'Wir übernachten in einer Jugendherberge.', en: "We're staying at a youth hostel." } },
    { id: 'a2-11-guenstig', de: 'günstig', en: 'cheap / good value', pos: 'adj', example: { de: 'Im Winter sind die Flüge günstiger.', en: 'Flights are cheaper in winter.' } },
    { id: 'a2-11-ausgebucht', de: 'ausgebucht', en: 'fully booked', pos: 'adj', example: { de: 'Leider ist das Hotel ausgebucht.', en: 'Unfortunately the hotel is fully booked.' } },
    { id: 'a2-11-ab', de: 'ab', en: 'from (… on) (+ Dat)', pos: 'prep', example: { de: 'Ab nächster Woche fährt der Bus öfter.', en: 'From next week the bus runs more often.' } },
    { id: 'a2-11-waehrend', de: 'während', en: 'during (+ Gen)', pos: 'prep', example: { de: 'Während des Flugs habe ich geschlafen.', en: 'I slept during the flight.' } },
  ],
  drills: [
    { id: 'a2-11-d01', type: 'cloze', text: 'Das ist der Zug, ___ nach Köln fährt.', answers: [['der']], en: 'That is the train that goes to Cologne.', explain: 'der Zug (m.), subject of fährt → Nom der.' },
    { id: 'a2-11-d02', type: 'cloze', text: 'Wie heißt die Stadt, ___ du besucht hast?', answers: [['die']], en: 'What is the name of the town you visited?' },
    { id: 'a2-11-d03', type: 'choice', prompt: 'Das Hotel, ___ wir gebucht haben, ist sehr schön.', options: ['das', 'dem', 'den', 'der'], correct: 0, explain: 'das Hotel (n.), object of gebucht → Akk das.' },
    { id: 'a2-11-d04', type: 'translate', prompt: 'The woman who works at reception is very friendly.', answers: ['Die Frau, die an der Rezeption arbeitet, ist sehr freundlich'] },
    { id: 'a2-11-d05', type: 'translate', prompt: 'This is the suitcase I bought in Berlin.', answers: ['Das ist der Koffer, den ich in Berlin gekauft habe', 'Das ist der Koffer, den ich in Berlin kaufte'], explain: 'English drops "that"; German needs the relative pronoun: den (m., Akk).' },
    { id: 'a2-11-d06', type: 'cloze', text: 'Der Mann, ___ ich den Schlüssel gegeben habe, arbeitet an der Rezeption.', answers: [['dem']], en: 'The man I gave the key to works at reception.', explain: 'geben: person = dative → dem.' },
    { id: 'a2-11-d07', type: 'choice', prompt: 'Die Touristen, ___ wir den Weg gezeigt haben, kamen aus Japan.', options: ['denen', 'die', 'den', 'dem'], correct: 0, explain: 'Plural + dative (jemandem etwas zeigen) → denen.' },
    { id: 'a2-11-d08', type: 'order', en: 'The flight we booked is delayed.', words: ['Der', 'Flug,', 'den', 'wir', 'gebucht', 'haben,', 'hat', 'Verspätung'] },
    { id: 'a2-11-d09', type: 'cloze', text: 'Das sind die Kollegen, mit ___ ich nach Wien fahre.', answers: [['denen']], en: "These are the colleagues I'm going to Vienna with.", explain: 'Preposition first, then the pronoun in the case it needs: mit + Dat plural → denen.' },
    { id: 'a2-11-d10', type: 'translate', prompt: "I'm looking for a hotel that isn't too expensive.", answers: ['Ich suche ein Hotel, das nicht zu teuer ist'] },
    { id: 'a2-11-d11', type: 'translate', prompt: "This is my neighbour (m.) I often travel with.", answers: ['Das ist mein Nachbar, mit dem ich oft reise', 'Das ist mein Nachbar, mit dem ich oft verreise'] },
    { id: 'a2-11-d12', type: 'order', en: "The friends I'm visiting live in Hamburg.", words: ['Die', 'Freunde,', 'die', 'ich', 'besuche,', 'wohnen', 'in', 'Hamburg'] },
    { id: 'a2-11-d13', type: 'cloze', text: 'Ich wohne ___ zwei Jahren in Frankfurt.', answers: [['seit']], en: "I've been living in Frankfurt for two years.", explain: 'Started in the past and still true → seit + present tense.' },
    { id: 'a2-11-d14', type: 'translate', prompt: "I've been learning German for six months.", answers: ['Ich lerne seit sechs Monaten Deutsch', 'Seit sechs Monaten lerne ich Deutsch', 'Ich lerne Deutsch seit sechs Monaten'], explain: 'Trap: English present perfect continuous → German seit + present. Not "Ich habe … gelernt", not "für".' },
    { id: 'a2-11-d15', type: 'translate', prompt: 'We arrived in Munich two days ago.', answers: ['Wir sind vor zwei Tagen in München angekommen', 'Vor zwei Tagen sind wir in München angekommen', 'Wir kamen vor zwei Tagen in München an'], explain: '"ago" = vor + Dat, placed before the time: vor zwei Tagen.' },
    { id: 'a2-11-d16', type: 'choice', prompt: '"from Monday (on)" = ___ Montag', options: ['ab', 'seit', 'vor', 'nach'], correct: 0 },
    { id: 'a2-11-d17', type: 'cloze', text: 'Wir fahren ___ zwei Wochen nach Italien.', answers: [['für']], en: "We're going to Italy for two weeks.", explain: 'Planned duration → für (seit only for something ongoing since the past).' },
    { id: 'a2-11-d18', type: 'choice', prompt: 'Während ___ Reise hat es viel geregnet.', options: ['der', 'die', 'dem', 'den'], correct: 0, explain: 'während + genitive; die Reise → der Reise.' },
    { id: 'a2-11-d19', type: 'order', en: "I've been waiting for the bus for twenty minutes.", words: ['Ich', 'warte', 'seit', 'zwanzig', 'Minuten', 'auf', 'den', 'Bus'] },
    { id: 'a2-11-d20', type: 'choice', prompt: 'Ich habe mit ___ gesprochen. (the customer)', options: ['dem Kunden', 'dem Kunde', 'den Kunde', 'der Kunden'], correct: 0, explain: 'n-declination: der Kunde → dem Kunden.' },
    { id: 'a2-11-d21', type: 'cloze', text: 'Ich habe eine E-Mail an ___ Schmidt geschrieben.', answers: [['Herrn']], en: 'I wrote an e-mail to Mr Schmidt.', explain: 'Herr is an n-noun: an + Akk → Herrn.' },
    { id: 'a2-11-d22', type: 'cloze', text: 'Ich frage den ___ nach dem Weg.', answers: [['Studenten']], en: 'I ask the student the way.', hint: 'Student' },
    { id: 'a2-11-d23', type: 'translate', prompt: 'Do you know the boy? (informal)', answers: ['Kennst du den Jungen?'], explain: 'n-noun: den Jungen, not "den Junge".' },
    { id: 'a2-11-d24', type: 'translate', prompt: 'We have to change trains in Mannheim.', answers: ['Wir müssen in Mannheim umsteigen'] },
    { id: 'a2-11-d25', type: 'translate', prompt: 'Can you help the tourist? (formal)', answers: ['Können Sie dem Touristen helfen?', 'Könnten Sie dem Touristen helfen?'], explain: 'helfen + Dat; n-noun → dem Touristen.' },
    { id: 'a2-11-d26', type: 'translate', prompt: 'I missed the train that goes to Dresden.', answers: ['Ich habe den Zug verpasst, der nach Dresden fährt', 'Ich habe den Zug, der nach Dresden fährt, verpasst'], explain: 'der Zug is the subject inside the relative clause → der (Nom), even though it is Akk in the main clause.' },
  ],
};

export default unit;
