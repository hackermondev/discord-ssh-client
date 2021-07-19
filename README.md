# Discord SSH Bot
[public version invite](https://discord.com/oauth2/authorize?client_id=866294717641654335&scope=bot&permissions=2214980673)

[upvote on top.gg?](https://top.gg/bot/866294717641654335/vote)

## Introduction

This is a discord bot that I created over the weekend and I wanted to share it. It allows you to use a discord bot as an ssh client! You can run commands, setup a terminal and more is coming soon!

## My Stack

Language: **Node.js/Typescript** 

Database: **PostgreSQL**

Hosting: **Docker**

## What is an ssh client?
It's the protocol for the ssh server which is what developers use to run code remotely on servers.

## Images

Some images:

![image](https://i.matdoes.dev/image/dd93ca241cab32a290cb5f79549fb6c6)
![image](https://i.matdoes.dev/image/aae48cda8c6ddd33144d2cb8e823f041)


## How It Works

Basically you generate this things called ``auth keys`` on the bot with the username and password of the ssh server. You run the command `$auth <username <password>`, then the bot gives you a unique key that you can use to connect to servers (so you don't have to keep retyping your username and password) ``$bash <server_ip> <auth_key>`` or ``$command <server_ip> <auth_key> [command]``. The auth key will only work for you but should be kept secret. It saves the auth key with the username and password (encrypted) in the PostgreSQL database so you don't have to keep retyping your password.


### Roadmap

*Some things I might add later*

- Add support for SSH keys for auth
- Add support for listing files and directories with a command
- Add ability for user to customize bot settings (change prefix and stuff)