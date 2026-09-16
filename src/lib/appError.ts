export type AppErrorCode =
  | 'recipe.import.unreachable'
  | 'recipe.import.refused'
  | 'recipe.import.noStructuredRecipe'
  | 'recipe.photo.noUsableTitle'
  | 'recipe.photo.ocrNotConfigured'
  | 'recipe.photo.prepareFailed'
  | 'recipe.photo.ocrUnavailable';

export class AppError extends Error {
  readonly code:AppErrorCode;
  readonly meta:Record<string,string|number>;
  constructor(code:AppErrorCode,meta:Record<string,string|number>={}){
    super(code);
    this.name='AppError';
    this.code=code;
    this.meta=meta;
  }
}

export function asAppError(error:unknown):AppError|null{
  if(error instanceof AppError)return error;
  if(error&&typeof error==='object'&&'code' in error&&typeof (error as any).code==='string'){
    const code=(error as any).code as AppErrorCode;
    if(code.startsWith('recipe.'))return new AppError(code,(error as any).meta??{});
  }
  return null;
}
