 
let handler = async (message, { conn, text }) => {
    const userId = message.sender;
    const groupId = message.chat;

    if (!text && !message.mentionedJid?.[0] && !message.quoted) {
        return conn.reply(message.chat, global.t('banuserNoTarget', userId, groupId), message);
    }

    let target;
    if (message.mentionedJid?.[0]) {
        target = message.mentionedJid[0];
    } else if (message.quoted) {
        target = message.quoted.sender;
    } else if (text) {
        let number = text.replace(/\D/g, '');
        if (number.length < 8) return conn.reply(message.chat, global.t('banuserInvalidNumber', userId, groupId), message);
        target = number + '@s.whatsapp.net';
    }

    let users = global.db?.data?.users;
    if (!users) {
        global.db.data.users = {};
        users = global.db.data.users;
    }
    if (!users[target]) users[target] = {};
    users[target].banned = true;

    const nomeDelBot = conn.user?.name || global.db?.data?.nomedelbot || 'karma';

    await conn.sendMessage(message.chat, {
        text: global.t('banuserSuccess', userId, groupId, { target: target.split('@')[0] }),
        mentions: [target],
        contextInfo: {
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: '120363259442839354@newsletter',
                serverMessageId: '',
                newsletterName: nomeDelBot
            }
        }
    }, { quoted: message });
};

handler.help = [
  'banuser @user',
  'blockuser @user',
  'banearusuario @usuario',
  'bloquearusuario @usuario',
  'banirusuario @usuário',
  'blockieren @benutzer',
  '封禁用户 @用户',
  'забанитьпользователя @пользователь',
  'حظرالمستخدم @المستخدم',
  'उपयोगकर्ताबैन @उपयोगकर्ता',
  'bannirutilisateur @utilisateur',
  'blokpengguna @user',
  'kullanıcıyasakla @kullanıcı'
];
handler.tags = ['owner'];
handler.command = /^(banuser|blockuser|banearusuario|bloquearusuario|banirusuario|blockieren|封禁用户|забанитьпользователя|حظرالمستخدم|उपयोगकर्ताबैन|bannirutilisateur|blokpengguna|kullanıcıyasakla)$/i;
handler.rowner = true;

export default handler;
