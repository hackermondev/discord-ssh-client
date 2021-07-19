import { Pool as PostgresqlClient, QueryResult } from "pg"
import config from "../config/config"

import AuthTable from "./database/tables/auth.json"

interface ITableColumn{
    name: string
    type: string
    required: boolean
    isUnique: boolean
    primary: boolean
    default?: string
}

interface ITable{
    tableName: string
    createOnConnect: boolean
    columns: ITableColumn[]
}


class DatabaseClient extends PostgresqlClient{
    constructor(){
        super({
            user: config.databaseConfig.user,
            host: config.databaseConfig.host,
            database: config.databaseConfig.database,
            password: config.databaseConfig.password,
            port: config.databaseConfig.port,
            ssl: {
                rejectUnauthorized: false
            }
        })
    }

    async runQuery(query: string): Promise<any[]> {
        var res: QueryResult = await this.query(query)

        // console.log(`query: `, query, `results: ${JSON.stringify(res.rows)}`)
        return res.rows
    }

    async createRequiredTables(){
        this.createTable(AuthTable)
    }

    async createTable(tableData: ITable): Promise<boolean>{
        var textData = ``

        tableData.columns.map((column: ITableColumn, index: Number)=>{
            var extraData = ``

            // if(column.primary){
            //     extraData += `PRIMARY `
            // }

            if(column.isUnique){
                extraData += `UNIQUE `
            }

            if(column.required){
                extraData += `NOT NULL `
            }

            if(column.default){
                extraData += `DEFAULT ${column.default}`
            }

            extraData = extraData.trimEnd()

            if(index == tableData.columns.length - 1){
                textData += `\t${column.name} ${column.type} ${extraData}\n`
            } else {
                textData += `\t${column.name} ${column.type} ${extraData},\n`
            }
        })

        await this.runQuery(`CREATE TABLE IF NOT EXISTS ${tableData.tableName} (\n${textData})`)

        return true
    }
}

export default DatabaseClient