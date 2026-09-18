import {liaDeviceContactsModuleAvailable,liaDeviceContactsPermissionStatus,requestLiaDeviceContactsPermission,searchLiaDeviceContacts} from '../../modules/lia-device-contacts';
import type {LiaPhoneContact} from '../lib/liaPhoneContactResolver';

export interface LiaPhoneContactsAdapter{
  isAvailable():boolean;
  permissionStatus():string;
  requestPermission():Promise<boolean>;
  search(query:string):Promise<LiaPhoneContact[]>;
}

const nativeAdapter:LiaPhoneContactsAdapter={
  isAvailable:()=>liaDeviceContactsModuleAvailable(),
  permissionStatus:()=>liaDeviceContactsPermissionStatus(),
  requestPermission:()=>requestLiaDeviceContactsPermission(),
  search:query=>searchLiaDeviceContacts(query),
};
let overrideAdapter:LiaPhoneContactsAdapter|null=null;
export function registerLiaPhoneContactsAdapter(adapter:LiaPhoneContactsAdapter|null):void{overrideAdapter=adapter;}
export function getLiaPhoneContactsAdapter():LiaPhoneContactsAdapter|null{
  const candidate=overrideAdapter??nativeAdapter;
  return candidate.isAvailable()?candidate:null;
}
export function liaPhoneContactsAvailable():boolean{return Boolean(getLiaPhoneContactsAdapter());}
