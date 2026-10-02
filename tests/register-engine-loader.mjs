import * as module from 'node:module';
import { resolve } from './engine-loader.mjs';

if (module.registerHooks) {
  module.registerHooks({ resolve });
} else {
  // Node 20 uses the asynchronous loader API; newer runtimes support sync hooks.
  module.register('./engine-loader.mjs', import.meta.url);
}
