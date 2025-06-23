// userinfo command
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('Get information about a user')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('User to get information about')
                .setRequired(false)),
    async execute(interaction) {
        const target = interaction.options.getUser('target') || interaction.user;
        const member = await interaction.guild.members.fetch(target.id).catch(() => null);

        if (!member) {
            return interaction.reply({ content: '❌ User not found in this server.', ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`${target.username}'s Information`)
            .setThumbnail(target.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: 'Username', value: target.username, inline: true },
                { name: 'ID', value: target.id, inline: true },
                { name: 'Joined Server', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>`, inline: true },
                { name: 'Account Created', value: `<t:${Math.floor(target.createdTimestamp / 1000)}:F>`, inline: true },
                { name: 'Roles', value: member.roles.cache.map(role => role.name).join(', ') || 'No roles' }
            )
            .setTimestamp()
            .setFooter({ text: 'User Info Command' });

        return interaction.reply({ embeds: [embed] });
    }
};