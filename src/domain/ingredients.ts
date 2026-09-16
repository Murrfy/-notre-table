import type { SupportedLanguage } from '../i18n';

type IngredientEntry={
  labels:Record<SupportedLanguage,string>;
  aliases:string[];
};

// Small, original starter lexicon for cross-language household matching.
// It is intentionally not a scraped recipe/ingredient dataset. Unknown items fall back to
// a stable slug and keep the user's original visible wording.
const lexicon:Record<string,IngredientEntry>={
  milk:{labels:{en:'Milk',fr:'Lait',es:'Leche',he:'חלב'},aliases:['milk','lait','leche','חלב','lactose']},
  peanut:{labels:{en:'Peanuts',fr:'Cacahuètes',es:'Cacahuetes',he:'בוטנים'},aliases:['peanut','peanuts','cacahuète','cacahuètes','cacahuete','cacahuetes','arachide','arachides','בוטנים']},
  egg:{labels:{en:'Eggs',fr:'Œufs',es:'Huevos',he:'ביצים'},aliases:['egg','eggs','oeuf','oeufs','œuf','œufs','huevo','huevos','ביצה','ביצים']},
  wheat:{labels:{en:'Wheat',fr:'Blé',es:'Trigo',he:'חיטה'},aliases:['wheat','blé','ble','trigo','חיטה']},
  gluten:{labels:{en:'Gluten',fr:'Gluten',es:'Gluten',he:'גלוטן'},aliases:['gluten','גלוטן']},
  soy:{labels:{en:'Soy',fr:'Soja',es:'Soja',he:'סויה'},aliases:['soy','soya','soja','סויה']},
  sesame:{labels:{en:'Sesame',fr:'Sésame',es:'Sésamo',he:'שומשום'},aliases:['sesame','sésame','sesamo','sésamo','שומשום']},
  fish:{labels:{en:'Fish',fr:'Poisson',es:'Pescado',he:'דג'},aliases:['fish','poisson','pescado','דג','דגים']},
  salmon:{labels:{en:'Salmon',fr:'Saumon',es:'Salmón',he:'סלמון'},aliases:['salmon','saumon','salmón','סלמון']},
  tuna:{labels:{en:'Tuna',fr:'Thon',es:'Atún',he:'טונה'},aliases:['tuna','thon','atún','atun','טונה']},
  pork:{labels:{en:'Pork',fr:'Porc',es:'Cerdo',he:'חזיר'},aliases:['pork','porc','cerdo','חזיר','bacon','jambon','jamón','jamon']},
  beef:{labels:{en:'Beef',fr:'Bœuf',es:'Ternera',he:'בקר'},aliases:['beef','boeuf','bœuf','ternera','carne de res','בקר']},
  chicken:{labels:{en:'Chicken',fr:'Poulet',es:'Pollo',he:'עוף'},aliases:['chicken','poulet','pollo','עוף']},
  tomato:{labels:{en:'Tomatoes',fr:'Tomates',es:'Tomates',he:'עגבניות'},aliases:['tomato','tomatoes','tomate','tomates','עגבניה','עגבניות']},
  zucchini:{labels:{en:'Zucchini',fr:'Courgettes',es:'Calabacín',he:'קישוא'},aliases:['zucchini','courgette','courgettes','calabacín','calabacin','calabacines','קישוא','קישואים']},
  eggplant:{labels:{en:'Eggplant',fr:'Aubergine',es:'Berenjena',he:'חציל'},aliases:['eggplant','aubergine','aubergines','berenjena','berenjenas','חציל','חצילים']},
  carrot:{labels:{en:'Carrots',fr:'Carottes',es:'Zanahorias',he:'גזר'},aliases:['carrot','carrots','carotte','carottes','zanahoria','zanahorias','גזר','גזרים']},
  onion:{labels:{en:'Onions',fr:'Oignons',es:'Cebollas',he:'בצל'},aliases:['onion','onions','oignon','oignons','cebolla','cebollas','בצל','בצלים']},
  garlic:{labels:{en:'Garlic',fr:'Ail',es:'Ajo',he:'שום'},aliases:['garlic','ail','ajo','ajos','שום']},
  lettuce:{labels:{en:'Lettuce',fr:'Salade',es:'Lechuga',he:'חסה'},aliases:['lettuce','salade','salades','lechuga','lechugas','חסה']},
  potato:{labels:{en:'Potatoes',fr:'Pommes de terre',es:'Patatas',he:'תפוחי אדמה'},aliases:['potato','potatoes','pomme de terre','pommes de terre','patata','patatas','papa','papas','תפוח אדמה','תפוחי אדמה']},
  apple:{labels:{en:'Apples',fr:'Pommes',es:'Manzanas',he:'תפוחים'},aliases:['apple','apples','pomme','pommes','manzana','manzanas','תפוח','תפוחים']},
  banana:{labels:{en:'Bananas',fr:'Bananes',es:'Plátanos',he:'בננות'},aliases:['banana','bananas','banane','bananes','plátano','platano','plátanos','platanos','בננה','בננות']},
  lemon:{labels:{en:'Lemons',fr:'Citrons',es:'Limones',he:'לימונים'},aliases:['lemon','lemons','citron','citrons','limón','limon','limones','לימון','לימונים']},
  orange:{labels:{en:'Oranges',fr:'Oranges',es:'Naranjas',he:'תפוזים'},aliases:['orange','oranges','naranja','naranjas','תפוז','תפוזים']},
  parsley:{labels:{en:'Parsley',fr:'Persil',es:'Perejil',he:'פטרוזיליה'},aliases:['parsley','persil','perejil','פטרוזיליה']},
  cilantro:{labels:{en:'Cilantro',fr:'Coriandre',es:'Cilantro',he:'כוסברה'},aliases:['cilantro','coriander','coriandre','כוסברה']},
  basil:{labels:{en:'Basil',fr:'Basilic',es:'Albahaca',he:'בזיליקום'},aliases:['basil','basilic','albahaca','בזיליקום']},
  avocado:{labels:{en:'Avocado',fr:'Avocat',es:'Aguacate',he:'אבוקדו'},aliases:['avocado','avocados','avocat','avocats','aguacate','aguacates','אבוקדו']},
  bell_pepper:{labels:{en:'Bell peppers',fr:'Poivrons',es:'Pimientos',he:'פלפלים'},aliases:['bell pepper','bell peppers','poivron','poivrons','pimiento','pimientos','פלפל','פלפלים']},
  mushroom:{labels:{en:'Mushrooms',fr:'Champignons',es:'Setas',he:'פטריות'},aliases:['mushroom','mushrooms','champignon','champignons','seta','setas','hongos','פטריה','פטריות']},
  mozzarella:{labels:{en:'Mozzarella',fr:'Mozzarella',es:'Mozzarella',he:'מוצרלה'},aliases:['mozzarella','מוצרלה']},
  cheese:{labels:{en:'Cheese',fr:'Fromage',es:'Queso',he:'גבינה'},aliases:['cheese','fromage','fromages','queso','quesos','גבינה','גבינות']},
  butter:{labels:{en:'Butter',fr:'Beurre',es:'Mantequilla',he:'חמאה'},aliases:['butter','beurre','mantequilla','חמאה']},
  yogurt:{labels:{en:'Yogurt',fr:'Yaourt',es:'Yogur',he:'יוגורט'},aliases:['yogurt','yoghurt','yaourt','yaourts','yogur','yogures','יוגורט']},
  cream:{labels:{en:'Cream',fr:'Crème',es:'Nata',he:'שמנת'},aliases:['cream','crème','creme','nata','שמנת']},
  chickpea:{labels:{en:'Chickpeas',fr:'Pois chiches',es:'Garbanzos',he:'חומוס'},aliases:['chickpea','chickpeas','pois chiche','pois chiches','garbanzo','garbanzos','חומוס']},
  coconut_milk:{labels:{en:'Coconut milk',fr:'Lait de coco',es:'Leche de coco',he:'חלב קוקוס'},aliases:['coconut milk','lait de coco','leche de coco','חלב קוקוס']},
  rice:{labels:{en:'Rice',fr:'Riz',es:'Arroz',he:'אורז'},aliases:['rice','riz','arroz','אורז']},
  pasta:{labels:{en:'Pasta',fr:'Pâtes',es:'Pasta',he:'פסטה'},aliases:['pasta','pâtes','pates','פסטה']},
  lasagna_sheets:{labels:{en:'Lasagna sheets',fr:'Pâtes à lasagnes',es:'Placas de lasaña',he:'דפי לזניה'},aliases:['lasagna sheets','lasagne sheets','pâtes à lasagnes','pates a lasagnes','placas de lasaña','placas de lasana','דפי לזניה']},
  flour:{labels:{en:'Flour',fr:'Farine',es:'Harina',he:'קמח'},aliases:['flour','farine','harina','קמח']},
  sugar:{labels:{en:'Sugar',fr:'Sucre',es:'Azúcar',he:'סוכר'},aliases:['sugar','sucre','azúcar','azucar','סוכר']},
  salt:{labels:{en:'Salt',fr:'Sel',es:'Sal',he:'מלח'},aliases:['salt','sel','sal','מלח']},
  olive_oil:{labels:{en:'Olive oil',fr:'Huile d’olive',es:'Aceite de oliva',he:'שמן זית'},aliases:["olive oil","huile d'olive",'huile d’olive','aceite de oliva','שמן זית']},
  mustard:{labels:{en:'Mustard',fr:'Moutarde',es:'Mostaza',he:'חרדל'},aliases:['mustard','moutarde','mostaza','חרדל']},
  bread:{labels:{en:'Bread',fr:'Pain',es:'Pan',he:'לחם'},aliases:['bread','pain','pan','לחם']},
  lentil:{labels:{en:'Lentils',fr:'Lentilles',es:'Lentejas',he:'עדשים'},aliases:['lentil','lentils','lentille','lentilles','lenteja','lentejas','עדשה','עדשים']},
};

function normalize(value:string):string{
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .toLocaleLowerCase()
    .trim()
    .replace(/\s+/g,' ');
}

const aliasToKey:Record<string,string>={};
for(const [key,entry] of Object.entries(lexicon)){
  aliasToKey[normalize(key)]=key;
  for(const alias of entry.aliases)aliasToKey[normalize(alias)]=key;
}

export function canonicalIngredientKey(value:string):string{
  const normalized=normalize(value);
  return aliasToKey[normalized]??normalized.replace(/[^\p{L}\p{N}]+/gu,'_').replace(/^_+|_+$/g,'');
}

export function localizedIngredientLabel(key:string|undefined|null,language:SupportedLanguage):string|null{
  if(!key)return null;
  return lexicon[key]?.labels[language]??null;
}

export function isKnownIngredientKey(key:string|undefined|null):boolean{
  return Boolean(key&&lexicon[key]);
}
