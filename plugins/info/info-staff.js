let handler = async (m, { conn }) => {
let text = `
╭━━━━━━━━━━━╮
┃   👑 *OWNER* 👑   
╰━━━━━━━━━━━╯

✨ *Contatti ufficiali*

📞 *WhatsApp*
wa.me/19782540529

📸 *Instagram*
@identityspoofing

📧 *Email*
identityspoofing@gmail.com

━━━━━━━━━━━━━━━━━━━━
😈 *FEAR DOMINA*
⚡ Potere. Stile. Controllo.
━━━━━━━━━━━━━━━━━━━━
`

await conn.sendMessage(m.chat, { text }, { quoted: m })
}

handler.help = ['owner']
handler.tags = ['info']
handler.command = ['owner']

export default handler
