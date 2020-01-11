/* eslint no-underscore-dangle: 0 */

import { loadFromStorage } from '../utils';
import config from './config';
import context from './context';

class TabSuspender {
  constructor() {
    this.action = null;
    this.console = console;
    this.discardEventEmitter = document;
    this.config = config.call(this);

    this.tabHandlers = {
      onCreated: tab => this.emit({ type: 'created', id: tab.id }),
      onActivated: ({ tabId }) => this.emit({ type: 'activated', id: tabId }),
      onRemoved: (tabId, removeInfo) => {
        const { isWindowClosing } = removeInfo;
        this.emit({ type: 'removed', id: tabId, isWindowClosing });
      },
      onUpdated: (tabId, change) => {
        // TODO: change, add args in addListener to listen to specific changes
        if (!change.audible) {
          return;
        }
        this.emit({ type: 'updated', id: tabId });
      },
      onAttached: tabId => this.emit({ type: 'attached', id: tabId }),
      onDetached: tabId => this.emit({ type: 'detached', id: tabId }),
    };
  }

  // Emits events that trigger this.config calls
  emit(payload) {
    const event = new CustomEvent('discard', { detail: payload });
    this.discardEventEmitter.dispatchEvent(event);
  }

  discard(tabs) {
    browser.tabs.discard(tabs);
  }

  handleAction(actionInfo) {
    browser.tabs.query({}).then((tabs) => {
      this.action(actionInfo)(tabs);
    });
  }

  async updateConfig() {
    const loadedOptions = await Promise.all(this.config.map(async (option) => {
      const { id, defaultValue } = option;
      const data = await loadFromStorage(id);
      const value = data[id] !== undefined ? data[id] : defaultValue;
      return { ...option, value };
    }));

    this.config = loadedOptions;
    this.console.log('config changed', this.config);
  }

  generateAction() {
    const activeOptions = this.config.filter(option => option.isEnabled(option.value));

    this.console.log('active options', activeOptions, this.config);
    const mergedActions = activeOptions.reduceRight(
      (acc, cur) => actionInfo => (rawTabs, modTabs) => {
        const newModTabs = cur.action(cur.value)(actionInfo)(rawTabs, modTabs);
        return acc(actionInfo)(rawTabs, newModTabs);
      },
      () => rawTabs => rawTabs,
    );

    this.action = mergedActions;
  }

  createContextMenus() {
    context.call(this);
  }

  registerHandlers() {
    // handle tab actions
    Object.keys(this.tabHandlers)
      .forEach(event => browser.tabs[event].addListener(this.tabHandlers[event]));

    this.discardEventEmitter.addEventListener('discard', (e) => {
      const { detail } = e;
      this.console.log('event', detail.type, detail.id);
      this.handleAction(detail);
    }, false);

    // reload config after every change
    browser.storage.onChanged.addListener(async () => {
      await this.updateConfig();
      this.generateAction();
      this.emit({ type: 'configChange' });
    });
  }

  async run() {
    this.updateConfig = this.updateConfig.bind(this);
    await this.updateConfig();
    this.generateAction();
    this.registerHandlers();
    this.createContextMenus();
  }
}

export default TabSuspender;
