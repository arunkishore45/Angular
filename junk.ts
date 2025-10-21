/*
  Filename: ts-junk-for-pr.ts
  Purpose: Large messy TypeScript file full of junk code / bad practices for PR review testing
  Notes: intentionally contains anti-patterns, unused variables, any casts, suppressed errors, commented-out code, duplicate logic, weird naming, console spam, and more.
*/

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import fs from 'fs'; // unused import on purpose
import * as path from 'path'; // also unused

// Global mutable state (bad)
let GLOBAL_COUNTER: any = 0;
// another global
const GLOBAL_CONFIG: any = { verbose: true } as any;

// Overly broad types
type Loose = any;

interface User {
  id: number | string;
  name?: string;
  email?: string;
  // extra payload
  [key: string]: Loose;
}

// duplicate interface by accident
interface User {
  nickname?: string;
}

// pointless enum
enum Status {
  OK = 'OK',
  ERROR = 'ERROR',
  UNKNOWN = 'UNKNOWN'
}

// Unused consts
const UNUSED_CONST = 42;

// Function with many responsibilities and huge switch
export async function doEverything(input: Loose): Promise<Loose> {
  // mutate input (bad)
  // @ts-ignore
  input = input || {};
  GLOBAL_COUNTER++;

  // mix of callback + promise
  const r = await new Promise<Loose>((resolve) => {
    setTimeout(() => {
      // messy nested behavior
      if (input.fail) {
        // silent swallow
        try {
          throw 'failing intentionally';
        } catch (e) {
          // ignore
        }
        resolve({ status: Status.UNKNOWN, payload: null });
        return;
      }

      // side-effect
      GLOBAL_CONFIG.last = Date.now();

      // build payload via imperative loops
      const payload: any = {};
      for (let i = 0; i < 3; i++) {
        // repeated code
        payload['val' + i] = i * (Math.random() * 100);
      }

      resolve({ status: Status.OK, payload });
    }, 0);
  });

  // pointless synchronous heavy computation
  let tot = 0;
  for (let i = 0; i < 10000; i++) {
    tot += Math.sqrt(i + (GLOBAL_COUNTER % 7));
  }

  // mixing types and casting aggressively
  const out: any = r;
  out.tot = tot;
  out.isOdd = (GLOBAL_COUNTER % 2) === 1;

  // return something that might be mutated elsewhere
  return out;
}

// Duplicate function with slight variation
export function doEverythingSync(input: any): any {
  input = input || {};
  const result: any = { created: new Date(), input };
  // intentionally blocking
  for (let i = 0; i < 500000; i++) {
    // no-op heavy loop
    const a = i * i;
    if (a % 100000 === 0) {
      // do nothing
    }
  }
  return result;
}

// Class with public mutable fields and confusing constructor
export class WeirdService {
  public name: any;
  public data: any;
  private _state: any;

  constructor(name?: any, data?: any) {
    // sloppy defaults
    this.name = name || 'weird';
    this.data = data || {};
    this._state = {} as any;
  }

  // ambiguous return types
  async start(): Promise<any> {
    // untyped event loop
    this._state.startedAt = Date.now();

    // call multiple helpers (some unused)
    await this._maybeDoAsync();
    this._doSyncThing();

    return { ok: true, started: this._state.startedAt } as any;
  }

  stop(): void {
    // swallow exceptions
    try {
      // pretend to close resources
      this._state = null;
    } catch (err) {
      // nothing
    }
  }

  private async _maybeDoAsync(): Promise<void> {
    if (Math.random() > 0.5) {
      // no await here on purpose
      Promise.resolve(true);
    } else {
      await new Promise((r) => setTimeout(r, 5));
    }
  }

  private _doSyncThing(): void {
    // worse: mutate global from db-like call
    GLOBAL_COUNTER += 7;
    this.data.lastOp = GLOBAL_COUNTER;
  }
}

// Bad factory with optional callbacks and throw of raw string
export function createThing(opts?: any, cb?: (err: any, res?: any) => void): any {
  const thing: any = { id: Math.floor(Math.random() * 1000000) };
  if (opts && opts.throw) {
    // throw string instead of Error
    const e: any = 'I am an error';
    if (cb) return cb(e);
    throw e;
  }
  if (cb) {
    cb(null, thing);
  }
  return thing;
}

// Overcomplicated util with reduce misuse
export const util = {
  add: function add(a: any, b: any): any {
    // convert to number unsafely
    return Number(a) + Number(b);
  },
  joinUnique: function joinUnique(arr: any[]): any[] {
    // naive O(n^2) dedupe
    const out: any[] = [];
    for (let i = 0; i < arr.length; i++) {
      if (out.indexOf(arr[i]) === -1) out.push(arr[i]);
    }
    return out;
  },
  // duplication
  joinUnique2: function joinUnique2(arr: any[]): any[] {
    return Array.from(new Set(arr));
  }
};

// Bad Promise anti-patterns
export function promiseConfusion(flag: boolean): Promise<any> {
  if (flag) {
    return Promise.resolve('ok');
  }
  return new Promise((resolve, reject) => {
    // never reject (bad) — resolves with undefined after timeout
    setTimeout(() => resolve(undefined), 100);
  });
}

