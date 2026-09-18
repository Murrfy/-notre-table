import type {CommanderPlace} from '../domain/commander';
import {runtimeConfig} from '../lib/runtimeConfig';
import {supabase} from '../lib/supabase';

function isStringArray(value:unknown):value is string[]{return Array.isArray(value)&&value.every(item=>typeof item==='string');}
function finite(value:unknown):value is number{return typeof value==='number'&&Number.isFinite(value);}
function validPlace(value:unknown):value is CommanderPlace{
  if(!value||typeof value!=='object')return false;
  const row=value as Record<string,unknown>;
  return typeof row.id==='string'&&typeof row.name==='string'&&isStringArray(row.categories)&&finite(row.latitude)&&finite(row.longitude)&&['open','closed','unknown','closing_soon'].includes(String(row.openState))&&['confirmed','unknown','unavailable'].includes(String(row.delivery));
}

export function configuredCommanderPlaceProvider(){
  const client=supabase;
  if(runtimeConfig.commanderLiveProvider!=='supabase-edge'||!client)return null;
  return {
    async search(context:{deliveryAddress:string;maxRadiusKm:number}):Promise<CommanderPlace[]>{
      const {data,error}=await client.functions.invoke('commander-search',{body:context});
      if(error)throw error;
      const rows=(data as {places?:unknown})?.places;
      if(!Array.isArray(rows))return [];
      return rows.filter(validPlace).map(row=>({...row,sponsored:false}));
    },
  };
}
