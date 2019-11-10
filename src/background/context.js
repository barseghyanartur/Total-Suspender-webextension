import { saveToStorage } from '../utils';

function context() {
  const menus = [
    {
      id: 'total-suspender-suspend',
      title: 'Suspend',
      contexts: ['tab'],
      handler: (info, tab) => browser.tabs.discard(tab.id),
    },
    {
      id: 'total-suspender-whitelist-page',
      title: 'Whitelist',
      contexts: ['tab'],
      handler: (info, tab) => {
        this._whitelistPatternsStrings.add(tab.url);
        saveToStorage({ '#input-whitelist-pattern': this._whitelistPatternsStrings });
      },
    },
    {
      id: 'total-suspender-whitelist-domain',
      title: 'Whitelist domain',
      contexts: ['tab'],
      handler: (info, tab) => {
        const { origin } = new URL(tab.url);
        if (origin === 'null') return;
        this._whitelistPatternsStrings.add(origin);
        saveToStorage({ '#input-whitelist-pattern': this._whitelistPatternsStrings });
      },
    },
    {
      id: 'total-suspender-blacklist-page',
      title: 'Blacklist',
      contexts: ['tab'],
      handler: (info, tab) => {
        this._blacklistPatternsStrings.add(tab.url);
        saveToStorage({ '#input-blacklist-pattern': this._blacklistPatternsStrings });
      },
    },
    {
      id: 'total-suspender-blacklist-domain',
      title: 'Blacklist domain',
      contexts: ['tab'],
      handler: (info, tab) => {
        const { origin } = new URL(tab.url);
        if (origin === 'null') return;
        this._blacklistPatternsStrings.add(origin);
        saveToStorage({ '#input-blacklist-pattern': this._blacklistPatternsStrings });
      },
    },
  ];

  menus.forEach(({ id, title, contexts}) => {
    // NOTE: browser.menus.create does NOT ignore unexpected properties for createProperties
    // object, so we can not just pass menu item, we have to omit handler and others,
    // otherwise it'll throw type error
    browser.menus.create({ id, title, contexts });
  });

  const handlers = menus.reduce((acc, { id, handler }) => ({ ...acc, [id]: handler }), {});
  browser.menus.onClicked.addListener((info, tab) => {
    if (!(this._blacklistPatternsStrings instanceof Set)) {
      this._blacklistPatternsStrings = new Set();
    }

    if (!(this._whitelistPatternsStrings instanceof Set)) {
      this._whitelistPatternsStrings = new Set();
    }

    const activeEntry = info.menuItemId;
    if (!Object.prototype.hasOwnProperty.call(handlers, activeEntry)) {
      return;
    }

    handlers[activeEntry](info, tab);
  });
}

export default context;
