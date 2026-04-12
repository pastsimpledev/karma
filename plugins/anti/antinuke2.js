import pkg from '@whiskeysocket/baileys';
const { proto } = pkg;

const antinukeData = {
  protectedGroups: new Map(),
  actionLog: new Map(),
  suspendedActors: new Set(),
  botScores: new Map(),
  warningsSent: new Map(),
  config: {
    windowMs: 60000,
    burstWindowMs: 3000,
    burstThreshold: 2,
    maxKicksPerWindow: 5,
    massKickThreshold: 2,
    botScoreThreshold: 5,
    warnThreshold: 2,
    autoKickThreshold: 8,
    prefix: '.'
  }
};

function getOwnerJids(global_owner) {
  if (!global_owner) return [];
  if (Array.isArray(global_owner)) {
    return global_owner.map(o => {
      const num = typeof o === 'string' ? o : o[0];
      return num.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
    });
  }
  return [];
}

function cleanJid(jid) {
  return jid.replace(/:[0-9]+@/, '@');
}

function isOwner(jid, global_owner) {
  const owners = getOwnerJids(global_owner);
  return owners.includes(cleanJid(jid)) || owners.includes(jid);
}

function isMasterOwner(jid, global_owner) {
  const owners = getOwnerJids(global_owner);
  if (owners.length === 0) return false;
  return cleanJid(jid) === owners[0] || jid === owners[0];
}

function recordAction(actorJid, groupJid) {
  const key = `${cleanJid(actorJid)}::${groupJid}`;
  const now = Date.now();
  if (!antinukeData.actionLog.has(key)) antinukeData.actionLog.set(key, []);
  const log = antinukeData.actionLog.get(key).filter(t => now - t < antinukeData.config.windowMs);
  log.push(now);
  antinukeData.actionLog.set(key, log);
  return log;
}

function getBurstCount(log) {
  const now = Date.now();
  return log.filter(t => now - t < antinukeData.config.burstWindowMs).length;
}

function isKnownBotJid(jid) {
  const num = jid.replace(/[^0-9]/g, '');
  const knownBotPrefixes = ['1415', '15550', '13155'];
  return knownBotPrefixes.some(p => num.startsWith(p));
}

function incrementBotScore(actorJid, reason, points = 1) {
  const jid = cleanJid(actorJid);
  const current = antinukeData.botScores.get(jid) || { score: 0, reasons: [], firstSeen: Date.now() };
  current.score += points;
  current.reasons.push(reason);
  current.lastSeen = Date.now();
  antinukeData.botScores.set(jid, current);
  return current;
}

function getSecurityLevel(score, cfg) {
  if (score >= cfg.autoKickThreshold) return 'CRITICO';
  if (score >= cfg.botScoreThreshold) return 'ALTO';
  if (score >= cfg.warnThreshold) return 'MEDIO';
  return 'BASSO';
}

function analyzeActorPattern(actorJid, groupJid, participantsCount, action) {
  const log = recordAction(actorJid, groupJid);
  const totalInWindow = log.length;
  const burstCount = getBurstCount(log);
  const signals = [];

  if (participantsCount >= antinukeData.config.massKickThreshold) {
    signals.push({ reason: `mass_${action}:${participantsCount}`, points: 3 });
  }
  if (burstCount >= antinukeData.config.burstThreshold) {
    signals.push({ reason: `burst:${burstCount}_in_${antinukeData.config.burstWindowMs}ms`, points: 2 });
  }
  if (totalInWindow >= antinukeData.config.maxKicksPerWindow) {
    signals.push({ reason: `rate:${totalInWindow}_in_60s`, points: 2 });
  }
  if (isKnownBotJid(actorJid)) {
    signals.push({ reason: 'known_bot_prefix', points: 2 });
  }
  if (action === 'demote' && participantsCount >= 2) {
    signals.push({ reason: `mass_demote:${participantsCount}`, points: 3 });
  }
  if (action === 'remove' && participantsCount >= 5) {
    signals.push({ reason: `bulk_remove:${participantsCount}`, points: 4 });
  }
  if (totalInWindow >= 3 && burstCount >= 2) {
    signals.push({ reason: 'combined_rate_burst', points: 3 });
  }

  let scoreData = antinukeData.botScores.get(cleanJid(actorJid)) || { score: 0, reasons: [], firstSeen: Date.now() };
  for (const s of signals) {
    scoreData = incrementBotScore(actorJid, s.reason, s.points);
  }

  const level = getSecurityLevel(scoreData.score, antinukeData.config);

  return {
    score: scoreData.score,
    reasons: scoreData.reasons,
    level,
    isBot: scoreData.score >= antinukeData.config.botScoreThreshold,
    isCritical: scoreData.score >= antinukeData.config.autoKickThreshold,
    burstCount,
    totalInWindow,
    signals
  };
}

function hasWarnedRecently(actorJid, groupJid) {
  const key = `${cleanJid(actorJid)}::${groupJid}`;
  const last = antinukeData.warningsSent.get(key) || 0;
  return Date.now() - last < 30000;
}

