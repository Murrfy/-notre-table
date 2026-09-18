import {createLiaMemo,LiaMemoLink} from './memos';
import {LiaTableResearchResultState} from './liaTableResearchResult';

export async function saveAcceptedTableResultToMemo(input:{
  researchState:LiaTableResearchResultState;
  title:string;
  summary:string;
  link?:LiaMemoLink|null;
  demo?:boolean;
}){
  if(input.researchState!=='memo_saved')return null;
  return createLiaMemo({
    title:input.title,
    summary:input.summary,
    link:input.link??null,
  },input.demo??false);
}
