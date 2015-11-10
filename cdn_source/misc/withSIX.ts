interface JQuery {
  redactor(options): any;
}

interface JQueryStatic {
  validator: any;
}

interface IAvatarInfo {
  avatarURL: string;
  avatarUpdatedAt: string;
  hasAvatar: boolean;
  emailMd5: string;
}

declare var googletag: any;
declare var Markdown: any;

enum Sites {
  Main,
  Play,
  Connect
}

class W6Urls {
    urlNonSsl: string;
  constructor(urls) {
    Tools.handleOverrides(this, urls);
    var siteSuffix = "withSIX";
    if (this.site)
      siteSuffix = this.site.toUpperCaseFirst() + " " + siteSuffix;
    this.siteTitle = siteSuffix;

    this.setupDomain();

    this.contentCdn = "//" + this.buckets["withsix-usercontent"];
    this.docsCdn = "//cdn2.withsix.com";
  }

  get selectedSite() {
    // todo: Use routing table instead??!
    var path = window.location.pathname;
    if (path == "/p" || path.startsWith("/p/"))
      return Sites.Play;
    if (path == "/me" || path.startsWith("/me/"))
      return Sites.Connect;
    if (path == "/u" || path.startsWith("/u/"))
      return Sites.Connect;
    if (path == "/login" || path == "/register")
      return Sites.Connect;
    return Sites.Main;
  }

  get redirectUrl() { return encodeURIComponent(this.currentPage); }

  get isRoot() { return window.location.pathname == "/"; }

  environment: Tk.Environment;

  private toSsl(host) { return host.replace(":9000", ":9001"); }
  private fromSsl(host) { return host.replace(":9001", ":9000"); }

  public navigate($event, url) {
    $event.preventDefault();
    window.location.href = url;
  }

  private setupDomain() {
    this.currentSite = "//" + window.location.host;
    var host = this.domain;
    if (window.location.port && window.location.port != "80" && window.location.port != "443")
      host = host + ":" + window.location.port;

    // TODO: localhost port variations or better go domains??
    this.url = "//" + host;
    this.urlSsl = "https:" + this.toSsl(this.url);
    this.urlNonSsl = "http:" + this.fromSsl(this.url);
    this.main = "";
    this.play = "/p";
    this.connect = this.main;
    this.connectSsl = this.urlSsl;

    var auth = "//auth." + this.domain;
    this.authSsl = "https:" + this.toSsl(auth);

    var apiPrefix = "auth.";
    var api = "//" + apiPrefix + this.domain;
    this.api = "https:" + this.toSsl(api) + "/api";

    var wsPrefix = this.environment == Tk.Environment.Staging ? "api." : "api2.";
    var ws = "//" + wsPrefix + this.domain;
    this.ws = "https:" + this.toSsl(ws) + "/signalr";

    this.cdn = this.url + '/cdn';
    if (window.assetHash && window.assetHash["cdn"])
      this.cdn = window.assetHash["cdn"];

  }

  public getUserUrl = (user: any): string => { return this.getUserSlugUrl(user.slug); };
  public getUserSlugUrl = (userSlug: string): string => { return this.connect + "/u/" + userSlug; };
  public calculateAvatarUrl = (model: IAvatarInfo, size?) => {
    if (!size) size = 72;
    return model.hasAvatar ? this.getCustomAvatarUrl(model, size) : this.getGravatarUrl(model, size);
  };

  // TODO: Images should get added to manifest etc..
  public getSerialUrl(asset) { return this. getAssetUrl(asset); }
  public getAssetUrl(asset) {
    var hashed = this.getAssetHashed(asset);
    return this.cdn + '/' + (hashed || asset);
  }
  getAssetHashed(asset) { return window.assetHash && window.assetHash[asset] };

  public getUsercontentUrl(asset: string, updatedAt?: Date) {
    asset = this.processAssetVersion(asset, updatedAt);
    return this.contentCdn + '/' + asset;
  }

  public getUsercontentUrl2(asset: string, updatedAt?: Date) {
    asset = this.processAssetVersion(asset, updatedAt);
    return Tools.uriHasProtocol(asset) ? asset : this.contentCdn + '/' + asset;
  }

