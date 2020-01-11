/* eslint no-underscore-dangle: off */
/* eslint import/extensions: off */
/* eslint class-methods-use-this: off */

import { loadFromStorage, createImage } from '../utils.js';
import { settingsByName } from '../settings.js';

/*
How to track browser.tabs.discard and do some actions before tabs get actually discarded: 101
1. OFC one can not simply change tab.title or tab.favicon, that would have been to easy, right?
  Sadly, it doesn't work this way
2. browser.tabs.onChanged triggers after tab has been discarded, making it useless to try
  to inject any content scripts in a page, since it doesn't really exist (only in cache) after
  discard
3. Obviously, redefining browser.tabs.discard method is useless, since for security issues it
  would work only for the extension, that redefined it, other extensions and the browser itself
  will still use native browser.tabs.discard.
So, we have to invent a hacky way to do it.
How does this even work? First, we inject a content script in each tab, that does two things:
enables receiving messages from background scripts and registers a beforeUnload listener, that
by design, prevents native discarding. Then, whenever native discard is called, tab cannot be
suspended and is not meant to trigger any of the two unload events on the document,
but for some reason, beforeUnload gets triggered, while not showing any questions and that's
what we use: we put some code that we need to be executed before discard into beforeUnload handler,
it gets executed, then we send a message to the background script, that removes beforeUnload
from the caller and calls native discard function by itself, thus making us able to perform
arbitrary actions before each native discard. Note, that, again, for avoiding popups spamming,
we are not allowed to have multiple effective onbeforeunload listeners.
*/

class CustomDiscardIndication {
  constructor() {
    // Set default console to refer to enable custom logging
    this.console = console;

    // Load default values from settings.js
    this.config = { ...settingsByName };
  }

  // Load settings from local storage and merge them with the current config
  async loadSettings() {
    const loadedSettings = await loadFromStorage();
    this.mergeSettings(loadedSettings);
  }

  // Merge new settings with the current config
  mergeSettings(loadedSettings) {
    // Merge loadedSettings values with current config by ids
    const newConfig = { ...this.config };
    const loadedSettingsNames = Object.keys(loadedSettings);
    loadedSettingsNames.forEach((name) => {
      if (!Object.prototype.hasOwnProperty.call(this.config, name)) {
        return;
      }
      newConfig[name].value = loadedSettings[name];
    });

    this.console.log('new config', newConfig);
    this.config = newConfig;
  }

  async changeTitle(tab, prependText) {
    const injectableChangeTitle = (title) => {
      document.title = title;
    };

    const title = `${prependText}${tab.title}`;
    return {
      fn: injectableChangeTitle,
      args: [title],
    };
  }

  // The code that gets injected as content script as IIFE to actually change tab icon.
  async changeFavicon(tab, original, fillColor, borderColor) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const image = await createImage(original);

    canvas.width = image.width;
    canvas.height = image.height;
    ctx.filter = 'grayscale(50%)';
    ctx.drawImage(image, 0, 0);
    ctx.filter = '';
    ctx.beginPath();
    ctx.fillStyle = fillColor;
    ctx.strokeStyle = borderColor;
    ctx.arc(
      image.width * 0.75,
      image.height * 0.75,
      image.width * 0.25,
      0,
      2 * Math.PI,
      false,
    );
    ctx.fill();
    ctx.stroke();

    const injectableChangeFavicon = (dataURL) => {
      document.head.querySelectorAll('link[rel*=icon]').forEach((link) => {
        link.remove();
      });
      const link = document.createElement('link');
      link.rel = 'icon';
      link.type = 'image/png';
      link.href = dataURL;
      document.head.appendChild(link);
    };

    const grayscaled = canvas.toDataURL('image/png');
    return {
      fn: injectableChangeFavicon,
      args: [grayscaled],
    };
  }

  async sendMessage() {
    const injectableSendMessage = () => {
      setTimeout(() => browser.runtime.sendMessage(), 200);
    };

    return {
      fn: injectableSendMessage,
      args: [],
    };
  }

  async clearBeforeUnload() {
    const injectableClearBeforeUnload = () => {
      window.onbeforeunload = () => {};
    };

    return {
      fn: injectableClearBeforeUnload,
      args: [],
    };
  }

  generateIIFE(injectable) {
    const { fn, args } = injectable;
    const fnString = `(${fn})`;
    // NOTE: working only with string args
    const argsString = `(${args.map(arg => `'${arg}'`).join(',')})`;
    const IIFE = fnString + argsString;
    return IIFE;
  }

  async generateCode(tab) {
    const changeFavicon = this.config.shouldChangeIcon.value;
    const changeTitle = this.config.shouldChangeTitle.value;

    const injectables = [];

    if (changeFavicon) {
      const original = tab.favIconUrl || '/../icons/32.png';
      const fillColor = this.config.dotColorFill.value;
      const borderColor = this.config.dotColorBorder.value;
      const fn = await this.changeFavicon(tab, original, fillColor, borderColor);
      injectables.push(fn);
    }

    if (changeTitle) {
      const prependText = this.config.titlePrependText.value;
      const fn = await this.changeTitle(tab, prependText);
      injectables.push(fn);
    }

    const sendFn = await this.sendMessage();
    injectables.push(sendFn);

    const IIFEs = injectables.map(this.generateIIFE);

    // NOTE: If injectables defined with 'function' are moved to class even as static methods,
    // interpolated strings with them and other injected code won't contain 'function' as prefix
    // and thus will throw parentheses missmatch error for IIFE
    const CODE = `(function(){ window.onbeforeunload = (e) => {${IIFEs.join(';')}; e.preventDefault(); e.returnValue = '*';}})()`;

    return CODE;
  }

  async injectCode(tab, CODE) {
    this.console.log('injecting', CODE);
    const executed = await browser.tabs.executeScript(tab.id, {
      allFrames: true,
      matchAboutBlank: true,
      runAt: 'document_start',
      code: CODE,
    });

    this.console.log('modified tab', tab);
    this.console.log(`executed in ${executed.length} frames`);
  }

  async run() {
   /* // Initial load
    await this.loadSettings();
    this.console.log('run');
    // Set up a listener to trigger native discard on message from tab
    const handleMessage = async (request, sender) => {
      const { tab } = sender;
      const CODE = this.generateIIFE(this.clearBeforeUnload());
      await this.injectCode(tab, CODE);
      setTimeout(() => browser.tabs.discard(tab.id), 600);
    };

    browser.runtime.onMessage.addListener(handleMessage);

    const tabs = await browser.tabs.query({});
    this.console.log('initial query');
    tabs.forEach(async (tab) => {
      const discardable = /^(http)/.test(tab.url);
      if (!discardable) {
        return;
      }

      const CODE = await this.generateCode(tab);
      await this.injectCode(tab, CODE);
    });

    browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
      this.console.log('tab changed', changeInfo, tab);
      if (changeInfo.discarded) {
        return;
      }
      const discardable = /^(http)/.test(tab.url);
      if (!discardable) {
        return;
      }
      this.console.log('tab activated after discard, reinjecting');
      const CODE = await this.generateCode(tab);
      await this.injectCode(tab, CODE);
    }, { properties: ['discarded'] });

    // Listen to options changes
    browser.storage.onChanged.addListener(async (changes, area) => {
      if (area !== 'local') {
        return;
      }

      await this.loadSettings();
    });*/
  }
}

export default CustomDiscardIndication;
