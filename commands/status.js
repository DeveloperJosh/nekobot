const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

const siteUrl = process.env.SITE;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('status')
        .setDescription('Shows the status of the site'),
    async execute(interaction) {
        let embed;
        try {
            const startTime = Date.now();
            const response = await axios.get(siteUrl);
            const endTime = Date.now();

            const responseTime = endTime - startTime;

            if (response.status === 200) {
                embed = new EmbedBuilder()
                    .setTitle('Site Status')
                    .setDescription('Site is up!')
                    .setColor('#00FF00')
                    .addFields(
                        { name: 'Status Code', value: `${response.status}`, inline: true },
                        { name: 'Response Time', value: `${responseTime}ms`, inline: true },
                        { name: 'Headers', value: `\`\`\`json\n${JSON.stringify(response.headers, null, 2)}\n\`\`\`` }
                    );
            } else {
                embed = new EmbedBuilder()
                    .setTitle('Site Status')
                    .setDescription('Site might be down.')
                    .setColor('#FF0000')
                    .addFields(
                        { name: 'Status Code', value: `${response.status}`, inline: true },
                        { name: 'Response Time', value: `${responseTime}ms`, inline: true },
                        { name: 'Headers', value: `\`\`\`json\n${JSON.stringify(response.headers, null, 2)}\n\`\`\`` }
                    );
            }
        } catch (error) {
            if (error.response) {
                embed = new EmbedBuilder()
                    .setTitle('Site Status')
                    .setDescription('Site might be down.')
                    .setColor('#FF0000')
                    .addFields(
                        { name: 'Status Code', value: `${error.response.status}`, inline: true },
                        { name: 'Headers', value: `\`\`\`json\n${JSON.stringify(error.response.headers, null, 2)}\n\`\`\`` },
                        { name: 'Response Data', value: `\`\`\`json\n${JSON.stringify(error.response.data, null, 2)}\n\`\`\`` }
                    );
            } else if (error.request) {
                embed = new EmbedBuilder()
                    .setTitle('Site Status')
                    .setDescription('No response received from the site.')
                    .setColor('#FF0000')
                    .addFields(
                        { name: 'Error Message', value: `${error.message}`, inline: true }
                    );
            } else {
                embed = new EmbedBuilder()
                    .setTitle('Site Status')
                    .setDescription('Error setting up the request.')
                    .setColor('#FF0000')
                    .addFields(
                        { name: 'Error Message', value: `${error.message}`, inline: true }
                    );
            }

            console.error('Error pinging site:', error);
        }

        interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