  public getContentAvatarUrl(avatar: string, updatedAt?: Date): string {
    if (!avatar || avatar == "")
      return null;
    return this.getUsercontentUrl2(avatar, updatedAt);
  }

  public processAssetVersion(avatar: string, updatedAt?: Date): string {
    if (avatar == null)
      return null;
    if (!updatedAt)
      return avatar;
    return avatar + "?" + Math.round(updatedAt.getTime() / 1000);
  }

  // TODO: Convert to CDNUrl (currently AzureCDN)
  private getGravatarUrl(model: IAvatarInfo, size?) {
    return "//www.gravatar.com/avatar/" + model.emailMd5 +
      "?size=" + size + "&amp;d=%2f%2faz667488.vo.msecnd.net%2fimg%2favatar%2fnoava_" + size + ".jpg";
  }

  // TODO: Date.parse seems to be inaccurate...
  private getCustomAvatarUrl(model: IAvatarInfo, size?) {
    var v = model.avatarUpdatedAt ? ("?v=" + Date.parse(model.avatarUpdatedAt)) : "";
    //this.contentCdn + "/account/" + model.id + "/profile/avatar/"
    return model.avatarURL + size + "x" + size + ".jpg" + v;
  }

  defaultContentImage = 'https://cdn4.iconfinder.com/data/icons/defaulticon/icons/png/256x256/help.png';

  domain: string;
  serial: string;
  authSsl: string;
  url: string;
  urlSsl: string;
  connectSsl: string;
  connect: string;
  play: string;
  kb: string;
  admin: string;
  main: string;
  api: string;
  ws: string;
  cacheBuster: string;
  site: string;
  contentCdn: string;
  cdn: string;
  docsCdn: string;
  buckets: {
    [key: string]: string;
  };
  siteTitle: string;
  currentPage: string;
  currentSite: string;
}

class W6Ads {
  constructor(private url: W6Urls) {
    this.adsenseId = "ca-pub-8060864068276104";

    this.slots = <any>{
      "main_leaderboard_atf": 9799381642,
      "main_leaderboard_btf": 2276114842,
      "main_rectangle_atf": 6845915243,
      "main_rectangle_btf": 8322648446,
      "main_skyscraper_atf": 3752848047,
      "main_skyscraper_btf": 5229581246,
      "connect_leaderboard_atf": 9799381642,
      "connect_leaderboard_btf": 2276114842,
      "connect_rectangle_atf": 6845915243,
      "connect_rectangle_btf": 8322648446,
      "connect_skyscraper_atf": 3752848047,
      "connect_skyscraper_btf": 5229581246,
      "play_leaderboard_atf": 3613247242,
      "play_leaderboard_btf": 5089980446,
      "play_rectangle_atf": 9659780847,
      "play_rectangle_btf": 2136514044,
      "play_skyscraper_atf": 6706314446,
      "play_skyscraper_btf": 8183047642,
      play: {
        "hz_large": 6485988441,
        "hz_medium": 7962721641,
        "vt_xlarge": 9439454845,
        "vt_large": 1916188043,
        "vt_medium": 3392921241,
        "vt_small": 4869654448
      },
      main: {
        "hz_large": 6346387644,
        "hz_medium": 9299854041,
        "vt_xlarge": 3253320446,
        "vt_large": 4730053648,
        "vt_medium": 7683520042,
        "vt_small": 3113719643
      },
      connect: {

      }
    }
  }

  defineSlot(slot: string, tag: string, sizes: any[][]) {
    var adSlot = googletag.defineSlot("/" + this.adsenseId + "/" + slot, sizes, tag).addService(googletag.pubads());
    var mapping = googletag.sizeMapping();
    sizes.forEach(v => mapping = mapping.addSize(v[0], v[1]));
    mapping.build();

    var resolutions = [];
    sizes.forEach(v => resolutions.push(v[0]));

    adSlot.defineSizeMapping(mapping);
    adSlot.set('adsense_channel_ids', this.slots[slot]);

    googletag.sbNgTags.push([adSlot, resolutions]);
  }

