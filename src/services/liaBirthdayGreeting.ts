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



export function liaBirthdayOrganizerReminder(input:{name:string;languageTag:string;daysUntil:number;variantSeed?:number;birthdayKnown:boolean}):string|null{
 if(!input.birthdayKnown||input.daysUntil<0||input.daysUntil>7)return null;
 const n=clean(input.name);
 const lang=language(input.languageTag);
 const today={
  fr:[`Aujourd'hui, c'est l'anniversaire de ${n}. N'oublie pas de lui souhaiter !`,`Petit rappel : ${n} fête son anniversaire aujourd'hui.`,`${n} est à l'honneur aujourd'hui : c'est son anniversaire !`,`N'oublie pas ${n} aujourd'hui : anniversaire au programme.`,`Aujourd'hui, pense à ${n} : c'est son anniversaire.`,`Rappel du jour : joyeux anniversaire à souhaiter à ${n} !`],
  en:[`Today's ${n}'s birthday — don't forget to wish them a happy birthday!`,`Quick reminder: it's ${n}'s birthday today.`,`${n} is the star today: it's their birthday!`,`Don't forget ${n} today — birthday time.`,`Think of ${n} today: it's their birthday.`,`Today's reminder: wish ${n} a happy birthday!`],
  he:[`היום יום ההולדת של ${n}. אל תשכח לברך!`,`תזכורת קטנה: היום יום ההולדת של ${n}.`,`היום ${n} במרכז: יום הולדת!`,`אל תשכח את ${n} היום — יש יום הולדת.`,`היום תחשוב על ${n}: יום ההולדת הגיע.`,`תזכורת להיום: לאחל ל-${n} יום הולדת שמח!`],
 }[lang];
 const tomorrow={
  fr:[`Demain, c'est l'anniversaire de ${n}.`,`Petit rappel pour demain : anniversaire de ${n}.`,`${n} fête son anniversaire demain, histoire de ne pas l'oublier.`,`Demain, pense à ${n} : c'est son anniversaire.`,`Je te préviens un peu avant : ${n} souffle ses bougies demain.`,`À noter pour demain : l'anniversaire de ${n}.`],
  en:[`Tomorrow is ${n}'s birthday.`,`Quick reminder for tomorrow: ${n}'s birthday.`,`${n}'s birthday is tomorrow, so it doesn't slip your mind.`,`Think of ${n} tomorrow: it's their birthday.`,`A little heads-up: ${n} celebrates tomorrow.`,`For tomorrow: ${n}'s birthday.`],
  he:[`מחר יום ההולדת של ${n}.`,`תזכורת קטנה למחר: יום ההולדת של ${n}.`,`מחר ${n} חוגג יום הולדת, שלא נשכח.`,`מחר תחשוב על ${n}: יום הולדת.`,`מעדכנת מראש: ${n} חוגג מחר.`,`למחר: יום ההולדת של ${n}.`],
 }[lang];
 const upcoming={
  fr:[`Dans ${input.daysUntil} jours, c'est l'anniversaire de ${n}.`,`Petit rappel : anniversaire de ${n} dans ${input.daysUntil} jours.`,`${n} fête son anniversaire dans ${input.daysUntil} jours.`,`À garder en tête : ${n}, anniversaire dans ${input.daysUntil} jours.`,`Je te le glisse à l'avance : ${n} fête son anniversaire dans ${input.daysUntil} jours.`,`Anniversaire à venir : ${n}, dans ${input.daysUntil} jours.`],
  en:[`${n}'s birthday is in ${input.daysUntil} days.`,`Quick reminder: ${n}'s birthday is in ${input.daysUntil} days.`,`${n} celebrates in ${input.daysUntil} days.`,`Keep in mind: ${n}'s birthday is in ${input.daysUntil} days.`,`A little early heads-up: ${n}'s birthday is in ${input.daysUntil} days.`,`Upcoming birthday: ${n}, in ${input.daysUntil} days.`],
  he:[`בעוד ${input.daysUntil} ימים יום ההולדת של ${n}.`,`תזכורת קטנה: יום ההולדת של ${n} בעוד ${input.daysUntil} ימים.`,`${n} חוגג בעוד ${input.daysUntil} ימים.`,`כדאי לזכור: יום ההולדת של ${n} בעוד ${input.daysUntil} ימים.`,`מעדכנת קצת מראש: ${n} חוגג בעוד ${input.daysUntil} ימים.`,`יום הולדת מתקרב: ${n}, בעוד ${input.daysUntil} ימים.`],
 }[lang];
 const list=input.daysUntil===0?today:input.daysUntil===1?tomorrow:upcoming;
 return list[Math.abs(input.variantSeed??0)%list.length];
}
