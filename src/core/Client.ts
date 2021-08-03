import { Client, ClientOptions as BotOptions, Collection } from 'discord.js';
import { DatabaseClient, Encryption } from '.';
import { ClientOptions } from '../structures';

import fetch, { HeaderInit, Headers } from 'node-fetch';

class BotClient extends Client {
  public prefix: string;
  public _token: string | undefined;
  public commands: Collection<unknown, unknown>;
  public db: DatabaseClient;
  public encryption: Encryption;
  public topggKey?: string;

  constructor(options: ClientOptions) {
    super(options);

    this.prefix = options.prefix;
    this._token = options.token;
    this.commands = new Collection();

    this.db = options.databaseClient;
    this.encryption = new Encryption(options.encryptionKey);

    if (options.topggKey) {
      this.topggKey = options.topggKey;
    }
  }

  run(callback?: () => any) {
    if (callback) {
      this.once('ready', callback);
    }

    this.login(this._token);
  }

  async postTopggStats() {
    if (!this.topggKey) {
      return false;
    }

    const headers: HeaderInit = new Headers();

    headers.set('Authorization', this.topggKey);
    headers.set('User-Agent', 'discord-ssh-client/1.0');
    headers.set('Content-Type', 'application/json');

    var res = await fetch(`https://top.gg/api/bots/${this.user?.id}/stats`, {
      headers: headers,
      method: 'POST',
      body: JSON.stringify({
        server_count: this.guilds.cache.size,
        shard_count: this.shard?.count
      })
    });

    return res.ok;
  }
}

export default BotClient;
