/**
 * big-random.ts
 *
 * A large, self-contained TypeScript file containing:
 * - interfaces, types, enums
 * - generics and utility types
 * - classes (service, repository, model)
 * - async simulations and promises
 * - decorators (simple)
 * - fake data generators
 * - small in-memory DB and query helpers
 * - example usage / quick tests
 *
 * Use it for learning, testing type-checkers, or generating large code samples.
 */

/* ============================
 * Types, Enums, & Utility Types
 * ============================ */

export enum UserRole {
  Guest = "guest",
  User = "user",
  Moderator = "moderator",
  Admin = "admin",
}

export type ID = string;

export interface Address {
  id: ID;
  street: string;
  city: string;
  state?: string;
  zip: string;
  country: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface User {
  id: ID;
  username: string;
  email: string;
  role: UserRole;
  createdAt: Date;
  updatedAt?: Date;
  addresses: Address[];
  metadata?: Record<string, any>;
}

export interface Post {
  id: ID;
  authorId: ID;
  title: string;
  content: string;
  tags: string[];
  published: boolean;
  createdAt: Date;
  updatedAt?: Date;
  reactions: Record<string, number>; // e.g., { like: 10, love: 2 }
}

export interface QueryOptions {
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  filter?: Record<string, any>;
}

/* Generic Result wrapper */
export type Result<T> =
  | { ok: true; value: T }
  | { ok: false; error: Error };

/* ============================
 * Utility functions
 * ============================ */

/** Simple UUID-ish id generator (not cryptographically secure) */
export function makeId(prefix = ""): ID {
  const rand = () =>
    Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  return `${prefix}${rand()}${rand()}-${Date.now().toString(36)}`;
}

export function now(): Date {
  return new Date();
}

export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* ============================
 * Decorators (simple)
 * ============================ */

/** A method decorator that logs execution time. */
export function timed(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
) {
  const original = descriptor.value;
  descriptor.value = async function (...args: any[]) {
    const t0 = performanceNow();
    const result = await original.apply(this, args);
    const t1 = performanceNow();
    console.info(
      `[timed] ${target.constructor.name}.${propertyKey} took ${(t1 - t0).toFixed(
        2
      )}ms`
    );
    return result;
  };
  return descriptor;
}

/** A class decorator that adds a static debug name */
export function debugName(name: string) {
  return function <T extends { new (...args: any[]): {} }>(constructor: T) {
    (constructor as any).__debugName = name;
    return constructor;
  };
}

/* performanceNow shim for Node + browser compatibility */
function performanceNow(): number {
  if (typeof performance !== "undefined" && performance.now) {
    return performance.now();
  }
  return Date.now();
}

/* ============================
 * In-memory Database (very small)
 * ============================ */

type TableRow = Record<string, any>;

class InMemoryTable<T extends TableRow> {
  private rows: Map<ID, T> = new Map();

  insert(row: T & { id?: ID }): T {
    const id = row.id ?? makeId();
    const toInsert = { ...row, id } as T;
    this.rows.set(id, toInsert);
    return deepClone(toInsert);
  }

  get(id: ID): T | undefined {
    const r = this.rows.get(id);
    return r ? deepClone(r) : undefined;
  }

  update(id: ID, patch: Partial<T>): T | undefined {
    const existing = this.rows.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...patch } as T;
    this.rows.set(id, updated);
    return deepClone(updated);
  }

  delete(id: ID): boolean {
    return this.rows.delete(id);
  }

  query(opts: QueryOptions = {}): T[] {
    let arr = Array.from(this.rows.values()).map((r) => deepClone(r));
    if (opts.filter) {
      const f = opts.filter;
      arr = arr.filter((row) => {
        return Object.keys(f).every((k) => {
          const expected = f[k];
          const actual = (row as any)[k];
          if (expected instanceof RegExp && typeof actual === "string") {
            return expected.test(actual);
          }
          if (typeof expected === "function") {
            try {
              return expected(actual);
            } catch {
              return false;
            }
          }
          return actual === expected;
        });
      });
    }
    if (opts.sortBy) {
      arr.sort((a: any, b: any) => {
        const aVal = a[opts.sortBy!];
        const bVal = b[opts.sortBy!];
        if (aVal === bVal) return 0;
        const cmp = aVal > bVal ? 1 : -1;
        return opts.sortOrder === "desc" ? -cmp : cmp;
      });
    }
    const offset = opts.offset ?? 0;
    const limit = opts.limit ?? arr.length;
    return arr.slice(offset, offset + limit);
  }

