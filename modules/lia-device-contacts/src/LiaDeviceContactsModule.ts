import {NativeModule,requireOptionalNativeModule} from 'expo';
import type {LiaDeviceContact,LiaMessageComposeRequest} from './LiaDeviceContacts.types';

declare class LiaDeviceContactsNativeModule extends NativeModule {
  isAvailable():boolean;
  permissionStatus():string;
  requestPermission():Promise<boolean>;
  searchContacts(query:string):Promise<LiaDeviceContact[]>;
  isMessageComposerAvailable():boolean;
  composeMessage(request:LiaMessageComposeRequest):Promise<boolean>;
}

export default requireOptionalNativeModule<LiaDeviceContactsNativeModule>('LiaDeviceContacts');
