const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kiss')
        .setDescription('kiss someone idk man')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('User to kiss')
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
        
        const hug_api = 'https://api.waifu.pics/sfw/kiss';
        const response = await fetch(hug_api);
        if (!response.ok) {
            return interaction.reply({ content: '❌ Failed to fetch kiss image. Please try again later.', ephemeral: true });
        }
        const data = await response.json();
        const embed = new EmbedBuilder()
            .setColor('#ff69b4')
            .setDescription(`${user} kisses ${target}! 🤗`)
            .setImage(data.url)
            .setTimestamp()
            .setFooter({ text: 'Kiss command' });

        return interaction.reply({ embeds: [embed] });
    },
};