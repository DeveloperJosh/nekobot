const { Events, ActivityType } = require('discord.js');
const dotenv = require('dotenv');
dotenv.config();

module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client) {
		console.log(`Logged in as ${client.user.tag}`);
		client.user.setActivity('Someone pee', { type: ActivityType.Watching });
	},
};
