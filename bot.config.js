module.exports = {
  apps: [{
    name: "discord-ssh-client",
    script: "./dest/index.js",
    watch: true,

    env_production: {
      NODE_ENV: "production"
    },

    env_development: {
      NODE_ENV: "development"
    }
  }]
}
