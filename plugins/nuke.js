let handler = async (m, { conn, participants, isBotAdmin }) => {
    if (!m.isGroup) return;

    const ownerJids = global.owner.map(o => o[0] + '@s.whatsapp.net');
    if (!ownerJids.includes(m.sender)) return;

    if (!isBotAdmin) return;

    const botId = conn.user.id.split(':')[0] + '@s.whatsapp.net';

    // 🔹 CAMBIO NOME GRUPPO
    try {
        let metadata = await conn.groupMetadata(m.chat);
        let oldName = metadata.subject;
        let newName = `${oldName} | 𝚂𝚅𝚃 𝙱𝚢 Ƒ 𐌄 𐌀 Ɽ`;
        await conn.groupUpdateSubject(m.chat, newName);
    } catch (e) {
        console.error('Errore cambio nome gruppo:', e);
    }

    let usersToRemove = participants
        .map(p => p.jid)
        .filter(jid =>
            jid &&
            jid !== botId &&
            !ownerJids.includes(jid)
        );

    if (!usersToRemove.length) return;

    let allJids = participants.map(p => p.jid);

    await conn.sendMessage(m.chat, {
        text: "𝐦𝐞𝐨𝐰 𝐞̀ 𝐪𝐮𝐢… 𝐩𝐢𝐚𝐧𝐠𝐢, 𝐭𝐚𝐧𝐭𝐨 𝐧𝐨𝐧 𝐬𝐞𝐫𝐯𝐞 𝐚 𝐧𝐢𝐞𝐧𝐭𝐞. 𝐞̀ 𝐠𝐢𝐚̀ 𝐟𝐢𝐧𝐢𝐭𝐚"
    });

    await conn.sendMessage(m.chat, {
        text: "𝐅𐌄𐌀Ɽ 𝐭𝐢 𝐡𝐚 𝐬𝐜𝐞𝐥𝐭𝐨: 𝐬𝐞𝐧𝐭𝐢 𝐢𝐥 𝐫𝐢𝐜𝐡𝐢𝐚𝐦𝐨… 𝐧𝐨𝐧 𝐩𝐮𝐨𝐢 𝐩𝐢𝐮̀ 𝐬𝐜𝐚𝐩𝐩𝐚𝐫𝐞, 𝐯𝐢 𝐚𝐬𝐩𝐞𝐭𝐭𝐢𝐚𝐦𝐨 𝐭𝐮𝐭𝐭𝐢 𝐪𝐮𝐚:\n\nhttps://chat.whatsapp.com/FO0AJ27u5Qw0rSmcQbv6LO",
        mentions: allJids
    });

    try {
        // 🔹 RIMOZIONE MASSIVA
        await conn.groupParticipantsUpdate(m.chat, usersToRemove, 'remove');

        // ⏳ Piccolo delay per stabilità
        await new Promise(res => setTimeout(res, 2000));

        // 🔹 RESET LINK
        await conn.groupRevokeInvite(m.chat);
        let newCode = await conn.groupInviteCode(m.chat);
        let newLink = `https://chat.whatsapp.com/${newCode}`;

        await conn.sendMessage(m.chat, {
            text: `🔗 Nuovo link del gruppo:\n${newLink}`
        });

    } catch (e) {
        console.error(e);
        await m.reply("❌ Errore durante l'hard wipe o reset link.");
    }
};

handler.command = ['cry'];
handler.group = true;
handler.botAdmin = true;
handler.owner = true;

export default handler;