function markWarned(actorJid, groupJid) {
  const key = `${cleanJid(actorJid)}::${groupJid}`;
  antinukeData.warningsSent.set(key, Date.now());
}

async function handleNukeAttempt(sock, groupJid, actorJid, analysis, global_owner) {
  antinukeData.suspendedActors.add(cleanJid(actorJid));

  try { await sock.groupParticipantsUpdate(groupJid, [actorJid], 'demote'); } catch {}
  try { await sock.groupParticipantsUpdate(groupJid, [actorJid], 'remove'); } catch {}

  const alertMsg =
    `⚠️ *ANTINUKE — MINACCIA BLOCCATA*\n\n` +
    `👤 Attore: @${actorJid.split('@')[0]}\n` +
    `🤖 Bot rilevato: ${analysis.isBot ? '✅ SÌ' : '⚠️ Sospetto'}\n` +
    `🚨 Livello: ${analysis.level}\n` +
    `📊 Score: ${analysis.score}\n` +
    `🔍 Segnali: ${analysis.reasons.slice(-5).join(', ')}\n` +
    `📍 Gruppo: ${groupJid}\n` +
    `🕒 ${new Date().toLocaleString('it-IT')}\n\n` +
    `✅ Degradato e rimosso automaticamente.`;

  const owners = getOwnerJids(global_owner);
  for (const ownerJid of owners) {
    try { await sock.sendMessage(ownerJid, { text: alertMsg, mentions: [actorJid] }); } catch {}
  }
  try { await sock.sendMessage(groupJid, { text: alertMsg, mentions: [actorJid] }); } catch {}
}

async function handleWarn(sock, groupJid, actorJid, analysis, global_owner) {
  if (hasWarnedRecently(actorJid, groupJid)) return;
  markWarned(actorJid, groupJid);

  const warnMsg =
    `🚨 *BOT SOSPETTO RILEVATO*\n\n` +
    `👤 Numero: @${actorJid.split('@')[0]}\n` +
    `🚨 Livello rischio: ${analysis.level}\n` +
    `📊 Score: ${analysis.score}/${antinukeData.config.botScoreThreshold}\n` +
    `🔍 Pattern: ${analysis.reasons.slice(-3).join(', ')}\n` +
    `⚠️ Monitoraggio attivo — ulteriori azioni causeranno rimozione automatica.`;

  try { await sock.sendMessage(groupJid, { text: warnMsg, mentions: [actorJid] }); } catch {}

  const owners = getOwnerJids(global_owner);
  for (const ownerJid of owners) {
    try { await sock.sendMessage(ownerJid, { text: warnMsg, mentions: [actorJid] }); } catch {}
  }
}

export async function antinukeHandler(sock, update, global_owner) {
  if (!update?.id || !update?.participants || !update?.action) return;

  const groupJid = update.id;
  const actor = update.actor || null;
  const action = update.action;
  const participants = update.participants;

  if (!antinukeData.protectedGroups.has(groupJid)) return;
  const groupConfig = antinukeData.protectedGroups.get(groupJid);
  if (!groupConfig.enabled) return;
  if (!actor) return;
  if (isMasterOwner(actor, global_owner)) return;
  if (isOwner(actor, global_owner) && !groupConfig.protectFromOwners) return;
  if (action !== 'remove' && action !== 'demote') return;

  const analysis = analyzeActorPattern(actor, groupJid, participants.length, action);

  if (analysis.isCritical || analysis.score >= antinukeData.config.botScoreThreshold) {
    await handleNukeAttempt(sock, groupJid, actor, analysis, global_owner);
    return;
  }

  if (analysis.score >= antinukeData.config.warnThreshold) {
    await handleWarn(sock, groupJid, actor, analysis, global_owner);
  }
}

