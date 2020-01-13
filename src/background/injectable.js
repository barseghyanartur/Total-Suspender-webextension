/* eslint no-underscore-dangle: off */
/* eslint import/extensions: off */
/* eslint class-methods-use-this: off */

import { createImage } from '../utils.js';

class CustomDiscard {
  static async changeTitle(tab, prependText) {
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
  static async changeFavicon(tab, original, fillColor) {
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
    ctx.arc(
      image.width * 0.75,
      image.height * 0.75,
      image.width * 0.25,
      0,
      2 * Math.PI,
      false,
    );
    ctx.fill();

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

  static async clearBeforeUnload() {
    const injectableClearBeforeUnload = () => {
      window.onbeforeunload = () => {};
    };

    return {
      fn: injectableClearBeforeUnload,
      args: [],
    };
  }

  static generateIIFE(injectable) {
    const { fn, args } = injectable;
    const fnString = `(${fn})`;
    // NOTE: working only with string args
    const argsString = `(${args.map(arg => `'${arg}'`).join(',')})`;
    const IIFE = fnString + argsString;
    return IIFE;
  }

  static async generateCode(tab, titlePrependText, dotColorFill) {
    const changeFavicon = true;
    const changeTitle = true;

    const injectables = [];

    if (changeFavicon) {
      const original = tab.favIconUrl || require('../icons/32.png');
      const fillColor = dotColorFill;
      const fn = await CustomDiscard.changeFavicon(tab, original, fillColor);
      injectables.push(fn);
    }

    if (changeTitle) {
      const prependText = titlePrependText;
      const fn = await CustomDiscard.changeTitle(tab, prependText);
      injectables.push(fn);
    }

    const IIFEs = injectables.map(CustomDiscard.generateIIFE);

    // NOTE: If injectables defined with 'function' are moved to class even as static methods,
    // interpolated strings with them and other injected code won't contain 'function' as prefix
    // and thus will throw parentheses missmatch error for IIFE
    // const CODE = `(function(){ window.onbeforeunload = (e) => {${IIFEs.join(';')}; e.preventDefault(); e.returnValue = '*';}})()`;
    const CODE = `(function(){ ${IIFEs.join(';')};})()`;
    return CODE;
  }
}

export default CustomDiscard;
