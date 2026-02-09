import { format } from 'util';

export const logger = {
  error: (...args: any[]) => {
    console.error(`\x1b[31m${format(...args)}\x1b[0m`);
  },
  warn: (...args: any[]) => {
    console.warn(`\x1b[33m${format(...args)}\x1b[0m`);
  },
  info: (...args: any[]) => {
    console.log(...args);
  },
  success: (...args: any[]) => {
    console.log(`\x1b[32m${format(...args)}\x1b[0m`);
  }
};
