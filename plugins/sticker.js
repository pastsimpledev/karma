import { sticker } from '../../lib/sticker.js'
import uploadFile from '../../lib/uploadFile.js'
import uploadImage from '../../lib/uploadImage.js'
import { webp2png } from '../../lib/webp2mp4.js'

// ✦ FIX PERCORSI FFMPEG ✦
// Nota: Se hai installato ffmpeg nel sistema come ti ho suggerito (apt install ffmpeg), 
// il bot lo troverà automaticamente senza bisogno di ffmpeg-static.
import ffmpeg from 'fluent-ffmpeg'

let handler = async (m, { conn, args, usedPrefix, command }) => {
  let stiker = false
  
  // Newsletter e stile ChatUnity
  const cuContext = {
    isForwarded: true,
    forwardingScore: 999,
    forwardedNewsletterMessageInfo: {
        newsletterJid: '120363259442839354@newsletter',
        serverMessageId: 100,
        newsletterName: `𝐂𝐡𝐚𝐭𝐔𝐧𝐢𝐭𝐲-𝐁𝐨𝐭 ✦ Sticker Studio`
    }
  }

  try {
    let q = m.quoted ? m.quoted : m
    let mime = (q.msg || q).mimetype || q.mediaType || ''
    
    // Impostazioni Pack & Author (Prese dal database o globali)
    let pack = global.packname || '𝐂𝐡𝐚𝐭𝐔𝐧𝐢𝐭𝐲'
    let author = global.author || '𝐁𝐨𝐭'

    if (/webp|image|video/g.test(mime)) {
      // Controllo durata per le GIF/Video
      if (/video/g.test(mime)) {
        if ((q.msg || q).seconds > 10) return conn.sendMessage(m.chat, { text: '୧・︶ ⚠️ ︶・୨ `Il video è troppo lungo! Massimo 10 secondi.` ꒷꒦', contextInfo: cuContext }, { quoted: m })
      }

      await m.react('⏳') // Reazione di caricamento
      
      let img = await q.download?.()
      if (!img) throw 'Errore nel download del media'

      // Primo tentativo: Creazione diretta dal buffer
      stiker = await sticker(img, false, pack, author)
      
      // Secondo tentativo (Fallback): Se il buffer fallisce, proviamo tramite URL/Upload
      if (!stiker) {
        console.log('Tentativo Fallback via Upload...')
        let out
        if (/webp/g.test(mime)) out = await webp2png(img)
        else if (/image/g.test(mime)) out = await uploadImage(img)
        else if (/video/g.test(mime)) out = await uploadFile(img)
        
        if (out) stiker = await sticker(false, out, pack, author)
      }

    } else if (args[0] && isUrl(args[0])) {
      // Creazione da URL
      stiker = await sticker(false, args[0], pack, author)
      
    } else {
      return conn.sendMessage(m.chat, { 
        text: `୧・︶ 📸 ︶・୨ \`Rispondi a un media per crearlo!\`\n✦ *${usedPrefix}${command}* (Immagine/Video/GIF)\n✦ *${usedPrefix}${command} <link>*\n\n💡 _Lo sapevi? I video diventano Sticker Animati!_ ꒷꒦`, 
        contextInfo: cuContext 
      }, { quoted: m })
    }
  } catch (e) {
    console.error('ERRORE STICKER:', e)
    stiker = false
  } finally {
    if (stiker) {
      // Invio dello sticker con metadati e contesto newsletter
      await conn.sendFile(m.chat, stiker, 'sticker.webp', '', m, false, { 
        asSticker: true,
        contextInfo: cuContext 
      })
      await m.react('✅')
    } else {
      await m.react('❌')
      conn.sendMessage(m.chat, { 
        text: '୧・︶ ❌ ︶・୨ `Impossibile creare lo sticker.`\n\n💡 _Verifica che ffmpeg e imagemagick siano installati sul server!_ ꒷꒦', 
        contextInfo: cuContext 
      }, { quoted: m })
    }
  }
}

handler.help = ['sticker']
handler.tags = ['sticker']
handler.command = /^(s(tic?ker)?(gif)?(wm)?)$/i

export default handler

function isUrl(text) {
  return text.match(new RegExp(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)(jpe?g|gif|png|webp)/, 'gi'))
}
