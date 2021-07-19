import { AuthData, CommandOptions } from "../structures"

import { MessageBuilder } from "../core"
import config from "../config/config"

import { Message } from "discord.js"
import { Client } from "../core"


const commandCallback = async (client: Client, message: Message, args: string[]) => {
    try {
        var id: string = args[0]

        if (!id) {
            var error = new MessageBuilder(message)
                .setTitle(`Error`)
                .setDescription(`You need to provide a valid auth key to delete from our database.`)
                .setColor(config.colors.error)

            return message.channel.send(error)
        }

        var query = await client.db.query(`SELECT * FROM auth WHERE hash = $1`, [id])

        if (query.rowCount == 0) {
            var error = new MessageBuilder(message)
                .setTitle(`Error`)
                .setDescription(`You need to provide a valid auth key to delete from our database.`)
                .setColor(config.colors.error)

            return message.channel.send(error)
        }

        var item: AuthData = query.rows[0]

        if(item.created_by != message.author.id){
            var error = new MessageBuilder(message)
                .setTitle(`Error`)
                .setDescription(`You cannot delete this key! This is not your auth key!`)
                .setColor(config.colors.error)

            return message.channel.send(error)
        }

        await client.db.query(`DELETE FROM auth WHERE hash = $1`, [id])

        var embed = new MessageBuilder(message)
            .setTitle(`Auth Key Deleted`)
            .setDescription(`That auth key was successfully deleted from our database.`)

            .setColor(config.colors.success)
        
        message.channel.send(embed)
    }
    catch (err) {
        console.error(err)

        var error = new MessageBuilder(message)
            .setTitle(`Error`)
            .setDescription(`An error occured while fetching the keys from our database. Please contact the owners for more information.`)
            .setColor(config.colors.error)

        return message.channel.send(error)
    }
}

const commandOptions: CommandOptions = {
    name: "delete",
    aliases: ["remove"],
    callback: commandCallback,
    description: `Remove an auth key that you created.`,
    usage: "delete <auth_key>"
}

export default commandOptions