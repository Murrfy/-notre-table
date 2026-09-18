import {getLiaNavigationCurrentLocation,liaNavigationLocationAuthorizationStatus,liaNavigationLocationAvailable,requestLiaNavigationLocationPermission,type LiaNavigationCoordinate} from '../../modules/lia-navigation';

export type LiaNavigationLocationResult=
  |{status:'ready';location:LiaNavigationCoordinate}
  |{status:'permission_denied'}
  |{status:'unavailable'}
  |{status:'location_unavailable'};

export async function prepareLiaNavigationOrigin():Promise<LiaNavigationLocationResult>{
  if(!liaNavigationLocationAvailable())return{status:'unavailable'};
  const status=liaNavigationLocationAuthorizationStatus();
  const granted=status==='granted_when_in_use'||status==='granted_always'||await requestLiaNavigationLocationPermission();
  if(!granted)return{status:'permission_denied'};
  const location=await getLiaNavigationCurrentLocation();
  return location?{status:'ready',location}:{status:'location_unavailable'};
}