  check = () => {
    if (window.location.protocol == 'https:' || document.location.protocol == 'https:') {
      $('.add-container').empty();
    } else {
      // Refresh
      $(".add-container.add-b").each((e, t) => {
        var adEl = $(t).find("div");
        this.placeAltAd(adEl);
      });

      setTimeout(() => {
        // Find new with 0 height..
        $(".add-container").each((e, t) => {
          var $t = $(t);
          if ($t.hasClass("add-b"))
            return;
          var adEl = $t.find("div");
          if (adEl.height() == 0) {
            this.placeAltAd(adEl);
            $t.addClass('add-b');
          }
        });
      }, 5000);
    }
  };
  placeAltAd = container => {
    if (container.hasClass('add-leaderboard')) {
      this.generateAltLeaderboardAd(container);
    } else if (container.hasClass('add-skyscraper')) {
      this.generateAltSkyscraperAd(container);
    } else {
      this.generateAltRectangleAd(container);
    }
  };
  generateAltLeaderboardAd = container => {
    var adWidth = container.width();
    var img;
    if (adWidth >= 970) {
      img = '97090.png';
    } else if (adWidth >= 728) {
      img = '72890.png';
    } else if (adWidth >= 468) {
      img = '46860.png';
    } else if (adWidth >= 320) {
      img = '32050.png';
    } else {
      img = '125125.png';
    }

    this.appendHtml(container, img);
  };
  generateAltSkyscraperAd = container => {
    var adWidth = container.width();
    var img;
    if (adWidth >= 160) {
      img = '160600.png';
    } else {
      img = '120600.png';
    }

    this.appendHtml(container, img);
  };
  generateAltRectangleAd = container => {
    var adWidth = container.width();
    var parentHeight = 280;
    // Workaround for height in grid..
    var isGrid = container.hasClass('grid-add');
    if (isGrid)
      parentHeight = container.parent().parent().height();

    var img;
    if (adWidth >= 336 && parentHeight >= 280) {
      img = '336280.png';
    } else if (adWidth >= 300 && parentHeight >= 250) {
      img = '300250.png';
    } else if (adWidth >= 250 && parentHeight >= 250) {
      img = '250250.png';
    } else if (adWidth >= 200 && parentHeight >= 200) {
      img = '200200.png';
    } else if (adWidth >= 180 && parentHeight >= 150) {
      img = '180150.png';
    } else {
      img = '125125.png';
    }

    this.appendHtml(container, img);
  };
  appendHtml = (container, img) => {
    container.html('<a href="' + this.url.urlSsl + '/gopremium?ref=0"><img src="http:' + this.url.cdn + '/img/noa/' + img + "?v=" + this.url.cacheBuster + '" alt="no ads" /></a>');
    /*
            container.empty();
            setTimeout(() => {
                container.append('<a href="' + this.url.urlSsl + '/gopremium?ref=0"><img src="http:' + this.url.cdn + '/img/noa/' + img + "?v=" + this.url.cacheBuster + '" alt="no ads" /></a>');
            }, 200);
    */
  };

  public processAdSlots(previous, current) {
    var slots = [];
    for (var i in googletag.sbNgTags) {
      var slot = googletag.sbNgTags[i];
      if (this.processAdSize(slot[0], slot[1], current, previous))
        slots.push(slot[0]);
    }

    googletag.pubads().refresh(slots);
    this.check();
  }

  public processAdSize(adSlot, sizes, current, previous) {
    for (var i in sizes) {
      var x = sizes[i];
      if (current >= x[0]) {
        if (previous < x[0])
          return true;
        break;
      }

      if (previous >= x[0]) {
        if (current < x[0])
          return true;
        break;
      }
      /*
  // then in reverse order and condition?
  x = sizes[sizes.length - 1 - i];
  if (current < x[0]) {
      if (previous >= x[0])
          return true;
      break;
  }
*/
    }
    return false;
  }

  refreshAds() {
    if (googletag && googletag.pubads)
      googletag.pubads().refresh();
    this.check();
  }