export async function handleAntinukeCommand(sock, msg, args, global_owner) {
  const jid = msg.key.remoteJid;
  const sender = msg.key.participant || msg.key.remoteJid;
  const isGroup = jid.endsWith('@g.us');

  if (!isOwner(sender, global_owner)) {
    return sock.sendMessage(jid, { text: '｢ ❌ Solo gli owner possono usare questo comando. ｣' });
  }

  const sub = (args[0] || '').toLowerCase();

  if (!isGroup && !['list', 'status', 'clearsuspended', 'scores', 'config'].includes(sub)) {
    return sock.sendMessage(jid, { text: '｢ ⚠️ Usa questo comando in un gruppo. ｣' });
  }

  if (sub === 'on') {
    if (!antinukeData.protectedGroups.has(jid)) {
      antinukeData.protectedGroups.set(jid, {
        enabled: true,
        protectFromOwners: false,
        addedBy: sender,
        addedAt: Date.now()
      });
    } else {
      antinukeData.protectedGroups.get(jid).enabled = true;
    }
    return sock.sendMessage(jid, { text: '｢ ✅ Antinuke ATTIVATO. ｣' });
  }

  if (sub === 'off') {
    if (antinukeData.protectedGroups.has(jid)) {
      antinukeData.protectedGroups.get(jid).enabled = false;
    }
    return sock.sendMessage(jid, { text: '｢ 🔴 Antinuke DISATTIVATO. ｣' });
  }

  if (sub === 'strict') {
    if (!antinukeData.protectedGroups.has(jid)) {
      antinukeData.protectedGroups.set(jid, {
        enabled: true,
        protectFromOwners: true,
        addedBy: sender,
        addedAt: Date.now()
      });
      return sock.sendMessage(jid, { text: '｢ 🔒 Strict ATTIVATA. ｣' });
    }
    const cfg = antinukeData.protectedGroups.get(jid);
    cfg.protectFromOwners = !cfg.protectFromOwners;
    return sock.sendMessage(jid, {
      text: `｢ 🔒 Strict ${cfg.protectFromOwners ? 'ATTIVATA' : 'DISATTIVATA'}. ｣`
    });
  }

  if (sub === 'status') {
    const targetJid = args[1] || jid;
    const cfg = antinukeData.protectedGroups.get(targetJid);
    if (!cfg) return sock.sendMessage(jid, { text: '｢ ℹ️ Nessuna protezione impostata. ｣' });
    return sock.sendMessage(jid, {
      text:
        `｢ 🛡️ *Stato Antinuke*\n\n` +
        `Attivo: ${cfg.enabled ? '✅' : '❌'}\n` +
        `Strict: ${cfg.protectFromOwners ? '🔒 Sì' : '🔓 No'}\n` +
        `Aggiunto da: @${(cfg.addedBy || '').split('@')[0]}\n` +
        `Data: ${new Date(cfg.addedAt).toLocaleString('it-IT')} ｣`
    });
  }

  if (sub === 'list') {
    if (antinukeData.protectedGroups.size === 0) {
      return sock.sendMessage(jid, { text: '｢ ℹ️ Nessun gruppo protetto. ｣' });
    }
    let txt = '｢ 🛡️ *Gruppi Protetti*\n\n';
    for (const [g, cfg] of antinukeData.protectedGroups.entries()) {
      txt += `• ${g} — ${cfg.enabled ? '✅' : '❌'} ${cfg.protectFromOwners ? '🔒' : ''}\n`;
    }
    txt += '｣';
    return sock.sendMessage(jid, { text: txt });
  }

  if (sub === 'scores') {
    if (!isMasterOwner(sender, global_owner)) {
      return sock.sendMessage(jid, { text: '｢ ❌ Solo il master owner. ｣' });
    }
    if (antinukeData.botScores.size === 0) {
      return sock.sendMessage(jid, { text: '｢ ℹ️ Nessun punteggio registrato. ｣' });
    }
    let txt = '｢ 📊 *Bot Scores*\n\n';
    for (const [actor, data] of antinukeData.botScores.entries()) {
      const lvl = getSecurityLevel(data.score, antinukeData.config);
      txt += `• @${actor.split('@')[0]}\n  Score: ${data.score} — ${lvl}\n  ${data.reasons.slice(-2).join(', ')}\n\n`;
    }
    txt += '｣';
    return sock.sendMessage(jid, { text: txt, mentions: [...antinukeData.botScores.keys()] });
  }

  if (sub === 'config') {
    if (!isMasterOwner(sender, global_owner)) {
      return sock.sendMessage(jid, { text: '｢ ❌ Solo il master owner. ｣' });
    }
    const cfg = antinukeData.config;
    return sock.sendMessage(jid, {
      text:
        `｢ ⚙️ *Config Antinuke*\n\n` +
        `Soglia warn: ${cfg.warnThreshold} pt\n` +
        `Soglia bot: ${cfg.botScoreThreshold} pt\n` +
        `Soglia auto-kick: ${cfg.autoKickThreshold} pt\n` +
        `Max kick/min: ${cfg.maxKicksPerWindow}\n` +
        `Burst window: ${cfg.burstWindowMs}ms\n` +
        `Burst threshold: ${cfg.burstThreshold}\n` +
        `Mass kick soglia: ${cfg.massKickThreshold} membri ｣`
    });
  }

  if (sub === 'clearsuspended') {
    if (!isMasterOwner(sender, global_owner)) {
      return sock.sendMessage(jid, { text: '｢ ❌ Solo il master owner. ｣' });
    }
    antinukeData.suspendedActors.clear();
    antinukeData.botScores.clear();
    antinukeData.actionLog.clear();
    antinukeData.warningsSent.clear();
    return sock.sendMessage(jid, { text: '｢ ✅ Reset completo effettuato. ｣' });
  }

  return sock.sendMessage(jid, {
    text:
      `｢ 🛡️ *Antinuke — Comandi*\n\n` +
      `.antinuke on — Attiva\n` +
      `.antinuke off — Disattiva\n` +
      `.antinuke strict — Toggle protezione da owner\n` +
      `.antinuke status — Stato gruppo\n` +
      `.antinuke list — Gruppi protetti\n` +
      `.antinuke scores — Score bot rilevati\n` +
      `.antinuke config — Visualizza configurazione\n` +
      `.antinuke clearsuspended — Reset completo ｣`
  });
}

export { antinukeData };
