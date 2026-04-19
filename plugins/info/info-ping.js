import speed from 'performance-now'

let handler = async (m, { conn, usedPrefix }) => {
  try {

    let start = speed()
    await conn.readMessages([m.key])
    let end = speed()
    let latency = (end - start).toFixed(2)

    const uptimeMs = process.uptime() * 1000
    const uptimeStr = clockString(uptimeMs)

    const botStartTime = new Date(Date.now() - uptimeMs)
    const activationTime = botStartTime.toLocaleString('it-IT', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })

    const message = `
╭━━━━━━•✦•━━━━━━╮
                  𝑷𝑰𝑵𝑮
            Ƒ𐌄𐌀Ɽ
╰━━━━━━•✦•━━━━━━╯

𝑼𝒑𝒕𝒊𝒎𝒆: ${uptimeStr}
𝑳𝒂𝒕𝒆𝒏𝒛𝒂: ${latency} ms
𝑨𝒗𝒗𝒊𝒐: ${activationTime}

╭━━━━━━•✦•━━━━━━╮
   𝑶𝒘𝒏𝒆𝒓: ɱɛơա
   𝑺𝒕𝒂𝒕𝒐: _Online_
╰━━━━━━•✦•━━━━━━╯
`.trim()

    await conn.sendMessage(m.chat, {
      text: message,
      footer: `𝐏𝐢𝐧𝐠 ${nomebot}`,
      buttons: [
        { buttonId: `${usedPrefix}ping`, buttonText: { displayText: "🔄 𝐏𝐢𝐧𝐠" }, type: 1 }
      ],
      headerType: 1
    })

  } catch (e) {
    console.error(e)
  }
}

function clockString(ms) {
  let h = Math.floor(ms / 3600000)
  let m = Math.floor((ms % 3600000) / 60000)
  let s = Math.floor((ms % 60000) / 1000)
  return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':')
}

handler.help = ['ping']
handler.tags = ['info']
handler.command = /^(ping)$/i

export default handler
