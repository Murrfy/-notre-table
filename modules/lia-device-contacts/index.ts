import NativeModule from './src/LiaDeviceContactsModule';
import type {LiaDeviceContact,LiaMessageComposeRequest} from './src/LiaDeviceContacts.types';
export type {LiaDeviceContact,LiaDevicePhoneNumber,LiaMessageComposeRequest} from './src/LiaDeviceContacts.types';

export function liaDeviceContactsModuleAvailable():boolean{return Boolean(NativeModule?.isAvailable?.());}
export function liaDeviceContactsPermissionStatus():string{return NativeModule?.permissionStatus?.()??'unavailable';}
export async function requestLiaDeviceContactsPermission():Promise<boolean>{return NativeModule?NativeModule.requestPermission():false;}
export async function searchLiaDeviceContacts(query:string):Promise<LiaDeviceContact[]>{
  const clean=query.trim();
  if(!NativeModule||!clean)return[];
  return NativeModule.searchContacts(clean);
}
export function liaDeviceMessageComposerAvailable():boolean{return Boolean(NativeModule?.isMessageComposerAvailable?.());}
export async function composeLiaDeviceMessage(request:LiaMessageComposeRequest):Promise<boolean>{return NativeModule?NativeModule.composeMessage(request):false;}
