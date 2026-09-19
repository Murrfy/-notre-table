type BirthdaySurface='spoken'|'notification';

function clean(value:string){return value.trim().replace(/\s+/g,' ').slice(0,80);}

const spoken={
 fr:[
  (n:string)=>`Joyeux anniversaire ${n} ! Je te souhaite une très belle journée.`,
  (n:string)=>`Bon anniversaire ${n} ! Profite bien de ta journée, elle est à toi.`,
  (n:string)=>`Alors ${n}, aujourd'hui c'est ton jour ! Très joyeux anniversaire.`,
  (n:string)=>`Joyeux anniversaire ${n} ! Plein de belles choses pour cette nouvelle année.`,
  (n:string)=>`Bon anniversaire ${n} ! J'espère que cette journée te réserve de jolies surprises.`,
  (n:string)=>`${n}, impossible de te laisser passer sans te souhaiter un très joyeux anniversaire !`,
 ],
 en:[
  (n:string)=>`Happy birthday, ${n}! I hope you have a wonderful day.`,
  (n:string)=>`Happy birthday, ${n}! Enjoy your day — this one is yours.`,
  (n:string)=>`Well ${n}, today's your day! Have a very happy birthday.`,
  (n:string)=>`Happy birthday, ${n}! Wishing you lots of good things in the year ahead.`,
  (n:string)=>`Happy birthday, ${n}! I hope today brings you some lovely surprises.`,
  (n:string)=>`${n}, I couldn't let today go by without wishing you a very happy birthday!`,
 ],
 he:[
  (n:string)=>`יום הולדת שמח ${n}! מאחלת לך יום מקסים.`,
  (n:string)=>`מזל טוב ${n}! תהנה מהיום שלך, היום הוא כולו שלך.`,
  (n:string)=>`אז ${n}, היום זה היום שלך! יום הולדת שמח מאוד.`,
  (n:string)=>`יום הולדת שמח ${n}! המון דברים טובים בשנה החדשה שלך.`,
  (n:string)=>`מזל טוב ${n}! מקווה שהיום יחכו לך הפתעות יפות.`,
  (n:string)=>`${n}, אי אפשר לתת ליום הזה לעבור בלי לאחל לך יום הולדת שמח!`,
 ],
};

const notification={
 fr:[
  (n:string)=>`Joyeux anniversaire ${n} ! Passe une magnifique journée.`,
  (n:string)=>`Bon anniversaire ${n} ! Aujourd'hui, profite bien de chaque instant.`,
  (n:string)=>`${n}, c'est ton jour ! Très joyeux anniversaire.`,
  (n:string)=>`Une petite pensée de LIA : joyeux anniversaire ${n} !`,
  (n:string)=>`Bon anniversaire ${n} ! Que cette nouvelle année t'apporte plein de belles choses.`,
  (n:string)=>`Aujourd'hui, vedette du jour : ${n}. Joyeux anniversaire !`,
 ],
 en:[
  (n:string)=>`Happy birthday, ${n}! Have a wonderful day.`,
  (n:string)=>`Happy birthday, ${n}! Enjoy every bit of your day.`,
  (n:string)=>`${n}, today's your day! Happy birthday.`,
  (n:string)=>`A little note from LIA: happy birthday, ${n}!`,
  (n:string)=>`Happy birthday, ${n}! Wishing you a beautiful year ahead.`,
  (n:string)=>`Today's star: ${n}. Happy birthday!`,
 ],
 he:[
  (n:string)=>`יום הולדת שמח ${n}! שיהיה לך יום נפלא.`,
  (n:string)=>`מזל טוב ${n}! תהנה מכל רגע ביום שלך.`,
  (n:string)=>`${n}, היום זה היום שלך! יום הולדת שמח.`,
  (n:string)=>`ברכה קטנה מ-LIA: יום הולדת שמח ${n}!`,
  (n:string)=>`מזל טוב ${n}! שתהיה לך שנה מלאה בדברים טובים.`,
  (n:string)=>`כוכב היום: ${n}. יום הולדת שמח!`,
 ],
};

function language(languageTag:string):'fr'|'he'|'en'{
 const tag=languageTag.toLowerCase();
 return tag.startsWith('fr')?'fr':tag.startsWith('he')?'he':'en';
}

export function liaBirthdayGreeting(input:{name:string;languageTag:string;surface:BirthdaySurface;variantSeed?:number;birthdayKnown:boolean}):string|null{
 if(!input.birthdayKnown)return null;
 const list=(input.surface==='notification'?notification:spoken)[language(input.languageTag)];
 const index=Math.abs(input.variantSeed??0)%list.length;
 return list[index](clean(input.name));
}