  clear() {
    this.rows.clear();
  }
}

/* ============================
 * Repositories
 * ============================ */

export class UserRepository {
  private table = new InMemoryTable<User>();

  create(user: Omit<User, "id" | "createdAt">): User {
    const nowDate = now();
    const toCreate: User = {
      ...user,
      id: makeId("user_"),
      createdAt: nowDate,
      updatedAt: nowDate,
    };
    return this.table.insert(toCreate);
  }

  findById(id: ID): User | undefined {
    return this.table.get(id);
  }

  findByEmail(email: string): User | undefined {
    return this.table.query({ filter: { email } })[0];
  }

  query(opts: QueryOptions = {}): User[] {
    return this.table.query(opts);
  }

  update(id: ID, patch: Partial<User>): User | undefined {
    patch.updatedAt = now();
    return this.table.update(id, patch);
  }

  delete(id: ID): boolean {
    return this.table.delete(id);
  }

  clear() {
    this.table.clear();
  }
}

export class PostRepository {
  private table = new InMemoryTable<Post>();

  create(post: Omit<Post, "id" | "createdAt" | "reactions">): Post {
    const nowDate = now();
    const toCreate: Post = {
      ...post,
      id: makeId("post_"),
      createdAt: nowDate,
      updatedAt: nowDate,
      reactions: {},
    };
    return this.table.insert(toCreate);
  }

  findById(id: ID): Post | undefined {
    return this.table.get(id);
  }

  query(opts: QueryOptions = {}): Post[] {
    return this.table.query(opts);
  }

  update(id: ID, patch: Partial<Post>): Post | undefined {
    patch.updatedAt = now();
    return this.table.update(id, patch);
  }

  delete(id: ID): boolean {
    return this.table.delete(id);
  }

  react(id: ID, reaction: string, delta = 1): Post | undefined {
    const p = this.table.get(id);
    if (!p) return undefined;
    p.reactions[reaction] = (p.reactions[reaction] ?? 0) + delta;
    p.updatedAt = now();
    this.table.update(id, p);
    return deepClone(p);
  }

  clear() {
    this.table.clear();
  }
}

/* ============================
 * Services & Business Logic
 * ============================ */

@debugName("UserService")
export class UserService {
  constructor(private repo: UserRepository) {}

  @timed
  async registerUser(payload: {
    username: string;
    email: string;
    role?: UserRole;
  }): Promise<Result<User>> {
    // simulate some work
    await delay(10 + Math.random() * 50);
    const exists = this.repo.findByEmail(payload.email);
    if (exists) {
      return { ok: false, error: new Error("Email already registered") };
    }
    const user = this.repo.create({
      username: payload.username,
      email: payload.email,
      role: payload.role ?? UserRole.User,
      addresses: [],
    });
    return { ok: true, value: user };
  }

  @timed
  async addAddress(userId: ID, addr: Omit<Address, "id" | "createdAt">) {
    await delay(Math.random() * 50);
    const user = this.repo.findById(userId);
    if (!user) return { ok: false, error: new Error("User not found") } as const;
    const address: Address = {
      ...addr,
      id: makeId("addr_"),
      createdAt: now(),
    };
    user.addresses.push(address);
    this.repo.update(userId, { addresses: user.addresses });
    return { ok: true, value: address } as const;
  }

  getUser(userId: ID): Result<User> {
    const u = this.repo.findById(userId);
    if (!u) return { ok: false, error: new Error("User not found") };
    return { ok: true, value: u };
  }
}

@debugName("PostService")
export class PostService {
  constructor(private postRepo: PostRepository, private userRepo: UserRepository) {}

  @timed
  async createPost(payload: {
    authorId: ID;
    title: string;
    content: string;
    tags?: string[];
  }): Promise<Result<Post>> {
    await delay(Math.random() * 30);
    const author = this.userRepo.findById(payload.authorId);
    if (!author) return { ok: false, error: new Error("Author not found") };
    const post = this.postRepo.create({
      authorId: payload.authorId,
      title: payload.title,
      content: payload.content,
      tags: payload.tags ?? [],
      published: false,
    });
    return { ok: true, value: post };
  }

