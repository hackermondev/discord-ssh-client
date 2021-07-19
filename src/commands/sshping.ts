import { CommandOptions, ServerData, AuthData } from "../structures"

import { MessageBuilder, Client, SSHClient } from "../core"
import config from "../config/config"

import utils from "../core/utils"
import { Message } from "discord.js"


const commandCallback = async (client: Client, message: Message, args: string[]) => {
    var server: string = args[0]
    var authKey: string = args[1]

    if (!server) {
        var error = new MessageBuilder(message)
            .setTitle(`SSH Ping Error`)
            .setDescription(`You need to provide a valid server ip and/or port. Please run the command again. Example: \`${config.botConfig.prefix}sshping 69.69.69.69:22\` `)
            .setColor(config.colors.error)

        return message.channel.send(error)
    }

    if (!authKey) {
        var error = new MessageBuilder(message)
            .setTitle(`SSH Ping Error`)
            .setDescription(`You need to provide a valid auth key. Please run the command again. Example: \`${config.botConfig.prefix}sshping 69.69.69.69:22 your_auth_key\` `)
            .setColor(config.colors.error)

        return message.channel.send(error)
    }

    var serverData: ServerData = utils.parseServerData(server)

    try {
        var auth = await client.db.query(`SELECT * FROM auth WHERE hash=$1`, [authKey])

        if (auth.rowCount == 0) {
            var error = new MessageBuilder(message)
                .setTitle(`Invalid auth key.`)
                .setDescription(`You provided an invalid auth key. If you don't have an auth key, generate one with: \`${config.botConfig.prefix}auth <username> <password>\` `)
                .setColor(config.colors.error)

            return message.channel.send(error)
        }

        var data: AuthData = auth.rows[0]

        if (data['created_by'] != message.author.id) {
            var error = new MessageBuilder(message)
                .setTitle(`Invalid auth key.`)
                .setDescription(`You provided a valid auth key but it isn't yours. Please make sure you are only using keys that you have generated.`)
                .setColor(config.colors.error)

            return message.channel.send(error)
        }
        
        if(data.password){
            data.password = await client.encryption.decrypt(data.password)
        }

        var messageEmbed = new MessageBuilder(message)
            .setDescription(`Attempting to connect to server \`${serverData.ipAddress}:${serverData.port}\` with the provided auth key. This might take a few seconds...`)
            .setColor(config.colors.processing)

        var connectingMessage: Message = await message.channel.send(messageEmbed)

        try{
            var c: SSHClient = await utils.connectToSSHAndReturnClient(serverData, data, message)

            // console.log(`connected...`)

            c.end()
            var success = new MessageBuilder(message)
                .setTitle(`SSH Ping Success.`)
                .setDescription(`The ssh ping was successfully. The auth key provided has the correct creds for the server.`)
                .setColor(config.colors.success)

            return connectingMessage.edit(success)
        }
        catch(err){
            var error = new MessageBuilder(message)
                .setTitle(`SSH Handshake Failed.`)
                .setDescription(`The ssh handshake failed. The port is closed or the auth data for the provided auth key is invalid for the server provided. Please create a new auth key with correct creds or change the creds from the server.\n\n \`${err}\` `)
                .setColor(config.colors.error)

            return connectingMessage.edit(error)
        }
    }
    catch (err) {
        console.error(err)

        var error = new MessageBuilder(message)
            .setTitle(`Error`)
            .setDescription(`An error occured while fetching the auth key from our database. Please contact the owners for more information.`)
            .setColor(config.colors.error)

        return message.channel.send(error)
    }
}

const commandOptions: CommandOptions = {
    name: "sshping",
    aliases: ["sshtest", "authtest", "connect"],
    callback: commandCallback,
    description: `Test your SSH auth keys with the server.`,
    usage: "sshping <ip:port> <auth_key>"
}

export default commandOptions