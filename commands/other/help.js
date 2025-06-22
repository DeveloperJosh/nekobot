const {
	SlashCommandBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	EmbedBuilder
} = require('discord.js');
const getAllCommands = require('../../structure/commandRegistry').getAllCommands;

module.exports = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('List all available commands grouped by category.'),

	async execute(interaction) {
		const commands = getAllCommands();

		const categories = {};
		for (const cmd of commands) {
			if (!categories[cmd.category]) categories[cmd.category] = [];
			categories[cmd.category].push(cmd);
		}

		const categoryNames = Object.keys(categories);
		let page = 0;

		const generateEmbed = (page) => {
			const category = categoryNames[page];
			const cmds = categories[category];

			const embed = new EmbedBuilder()
				.setTitle(`📖 Help Menu - ${category.charAt(0).toUpperCase() + category.slice(1)}`)
				.setColor('#0099ff')
				.setFooter({ text: `Category ${page + 1} of ${categoryNames.length}` });

			for (const cmd of cmds) {
				embed.addFields({ name: `/${cmd.name}`, value: cmd.description });
			}

			return embed;
		};

		const row = new ActionRowBuilder().addComponents(
			new ButtonBuilder()
				.setCustomId('prev')
				.setLabel('⬅️ Previous')
				.setStyle(ButtonStyle.Secondary)
				.setDisabled(true),
			new ButtonBuilder()
				.setCustomId('next')
				.setLabel('Next ➡️')
				.setStyle(ButtonStyle.Secondary)
				.setDisabled(categoryNames.length <= 1)
		);

		await interaction.reply({
			embeds: [generateEmbed(page)],
			components: [row],
			ephemeral: true
		});

		const message = await interaction.fetchReply();
		const collector = message.createMessageComponentCollector({ time: 60_000 });

		collector.on('collect', async i => {
			if (i.user.id !== interaction.user.id) {
				await i.reply({ content: '❌ Only the command user can use these buttons.', ephemeral: true });
				return;
			}

			if (i.customId === 'next') page++;
			else if (i.customId === 'prev') page--;

			row.components[0].setDisabled(page === 0);
			row.components[1].setDisabled(page + 1 >= categoryNames.length);

			await i.update({
				embeds: [generateEmbed(page)],
				components: [row]
			});
		});

		collector.on('end', async () => {
			row.components.forEach(btn => btn.setDisabled(true));
			await interaction.editReply({
				components: [row]
			});
		});
	}
};
