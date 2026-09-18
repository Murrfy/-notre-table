import {Linking} from 'react-native';
import {sanitizeLiaPhoneNumber} from '../lib/liaPhoneContactResolver';
import {markLiaExternalHandoff} from './liaAssistantContinuity';

export async function openLiaPhoneDialer(phoneNumber:string):Promise<boolean>{
  const clean=sanitizeLiaPhoneNumber(phoneNumber);
  if(!clean)return false;
  const url=`tel:${clean}`;
  if(!(await Linking.canOpenURL(url)))return false;
  markLiaExternalHandoff('phone');
  await Linking.openURL(url);
  return true;
}
