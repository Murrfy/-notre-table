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
