import {AppState,Platform} from 'react-native';
import {File,Paths} from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import {addLiaNativeAudioRuntimeListener,liaNativeAudioRuntimeStatus,type LiaNativeAudioRuntimeStatus} from '../../modules/lia-sound-analysis';

export type LiaAudioDiagnosticSnapshot=LiaNativeAudioRuntimeStatus&{appState:string;platform:string};
export type LiaAudioDiagnosticTraceEntry={capturedAt:string;snapshot:LiaAudioDiagnosticSnapshot};
export type LiaAudioDiagnosticReport={
  formatVersion:1;
  checkpoint:'V0.253';
  generatedAt:string;
  latest:LiaAudioDiagnosticSnapshot|null;
  trace:LiaAudioDiagnosticTraceEntry[];
};

const TRACE_LIMIT=80;
const trace:LiaAudioDiagnosticTraceEntry[]=[];

function record(snapshot:LiaAudioDiagnosticSnapshot){
  const previous=trace[trace.length-1]?.snapshot;
  const same=previous&&JSON.stringify(previous)===JSON.stringify(snapshot);
  if(same)return;
  trace.push({capturedAt:new Date().toISOString(),snapshot});
  if(trace.length>TRACE_LIMIT)trace.splice(0,trace.length-TRACE_LIMIT);
}

export function getLiaAudioDiagnosticSnapshot():LiaAudioDiagnosticSnapshot|null{
  const native=liaNativeAudioRuntimeStatus();
  if(!native)return null;
  const snapshot={...native,appState:AppState.currentState,platform:Platform.OS};
  record(snapshot);
  return snapshot;
}

export function addLiaAudioDiagnosticListener(listener:(snapshot:LiaAudioDiagnosticSnapshot)=>void){
  const nativeSub=addLiaNativeAudioRuntimeListener(event=>{
    const snapshot={...event,appState:AppState.currentState,platform:Platform.OS};
    record(snapshot);
    listener(snapshot);
  });
  const appSub=AppState.addEventListener('change',()=>{
    const current=getLiaAudioDiagnosticSnapshot();
    if(current)listener(current);
  });
  return {remove(){nativeSub?.remove();appSub.remove();}};
}

export function getLiaAudioDiagnosticReport():LiaAudioDiagnosticReport{
  return {
    formatVersion:1,
    checkpoint:'V0.253',
    generatedAt:new Date().toISOString(),
    latest:getLiaAudioDiagnosticSnapshot(),
    trace:[...trace],
  };
}

export async function shareLiaAudioDiagnosticReport():Promise<string>{
  const report=getLiaAudioDiagnosticReport();
  const timestamp=new Date().toISOString().replace(/[:.]/g,'-');
  const file=new File(Paths.cache,`lia-iphone-audio-test-${timestamp}.json`);
  file.create({overwrite:true,intermediates:true});
  file.write(JSON.stringify(report,null,2));
  if(!(await Sharing.isAvailableAsync()))throw new Error('SHARING_UNAVAILABLE');
  await Sharing.shareAsync(file.uri,{mimeType:'application/json',UTI:'public.json',dialogTitle:'LIA iPhone audio test'});
  return file.uri;
}

export function clearLiaAudioDiagnosticTrace(){trace.splice(0,trace.length);}
