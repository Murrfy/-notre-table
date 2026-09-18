import NativeModule from './src/LiaNavigationModule';
import type {LiaGoogleNavigationPreparationStatus,LiaNavigationCoordinate} from './src/LiaNavigation.types';
export type {LiaGoogleNavigationPreparationStatus,LiaNavigationCoordinate} from './src/LiaNavigation.types';

export function liaNavigationLocationAvailable():boolean{return Boolean(NativeModule?.isAvailable?.());}
export function liaNavigationLocationAuthorizationStatus():string{return NativeModule?.authorizationStatus?.()??'unavailable';}
export async function requestLiaNavigationLocationPermission():Promise<boolean>{return NativeModule?NativeModule.requestWhenInUsePermission():false;}
export async function requestLiaNavigationAlwaysPermission():Promise<boolean>{return NativeModule?NativeModule.requestAlwaysPermission():false;}
export async function getLiaNavigationCurrentLocation():Promise<LiaNavigationCoordinate|null>{return NativeModule?NativeModule.currentLocation():null;}
export function liaGoogleNavigationSdkAvailable():boolean{return Boolean(NativeModule?.googleNavigationSdkAvailable?.());}
export async function prepareLiaGoogleNavigation(apiKey:string,companyName='Notre Table'):Promise<LiaGoogleNavigationPreparationStatus>{
  if(!NativeModule)return'sdk_unavailable';
  return NativeModule.prepareGoogleNavigation(apiKey,companyName);
}

export {LiaNavigationMapView} from './src/LiaNavigationMapView';
export type {LiaNavigationMapViewProps,LiaNavigationMapReadyEvent,LiaNavigationMapUnavailableEvent,LiaNavigationRouteStatusEvent,LiaNavigationProgressEvent,LiaNavigationArrivalEvent} from './src/LiaNavigationMapView';
