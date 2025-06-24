const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUser, saveUser, addMoney } = require('../../structure/userData');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sell')
        .setDescription('Sell items from your inventory')
        .addStringOption(option =>
            option.setName('filter')
                .setDescription('Filter items by rarity to sell')
                .setRequired(false)
                .addChoices(
                    { name: 'All Items', value: 'all' },
                    { name: 'Junk Only 🗑️', value: 'junk' },
                    { name: 'Common Only 🔽', value: 'common' },
                    { name: 'Uncommon Only 🔼', value: 'uncommon' },
                    { name: 'Rare Only ⭐', value: 'rare' },
                    { name: 'Epic Only ✨', value: 'epic' },
                    { name: 'Legendary Only 💫', value: 'legendary' }
                )),

    async execute(interaction) {
        const userId = interaction.user.id;
        const filter = interaction.options.getString('filter') || 'all';

        const userData = getUser(userId);
        if (!userData.inventory || userData.inventory.length === 0) {
            return interaction.reply({
                content: "📦 Your inventory is empty. Go catch or collect some items first!",
                ephemeral: true
            });
        }

        let itemsToSell = userData.inventory;
        if (filter !== 'all') {
            itemsToSell = userData.inventory.filter(item =>
                item.rarity.toLowerCase().includes(filter)
            );
        }

        if (itemsToSell.length === 0) {
            return interaction.reply({
                content: `❌ You don't have any ${filter} items to sell!`,
                ephemeral: true
            });
        }

        const totalValue = itemsToSell.reduce((sum, item) => sum + item.value, 0);

        const itemGroups = {};
        itemsToSell.forEach(item => {
            const key = `${item.name}|${item.rarity}`;
            if (!itemGroups[key]) {
                itemGroups[key] = {
                    name: item.name,
                    rarity: item.rarity,
                    value: item.value,
                    count: 0,
                    totalValue: 0
                };
            }
            itemGroups[key].count++;
            itemGroups[key].totalValue += item.value;
        });

        const rarityOrder = [
            'Legendary 💫',
            'Epic ✨',
            'Rare ⭐',
            'Uncommon 🔼',
            'Common 🔽',
            'Junk 🗑️'
        ];

        const sortedGroups = Object.values(itemGroups).sort((a, b) => {
            return rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity);
        });

        let summaryLines = sortedGroups.map(group => {
            return `• ${group.count}x ${group.name} (${group.rarity}) - $${group.totalValue.toLocaleString()}`;
        });

        if (summaryLines.length > 15) {
            summaryLines = [
                ...summaryLines.slice(0, 10),
                `... and ${summaryLines.length - 10} more item types`,
                `• Total: ${itemsToSell.length} items`
            ];
        }

        const embed = new EmbedBuilder()
            .setTitle('💰 Items Sold')
            .setColor('#2ecc71')
            .setDescription(`You sold **${itemsToSell.length} items** for a total of **$${totalValue.toLocaleString()}**`)
            .addFields({
                name: 'Items Sold',
                value: summaryLines.join('\n') || 'No items to sell'
            })
            .setFooter({ text: `Filter: ${filter === 'all' ? 'All Items' : filter.charAt(0).toUpperCase() + filter.slice(1)}` });

        if (filter === 'all') {
            userData.inventory = [];
        } else {
            userData.inventory = userData.inventory.filter(item => 
                !item.rarity.toLowerCase().includes(filter)
            );
        }

        saveUser(userId, userData);
        addMoney(userId, totalValue);
        await interaction.reply({ embeds: [embed] });
    }
};
