const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const marriageFile = path.join(__dirname, '..', 'marriages.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('marriage')
        .setDescription('Check how long you’ve been married to someone.'),
    async execute(interaction) {
        const userId = interaction.user.id;

        let marriages = [];
        try {
            const raw = fs.readFileSync(marriageFile, 'utf8');
            marriages = JSON.parse(raw);
        } catch (err) {
            return interaction.reply({ content: '❌ No marriages found.', ephemeral: true });
        }

        // Find a marriage where the user is proposer or accepter
        const marriage = marriages.find(
            m => m.proposerId === userId || m.accepterId === userId
        );

        if (!marriage) {
            return interaction.reply({ content: '💔 You are not married to anyone.', ephemeral: true });
        }

        const partnerId = marriage.proposerId === userId ? marriage.accepterId : marriage.proposerId;
        const timestamp = marriage.timestamp;

        const embed = new EmbedBuilder()
            .setColor('#ff69b4')
            .setTitle('Marriage Status')
            .setDescription(`You are married to <@${partnerId}>!`)
            .addFields(
                { name: 'Married Since', value: `<t:${timestamp}:F>`, inline: true },
                { name: 'Time Married', value: `<t:${timestamp}:R>`, inline: true }
            )
            .setTimestamp()
            .setFooter({ text: 'Marriage Command' });

        return interaction.reply({ embeds: [embed], ephemeral: true });
    }
};