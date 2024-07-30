const {SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Get help with the bot'),
    async execute(interaction) {

        const help_message = '**/report** - Report an issue or bug**\n/help** - Get help with the bot\n**/ping** - Check the bot\'s latency';

        const embed = new EmbedBuilder()
            .setTitle('Help')
            .setThumbnail(interaction.client.user.displayAvatarURL())
            .setDescription(help_message)
            .setTimestamp()
            .setFooter( { text: 'Bot made by Blue' })
            .setColor('#FF0000');

        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};