export function liaBirthdayOrganizerReminder(input:{name:string;languageTag:string;daysUntil:number;variantSeed?:number;birthdayKnown:boolean}):string|null{
 if(!input.birthdayKnown||input.daysUntil<0||input.daysUntil>7)return null;
 const n=clean(input.name);
 const d=input.daysUntil;
 const fr=d===0?[
  `Petit rappel : c'est l'anniversaire de ${n} aujourd'hui.`,
  `N'oublie pas ${n} : c'est son anniversaire aujourd'hui.`,
  `Aujourd'hui, c'est l'anniversaire de ${n}.`,
  `${n} fête son anniversaire aujourd'hui. Je te le rappelle au bon moment.`,
  `Pense à ${n} aujourd'hui : c'est son anniversaire.`,
  `Anniversaire de ${n} aujourd'hui. Je veille au grain !`,
 ]:[
  `Petit rappel : l'anniversaire de ${n} est dans ${d} jour${d>1?'s':''}.`,
  `Dans ${d} jour${d>1?'s':''}, c'est l'anniversaire de ${n}.`,
  `Je te glisse ça maintenant : anniversaire de ${n} dans ${d} jour${d>1?'s':''}.`,
  `Pense à ${n} : son anniversaire arrive dans ${d} jour${d>1?'s':''}.`,
  `L'anniversaire de ${n} approche : encore ${d} jour${d>1?'s':''}.`,
  `Je garde un œil sur le calendrier : ${n} fête son anniversaire dans ${d} jour${d>1?'s':''}.`,
 ];
 const en=d===0?[
  `Quick reminder: it's ${n}'s birthday today.`,`Don't forget ${n}: it's their birthday today.`,`Today is ${n}'s birthday.`,`${n} has a birthday today. Right on time with the reminder.`,`Think of ${n} today: it's their birthday.`,`${n}'s birthday is today. I've got the calendar covered!`
 ]:[
  `Quick reminder: ${n}'s birthday is in ${d} day${d>1?'s':''}.`,`In ${d} day${d>1?'s':''}, it's ${n}'s birthday.`,`A heads-up: ${n}'s birthday is in ${d} day${d>1?'s':''}.`,`Keep ${n} in mind: their birthday is in ${d} day${d>1?'s':''}.`,`${n}'s birthday is coming up in ${d} day${d>1?'s':''}.`,`I'm watching the calendar: ${n}'s birthday is in ${d} day${d>1?'s':''}.`
 ];
 const he=d===0?[
  `תזכורת קטנה: היום יום ההולדת של ${n}.`,`לא לשכוח את ${n}: היום יום ההולדת.`,`היום יום ההולדת של ${n}.`,`${n} חוגג היום יום הולדת. מזכירה בדיוק בזמן.`,`כדאי לחשוב על ${n} היום: זה יום ההולדת.`,`היום יום ההולדת של ${n}. אני שומרת על היומן!`
 ]:[
  `תזכורת קטנה: יום ההולדת של ${n} בעוד ${d} ימים.`,`בעוד ${d} ימים יום ההולדת של ${n}.`,`רק מזכירה: יום ההולדת של ${n} בעוד ${d} ימים.`,`כדאי לזכור את ${n}: יום ההולדת בעוד ${d} ימים.`,`יום ההולדת של ${n} מתקרב: עוד ${d} ימים.`,`אני שומרת על היומן: יום ההולדת של ${n} בעוד ${d} ימים.`
 ];
 const list=language(input.languageTag)==='fr'?fr:language(input.languageTag)==='he'?he:en;
 return list[Math.abs(input.variantSeed??0)%list.length];
}