  @timed
  async publish(postId: ID): Promise<Result<Post>> {
    await delay(Math.random() * 20);
    const p = this.postRepo.findById(postId);
    if (!p) return { ok: false, error: new Error("Post not found") };
    const updated = this.postRepo.update(postId, { published: true });
    if (!updated) return { ok: false, error: new Error("Failed to publish") };
    return { ok: true, value: updated };
  }

  listRecent(limit = 10): Post[] {
    return this.postRepo.query({ limit, sortBy: "createdAt", sortOrder: "desc" });
  }
}

/* ============================
 * Fake data generators
 * ============================ */

export function fakeName(): string {
  const first = ["Aiden", "Liam", "Sophia", "Olivia", "Arjun", "Priya", "Rohit", "Sara"];
  const last = ["Patel", "Smith", "Garcia", "Khan", "Lee", "Brown", "Singh", "Gonzalez"];
  return `${first[Math.floor(Math.random() * first.length)]} ${
    last[Math.floor(Math.random() * last.length)]
  }`;
}

export function fakeEmail(username?: string): string {
  const domains = ["example.com", "mail.com", "service.org", "company.co"];
  const u = username ?? `user${Math.floor(Math.random() * 10000)}`;
  return `${u.replace(/\s+/g, ".").toLowerCase()}@${domains[Math.floor(Math.random() * domains.length)]}`;
}

export function fakeAddress(): Omit<Address, "id" | "createdAt"> {
  const streets = ["1 Main St", "42 Park Ave", "1600 Elm St", "500 Tech Blvd", "10 Downing"];
  const cities = ["Springfield", "Mumbai", "Austin", "London", "Toronto"];
  const zips = ["10001", "400001", "73301", "SW1A 1AA", "M5H 2N2"];
  const i = Math.floor(Math.random() * streets.length);
  return {
    street: streets[i],
    city: cities[i],
    state: "N/A",
    zip: zips[i],
    country: "Wonderland",
    updatedAt: undefined,
  };
}

export function fakeParagraph(sentences = 3): string {
  const pool = [
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit",
    "Vestibulum gravida libero vel turpis malesuada, at tincidunt est faucibus",
    "Integer feugiat sapien sed velit gravida, id suscipit lectus facilisis",
    "Cras quis tortor sed orci luctus fermentum",
    "Pellentesque habitant morbi tristique senectus et netus et malesuada fames",
    "Sed vitae nibh vitae purus volutpat pellentesque",
  ];
  let out = "";
  for (let i = 0; i < sentences; i++) {
    out += pool[Math.floor(Math.random() * pool.length)];
    out += i === sentences - 1 ? "." : ". ";
  }
  return out;
}

/* ============================
 * Type guards and helpers
 * ============================ */

export function isUser(x: any): x is User {
  return !!x && typeof x.id === "string" && typeof x.email === "string";
}

export function isPost(x: any): x is Post {
  return !!x && typeof x.id === "string" && typeof x.title === "string";
}

/* ============================
 * Batch operations + Utilities
 * ============================ */

/** Create a batch of fake users */
export async function createFakeUsers(
  repo: UserRepository,
  count: number,
  delayBetween = 0
): Promise<User[]> {
  const results: User[] = [];
  for (let i = 0; i < count; i++) {
    const user = repo.create({
      username: fakeName(),
      email: fakeEmail(`user${Math.floor(Math.random() * 100000)}`),
      role: UserRole.User,
      addresses: [],
    });
    results.push(user);
    if (delayBetween > 0) await delay(delayBetween);
  }
  return results;
}

/** Create a batch of fake posts for a set of userIds */
export async function createFakePosts(
  postRepo: PostRepository,
  userIds: ID[],
  countPerUser = 3
): Promise<Post[]> {
  const posts: Post[] = [];
  for (const uid of userIds) {
    for (let i = 0; i < countPerUser; i++) {
      const p = postRepo.create({
        authorId: uid,
        title: `Post by ${uid} #${i + 1}`,
        content: fakeParagraph(2 + Math.floor(Math.random() * 3)),
        tags: ["random", "sample"].concat(i % 2 === 0 ? ["even"] : ["odd"]),
        published: Math.random() > 0.4,
      });
      posts.push(p);
    }
  }
  return posts;
}

