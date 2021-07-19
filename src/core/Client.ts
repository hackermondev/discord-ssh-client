import { Client, ClientOptions as BotOptions, Collection } from "discord.js"
import { DatabaseClient, Encryption } from ".";
import { ClientOptions } from "../structures"

class BotClient extends Client{
    public prefix: string;
    public _token: string | undefined;
    public commands: Collection<unknown, unknown>;
    public db: DatabaseClient
    public encryption: Encryption;

    constructor(options: ClientOptions){
        super(options)

        this.prefix = options.prefix
        this._token = options.token
        this.commands = new Collection()

        this.db = options.databaseClient
        this.encryption = new Encryption(options.encryptionKey)
    }

    run(callback?: () => any){
        if(callback){
            this.once('ready', callback)
        }

        this.login(this._token)
    }
}

export default BotClient