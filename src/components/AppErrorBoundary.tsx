import React from 'react';
import { RecoveryScreen } from './RecoveryScreen';
import { useLocale } from '../context/LocaleContext';

type BoundaryProps={children:React.ReactNode};
type BoundaryState={error:Error|null;resetKey:number};

export class AppErrorBoundary extends React.Component<BoundaryProps,BoundaryState>{
  state:BoundaryState={error:null,resetKey:0};

  static getDerivedStateFromError(error:Error):BoundaryState{
    return {error,resetKey:0};
  }

  componentDidCatch(error:Error,info:React.ErrorInfo){
    if(__DEV__)console.error('Notre Table render failure',error,info.componentStack);
  }

  private reset=()=>this.setState(state=>({error:null,resetKey:state.resetKey+1}));

  render(){
    if(this.state.error)return <UnexpectedFailure onRetry={this.reset}/>;
    return <React.Fragment key={this.state.resetKey}>{this.props.children}</React.Fragment>;
  }
}

function UnexpectedFailure({onRetry}:{onRetry:()=>void}){
  const locale=useLocale();
  return <RecoveryScreen
    title={locale.t('recovery.unexpectedTitle')}
    message={locale.t('recovery.unexpectedText')}
    primaryLabel={locale.t('recovery.retry')}
    onPrimary={onRetry}
  />;
}
