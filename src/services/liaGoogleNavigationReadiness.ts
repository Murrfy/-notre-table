import {runtimeConfig} from '../lib/runtimeConfig';
import {liaGoogleNavigationSdkAvailable,prepareLiaGoogleNavigation,requestLiaNavigationAlwaysPermission} from '../../modules/lia-navigation';

export type LiaGoogleNavigationReadiness=
  |{status:'ready'}
  |{status:'not_configured';reason:string}
  |{status:'sdk_unavailable'}
  |{status:'location_permission_denied'}
  |{status:'terms_declined'}
  |{status:'failed'};

export async function prepareLiaGoogleNavigationRuntime(companyName='Notre Table'):Promise<LiaGoogleNavigationReadiness>{
  if(!runtimeConfig.googleNavigation.enabled||!runtimeConfig.googleNavigation.iosApiKey){
    return{status:'not_configured',reason:runtimeConfig.googleNavigation.reason??'GOOGLE_NAVIGATION_NOT_CONFIGURED'};
  }
  if(!liaGoogleNavigationSdkAvailable())return{status:'sdk_unavailable'};
  const always=await requestLiaNavigationAlwaysPermission();
  if(!always)return{status:'location_permission_denied'};
  const prepared=await prepareLiaGoogleNavigation(runtimeConfig.googleNavigation.iosApiKey,companyName);
  if(prepared==='ready')return{status:'ready'};
  if(prepared==='terms_declined')return{status:'terms_declined'};
  if(prepared==='sdk_unavailable')return{status:'sdk_unavailable'};
  return{status:'failed'};
}
