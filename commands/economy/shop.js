const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUser, saveUser } = require('../../structure/userData');

const SHOP_ITEMS = {
    rod_basic: { name: 'Basic Rod', type: 'equipment', slot: 'rod', price: 0, emoji: '🎣', description: 'A starter fishing rod' },
    rod_reinforced: { name: 'Reinforced Rod', type: 'equipment', slot: 'rod', price: 500, level: 2, emoji: '🎣', description: 'More durable than the basic rod' },
    rod_advanced: { name: 'Advanced Rod', type: 'equipment', slot: 'rod', price: 1500, level: 3, emoji: '🎣', description: 'Professional-grade fishing equipment' },

    bait_worms: { name: 'Worms', type: 'bait', price: 50, quantity: 10, emoji: '🪱', description: 'Basic bait that attracts common fish' },
    bait_insects: { name: 'Insects', type: 'bait', price: 120, quantity: 30, emoji: '🦗', description: 'Premium bait that attracts rare fish' },

    buff_luck: { name: 'Luck Potion', type: 'buff', price: 300, durationMs: 3600000, emoji: '🍀', description: 'Increases rare catch chance for 1 hour', effect: 'rare catch chance' },
    buff_energy: { name: 'Energy Drink', type: 'buff', price: 200, durationMs: 1800000, emoji: '⚡', description: 'Reduces fishing cooldown for 30 minutes', effect: 'fishing speed' }
};

function formatPrice(price) {
    return `**$${price.toLocaleString()}**`;
}

function formatDuration(ms) {
    const minutes = Math.floor(ms / 60000);
    return `${minutes} minutes`;
}

function createShopEmbed(userBalance) {
    const embed = new EmbedBuilder()
        .setTitle('🎣 Fishing Shop')
        .setDescription(`Welcome to the fishing shop! Your balance: **$${userBalance.toLocaleString()}**\n\nBrowse our selection below:`)
        .setColor('#0099ff')
        .setFooter({ text: 'Use /shop [item] to purchase an item' });

    // Fishing Rods
    embed.addFields({
        name: '🔧 Fishing Rods',
        value: Object.entries(SHOP_ITEMS)
            .filter(([_, item]) => item.type === 'equipment')
            .map(([_, item]) => `${item.emoji} **${item.name}** - ${formatPrice(item.price)}\n${item.description}`)
            .join('\n\n'),
        inline: true
    });

    // Bait
    embed.addFields({
        name: '🪱 Bait',
        value: Object.entries(SHOP_ITEMS)
            .filter(([_, item]) => item.type === 'bait')
            .map(([_, item]) => `${item.emoji} **${item.name}** (x${item.quantity}) - ${formatPrice(item.price)}\n${item.description}`)
            .join('\n\n'),
        inline: true
    });

    // Buffs
    embed.addFields({
        name: '✨ Buffs',
        value: Object.entries(SHOP_ITEMS)
            .filter(([_, item]) => item.type === 'buff')
            .map(([_, item]) => `${item.emoji} **${item.name}** - ${formatPrice(item.price)}\n${item.description}`)
            .join('\n\n'),
        inline: false
    });

    return embed;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shop')
        .setDescription('Buy fishing gear, bait, and buffs')
        .addStringOption(option =>
            option.setName('item')
                .setDescription('The item you want to buy')
                .setRequired(false)
                .addChoices(
                    ...Object.entries(SHOP_ITEMS).map(([key, item]) => ({ name: `${item.emoji} ${item.name}`, value: key }))
                )),

    async execute(interaction) {
        const userId = interaction.user.id;
        const userData = getUser(userId);

        const selectedItemKey = interaction.options.getString('item');
        if (!selectedItemKey) {
            return interaction.reply({ embeds: [createShopEmbed(userData.balance)] });
        }

        const item = SHOP_ITEMS[selectedItemKey];
        if (!item) return interaction.reply({ content: "❌ Item not found.", ephemeral: true });

        if (userData.balance < item.price) {
            const embed = new EmbedBuilder()
                .setTitle('❌ Purchase Failed')
                .setDescription(`You don't have enough money to buy **${item.name}**!`)
                .addFields(
                    { name: 'Item Price', value: formatPrice(item.price), inline: true },
                    { name: 'Your Balance', value: `$${userData.balance.toLocaleString()}`, inline: true },
                    { name: 'You Need', value: `$${(item.price - userData.balance).toLocaleString()} more`, inline: true }
                )
                .setColor('#ff0000');
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        userData.balance -= item.price;

        if (item.type === 'equipment') {
            userData.equipment = userData.equipment || {};
            userData.equipment[item.slot] = {
                level: item.level || 1,
                name: item.name
            };
            saveUser(userId, userData);

            const embed = new EmbedBuilder()
                .setTitle('✅ Purchase Successful')
                .setDescription(`You bought and equipped **${item.name}**!`)
                .addFields(
                    { name: 'Price Paid', value: formatPrice(item.price), inline: true },
                    { name: 'New Balance', value: `$${userData.balance.toLocaleString()}`, inline: true }
                )
                .setColor('#00ff00');
            return interaction.reply({ embeds: [embed] });
        }

        if (item.type === 'bait') {
            userData.equipment = userData.equipment || {};
            if (!userData.equipment.bait || userData.equipment.bait.type === 'None') {
                userData.equipment.bait = { type: item.name, count: 0 };
            }
            if (userData.equipment.bait.type !== item.name) {
                return interaction.reply({
                    content: "❌ You already have a different bait type. Sell it before buying new bait.",
                    ephemeral: true
                });
            }
            userData.equipment.bait.count += item.quantity;
            saveUser(userId, userData);

            const embed = new EmbedBuilder()
                .setTitle('✅ Purchase Successful')
                .setDescription(`You bought **${item.quantity}x ${item.name}** bait!`)
                .addFields(
                    { name: 'Price Paid', value: formatPrice(item.price), inline: true },
                    { name: 'New Balance', value: `$${userData.balance.toLocaleString()}`, inline: true },
                    { name: 'Total Bait', value: `${userData.equipment.bait.count}x ${item.name}`, inline: true }
                )
                .setColor('#00ff00');
            return interaction.reply({ embeds: [embed] });
        }

        if (item.type === 'buff') {
            userData.buffs = userData.buffs || {};
            const now = Date.now();

            // Handle both buff types
            if (item.name === 'Luck Potion') {
                userData.buffs.luckBoostExpires = now + item.durationMs;
            } else if (item.name === 'Energy Drink') {
                userData.buffs.energyDrinkExpires = now + item.durationMs;
            }

            saveUser(userId, userData);

            const duration = formatDuration(item.durationMs);
            const embed = new EmbedBuilder()
                .setTitle('✅ Purchase Successful')
                .setDescription(`You activated a **${item.name}**! ${item.emoji}`)
                .addFields(
                    { name: 'Price Paid', value: formatPrice(item.price), inline: true },
                    { name: 'New Balance', value: `$${userData.balance.toLocaleString()}`, inline: true },
                    { name: 'Effect', value: `Boosts ${item.effect}`, inline: true },
                    { name: 'Duration', value: duration, inline: true }
                )
                .setColor('#00ff00');
            return interaction.reply({ embeds: [embed] });
        }

        return interaction.reply({ content: "❌ Something went wrong with your purchase.", ephemeral: true });
    }
};