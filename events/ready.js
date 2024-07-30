const { Events, ActivityType } = require('discord.js');
const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

const siteUrl = process.env.SITE;

module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client) {
		console.log(`Logged in as ${client.user.tag}`);

		const checkSiteStatus = async () => {
			try {
				const response = await axios.get(siteUrl);
				if (response.status === 200) {
					client.user.setActivity('Site is up!', { type: ActivityType.Watching });
				} else {
					client.user.setActivity('Site might be down.', { type: ActivityType.Watching });
				}
			} catch (error) {
				client.user.setActivity('Error pinging site.', { type: ActivityType.Watching });
				console.error('Error pinging site:', error);
			}
		};
		checkSiteStatus();
		setInterval(checkSiteStatus, 300);
	},
};
