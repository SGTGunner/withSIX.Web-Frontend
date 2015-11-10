import {HttpClient} from 'aurelia-http-client';

import IUserInfo = MyApp.IUserInfo;
import UserInfo = MyApp.EntityExtends.UserInfo;

export class AbortError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export class LoginBase {
  static refreshToken = 'aurelia_refreshToken';
  static idToken = 'aurelia_id_token';
  static token = 'aurelia_token';
  constructor(private http: HttpClient, private w6Urls: W6Urls) {}
  async handleRefreshToken() {
    var refreshToken = window.localStorage[LoginBase.refreshToken];
    if (!refreshToken) return false;
    try {
      var r = await this.http.post(this.w6Urls.authSsl + "/api/login/refresh", {refreshToken: refreshToken, clientId: 'withsix-spa'}); /* authConfig.providers.localIdentityServer.clientId */
      window.localStorage[LoginBase.refreshToken] = r.content.refresh_token;
      window.localStorage[LoginBase.token] = r.content.token;
      window.localStorage[LoginBase.idToken] = r.content.id_token;
      return true;
    } catch (err) {
      Tk.Debug.error("Error trying to use refresh token", err);
      // TODO: Wait for X amount of delay, then see if we actually have a valid refresh token (other tab)
      throw err;
    }
  }

  static redirect(url) {
    Tk.Debug.log("$$$ redirecting", url);
    window.location.href = url;
    throw new AbortError("Redirecting to " + url);
  }

  redirect(url) { LoginBase.redirect(url); }

  async getUserInfo(): Promise<IUserInfo> {
      let userInfo = await this.getUserInfoInternal();
      if (!userInfo) userInfo = new MyApp.EntityExtends.UserInfo();
      let hasSslRedir = window.location.hash.includes('sslredir=1');
      if (userInfo.isPremium) {
        let isSsl = window.location.protocol === 'https:';
        if (userInfo.isPremium && !isSsl && !hasSslRedir) {
          var httpsUrl = "https:" + window.location.href.substring(window.location.protocol.length);
          httpsUrl = httpsUrl.includes('#') ? httpsUrl + "&sslredir=1" : httpsUrl + "#sslredir=1";
          httpsUrl = httpsUrl.replace(":9000", ":9001");
          this.redirect(httpsUrl); //w6Urls.connectSsl.replace(":9001", "") + '/login/redirect2?ReturnUrl=' + encodeURIComponent(httpsUrl);
          throw new Error("need ssl redir");
        }
      }
      if (hasSslRedir) {
        history.replaceState("", document.title, window.location.pathname + window.location.search + window.location.hash.replace("&sslredir=1", "").replace("#sslredir=1", ""));
        window.w6Cheat.redirected = true;
      }
      return userInfo;
  }

  clearRefreshToken() { window.localStorage.removeItem(LoginBase.refreshToken); }
  clearToken() { window.localStorage.removeItem(LoginBase.token); }
  clearIdToken() { window.localStorage.removeItem(LoginBase.idToken); }

  clearLoginInfo() {
    this.clearRefreshToken();
    this.clearToken();
  }

  buildLogoutParameters() { return window.localStorage[LoginBase.idToken] ? ("?id_token_hint=" + window.localStorage[LoginBase.idToken] + "&post_logout_redirect_uri=" + encodeURI(window.location.href)) : ""; }

  async getUserInfoInternal(): Promise<IUserInfo> {
    var hasLogout = window.location.search.includes('?logout=1');
    if (hasLogout) {
      this.clearLoginInfo();
      history.replaceState("", document.title, window.location.pathname + window.location.search.replace("&logout=1", "").replace("?logout=1", "") + window.location.hash);
      this.redirect(this.w6Urls.authSsl + "/identity/connect/endsession" + this.buildLogoutParameters());
      throw new Error("have to logout");
    }

    if (window.six_client && window.six_client.get_api_key)
      window.localStorage[LoginBase.token] = window.six_client.get_api_key();

    let token = window.localStorage[LoginBase.token];
    if (!token) {
      this.clearIdToken();
      return null;
    }
    var isValid = false;
    isValid = !Tools.isTokenExpired(token);
    if (!isValid) {
      Tk.Debug.log("token is not valid")
      try {
        await this.handleRefreshToken();
      } catch (err) {
        throw new Error("Expired token");
      }
    }
    // TODO: add #login=1 etc, to prevent endless loops?

    //var http = new HttpClient();
    //http.configure(x => x.withHeader("Authorization", 'Bearer ' + window.localStorage[LoginBase.token]));
    var req = <any>this.http.createRequest(this.w6Urls.authSsl + '/identity/connect/userinfo');
    var response = await req.withHeader("Authorization", 'Bearer ' + window.localStorage[LoginBase.token]).asGet().send();
    var roles = typeof (response.content["role"]) == "string" ? [response.content["role"]] : response.content["role"];

    let uInfo = {
      id: response.content["sub"],
      userName: response.content["preferred_username"],
      slug: response.content["preferred_username"].sluggifyEntityName(),
      displayName: response.content["nickname"],
      firstName: response.content["given_name"],
      lastName: response.content["family_name"],
      avatarURL: response.content["withsix:avatar_url"],
      hasAvatar: response.content["withsix:has_avatar"],
      avatarUpdatedAt: new Date(response.content["withsix:avatar_updated_at"]),
      emailMd5: response.content["withsix:email_md5"],
      roles: roles,
      isAdmin: roles.indexOf("admin") > -1,
      isManager: roles.indexOf("manager") > -1,
      isPremium: roles.indexOf("premium") > -1
    };

    let userInfo = new MyApp.EntityExtends.UserInfo();
    angular.extend(userInfo, uInfo);
    return userInfo;
  }
}
