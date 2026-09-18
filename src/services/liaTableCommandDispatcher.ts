import {LiaTableCommand} from './liaTableCommand';

export type LiaTableCommandHandlers={
  reply?:(text:string)=>Promise<void>|void;
  clarify?:(text:string)=>Promise<void>|void;
  research?:(query:string)=>Promise<void>|void;
  reminder?:(request:string)=>Promise<void>|void;
  prepareAction?:(request:string)=>Promise<void>|void;
};

export type LiaTableCommandDispatchResult='handled'|'unavailable'|'ignored';

export async function dispatchLiaTableCommand(
  command:LiaTableCommand,
  handlers:LiaTableCommandHandlers
):Promise<LiaTableCommandDispatchResult>{
  switch(command.type){
    case'none':return'ignored';
    case'reply':
      if(!handlers.reply)return'unavailable';
      await handlers.reply(command.text); return'handled';
    case'clarify':
      if(!handlers.clarify)return'unavailable';
      await handlers.clarify(command.text); return'handled';
    case'research':
      if(!handlers.research)return'unavailable';
      await handlers.research(command.query); return'handled';
    case'reminder':
      if(!handlers.reminder)return'unavailable';
      await handlers.reminder(command.request); return'handled';
    case'prepare_action':
      if(!handlers.prepareAction)return'unavailable';
      await handlers.prepareAction(command.request); return'handled';
  }
}
