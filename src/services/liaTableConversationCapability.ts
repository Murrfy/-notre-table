import {liaTableSpeechAvailable} from './liaTableSpeechAdapter';
import {liaTableResponseAvailable} from './liaTableResponseAdapter';
export function liaTableConversationAvailable():boolean{return liaTableSpeechAvailable()&&liaTableResponseAvailable();}
