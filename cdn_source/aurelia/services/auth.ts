import {UiContext} from './viewmodel';
import {HttpClient} from 'aurelia-http-client';
import {inject} from 'aurelia-framework';
import {AuthService} from 'aurelia-auth';
import {LoginBase} from './auth-base';

@inject(AuthService, UiContext, HttpClient)
export class Login extends LoginBase {
  constructor(public authService: AuthService, private ui: UiContext, http: HttpClient) { super(http, ui.w6.url); }
  async login(path?) {
    try {
      if (this.ui.w6.isClient) {
        this.ui.w6.client.login();
        return;
      }
      var url = path ? (window.location.protocol + '//' + window.location.host + path) : window.location.href;
      Tk.Debug.log("logging in, return: ", url);
      if (await this.handleRefreshToken()) {
        this.redirect(url);
        return;
      }

      var response = await this.authService.authenticate('localIdentityServer');
      window.localStorage[LoginBase.refreshToken] = response.content.refresh_token;
      window.localStorage[LoginBase.idToken] = response.content.id_token;
      this.redirect(url);
      return;
    } catch (err) {
      if (err && err.data == "Provider Popup Blocked")
        // TODO: Reconfigure without popup but redirect?
        if (await this.ui.toastr.error("Popup blocked, please allow the login popup in your browser", "Failed to login")) await this.login(path);
      else
        this.ui.toastr.error("Unknown error", "Failed to login");
      throw err;
    }
  }

  logout() {
      this.clearRefreshToken();
      this.authService.logout(this.ui.w6.url.urlNonSsl + "?logout=1")
  }
}
