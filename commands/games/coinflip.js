const { SlashCommandBuilder } = require('discord.js');
const { getUser, addMoney } = require('../../structure/userData');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('coinflip')
        .setDescription('Bet on a coinflip')
        .addStringOption(option =>
            option.setName('side')
                .setDescription('Heads or Tails')
                .addChoices(
                    { name: 'Heads', value: 'heads' },
                    { name: 'Tails', value: 'tails' }
                )
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('How much to bet')
                .setRequired(true)),

    async execute(interaction) {
        const side = interaction.options.getString('side');
        const amount = interaction.options.getInteger('amount');
        const user = getUser(interaction.user.id);

        if (amount <= 0 || user.balance < amount) {
            return interaction.reply({ content: '💸 Not enough balance for that bet!', ephemeral: true });
        }

        const result = Math.random() < 0.5 ? 'heads' : 'tails';
        const win = result === side;

        addMoney(interaction.user.id, win ? amount : -amount);

        await interaction.reply(
            `🪙 It landed on **${result}**! You ${win ? `won **$${amount}** 🎉` : `lost **$${amount}** 😢`}`
        );
    }
};