  slots: { play: { hz_large: number; hz_medium: number; vt_xlarge: number; vt_large: number; vt_medium: number; vt_small: number }; main: { hz_large: number; hz_medium: number; vt_xlarge: number; vt_large: number; vt_medium: number; vt_small: number } };
  adsenseId: string;
}

interface IClient {
  open_pws_uri(url: string): any;
  refresh_login(): void;
  login(): void;
}

class W6Client {
  constructor(private client: IClient) {
    this.clientFound = client != null;
  }

  openPwsUri(url: string) {
    this.client.open_pws_uri(url);
  }

  refreshLogin() {
    this.client.refresh_login();
  }

  login() {
    this.client.login();
  }

  clientFound: boolean;
}

class W6 {
  public subSlogan: string;
  public slogan: string;
  public chromeless: any;
  public enableBasket: boolean;
  public isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
  public static w6OBot = "60f61960-23a3-11e4-8c21-0800200c9a66";

  get isLoggedIn() { return this.userInfo && this.userInfo.id != null; }

  constructor(public url: W6Urls, public renderAds: boolean, public isClient: boolean, public clientVersion: string, public userInfo: MyApp.IUserInfo) {
    this.chromeless = window.location.search.includes("chromeless") || isClient;

    this.slogan = "Because the game is just the beginning";
    this.subSlogan = "The ultimate community driven content delivery platform";
    this.enableBasket = !this.isClient && !this.basketUrlDisabled();
  }

  basketUrlDisabled() {
    return /[?\&]basket=0/.test(window.location.href);
  }

  updateUserInfo = (newUserInfo: MyApp.IUserInfo, userInfo: MyApp.IUserInfo) => {
    var copy = angular.copy(newUserInfo);
    copy.id = newUserInfo.id; // wth?
    Tools.handleOverrides(userInfo, copy);
    userInfo.clearAvatars();
  };

  regexp = /\.00$/;

  public sizeFnc(size: number, format = "B") {
    if (!size)
      size = 0;
    var curFormat = MyApp.Components.FileSize[format];

    var upsize = () => {
      if (size < 1024) {
        return;
      }
      switch (curFormat) {
        case MyApp.Components.FileSize.B:
          curFormat = MyApp.Components.FileSize.KB;
          break;
        case MyApp.Components.FileSize.KB:
          curFormat = MyApp.Components.FileSize.MB;
          break;
        case MyApp.Components.FileSize.MB:
          curFormat = MyApp.Components.FileSize.GB;
          break;
        case MyApp.Components.FileSize.GB:
          curFormat = MyApp.Components.FileSize.TB;
          break;
        case MyApp.Components.FileSize.TB:
          curFormat = MyApp.Components.FileSize.PB;
          break;
        case MyApp.Components.FileSize.PB:
          curFormat = MyApp.Components.FileSize.EB;
          break;
        case MyApp.Components.FileSize.EB:
          curFormat = MyApp.Components.FileSize.ZB;
          break;
        case MyApp.Components.FileSize.ZB:
          curFormat = MyApp.Components.FileSize.YB;
          break;
        case MyApp.Components.FileSize.YB:
          return; //We can't go higher than YB so just return;
        default:
      }
      size = size / 1024;
      upsize();
    };

    upsize();
    var fixed = size.toFixed(2);
    if (fixed.match(this.regexp))
      fixed = fixed.replace(this.regexp, "");
    if (fixed === "0")
      curFormat = MyApp.Components.FileSize.MB;
    return [fixed, MyApp.Components.FileSize[curFormat]];
  }

  public userTitling(title?: string) {
    var titling = this.userInfo.id ? this.userInfo.userName + "'s" : "Your";
    return title ? `${titling} ${title}` : titling;
  }

  contentRowClasses() {
    return "";
  }

  versionedAsset(path: string): string {
    return this.url.getAssetUrl(path);
  }

  versionedImage(path: string): string {
    return this.url.getAssetUrl("img/" + path);
  }

  iso8601RegEx: any = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z?$/;