/* ============================
 * Some higher-order utilities
 * ============================ */

/** Retry wrapper for async functions */
export async function retry<T>(
  fn: () => Promise<T>,
  attempts = 3,
  backoffMs = 50
): Promise<T> {
  let lastErr: any;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      await delay(backoffMs * (i + 1));
    }
  }
  throw lastErr;
}

/** Simple pipeline operator for synchronous functions */
export function pipe<T>(value: T, ...fns: Array<(v: T) => T>): T {
  return fns.reduce((acc, fn) => fn(acc), value);
}

/* ============================
 * Example usage (self-test)
 * ============================ */

/* Self-contained run function for quick in-file testing */
export async function demoLargeFileScenario() {
  const userRepo = new UserRepository();
  const postRepo = new PostRepository();

  const userService = new UserService(userRepo);
  const postService = new PostService(postRepo, userRepo);

  // Create fake users
  const users = await createFakeUsers(userRepo, 12, 5);
  console.log(`Created ${users.length} users.`);

  // Add addresses for first 3 users
  for (let i = 0; i < 3; i++) {
    const u = users[i];
    const res = await userService.addAddress(u.id, fakeAddress());
    if (res.ok) {
      console.log(`Added address to ${u.username}: ${res.value.street}`);
    }
  }

  // Create some posts
  const userIds = users.slice(0, 6).map((u) => u.id);
  const posts = await createFakePosts(postRepo, userIds, 5);
  console.log(`Created ${posts.length} posts.`);

  // Publish a few posts and react
  const toPublish = posts.filter((p) => !p.published).slice(0, 5);
  for (const p of toPublish) {
    const r = await postService.publish(p.id);
    if (r.ok) {
      console.log(`Published post: ${r.value.id}`);
    }
    // random reactions
    postRepo.react(p.id, "like", Math.floor(Math.random() * 10));
    postRepo.react(p.id, "love", Math.floor(Math.random() * 5));
  }

  // List recent posts
  const recent = postService.listRecent(10);
  console.log("Recent posts (IDs):", recent.map((p) => p.id).join(", "));

  // Attempt a retry-wrapped operation that may fail randomly
  try {
    const sometimesFailing = async () => {
      if (Math.random() > 0.6) throw new Error("random fail");
      return "ok";
    };
    const val = await retry(sometimesFailing, 5, 20);
    console.log("Retry result:", val);
  } catch (e) {
    console.warn("Retry operation ultimately failed:", (e as Error).message);
  }

  return { users, posts, recentCount: recent.length };
}

@debugName("UserService")
export class UserService {
  constructor(private repo: UserRepository) {}

  @timed
  async registerUser(payload: {
    username: string;
    email: string;
    role?: UserRole;
  }): Promise<Result<User>> {
    await delay(10 + Math.random() * 50);
    const exists = this.repo.findByEmail(payload.email);
    if (exists) {
      return { ok: false, error: new Error("Email already registered") };
    }
    const user = this.repo.create({
      username: payload.username,
      email: payload.email,
      role: payload.role ?? UserRole.User,
      addresses: [],
    });
    return { ok: true, value: user };
  }

  @timed
  async addAddress(userId: ID, addr: Omit<Address, "id" | "createdAt">) {
    await delay(Math.random() * 50);
    const user = this.repo.findById(userId);
    if (!user) return { ok: false, error: new Error("User not found") } as const;
    const address: Address = {
      ...addr,
      id: makeId("addr_"),
      createdAt: now(),
    };
    user.addresses.push(address);
    this.repo.update(userId, { addresses: user.addresses });
    return { ok: true, value: address } as const;
  }

  getUser(userId: ID): Result<User> {
    const u = this.repo.findById(userId);
    if (!u) return { ok: false, error: new Error("User not found") };
    return { ok: true, value: u };
  }

  /** 🆕 New method: Get all users by their role */
  getUsersByRole(role: UserRole): User[] {
    return this.repo.query({ filter: { role } });
  }
}

/* ============================
 * Exports for convenience
 * ============================ */

export default {
  makeId,
  now,
  delay,
  UserRepository,
  PostRepository,
  UserService,
  PostService,
  createFakeUsers,
  createFakePosts,
  demoLargeFileScenario,
};