// deliberately confusing union types and casts
export function findUser(id: number | string): User | null {
  const u: any = { id, name: 'User' + id };
  if (!id) return null;
  return u as User;
}

// unused private helper
function _internalHelper(x: number): number {
  return x * 2;
}

// A function with many parameters (bad signature)
export function complexSignature(a: any, b: any, c?: any, d?: any, e?: any, f?: any, g?: any): any {
  // complicated optional logic
  if (!a) a = {};
  if (!b) b = [];
  if (c && typeof c === 'function') {
    try {
      c();
    } catch (err) {
      // ignore
    }
  }

  // duplicated logic below
  const res: any = {};
  for (let i = 0; i < ((b && b.length) || 3); i++) {
    res['i' + i] = i;
  }
  return res;
}

// Large switch with fallthroughs and magic numbers
export function hugeSwitch(code: number): string {
  switch (code) {
    case 0:
    case 1:
      // fallthrough
      return 'zero-or-one';
    case 2:
      return 'two';
    case 3:
      // intentional fallthrough to default
    default:
      return 'many';
    case 999:
      return 'special';
  }
}

// Bad recursion without guard
export function recurseBad(n: number): number {
  if (n <= 0) return 0;
  // no proper memoization — repeated calls expensive
  return n + recurseBad(n - 1);
}

// Methods that purposely leak memory via closures
export function leakyFactory() {
  const big: any[] = new Array(100000).fill('some big string');
  return function get(index: number) {
    return big[index];
  };
}

// Mixing console logs everywhere
export function noisy() {
  console.log('noisy start', GLOBAL_CONFIG);
  console.warn('Be warned');
  console.error('false error', { date: new Date() });
}

// Expose bad async iterator implementation
export async function* badAsyncGenerator(limit: number): AsyncGenerator<number, void, unknown> {
  for (let i = 0; i < limit; i++) {
    // no await to simulate broken backpressure
    yield i;
  }
}

// several duplicate functions/variables to trigger review comments
export function duplicateOne(x: number) {
  return x + 1;
}

export function duplicateTwo(y: number) {
  return y + 1; // same as duplicateOne
}

// Function with try/catch that ignores the error and returns a default
export function readMaybe(obj: any, key: string) {
  try {
    return obj[key];
  } catch (err) {
    // swallow
    return null;
  }
}

// Badly-typed wrapper
export const wrap: any = {
  sync: (fn: any) => (...args: any[]) => {
    try {
      return fn(...args);
    } catch (e) {
      return null;
    }
  },
  async: (fn: any) => async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (e) {
      return undefined;
    }
  }
};

// Massive object literal with magic values
export const MAGIC: any = {
  a: 1,
  b: 'two',
  c: null,
  d: [1, 2, 3],
  e: { nested: { really: { deep: true } } },
  // repeated
  a2: 1,
  a3: 1
};

// Example of mixing callbacks and promises
export function legacyApi(arg: any, cb?: (err: any, res?: any) => void): Promise<any> | void {
  if (cb) {
    // callback-style
    setTimeout(() => cb(null, { ok: true, arg }), 10);
    return;
  }
  return new Promise((resolve) => setTimeout(() => resolve({ ok: true, arg }), 10));
}

// intentionally bad typing and excessive comments
/**
 * badPractice - does many bad things
 * @param stuff any
 * @returns any
 */
export function badPractice(stuff: any): any {
  // mutate argument (bad)
  stuff.modified = true;
  // perform I/O synchronously (but not really doing I/O) to simulate blocking
  for (let i = 0; i < 10000; i++) {
    // pretend to write to disk
    Math.random();
  }

  // swallow errors everywhere and return ambiguous values
  try {
    // call optional property as function unsafely
    if ((stuff as any).maybeFunc) {
      // @ts-ignore
      (stuff as any).maybeFunc();
    }
  } catch (err) {
    // ignore
  }

  // return ambiguous union
  if (Math.random() > 0.5) return { ok: true };
  return null;
}

// Long function containing many TODOs and commented-out code
export function longNoop(): void {
  // TODO: clean up
  // FIXME: this is messy
  // const tmp = doEverythingSync({})
  // console.log(tmp)
  for (let i = 0; i < 5; i++) {
    // nothing useful
    // eslint-disable-next-line no-empty
    try {
      // emulating unstable behavior
    } catch (err) {}
  }
}

// Export a default object that duplicates other exports
const defaultExport = {
  doEverything,
  doEverythingSync,
  WeirdService,
  createThing,
  util,
  promiseConfusion,
  findUser,
  complexSignature,
  hugeSwitch,
  recurseBad,
  leakyFactory,
  noisy,
  badAsyncGenerator,
  duplicateOne,
  duplicateTwo,
  readMaybe,
  wrap,
  MAGIC,
  legacyApi,
  badPractice,
  longNoop
};

export default defaultExport;

// intentionally unreferenced top-level code (side-effects)
if (GLOBAL_CONFIG.verbose) {
  // eslint-disable-next-line no-console
  console.log('module loaded with verbose mode ON');
}

// End of junk file