  public convertToClient(obj) {
    var converter = breeze.NamingConvention.defaultInstance;
    if (obj instanceof Array) {
      var newAr = [];
      angular.forEach(obj, (v, i) => newAr[i] = this.convertToClient(v));
      return newAr;
    } else if (obj instanceof Date) {
      return obj;
    } else if (obj instanceof Object) {
      var newObj = {};
      angular.forEach(obj, (v, p) => newObj[converter.serverPropertyNameToClient(p)] = this.convertToClient(v));
      return newObj;
    } else if (typeof obj == "string") {
      if (this.iso8601RegEx.test(obj)) {
        if (!obj.endsWith("Z")) obj = obj + "Z";
        return new Date(obj);
      }
    }

    return obj;
  }

  // Divisable by 8! Keep in sync with C#: ImageConstants
  public imageSizes = {
    smallSquare: {
      w: 48,
      h: 48
    },
    smallRectangle: {
      w: 384,
      h: 216
    },
    bigRectangle: {
      w: 1024,
      h: 576
    },
    missionThumb: {
      w: 160,
      h: 100
    },
    missionOriginalFileName: 'original.jpg'
  };
  public usermenu = {
    init: () => {
      // toggle...
      if ($('#usermenu').hasClass('hidden')) {
        $('#usermenu').removeClass('hidden');
      } else {
        $('#usermenu').addClass('hidden');
      }

    }
  };

  public forms = {
    init: () => {
      // Implement MarkdownDeep Editor
      if ($('.wmd-input').length > 0) {
        this.forms.markdownEditor();
      }
      if ($('.html-input').length > 0) {
        this.forms.htmlEditor();
      }
    },
    markdownEditor: () => {
      $('.wmd-input').each((index, element: any) => {
        var converter = Markdown.getSanitizingConverter();
        var editor = new Markdown.Editor(converter);
        editor.run(element.id);
      });
    },
    htmlEditor: () => { $('.html-input').redactor(globalRedactorOptions); }
  };

  public scrollToAnchor(anchorname): void {
    var anchor = $("a[name='" + anchorname + "']");
    this.scrollTo(anchor.offset().top, 300);
  }

  public scrollTo(position, duration): void {
    $('html, body').animate({
      scrollTop: position
    }, duration);
  }

  public ads = new W6Ads(this.url);

  public slider = {
    init: () => {
      // set items
      this.slider.items = $('#mediaslider').find('ul li').length + 1;

      // set item width
      this.slider.itemWidth = $($('#mediaslider').find('ul li')[0]).outerWidth(true);

      // set slider width
      this.slider.sliderWidth = $('#mediaslider').width();

      // events
      $('#mediaslider').find('.btn-left').on('click', e => {
        e.preventDefault();
        this.slider.moveLeft();
      });
      $('#mediaslider').find('.btn-right').on('click', e => {
        e.preventDefault();
        this.slider.moveRight();
      });
    },
    currentPosition: 0,
    sliderWidth: 0,
    items: 0,
    itemWidth: 0,
    moveLeft: () => {
      if (this.slider.currentPosition < ((this.slider.itemWidth * -1) + this.slider.itemWidth)) {
        this.slider.move(this.slider.itemWidth * -1);
      }
    },
    moveRight: () => {
      if (this.slider.currentPosition > ((this.slider.itemWidth * this.slider.items) - (this.slider.itemWidth * 2)) * -1) {
        this.slider.move(this.slider.itemWidth);
      }
    },
    move: direction => {
      $('#mediaslider').find('ul').animate({
        'margin-left': this.slider.currentPosition - direction
      }, 200, () => {
          this.slider.currentPosition = this.slider.currentPosition - direction;
        });
    }
  };

  handleClient() {
    this.isClient = window.six_client != null;
    if (this.isClient)
      this.client = new W6Client(<IClient>window.six_client);
  }

  client: W6Client;
  adsenseId: string;
  isClientConnected: boolean;
  openLoginDialog: (evt: any) => void;
  logout: () => any;
  openRegisterDialog: (event: any) => void;
  openSearch: (event: any) => void;
};
