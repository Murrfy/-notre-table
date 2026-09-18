import {stripLiaKnownDirectName} from '../lib/liaIdentity';

export type LiaDirectAddress={
  addressed:boolean;
  cleanedText:string;
};

export function detectLiaDirectAddress(text:string,names:ReadonlyArray<string>=['LIA']):LiaDirectAddress{
  const result=stripLiaKnownDirectName(text,names);
  const cleanedText=result.cleanedText;
  return{addressed:cleanedText.length>0&&result.directAddressed,cleanedText};
}
