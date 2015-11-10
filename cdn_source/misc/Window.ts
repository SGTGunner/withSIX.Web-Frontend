interface Window {
    six_client: {
        open_pws_uri: (url) => void;
        get_api_key: () => string;
        refresh_login(): void;
        login(): void;
    }
    assetHash: {[asset: string]: string}
    api: {
      openExternalUrl(url: string): void;
    }
}
