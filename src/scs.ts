import redis, { RedisClient } from "redis";
import { promisify } from "util";

export interface Account {
  id: string;
  username: string;
  credit: number;
}

class SocialCreditSystem {
  private _accounts: Account[] = [];
  private _redis: RedisClient;
  private hkeysASync: (arg1: string) => Promise<string[]>;
  private hGetASync: (arg1: string, arg2: string) => Promise<string>;
  private getAsync: (arg1: string) => Promise<string | null>;

  constructor() {
    this._redis = redis.createClient({
      host: "containers-us-west-18.railway.app",
      port: 7962,
      password: "8mwbkKpG2Ep7O4rBLqmd",
    });
    this.getAsync = promisify(this._redis.get).bind(this._redis);
    this.hkeysASync = promisify(this._redis.hkeys).bind(this._redis);
    this.hGetASync = promisify(this._redis.hget).bind(this._redis);
  }

  // private _loadAccounts = async () => {
  //   const accounts = await this.hkeysASync("accounts");

  //   console.log(`Loaded ${accounts.length} accounts.`);
  //   this._accounts = [];

  //   accounts.forEach(async (account) => {
  //     const acc = await this.hGetASync("accounts", account);

  //     if (acc) {
  //       console.log(`Loaded account ${acc}`);
  //       this._accounts.push(JSON.parse(acc));
  //     } else {
  //       console.log(`Failed to load account ${account}`);
  //     }
  //   });
  // };

  private _getAccounts = async (): Promise<Account[]> => {
    const _accounts: Account[] = [];

    const accounts = await this.hkeysASync("accounts");
    for (let account of accounts) {
      const acc = await this.hGetASync("accounts", account);
      if (acc) {
        _accounts.push(JSON.parse(acc));
      }
    }

    return _accounts;
  };

  public addAccount = (account: Account) => {
    console.log(`Adding account ${account}`);
    this._accounts.push(account);
    this._redis.hset("accounts", account.id, JSON.stringify(account));
  };

  public getAccount = async (id: string): Promise<Account | undefined> => {
    const acc = await this.hGetASync("accounts", id);
    if (acc) {
      return JSON.parse(acc) as Account;
    }
  };

  public modifyBalance = async (
    id: string,
    amount: number
  ): Promise<number> => {
    const account = await this.getAccount(id);
    if (account) {
      account.credit += amount;
      this._redis.hset("accounts", account.id, JSON.stringify(account));
    }
    return account?.credit ?? 0;
  };

  public getBalance = async (id: string): Promise<number> => {
    const account = await this.getAccount(id);
    return account?.credit ?? 0;
  };
}

export default SocialCreditSystem;
