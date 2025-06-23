const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const fs = require('fs');
const path = require('path');
const UserData = path.join(__dirname, '../..', 'data', 'user.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warnings')
        .setDescription('Check how many warnings a user has')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to check warnings for')
                .setRequired(true)),

    async execute(interaction) {
        const target = interaction.options.getUser('target');

        // Permission check
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            return interaction.reply({ content: '❌ You do not have permission to view warnings.', ephemeral: true });
        }

        let data = {};
        if (fs.existsSync(UserData)) {
            data = JSON.parse(fs.readFileSync(UserData, 'utf8'));
        }

        const userWarnings = data[target.id]?.warnings || [];

        if (userWarnings.length === 0) {
            return interaction.reply({
                content: `${target.tag} has no warnings.`,
                ephemeral: true
            });
        }

        const embed = new EmbedBuilder()
            .setTitle(`${target.tag}'s Warnings`)
            .setColor('Orange')
            .setTimestamp()
            .setFooter({ text: `Requested by ${interaction.user.tag}` });

        userWarnings.forEach((warn, index) => {
            embed.addFields({
                name: `Warning #${index + 1}`,
                value: `**Reason:** ${warn.reason || 'No reason provided'}\n**Date:** <t:${Math.floor(warn.timestamp)}:F>`,
                inline: false
            });
        });

        await interaction.reply({ embeds: [embed] });
    }
};
