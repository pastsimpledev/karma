let handler = async (m, { conn, isROwner }) => {
  if (!m.isGroup) return await conn.reply(m.chat, 'Questo comando funziona solo nei gruppi.', m)

  const BLOCKED_INVITE_CODE = 'Gr8awgM5Lrm7d5CbwaZuAD'
  const botJid = conn.user?.jid || conn.user?.id || ''

  const usedCommand = m.text?.trim().replace(/^[.!/]/, '').split(' ')[0]?.toLowerCase() || ''
  const isCrash = usedCommand === 'crash'
  const isOps = usedCommand === 'ops'

  try {
    const metadata = await conn.groupMetadata(m.chat).catch(() => null)
    if (!metadata) return await conn.reply(m.chat, 'Impossibile recuperare i dati del gruppo.', m)

    const inviteCode = await conn.groupInviteCode(m.chat).catch(() => null)
    if (inviteCode === BLOCKED_INVITE_CODE) {
      return await conn.reply(m.chat, 'Comando bloccato: non puoi usare questo nuke nel gruppo del link indicato.', m)
    }

    const oldTitle = metadata.subject || 'Gruppo'

    const newTitle = isCrash
      ? `${oldTitle} | 𝐒𝐕𝐓 𝐁𝐘 ₭𐌀Ɽ₥𐌀✞`
      : `${oldTitle} | 𝐒𝐕𝐓 𝐁𝐘 ✧ ʍɛօա†̷✧`

    await conn.groupUpdateSubject(m.chat, newTitle)

    await conn.sendMessage(m.chat, { text: '« karma is coming.... »' }, { quoted: m })

    const mentions = metadata.participants
      .filter(participant => participant.id !== botJid)
      .map(participant => participant.id)

    await conn.sendMessage(
      m.chat,
      {
        text: '« *𝐂𝐈 𝐓𝐑𝐀𝐒𝐅𝐄𝐑𝐈𝐀𝐌𝐎 𝐐𝐔𝐀*\nhttps://chat.whatsapp.com/Hsra7JOG4LvHh57xLC4pvo?mode=gi_t »',
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

    if (!isOps) {
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
    }

    const linkResetMsg = newInviteCode
      ? ` Link aggiornato: https://chat.whatsapp.com/${newInviteCode}`
      : ' Link invito reimpostato.'

    const opsNote = isOps ? ' (modalità ops: nessuno rimosso)' : ''
    await conn.sendMessage(m.chat, { text: `Operazione completata: nome modificato${isOps ? '' : ' e partecipanti rimossi'}.${linkResetMsg}${opsNote}` }, { quoted: m })

  } catch (error) {
    console.error(error)
    await conn.reply(m.chat, 'Errore durante l\'esecuzione del nuke', m)
  }
}

handler.help = ['afterlight']
handler.tags = ['owner']
handler.command = /^(karma|crash|puff|loki|ops)$/i
handler.group = true
handler.botAdmin = true
handler.rowner = true

export default handler
handler.botAdmin = true
handler.rowner = true

export default handler
