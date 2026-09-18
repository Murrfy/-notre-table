export type LiaTableIntervention={
  at:number;
  topicKey:string|null;
  direct:boolean;
};

export type LiaTableInterventionHistory={
  items:LiaTableIntervention[];
};

export function createLiaTableInterventionHistory():LiaTableInterventionHistory{
  return{items:[]};
}

export function noteLiaTableIntervention(
  history:LiaTableInterventionHistory,
  intervention:LiaTableIntervention,
  now=intervention.at
):LiaTableInterventionHistory{
  const cutoff=now-20*60*1000;
  return{items:[...history.items.filter(x=>x.at>=cutoff),intervention]};
}

export function liaTableRhythmFromHistory(
  history:LiaTableInterventionHistory,
  now:number,
  topicKey:string|null
):{interventionsLast20Min:number;msSinceLastTopicContribution:number}{
  const recent=history.items.filter(x=>x.at>=now-20*60*1000&&!x.direct);
  const sameTopic=[...recent].reverse().find(x=>topicKey&&x.topicKey===topicKey);
  return{
    interventionsLast20Min:recent.length,
    msSinceLastTopicContribution:sameTopic?Math.max(0,now-sameTopic.at):Number.POSITIVE_INFINITY,
  };
}
