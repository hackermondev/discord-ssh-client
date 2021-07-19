import { AuthData, CommandOptions } from "../structures"

import { MessageBuilder } from "../core"
import config from "../config/config"

import { Message } from "discord.js"
import { Client } from "../core"


const commandCallback = async (client: Client, message: Message, args: string[]) => {
    try{
        var query = await client.db.query(`SELECT * FROM auth WHERE created_by=$1`, [message.author.id])

        var rows = query.rows[0]
        var text = ``

        if(query.rowCount == 0){
            text = `You have no auth keys connected. Use \`${config.botConfig.prefix}auth <username> <password>\` to generate an auth key!`
        }

        await Promise.all(query.rows.map(async (row: AuthData)=>{  
            var encryptedPassword: string = ``

            if(row.password){
                row.password = await client.encryption.decrypt(row.password)

                for(var i = 0; i < row.password?.length; i++){
                    encryptedPassword += `*`
                }
            } else {
                encryptedPassword = `NO_PASSWORD`
            }

            text += `\`(${row.id}) ${row.hash}\`:\n \tUsername: ${row.username}\r\n\tPassword: \`${encryptedPassword}\`\r\n\n`
        }))

        if(query.rowCount > 0){
            text += `\n\nUse \`${config.botConfig.prefix}delete <key_id>\` to delete an auth key!`
        }

        var embed = new MessageBuilder(message)
            .setTitle(`Your auth keys (${query.rowCount} keys)`)
            .setDescription(text)

            .setColor(config.colors['success'])
        
        message.channel.send(embed)
    }
    catch(err){
        console.error(err)

        var error = new MessageBuilder(message)
            .setTitle(`Error`)
            .setDescription(`An error occured while fetching the keys from our database. Please contact the owners for more information.`)
            .setColor(config.colors.error)

        return message.channel.send(error)
    }
}

const commandOptions: CommandOptions = {
    name: "keys",
    aliases: ["listkeys", "showkeys"],
    callback: commandCallback,
    description: `List all the auth keys you have created.`
}

export default commandOptions