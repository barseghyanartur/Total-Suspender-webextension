const context = () => {
  // TODO: refactor, separate creating menus, attaching listener and listener
  browser.menus.create({
    id: 'total-suspender-suspend',
    title: 'Suspend',
    contexts: ['tab'],
  });

  browser.menus.create({
    id: 'total-suspender-whitelist-page',
    title: 'Whitelist',
    contexts: ['tab'],
  });

  browser.menus.create({
    id: 'total-suspender-whitelist-domain',
    title: 'Whitelist domain',
    contexts: ['tab'],
  });

  browser.menus.create({
    id: 'total-suspender-blacklist-page',
    title: 'Blacklist',
    contexts: ['tab'],
  });

  browser.menus.create({
    id: 'total-suspender-blacklist-domain',
    title: 'Blacklist domain',
    contexts: ['tab'],
  });

  browser.menus.onClicked.addListener((info, tab) => {
    if (!(this._blacklistPatternsStrings instanceof Set)) {
      this._blacklistPatternsStrings = new Set();
    }
    if (!(this._whitelistPatternsStrings instanceof Set)) {
      this._whitelistPatternsStrings = new Set();
    }

    switch (info.menuItemId) {
      case 'total-suspender-suspend': {
        browser.tabs.discard(tab.id);
        break;
      }
      case 'total-suspender-whitelist-page': {
        this._whitelistPatternsStrings.add(tab.url);
        saveToStorage({ '#input-whitelist-pattern': this._whitelistPatternsStrings });
        break;
      }
      case 'total-suspender-whitelist-domain': {
        const { origin } = (new URL(tab.url));
        if (origin === 'null') {
          return;
        }
        this._whitelistPatternsStrings.add(origin);
        saveToStorage({ '#input-whitelist-pattern': this._whitelistPatternsStrings });
        break;
      }
      case 'total-suspender-blacklist-page': {
        this._blacklistPatternsStrings.add(tab.url);
        saveToStorage({ '#input-blacklist-pattern': this._blacklistPatternsStrings });
        break;
      }
      case 'total-suspender-blacklist-domain': {
        const { origin } = (new URL(tab.url));
        if (origin === 'null') {
          return;
        }
        this._blacklistPatternsStrings.add(origin);
        saveToStorage({ '#input-blacklist-pattern': this._blacklistPatternsStrings });
        break;
      }
      default:
    }
  });
};

export default context;
