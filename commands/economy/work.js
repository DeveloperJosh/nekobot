const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { getUser, addMoney, getCooldown, updateCooldown } = require('../../structure/userData');

const COOLDOWN_SECONDS = 15 * 60;

const jobPays = {
    Chef: [50, 100],
    Hunter: [60, 110],
    Thief: [70, 120],
    Fisher: [40, 90]
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('work')
        .setDescription('Work your job and earn money!'),

    async execute(interaction) {
        const userId = interaction.user.id;
        const user = getUser(userId);

        if (!user.job) {
            return interaction.reply({ content: '❌ You need to have a job to work. Use /job to pick one.', ephemeral: true });
        }

        const lastWork = getCooldown(userId, 'lastWork');
        const now = Math.floor(Date.now() / 1000);
        const timePassed = now - lastWork;

        if (timePassed < COOLDOWN_SECONDS) {
            const timeLeft = COOLDOWN_SECONDS - timePassed;
            return interaction.reply({
                content: `⏳ You are tired! Try again in <t:${now + timeLeft}:R>.`,
                ephemeral: true
            });
        }

        updateCooldown(userId, 'lastWork', now);

        const payRange = jobPays[user.job] || [50, 100];
        const pay = Math.floor(Math.random() * (payRange[1] - payRange[0] + 1)) + payRange[0];
        addMoney(userId, pay);

        return interaction.reply(`💼 You worked as a **${user.job}** and earned **$${pay}**!`, {
            ephemeral: true
        });
    }
};
