import { Message } from "discord.js"
import { Client } from "../core"

interface CommandOptions {
    name: string
    aliases: string[]
    callback: (client: Client, message: Message, args: string[]) => any

    usage?: string
    description?: string
    isPrivate?: boolean
    showOnHelpCommand?: boolean
    requiredPermissions?: string[]
}

export default CommandOptions