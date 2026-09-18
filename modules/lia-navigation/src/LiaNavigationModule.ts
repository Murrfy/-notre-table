import {NativeModule,requireOptionalNativeModule} from 'expo';
import type {LiaGoogleNavigationPreparationStatus,LiaNavigationCoordinate} from './LiaNavigation.types';

declare class LiaNavigationNativeModule extends NativeModule {
  isAvailable():boolean;
  authorizationStatus():string;
  requestWhenInUsePermission():Promise<boolean>;
  requestAlwaysPermission():Promise<boolean>;
  currentLocation():Promise<LiaNavigationCoordinate|null>;
  googleNavigationSdkAvailable():boolean;
  prepareGoogleNavigation(apiKey:string,companyName:string):Promise<LiaGoogleNavigationPreparationStatus>;
}

export default requireOptionalNativeModule<LiaNavigationNativeModule>('LiaNavigation');
