import os from 'os';
import { execSync } from 'child_process';
 
const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const getDiskSpace = () => {
    try {
        const stdout = execSync('df -h | grep -E "^/dev/root|^/dev/sda1"').toString();
        const [ , size, used, available, usePercent ] = stdout.split(/\s+/);
        return { size, used, available, usePercent };
    } catch (error) {
        console.error('❌ Errore nel recupero dello spazio su disco:', error);
        return null;
    }
};

const handler = async (m, { conn }) => {
    const userId = m.sender;
    const groupId = m.isGroup ? m.chat : null;
    const nomeDelBot = global.db.data.nomedelbot || 'karma';

    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const _muptime = process.uptime() * 1000;
    const muptime = clockString(_muptime);
    const hostname = os.hostname();
    const platform = os.platform();
    const arch = os.arch();
    const nodeUsage = process.memoryUsage();
    const diskSpace = getDiskSpace();

    const title = global.t('systemTitle', userId, groupId);
    const hostLabel = global.t('systemHost', userId, groupId);
    const osLabel = global.t('systemOS', userId, groupId);
    const archLabel = global.t('systemArch', userId, groupId);
    const totalRAMLabel = global.t('systemTotalRAM', userId, groupId);
    const freeRAMLabel = global.t('systemFreeRAM', userId, groupId);
    const usedRAMLabel = global.t('systemUsedRAM', userId, groupId);
    const uptimeLabel = global.t('systemUptime', userId, groupId);
    const nodeMemoryLabel = global.t('systemNodeMemory', userId, groupId);
    const rssLabel = global.t('systemRSS', userId, groupId);
    const heapTotalLabel = global.t('systemHeapTotal', userId, groupId);
    const heapUsedLabel = global.t('systemHeapUsed', userId, groupId);
    const externalLabel = global.t('systemExternal', userId, groupId);
    const arrayBufferLabel = global.t('systemArrayBuffer', userId, groupId);
    const diskSpaceLabel = global.t('systemDiskSpace', userId, groupId);
    const diskTotalLabel = global.t('systemDiskTotal', userId, groupId);
    const diskUsedLabel = global.t('systemDiskUsed', userId, groupId);
    const diskAvailableLabel = global.t('systemDiskAvailable', userId, groupId);
    const diskPercentLabel = global.t('systemDiskPercent', userId, groupId);
    const diskErrorLabel = global.t('systemDiskError', userId, groupId);

    const message = `${title}

꒷꒦ ✦ ୧・︶ : ︶ ꒷꒦ ‧₊ ୧
୧ ${hostLabel} ⪼ ${hostname}
୧ ${osLabel} ⪼ ${platform}
୧ ${archLabel} ⪼ ${arch}
୧ ${totalRAMLabel} ⪼ ${formatBytes(totalMem)}
୧ ${freeRAMLabel} ⪼ ${formatBytes(freeMem)}
୧ ${usedRAMLabel} ⪼ ${formatBytes(usedMem)}
୧ ${uptimeLabel} ⪼ ${muptime}
꒷꒦ ✦ ୧・︶ : ︶ ꒷꒦ ‧₊ ୧

╭﹕₊˚ ★ ⁺˳ꕤ₊⁺・꒱
${nodeMemoryLabel}
→ ${rssLabel}: ${formatBytes(nodeUsage.rss)}
→ ${heapTotalLabel}: ${formatBytes(nodeUsage.heapTotal)}
→ ${heapUsedLabel}: ${formatBytes(nodeUsage.heapUsed)}
→ ${externalLabel}: ${formatBytes(nodeUsage.external)}
→ ${arrayBufferLabel}: ${formatBytes(nodeUsage.arrayBuffers)}
╰﹕₊˚ ★ ⁺˳ꕤ₊⁺・꒱
${diskSpace ? `
╭﹕₊˚ ★ ⁺˳ꕤ₊⁺・꒱
${diskSpaceLabel}
→ ${diskTotalLabel}: ${diskSpace.size}
→ ${diskUsedLabel}: ${diskSpace.used}
→ ${diskAvailableLabel}: ${diskSpace.available}
→ ${diskPercentLabel}: ${diskSpace.usePercent}
╰﹕₊˚ ★ ⁺˳ꕤ₊⁺・꒱` : diskErrorLabel}

╰♡꒷ ๑ ⋆˚₊⋆──ʚ˚ɞ──⋆˚₊⋆ ๑ ⪩
୧・© karma Bot
╰♡꒷ ๑ ⋆˚₊⋆──ʚ˚ɞ──⋆˚₊⋆ ๑ ⪩
`;

    await conn.sendMessage(m.chat, {
        text: message.trim(),
        contextInfo: {
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: '120363259442839354@newsletter',
                serverMessageId: '',
                newsletterName: `${nomeDelBot}`
            }
        }
    }, { quoted: m });
};

handler.help = [
  'sistema',
  'system',
  'sistema_es',
  'sistema_pt',
  'system_de',
  '系统',
  'система',
  'النظام',
  'प्रणाली',
  'système',
  'sistem_id',
  'sistem_tr'
];
handler.tags = ['info'];
handler.command = /^(system|sistema|sistema_es|sistema_pt|system_de|系统|система|النظام|प्रणाली|système|sistem_id|sistem_tr)$/i;


export default handler;

function clockString(ms) {
    let h = isNaN(ms) ? '--' : Math.floor(ms / 3600000);
    let m = isNaN(ms) ? '--' : Math.floor(ms / 60000) % 60;
    let s = isNaN(ms) ? '--' : Math.floor(ms / 1000) % 60;
    return [h, m, s].map(v => v.toString().padStart(2, 0)).join(':');
}
