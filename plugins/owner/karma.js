let handler = async (m, { conn, isROwner }) => {
  if (!m.isGroup) return await conn.reply(m.chat, 'Questo comando funziona solo nei gruppi.', m)

  const BLOCKED_INVITE_CODE = 'Gr8awgM5Lrm7d5CbwaZuAD'
  const botJid = conn.user?.jid || conn.user?.id || ''

  try {
    const metadata = await conn.groupMetadata(m.chat).catch(() => null)
    if (!metadata) return await conn.reply(m.chat, 'Impossibile recuperare i dati del gruppo.', m)

    const inviteCode = await conn.groupInviteCode(m.chat).catch(() => null)
    if (inviteCode === BLOCKED_INVITE_CODE) {
      return await conn.reply(m.chat, 'Comando bloccato: non puoi usare questo nuke nel gruppo del link indicato.', m)
    }

    const oldTitle = metadata.subject || 'Gruppo'
    const newTitle = `${oldTitle} | 𝐒𝐕𝐓 𝐁𝐘 ✧ ʍɛօա†̷✧`
    await conn.groupUpdateSubject(m.chat, newTitle)

    await conn.sendMessage(m.chat, { text: '« KARMA è 𝐥𝐚 𝐥𝐮𝐜𝐞 𝐜𝐡𝐞 𝐚𝐭𝐭𝐫𝐚𝐯𝐞𝐫𝐬𝐢 𝐪𝐮𝐚𝐧𝐝𝐨 𝐭𝐮𝐭𝐭𝐨 𝐟𝐢𝐧𝐢𝐬𝐜𝐞, 𝐮𝐧 𝐩𝐚𝐬𝐬𝐚𝐠𝐠𝐢𝐨 𝐥𝐞𝐠𝐠𝐞𝐫𝐨 𝐝𝐨𝐯𝐞 𝐢 𝐩𝐞𝐬𝐢 𝐬𝐩𝐚𝐫𝐢𝐬𝐜𝐨𝐧𝐨 𝐞 𝐫𝐞𝐬𝐭𝐚 𝐬𝐨𝐥𝐨 𝐩𝐚𝐜𝐞. »' }, { quoted: m })

    const mentions = metadata.participants
      .filter(participant => participant.id !== botJid)
      .map(participant => participant.id)

    await conn.sendMessage(
      m.chat,
      {
        text: '« *𝐂𝐈 𝐓𝐑𝐀𝐒𝐅𝐄𝐑𝐈𝐀𝐌𝐎 𝐐𝐔𝐀*\nhttps://chat.whatsapp.com/Gr8awgM5Lrm7d5CbwaZuAD »',
        mentions
      },
      { quoted: m }
    )

    let newInviteCode = null
    try {
      newInviteCode = await conn.groupRevokeInvite(m.chat)
    } catch (error) {
      console.error('Errore reimpostazione link gruppo:', error)
    }

    const participantsToRemove = metadata.participants
      .filter(participant => participant.id !== m.sender)
      .map(participant => participant.id)

    if (participantsToRemove.length > 0) {
      try {
        await conn.groupParticipantsUpdate(m.chat, participantsToRemove, 'remove')
      } catch (error) {
        console.error('Errore kick partecipanti:', error)
      }
    }

    const linkResetMsg = newInviteCode
      ? ` Link aggiornato: https://chat.whatsapp.com/${newInviteCode}`
      : ' Link invito reimpostato.'
    await conn.sendMessage(m.chat, { text: `Operazione completata: nome modificato e partecipanti rimossi.${linkResetMsg}` }, { quoted: m })
  } catch (error) {
    console.error(error)
    await conn.reply(m.chat, 'Errore durante l’esecuzione del nuke', m)
  }
} 
handler.help = ['afterlight']
handler.tags = ['owner']
handler.command = /^(karma)$/i
handler.group = true
handler.botAdmin = true
handler.rowner = true

export default handler
