const { Events } = require('discord.js');

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		if (!interaction.isChatInputCommand()) return;

		const command = interaction.client.commands.get(interaction.commandName);
		const comman_channel = "1380591686798934106";
		const debug = false;
		const devs = ['321750582912221184'];

		if (!command) {
			console.error(`No command matching ${interaction.commandName} was found.`);
			return;
		}

		if (debug && !devs.includes(interaction.user.id)) {
			await interaction.reply({
				content: `⚠️ Debug mode is enabled. The command \`${interaction.commandName}\` is currently disabled.`,
				ephemeral: true,
			});
			return;
		}

		if (interaction.user.id !== '321750582912221184') {
			if (interaction.channel.id !== comman_channel) {
				await interaction.reply({
					content: `⚠️ This command can only be used in <#${comman_channel}>.`,
					ephemeral: true,
				});
				return;
			}
		}

		// Try to execute the command
		try {
			await command.execute(interaction);
		} catch (error) {
			console.error(`❌ Error executing ${interaction.commandName}`);
			console.error(error);
			await interaction.reply({
				content: `There was an error executing the command.`,
				ephemeral: true,
			});
		}
	},
};
