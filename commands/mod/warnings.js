const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const { getWarnings } = require('../../structure/userData');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warnings')
        .setDescription('Check how many warnings a user has')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to check warnings for')
                .setRequired(true)
        ),

    async execute(interaction) {
        const target = interaction.options.getUser('target');

        // Permission check
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            return interaction.reply({
                content: '❌ You do not have permission to view warnings.',
                ephemeral: true
            });
        }

        const warnings = getWarnings(target.id);

        if (!warnings.length) {
            return interaction.reply({
                content: `${target.tag} has no warnings.`,
                ephemeral: true
            });
        }

        const embed = new EmbedBuilder()
            .setTitle(`⚠️ ${target.tag}'s Warnings`)
            .setColor('Orange')
            .setTimestamp()
            .setFooter({ text: `Requested by ${interaction.user.tag}` });

        warnings.forEach((warn, index) => {
            embed.addFields({
                name: `Warning #${index + 1}`,
                value: `**Reason:** ${warn.reason || 'No reason provided'}\n**Issued By:** <@${warn.issuedBy}>\n**Date:** <t:${warn.timestamp}:F>`,
                inline: false
            });
        });

        await interaction.reply({ embeds: [embed] });
    }
};
