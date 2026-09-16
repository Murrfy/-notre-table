export class TimeoutError extends Error {
  readonly timeoutMs:number;
  constructor(timeoutMs:number){
    super(`Operation timed out after ${timeoutMs}ms`);
    this.name='TimeoutError';
    this.timeoutMs=timeoutMs;
  }
}

export async function withTimeout<T>(promise:Promise<T>,timeoutMs:number):Promise<T>{
  let timer:ReturnType<typeof setTimeout>|undefined;
  try{
    return await Promise.race([
      promise,
      new Promise<T>((_resolve,reject)=>{
        timer=setTimeout(()=>reject(new TimeoutError(timeoutMs)),timeoutMs);
      }),
    ]);
  }finally{
    if(timer)clearTimeout(timer);
  }
}
