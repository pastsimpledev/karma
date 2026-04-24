import { cpus as _cpus, totalmem, freemem } from 'os'
import { performance } from 'perf_hooks'
import { sizeFormatter } from 'human-readable'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const packageJson = require('../package.json')

let format = sizeFormatter({
  std: 'JEDEC',
  decimalPlaces: 2,
  keepTrailingZeroes: false,
  render: (literal, symbol) => `${literal} ${symbol}B`,
})

const handler = async (m, { conn }) => {
  const start = performance.now()
  const lattenza = (performance.now() - start).toFixed(3)

  const _uptime = process.uptime() * 1000
  const uptime = formatUptime(_uptime)

  const versione = packageJson.version || '1.0.0'
  const foto = global.immagini[Math.floor(Math.random() * global.immagini.length)]

 
  const cpus = _cpus()
  const cpuModel = cpus[0]?.model || 'Unknown'
  const cpuSpeed = cpus[0]?.speed || 0

  const ramUsed = format(totalmem() - freemem())
  const ramTotal = format(totalmem())
  const ramFree = format(freemem())

  const response = `
╭┈  『 🚀 』 \`ping\` ─ *_${lattenza}ms_*
┆  『 🕒 』 \`uptime\` ─ *_${uptime}_*
┆  『 💻 』 \`cpu\` ─ *_${cpuModel}_*
┆  『 ⚡ 』 \`speed\` ─ *_${cpuSpeed} MHz_*
┆  『 🧠 』 \`ram\` ─ *_${ramUsed} / ${ramTotal}_*
╰┈➤ 『 📦 』 \`versione\` ─ *_${versione}_*
`.trim()

  await conn.sendMessage(m.chat, { 
    text: response,
    contextInfo: {
      ...global.newsletter().contextInfo,
      externalAdReply: {
        title: `fear v${versione}`,
        body: `${versione} • ${lattenza}ms`,
        renderLargerThumbnail: false,
        thumbnailUrl: foto,
        mediaType: 1
      }
    }
  }, { quoted: m })
}

function formatUptime(ms) {
  let d = Math.floor(ms / 86400000)
  let h = Math.floor((ms % 86400000) / 3600000)
  let m = Math.floor((ms % 3600000) / 60000)
  let s = Math.floor((ms % 60000) / 1000)
  return `${d}g ${h}h ${m}m ${s}s`
}

handler.command = ['ping','pong']
export default handler
