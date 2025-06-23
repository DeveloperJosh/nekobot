const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('vox')
        .setDescription('Cupid-only command that sends a message using the Vox webhook')
        .addStringOption(option =>
            option.setName('message')
                .setDescription('Message to send as Vox')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('image_url')
                .setDescription('Optional image URL to include')
                .setRequired(false)
        )
        .addAttachmentOption(option =>
            option.setName('image_file')
                .setDescription('Optional image file to upload')
                .setRequired(false)
        ),

    async execute(interaction) {
        if (interaction.user.id !== '1347919466494820417') {
            return interaction.reply({
                content: '⚠️ This command is reserved for Cupid and cannot be used by anyone else.',
                ephemeral: true,
            });
        }

        const messageContent = interaction.options.getString('message');
        const imageUrl = interaction.options.getString('image_url');
        const imageFile = interaction.options.getAttachment('image_file');

        try {
            const webhooks = await interaction.channel.fetchWebhooks();
            let webhook = webhooks.find(wh => wh.name === 'Vox');

            if (!webhook) {
                webhook = await interaction.channel.createWebhook({
                    name: 'Vox',
                    avatar: "https://i.ibb.co/XfHrPm0b/image.png",
                });
            }

            const messageOptions = {
                username: 'Vox',
                avatarURL: "https://i.ibb.co/XfHrPm0b/image.png",
            };

            if (imageFile || imageUrl) {
                const embed = new EmbedBuilder()
                    .setDescription(messageContent)
                    .setColor(0xFFAACD);

                if (imageFile) {
                    embed.setImage(imageFile.url);
                } else if (imageUrl) {
                    embed.setImage(imageUrl);
                }

                messageOptions.embeds = [embed];
            } else {
                messageOptions.content = messageContent;
            }

            await webhook.send(messageOptions);

            await interaction.reply({
                content: '✅ Message sent as Vox!',
                ephemeral: true
            });
        } catch (err) {
            console.error('Webhook error:', err);
            await interaction.reply({
                content: '❌ Failed to send message as Vox.',
                ephemeral: true
            });
        }
    }
};