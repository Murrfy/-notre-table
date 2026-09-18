import React from 'react';
import type {ViewProps} from 'react-native';
import {requireNativeViewManager} from 'expo-modules-core';

export type LiaNavigationMapReadyEvent={sdk:'google-navigation'};
export type LiaNavigationMapUnavailableEvent={reason:'sdk_unavailable'};
export type LiaNavigationRouteStatusEvent={status:'started'|'failed';destination?:string;reason?:string};
export type LiaNavigationProgressEvent={etaSeconds:number;distanceMeters:number;roadName:string;instruction:string;stepDistanceMeters:number;navState:'enroute'|'rerouting'|'stopped'|'unknown';routeChanged:boolean};
export type LiaNavigationArrivalEvent={title:string;kind?:'stopover'|'final'};
export type LiaNavigationMapViewProps=ViewProps&{
  destinationLatitude?:number;
  destinationLongitude?:number;
  destinationPlaceId?:string;
  destinationTitle?:string;
  stopoverLatitude?:number;
  stopoverLongitude?:number;
  stopoverPlaceId?:string;
  stopoverTitle?:string;
  guidanceRequested?:boolean;
  onReady?:(event:{nativeEvent:LiaNavigationMapReadyEvent})=>void;
  onUnavailable?:(event:{nativeEvent:LiaNavigationMapUnavailableEvent})=>void;
  onRouteStatus?:(event:{nativeEvent:LiaNavigationRouteStatusEvent})=>void;
  onProgress?:(event:{nativeEvent:LiaNavigationProgressEvent})=>void;
  onArrival?:(event:{nativeEvent:LiaNavigationArrivalEvent})=>void;
};

const NativeView:React.ComponentType<LiaNavigationMapViewProps>=requireNativeViewManager('LiaNavigation');
export function LiaNavigationMapView(props:LiaNavigationMapViewProps){return <NativeView {...props}/>;}
