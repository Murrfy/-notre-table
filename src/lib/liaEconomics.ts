export type LiaUsage = {
  inputTokens?: number;
  outputTokens?: number;
  webSearches?: number;
  transcriptionMinutes?: number;
  ttsCharacters?: number;
  imageAnalyses?: number;
  otherUsd?: number;
};

export type LiaCostRates = {
  inputUsdPerMillionTokens: number;
  outputUsdPerMillionTokens: number;
  webSearchUsd: number;
  transcriptionUsdPerMinute: number;
  ttsUsdPerMillionCharacters: number;
  imageAnalysisUsd: number;
};

export type LiaCostBand = 'normal' | 'economize' | 'protect_margin';

// Business guardrail, not a user-facing quota. The user keeps the same LIA;
// routing/model choice changes behind the scenes before essential help is ever cut.
export const LIA_MONTHLY_COST_TARGET_USD = 1;
export const LIA_ECONOMIZE_AT_USD = 0.75;
export const LIA_PROTECT_MARGIN_AT_USD = 1;

const nonNegative = (value: number | undefined) => Math.max(0, Number.isFinite(value) ? Number(value) : 0);

export function estimateLiaUsageUsd(usage: LiaUsage, rates: LiaCostRates): number {
  const input = nonNegative(usage.inputTokens) / 1_000_000 * nonNegative(rates.inputUsdPerMillionTokens);
  const output = nonNegative(usage.outputTokens) / 1_000_000 * nonNegative(rates.outputUsdPerMillionTokens);
  const search = nonNegative(usage.webSearches) * nonNegative(rates.webSearchUsd);
  const transcription = nonNegative(usage.transcriptionMinutes) * nonNegative(rates.transcriptionUsdPerMinute);
  const tts = nonNegative(usage.ttsCharacters) / 1_000_000 * nonNegative(rates.ttsUsdPerMillionCharacters);
  const images = nonNegative(usage.imageAnalyses) * nonNegative(rates.imageAnalysisUsd);
  const other = nonNegative(usage.otherUsd);
  return input + output + search + transcription + tts + images + other;
}

export function liaCostBand(monthToDateUsd: number): LiaCostBand {
  const cost = nonNegative(monthToDateUsd);
  if (cost >= LIA_PROTECT_MARGIN_AT_USD) return 'protect_margin';
  if (cost >= LIA_ECONOMIZE_AT_USD) return 'economize';
  return 'normal';
}

export function liaMayUseExpensiveRoute({
  monthToDateUsd,
  essential,
  complexity,
}:{
  monthToDateUsd:number;
  essential:boolean;
  complexity:'simple'|'complex';
}):boolean{
  if(essential) return true;
  const band=liaCostBand(monthToDateUsd);
  if(band==='protect_margin') return false;
  if(band==='economize') return complexity==='complex';
  return true;
}

export function projectedMonthlyLiaCostUsd(activeHouseholds:number,averageUsdPerHousehold:number):number{
  return nonNegative(activeHouseholds)*nonNegative(averageUsdPerHousehold);
}
