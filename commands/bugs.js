const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Report = require('../models/report');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bugs')
        .setDescription('View the list of bugs')
        .addStringOption(option =>
            option.setName('code')
                .setDescription('View a specific bug by its code')
                .setRequired(false)),
    async execute(interaction) {
        const code = interaction.options.getString('code');
        let embed;

        if (code) {
            const bug = await Report.findOne({ code });

            if (!bug) {
                return interaction.reply({ content: 'No bug found with that code.', ephemeral: true });
            }

            embed = new EmbedBuilder()
                .setTitle(`Bug #${bug.code}`)
                .setDescription(`**Title:** ${bug.reportTitle}\n**Description:** ${bug.reportDescription}`)
                .setColor('#FF0000')
                .setFooter({ text: `Reported by ${bug.username}` });
        } else {
            const bugs = await Report.find();

            if (!bugs || bugs.length === 0) {
                return interaction.reply({ content: 'No bugs found.', ephemeral: true });
            }

            embed = new EmbedBuilder()
                .setTitle('Bugs List')
                .setColor('#FF0000');

            bugs.forEach(bug => {
                embed.addFields(
                    { name: `Bug #${bug.code}`, value: `**Title:** ${bug.reportTitle}\n**Description:** ${bug.reportDescription}\n**Reported by:** ${bug.username}` }
                );
            });
        }

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
