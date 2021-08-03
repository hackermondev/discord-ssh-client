import { ClientOptions as BotOptions } from 'discord.js';
import { DatabaseClient } from '../core';

interface ClientOptions extends BotOptions {
  prefix: string;
  token: string | undefined;
  databaseClient: DatabaseClient;
  encryptionKey: string;
  topggKey?: string;
}

export default ClientOptions;
