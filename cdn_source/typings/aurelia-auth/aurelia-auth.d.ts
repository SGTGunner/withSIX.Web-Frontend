declare module 'aurelia-auth' {
    export class AuthService {
      authenticate(name: string, redirect?: string, userData?);
      isAuthenticated(): boolean;
      getTokenPayload(): string;
      logout(redirect?: string)
    }

    export class AuthorizeStep {}

    export class Authentication {
      getLoginRoute();
    }
}

declare module 'aurelia-auth/app.httpClient.config' {
  export default class HttpClientConfig {
    configure();
  }
}
