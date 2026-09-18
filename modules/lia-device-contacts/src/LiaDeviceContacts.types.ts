export type LiaDevicePhoneNumber={label:string|null;number:string};
export type LiaDeviceContact={id:string;displayName:string;phoneNumbers:LiaDevicePhoneNumber[]};
export type LiaMessageComposeRequest={recipients:string[];body:string};
