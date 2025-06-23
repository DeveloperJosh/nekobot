const { SlashCommandBuilder } = require('discord.js');
const { getUser, addMoney } = require('../../structure/userData');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('give')
        .setDescription('Give money to another user')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('User to give money to')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Amount to give')
                .setRequired(true)),

    async execute(interaction) {
        const senderId = interaction.user.id;
        const target = interaction.options.getUser('target');
        const amount = interaction.options.getInteger('amount');

        if (target.bot) return interaction.reply({ content: '🤖 You can’t give money to a bot.', ephemeral: true });
        if (target.id === senderId) return interaction.reply({ content: '🧍 You can’t give money to yourself.', ephemeral: true });

        const sender = getUser(senderId);

        if (sender.balance < amount || amount <= 0) {
            return interaction.reply({ content: '💸 You don’t have that much money to give!', ephemeral: true });
        }

        addMoney(senderId, -amount);
        addMoney(target.id, amount);

        await interaction.reply(`💸 You gave **$${amount}** to ${target.tag}.`, 
            {
                ephemeral: true
            }
        );
    }
};
