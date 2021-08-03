interface GuildData {
  prefix: string;
  ownerID: string;
  disabledCommands: string[];
  blacklistedUsers: string[];
}

interface Guild {
  database_id?: number;
  guild_id: string;
  guild_data: GuildData;
  created_at: Date;
}

export default Guild;