export function liaBirthdayReminder(input:{name:string;languageTag:string;daysUntil:number;variantSeed?:number}):string|null{
 const n=clean(input.name);
 const days=Math.floor(input.daysUntil);
 if(days<0||days>7)return null;
 const fr=days===0?[
  `Petit rappel : aujourd'hui, c'est l'anniversaire de ${n}.`,
  `N'oublie pas : ${n} fête son anniversaire aujourd'hui.`,
  `Aujourd'hui c'est l'anniversaire de ${n}. Je te le rappelle avant que la journée file.`,
  `Au fait, anniversaire de ${n} aujourd'hui !`,
  `${n} est à l'honneur aujourd'hui : c'est son anniversaire.`,
  `Je te glisse ça maintenant : aujourd'hui, c'est l'anniversaire de ${n}.`,
 ]:days===1?[
  `Petit rappel : demain, c'est l'anniversaire de ${n}.`,
  `N'oublie pas, ${n} fête son anniversaire demain.`,
  `Demain c'est l'anniversaire de ${n}. Je préfère te prévenir maintenant.`,
  `Au fait, anniversaire de ${n} demain !`,
  `${n} sera à l'honneur demain : c'est son anniversaire.`,
  `Je te glisse ça à temps : demain, c'est l'anniversaire de ${n}.`,
 ]:[
  `Petit rappel : l'anniversaire de ${n} est dans ${days} jours.`,
  `Dans ${days} jours, c'est l'anniversaire de ${n}. Je te le garde à l'œil.`,
  `Pense à ${n} : son anniversaire arrive dans ${days} jours.`,
  `Anniversaire de ${n} dans ${days} jours. Tu as encore le temps de préparer quelque chose.`,
  `${n} fête bientôt son anniversaire : plus que ${days} jours.`,
  `Je te préviens à l'avance : anniversaire de ${n} dans ${days} jours.`,
 ];
 const en=days===0?[
  `Quick reminder: today is ${n}'s birthday.`,`Don't forget: it's ${n}'s birthday today.`,`Today is ${n}'s birthday — a reminder before the day gets away.`,`By the way, it's ${n}'s birthday today!`,`${n} is today's birthday star.`,`Just in time: today is ${n}'s birthday.`
 ]:days===1?[
  `Quick reminder: tomorrow is ${n}'s birthday.`,`Don't forget: ${n}'s birthday is tomorrow.`,`Tomorrow is ${n}'s birthday — giving you a little head start.`,`By the way, ${n}'s birthday is tomorrow!`,`${n} is the birthday star tomorrow.`,`A timely reminder: tomorrow is ${n}'s birthday.`
 ]:[
  `Quick reminder: ${n}'s birthday is in ${days} days.`,`${n}'s birthday is in ${days} days — I've got it on my radar.`,`Keep ${n} in mind: their birthday is in ${days} days.`,`${n}'s birthday is in ${days} days. Still time to plan something.`,`${n}'s birthday is coming up in ${days} days.`,`An early heads-up: ${n}'s birthday is in ${days} days.`
 ];
 const he=days===0?[
  `תזכורת קטנה: היום יום ההולדת של ${n}.`,`לא לשכוח: היום ${n} חוגג יום הולדת.`,`היום יום ההולדת של ${n}, מזכירה לפני שהיום רץ.`,`דרך אגב, היום יום ההולדת של ${n}!`,`${n} במרכז היום: יש יום הולדת.`,`תזכורת בזמן: היום יום ההולדת של ${n}.`
 ]:days===1?[
  `תזכורת קטנה: מחר יום ההולדת של ${n}.`,`לא לשכוח: מחר ${n} חוגג יום הולדת.`,`מחר יום ההולדת של ${n}, אז אני מזכירה מראש.`,`דרך אגב, מחר יום ההולדת של ${n}!`,`${n} במרכז מחר: יש יום הולדת.`,`תזכורת בזמן: מחר יום ההולדת של ${n}.`
 ]:[
  `תזכורת קטנה: יום ההולדת של ${n} בעוד ${days} ימים.`,`בעוד ${days} ימים יום ההולדת של ${n}.`,`כדאי לזכור את ${n}: יום ההולדת בעוד ${days} ימים.`,`יום ההולדת של ${n} בעוד ${days} ימים. יש עוד זמן להתכונן.`,`${n} חוגג בקרוב: עוד ${days} ימים.`,`מזכירה מראש: יום ההולדת של ${n} בעוד ${days} ימים.`
 ];
 const list=language(input.languageTag)==='fr'?fr:language(input.languageTag)==='he'?he:en;
 return list[Math.abs(input.variantSeed??0)%list.length];
}


const reminder={
 fr:[
  (n:string,d:string)=>`Petit rappel : l'anniversaire de ${n}, c'est ${d}.`,
  (n:string,d:string)=>`Au fait, ${n} fête son anniversaire ${d}. Je préfère te le rappeler.`,
  (n:string,d:string)=>`Pense à ${n} : son anniversaire arrive ${d}.`,
  (n:string,d:string)=>`Je te glisse ça avant que ça t'échappe : anniversaire de ${n} ${d}.`,
  (n:string,d:string)=>`${n} est bientôt à l'honneur : anniversaire ${d}.`,
  (n:string,d:string)=>`Note pour toi : ${d}, c'est l'anniversaire de ${n}.`,
 ],
 en:[
  (n:string,d:string)=>`Quick reminder: ${n}'s birthday is ${d}.`,
  (n:string,d:string)=>`By the way, ${n}'s birthday is ${d}. I thought I'd remind you.`,
  (n:string,d:string)=>`Keep ${n} in mind: their birthday is coming up ${d}.`,
  (n:string,d:string)=>`Before it slips your mind: ${n}'s birthday is ${d}.`,
  (n:string,d:string)=>`${n} will be the star soon: birthday ${d}.`,
  (n:string,d:string)=>`A note for you: ${d} is ${n}'s birthday.`,
 ],
 he:[
  (n:string,d:string)=>`תזכורת קטנה: יום ההולדת של ${n} הוא ${d}.`,
  (n:string,d:string)=>`אגב, ל${n} יש יום הולדת ${d}. חשבתי שכדאי להזכיר לך.`,
  (n:string,d:string)=>`תזכור את ${n}: יום ההולדת מגיע ${d}.`,
  (n:string,d:string)=>`לפני שזה בורח: יום ההולדת של ${n} הוא ${d}.`,
  (n:string,d:string)=>`${n} בקרוב במרכז העניינים: יום הולדת ${d}.`,
  (n:string,d:string)=>`הערה בשבילך: ${d} זה יום ההולדת של ${n}.`,
 ],
};

export function liaBirthdayOrganizerReminder(input:{name:string;dateLabel:string;languageTag:string;variantSeed?:number;birthdayKnown:boolean}):string|null{
 if(!input.birthdayKnown)return null;
 const list=reminder[language(input.languageTag)];
 return list[Math.abs(input.variantSeed??0)%list.length](clean(input.name),clean(input.dateLabel));
}
