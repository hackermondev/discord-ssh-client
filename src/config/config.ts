// import { ActivityType, PresenceData, PresenceStatusData } from "discord.js"

import databaseConfig from './config/database.json';
import botConfig from './config/botConfig.json';

interface IbotConfigActivity {
  type: any;
  text: any;
  status: any;
}

interface IbotConfig {
  token: string;
  activity: IbotConfigActivity;
  prefix: string;
  owners: string[];
  pastebinApiKey?: string;
  encryptionKey: string;
  topggKey?: string;
}

interface IDatabaseConfig {
  host: string;
  user: string;
  database: string;
  password: string;
  port: number;
  ssl: boolean;
}

interface IColors {
  success: string;
  error: string;
  processing: string;
  fancy: string;
}

const colors: IColors = {
  success: '#50c878',
  error: '#FF0000',
  processing: '#FFFF00',
  fancy: '#f26522'
};

const botConfigData: IbotConfig = botConfig;
const databaseConfigData: IDatabaseConfig = databaseConfig;

export default {
  botConfig: botConfigData,
  colors: colors,
  databaseConfig: databaseConfigData
};
