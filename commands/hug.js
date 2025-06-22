const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('hug')
        .setDescription('Give someone a hug')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('User to hug')
                .setRequired(true)),
    async execute(interaction) {
        const user = interaction.user;
        const target = interaction.options.getUser('target');

        if (!target) {
            return interaction.reply({ content: '❌ User not found. Please mention a valid user.', ephemeral: true });
        } else if (user.id === target.id) {
            return interaction.reply({ content: '❌ That\'s just sad.', ephemeral: true });
        } else if (target.bot) {
            return interaction.reply({ content: '❌ NO!', ephemeral: true });
        }
        
        const hug_api = 'https://api.waifu.pics/sfw/hug';
        const response = await fetch(hug_api);
        if (!response.ok) {
            return interaction.reply({ content: '❌ Failed to fetch hug image. Please try again later.', ephemeral: true });
        }
        const data = await response.json();
        const embed = new EmbedBuilder()
            .setColor('#ff69b4')
            .setDescription(`${user} hugs ${target}! 🤗`)
            .setImage(data.url)
            .setTimestamp()
            .setFooter({ text: 'Hug command' });

        return interaction.reply({ embeds: [embed] });
    },
};