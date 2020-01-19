import _ from 'lodash';
import { saveToStorage, loadFromStorage, stringToRegex } from '../utils';
import CustomDiscard from './injectable';

function config() {
  // NOTE: actions are applied sequentially,
  // modifiedTabs contain tabs changed in preceding actions, return them in actions!
  // only modifiedTabs are meant to be changed
  return [
    {
      id: 'default',
      action: () => () => (rawTabs, modifiedTabs = rawTabs) => modifiedTabs
        .filter(tab => !tab.active && !tab.discarded)
        .sort((a, b) => a.lastAccessed - b.lastAccessed),
      isEnabled: () => true,
    },
    {
      id: '#input-suspend-all-planned',
      action: () => () => (rawTabs, modifiedTabs = rawTabs) => {
        this.console.log('suspending all on planned', modifiedTabs);
        this.discard(modifiedTabs.map(tab => tab.id));
        // better make action generator accept async functions since this
        // below can cause unexpected behaviour
        saveToStorage({ '#input-suspend-all-planned': false });
        return modifiedTabs;
      },
      isEnabled: value => typeof value === 'boolean' && value,
      defaultValue: false,
    },
    {
      id: '#input-ignore-audible',
      action:
        () => () => (rawTabs, modifiedTabs = rawTabs) => modifiedTabs.filter(tab => !tab.audible),
      isEnabled: value => typeof value === 'boolean' && value,
      defaultValue: false,
    },
    {
      id: '#input-ignore-pinned',
      action:
        () => () => (rawTabs, modifiedTabs = rawTabs) => modifiedTabs.filter(tab => !tab.pinned),
      isEnabled: value => typeof value === 'boolean' && value,
      defaultValue: true,
    },
    {
      id: '#input-whitelist-pattern',
      action: value => () => (rawTabs, modifiedTabs = rawTabs) => {
        // check for those updating from previous versions
        // since trying to load value from storage by non-existing key returns empty object
        const set = (value && value instanceof Set);

        const strings = new Set();
        const regex = new Set();

        const regexMarker = '\\regex\\';
        if (set) {
          // Each item can be either string or regex, starting with \regex\
          // Populate strings and regex sets based on it
          value.forEach((item) => {
            if (_.startsWith(item, regexMarker)) {
              regex.add(item.slice(regexMarker.length));
            } else {
              strings.add(item);
            }
          });
        }

        this.console.log('whitelist', set, strings, regex);
        this._whitelistPatternsStrings = strings;
        this._whitelistPatternsRegex = regex;

        return modifiedTabs;
      },
      isEnabled: () => true,
    },
    {
      id: '#input-enable-whitelist',
      action: () => () => (rawTabs, modifiedTabs = rawTabs) => {
        this.console.log('input-enable-whitelist', modifiedTabs);
        const strings = (this._whitelistPatternsStrings instanceof Set)
          ? [...this._whitelistPatternsStrings]
          : [];

        const regex = (this._whitelistPatternsRegex instanceof Set)
          ? [...this._whitelistPatternsRegex]
          : [];

        return modifiedTabs.filter((tab) => {
          // we need to get only those tabs, that DO NOT match any of pattern strings and regex
          const inStrings = strings.findIndex(pattern => tab.url.includes(pattern)) !== -1;
          // better compile re in whitelist-pattern
          const inRegex = _.some(regex, (str) => {
            const re = stringToRegex(str);
            return tab.url.search(re) !== -1;
          });
          return !(inStrings || inRegex);
        });
      },
      isEnabled: value => typeof value === 'boolean' && value,
      defaultValue: false,
    },
    {
      id: '#input-blacklist-pattern',
      action: value => () => (rawTabs, modifiedTabs = rawTabs) => {
        // check for those updating from previous versions
        // since trying to load value from storage by non-existing key returns empty object
        const set = (value && value instanceof Set);

        const strings = new Set();
        const regex = new Set();

        const regexMarker = '\\regex\\';
        if (set) {
          // Each item can be either string or regex, starting with \regex\
          // Populate strings and regex sets based on it
          value.forEach((item) => {
            if (_.startsWith(item, regexMarker)) {
              regex.add(item.slice(regexMarker.length));
            } else {
              strings.add(item);
            }
          });
        }

        this.console.log('blacklist', set, strings, regex);
        this._blacklistPatternsStrings = strings;
        this._blacklistPatternsRegex = regex;

        return modifiedTabs;
      },
      isEnabled: () => true,
    },
    {
      id: '#input-enable-blacklist',
      action: () => () => (rawTabs, modifiedTabs = rawTabs) => {
        const strings = (this._blacklistPatternsStrings instanceof Set)
          ? [...this._blacklistPatternsStrings]
          : [];

        const regex = (this._blacklistPatternsRegex instanceof Set)
          ? [...this._blacklistPatternsRegex]
          : [];

        // NOTE: if both lists are empty, we simply return modifiedTabs
        // to suspend all of them istead of suspending none.
        if (!strings.length && !regex.length) {
          return modifiedTabs;
        }

        return modifiedTabs.filter((tab) => {
          // we need to get only those tabs, that DO match a pattern in strings or regex
          const inStrings = strings.findIndex(pattern => tab.url.includes(pattern)) !== -1;
          // better compile re in whitelist-pattern
          const inRegex = _.some(regex, (str) => {
            const re = stringToRegex(str);
            return tab.url.search(re) !== -1;
          });
          return inStrings || inRegex;
        });
      },
      isEnabled: value => typeof value === 'boolean' && value,
      defaultValue: false,
    },
    {
      id: '#input-suspend-threshold',
      action: value => () => (rawTabs, modifiedTabs = rawTabs) => {
        if (modifiedTabs.length < value) {
          return [];
        }
        const rest = modifiedTabs.slice(0, modifiedTabs.length - value);
        this.console.log('thresholding', modifiedTabs, rest);
        return rest;
      },
      isEnabled: value => !Number.isNaN(value) && value > 0,
      defaultValue: 1, // number of loaded tabs
    },
    {
      id: '#input-suspend-planned',
      action: () => () => (rawTabs, modifiedTabs = rawTabs) => {
        this.console.log('suspending on planned', modifiedTabs);
        this.discard(modifiedTabs.map(tab => tab.id));
        // Better make action generator accept async functions since this
        // below can cause unexpected behaviour
        saveToStorage({ '#input-suspend-planned': false });
        return modifiedTabs;
      },
      isEnabled: value => typeof value === 'boolean' && value,
      defaultValue: false,
    },
    {
      id: '#input-disable-suspension', // it should be placed before any automatic discard
      action:
        () => () => () => [], // just return empty modified tabs to prevent any further actions
      isEnabled: value => typeof value === 'boolean' && value,
      defaultValue: false,
    },
    {
      id: '#input-delay-suspend',
      action: value => () => (rawTabs, modifiedTabs = rawTabs) => {
        const ms = value * 1000;

        if (!this.delaySuspendTimeoutIds) {
          this.delaySuspendTimeoutIds = [];
        }

        // remove the timeout if the tab is not present in filter results
        const rest = rawTabs
          .filter(rawTab => modifiedTabs.findIndex(modTab => modTab.id === rawTab.id) === -1);

        rest.forEach((tab) => {
          if (!this.delaySuspendTimeoutIds[tab.id]) {
            return;
          }
          clearTimeout(this.delaySuspendTimeoutIds[tab.id]);
          this.delaySuspendTimeoutIds[tab.id] = null;
        });

        // TODO: add check for removed?
        // TODO: somehow process loading tabs
        modifiedTabs.forEach((tab) => {
          if (this.delaySuspendTimeoutIds[tab.id]) {
            return;
          }
          this.console.log('setting timeout for', tab.id);
          const delaySuspendTimeoutId = setTimeout(() => {
            this.console.log('time is out for tab', tab.id);
            this.discard([tab.id]);
            this.delaySuspendTimeoutIds[tab.id] = null;
          }, ms);

          this.delaySuspendTimeoutIds[tab.id] = delaySuspendTimeoutId;
        });

        return modifiedTabs;
      },
      isEnabled: value => !Number.isNaN(value) && value > 0,
      defaultValue: 60, // value provided in seconds
    },

    //By default, pages you open in this way will be stored in the user's history, just like normal web
    // pages. If you don't want to have this behavior, use history.deleteUrl() to remove the
    //browser's record:

    // wot do on reload
    // wot do on discard
    // wot do on close, on experimental disabled
    {
      id: '#input-confirm-reload',
      action: value => () => (rawTabs, modifiedTabs = rawTabs) => {
        if (!value) {
          this.discard = tabs => browser.tabs.discard(tabs);
          return modifiedTabs;
        }

        this._placeholdered = this._placeholdered || {};

        this.discard = tabs => Promise.all(
          tabs
            .filter(tabId => !(Object.keys(this._placeholdered).includes(String(tabId)) || Object.values(this._placeholdered).includes(tabId)))
            .map(async (tabId) => {
              const tab = await browser.tabs.get(tabId);
              // const { index, windowId } = tab;

              const code = await CustomDiscard.generateCode(tab, '[S]', '#ffffff');


              await browser.tabs.update(tabId, {
                url: require('../refresh/index.html'),
              });
              /* const { id: placeholderTabId } = await browser.tabs.create({
                url: require('../refresh/index.html'),
                index: index + 1,
                windowId,
              }); */

              await browser.tabs.executeScript(tabId, {
                code,
              });

              this._placeholdered[tabId] = tabId;


              // await browser.tabs.hide(tabId);
              // await browser.tabs.discard(tabId);

              // const port = browser.tabs.connect(placeholderTabId);
              // port.postMessage({ title, favIconUrl });

              // port.onMessage.addListener();
              // port.onDisconnect.addListener();
            })
        );

        return modifiedTabs;
      },
      isEnabled: () => true,
      defaultValue: false,
    },
    /*{
      id: '#input-should-change-icon',
      action: () => () => (rawTabs, modifiedTabs = rawTabs) => {
        return modifiedTabs;
      },
      isEnabled: value => typeof value === 'boolean' && value,
      defaultValue: false,
    },
    {
      id: '#input-dot-color',
      action: value => () => (rawTabs, modifiedTabs = rawTabs) => {
        return modifiedTabs;
      },
      isEnabled: value => String(value).search(/#([0-9a-fA-F]{3}){1,2}/g),
      defaultValue: '#fff',
    },
    {
      id: '#input-should-change-title',
      action: () => () => (rawTabs, modifiedTabs = rawTabs) => {
        return modifiedTabs;
      },
      isEnabled: value => typeof value === 'boolean' && value,
      defaultValue: false,
    },
    {
      id: '#input-prepend-text',
      action: value => () => (rawTabs, modifiedTabs = rawTabs) => {
        return modifiedTabs;
      },
      isEnabled: () => true,
      defaultValue: '[S]',
    },
    {
      id: '#input-enable-experimental',
      action: () => () => (rawTabs, modifiedTabs = rawTabs) => {

        return modifiedTabs;
      },
      isEnabled: value => typeof value === 'boolean' && value,
      defaultValue: false,
    },*/
    {
      id: 'updateBadgeText',
      action: () => actionInfo => (rawTabs, modifiedTabs = rawTabs) => {
        browser.tabs.query({}).then((tabs) => {
          if (actionInfo.type !== 'activated') {
            const removed = actionInfo.type === 'removed';
            const { isWindowClosing } = actionInfo;
            const tabsCount = (removed && !isWindowClosing) ? tabs.length - 1 : tabs.length;

            browser.browserAction.setBadgeText({ text: tabsCount.toString() });
            browser.browserAction.setBadgeTextColor({ color: [255, 255, 255, 255] });
            browser.browserAction.setBadgeBackgroundColor({ color: [64, 64, 64, 255] });
          }
        });
        return modifiedTabs;
      },
      isEnabled: () => true,
    },
  ];
}

export default config;
