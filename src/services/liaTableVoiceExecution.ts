import {LiaResolvedTableTurn} from './liaTableSpeechAdapter';
import {processLiaTableTurnFromSpeech} from './liaTableTurnPipeline';
import {buildLiaTableCommand} from './liaTableCommand';
import {
  dispatchLiaTableCommand,
  LiaTableCommandHandlers,
  LiaTableCommandDispatchResult,
} from './liaTableCommandDispatcher';

export async function executeLiaTableVoiceTurn(input:{
  turn:LiaResolvedTableTurn;
  topicUnderstood:boolean;
  sensitive:boolean;
  organizerApprovedExternalAction:boolean;
  handlers:LiaTableCommandHandlers;
}):Promise<LiaTableCommandDispatchResult>{
  const pipeline=processLiaTableTurnFromSpeech(input);
  const command=buildLiaTableCommand({
    recognizedText:input.turn.text,
    pipeline,
  });
  return dispatchLiaTableCommand(command,input.handlers);
}
