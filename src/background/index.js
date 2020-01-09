/* eslint import/extensions: off */
/* global PRODUCTION */

import TabSuspender from './TabSuspender.js';
import { Console } from '../utils.js';

const tabSuspender = new TabSuspender();
tabSuspender.console = new Console('Background', !PRODUCTION && 'debug'); // set second parameter to 'debug' for verbose output
tabSuspender.run();
