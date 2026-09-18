export type LiaTableRequestSignals={
  research:boolean;
  reminder:boolean;
  action:boolean;
};

export function detectLiaTableRequestSignals(text:string):LiaTableRequestSignals{
  const s=text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,' ');
  return{
    research:/\b(cherche|recherche|trouve|renseigne|regarde si|verifie)\b/.test(s),
    reminder:/\b(rappelle[- ]moi|rappelle nous|n'oublie pas de me rappeler|pense a me rappeler)\b/.test(s),
    action:/\b(prepare|ajoute|mets|commande|reserve)\b/.test(s),
  };
}
