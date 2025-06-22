const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const getAllCommands = require('../structure/commandRegistry').getAllCommands;

module.exports = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('List all available commands with descriptions.'),

	async execute(interaction) {
		const commands = getAllCommands();
		const perPage = 5;
		let page = 0;

		const generateEmbed = (page) => {
			const start = page * perPage;
			const end = start + perPage;
			const current = commands.slice(start, end);

			const embed = new EmbedBuilder()
				.setTitle('📖 Help Menu')
				.setColor('#0099ff')
				.setFooter({ text: `Page ${page + 1} of ${Math.ceil(commands.length / perPage)}` });

			current.forEach(cmd => {
				embed.addFields({ name: `/${cmd.name}`, value: cmd.description });
			});

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
				.setDisabled(commands.length <= perPage)
		);

		await interaction.reply({
			embeds: [generateEmbed(page)],
			components: [row],
			ephemeral: true
		});

		const message = await interaction.fetchReply();
		const collector = message.createMessageComponentCollector({
			time: 60_000
		});

		collector.on('collect', async i => {
			if (i.user.id !== interaction.user.id) {
				await i.reply({ content: '❌ Only the command user can use these buttons.', ephemeral: true });
				return;
			}

			if (i.customId === 'next') page++;
			else if (i.customId === 'prev') page--;

			row.components[0].setDisabled(page === 0);
			row.components[1].setDisabled((page + 1) * perPage >= commands.length);

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
