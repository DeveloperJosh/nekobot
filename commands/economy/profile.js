const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUser } = require('../../structure/userData');
const moment = require('moment');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('profile')
        .setDescription('Show your fishing profile, equipment, and inventory'),

    async execute(interaction) {
        const userId = interaction.user.id;
        const userData = getUser(userId);

        if (!userData) {
            return interaction.reply("You haven't started fishing yet! Use `/fish` to get started.");
        }

        const balance = userData.balance || 0;
        const inventory = userData.inventory || [];
        const equipment = userData.equipment || {
            rod: { level: 1, name: 'Basic Rod' },
            bait: { type: 'None', count: 0 }
        };
        const buffs = userData.buffs || {};

        const embed = new EmbedBuilder()
            .setTitle(`🎣 ${interaction.user.username}'s Fishing Profile`)
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
            .setColor('#4B0082')
            .setFooter({ text: 'Fish more to improve your profile!' });

        embed.addFields({ 
            name: '💰 Balance', 
            value: `$${balance.toLocaleString()}`,
            inline: true 
        });

        const rodInfo = equipment.rod 
            ? `**${equipment.rod.name}** (Level ${equipment.rod.level || 1})` 
            : 'No rod equipped';
        
        const baitInfo = equipment.bait && equipment.bait.count > 0 
            ? `**${equipment.bait.count}x ${equipment.bait.type}**` 
            : 'No bait';
        
        embed.addFields(
            { 
                name: '🎣 Equipment', 
                value: `Rod: ${rodInfo}\nBait: ${baitInfo}`,
                inline: true 
            }
        );

        const now = Date.now();
        const activeBuffs = [];
        
        if (buffs.luckBoostExpires > now) {
            const timeLeft = moment.duration(buffs.luckBoostExpires - now).humanize();
            activeBuffs.push(`🍀 Luck Boost (${timeLeft} left)`);
        }
        
        if (buffs.energyDrinkExpires > now) {
            const timeLeft = moment.duration(buffs.energyDrinkExpires - now).humanize();
            activeBuffs.push(`⚡ Energy Boost (${timeLeft} left)`);
        }
        
        embed.addFields({
            name: '✨ Active Buffs',
            value: activeBuffs.length > 0 ? activeBuffs.join('\n') : 'No active buffs',
            inline: false
        });

        if (inventory.length > 0) {
            const inventorySummary = {};
            inventory.forEach(item => {
                const key = `${item.name}|${item.value}`;
                if (!inventorySummary[key]) {
                    inventorySummary[key] = {
                        name: item.name,
                        value: item.value,
                        count: 0,
                        rarity: item.rarity
                    };
                }
                inventorySummary[key].count++;
            });

            const rarityGroups = {};
            Object.values(inventorySummary).forEach(item => {
                if (!rarityGroups[item.rarity]) {
                    rarityGroups[item.rarity] = [];
                }
                rarityGroups[item.rarity].push(item);
            });

            let inventoryDescription = '';
            const rarityOrder = ['Legendary 💫', 'Epic ✨', 'Rare ⭐', 'Uncommon 🔼', 'Common 🔽', 'Junk 🗑️'];
            
            rarityOrder.forEach(rarity => {
                if (rarityGroups[rarity]) {
                    inventoryDescription += `\n**${rarity}**\n`;
                    rarityGroups[rarity].forEach(item => {
                        inventoryDescription += `• ${item.count}x ${item.name} - $${item.value.toLocaleString()} each\n`;
                    });
                }
            });

            embed.addFields({
                name: `📦 Inventory (${inventory.length} items)`,
                value: inventoryDescription || 'No valuable items',
                inline: false
            });
        } else {
            embed.addFields({
                name: '📦 Inventory',
                value: 'Your inventory is empty! Go fishing to collect items.',
                inline: false
            });
        }

        await interaction.reply({ embeds: [embed] });
    }
};