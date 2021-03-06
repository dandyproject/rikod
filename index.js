const { create, decryptMedia } = require('@open-wa/wa-automate')
const moment = require('moment-timezone')
const { tiktok, instagram, twitter, facebook } = require('./lib/dl-video')
const urlShortener = require('./lib/shortener')
const color = require('./lib/color')
const { fetchMeme } = require('./lib/fetcher')
const { getText } = require('./lib/ocr')
moment.tz.setDefault('Asia/Jakarta')
moment.locale('id')

const serverOption = {
    headless: false,
    qrRefreshS: 20,
    qrTimeout: 0,
    authTimeout: 0,
    autoRefresh: true,
    killProcessOnBrowserClose: true,
    cacheEnabled: false,
    chromiumArgs: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        // THIS MAY BREAK YOUR APP !!!ONLY FOR TESTING FOR NOW!!!
        '--aggressive-cache-discard',
        '--disable-cache',
        '--disable-application-cache',
        '--disable-offline-load-stale-cache',
        '--disk-cache-size=0'
    ]
}

const opsys = process.platform
if (opsys === 'win32' || opsys === 'win64') {
    serverOption.executablePath = 'C:\\Users\\dandisubhani\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe'
} else if (opsys === 'linux') {
    serverOption.browserRevision = '737027'
} else if (opsys === 'darwin') {
    serverOption.executablePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
}

const startServer = async () => {
    create('Imperial', serverOption)
        .then((client) => {
            console.log('[DEV] Red Emperor')
            console.log('[SERVER] Server Started!')
            // Force it to keep the current session
            client.onStateChanged((state) => {
                console.log('[Client State]', state)
                if (state === 'CONFLICT') client.forceRefocus()
            })
            // listening on message
            client.onMessage((message) => {
                msgHandler(client, message)
            })

            client.onAddedToGroup((chat) => {
                client.sendText(chat.groupMetadata.id, `Halo Warga Grup ${chat.contact.name} Terimakasih sudah meninvite bot ini, untuk melihat menu silahkan kirim #menu`)
            })
            // listening on Incoming Call
            // client.onIncomingCall((call) => {
            //     client.sendText(call.peerJid._serialized, 'Maaf, saya tidak bisa menerima panggilan.')
            // })
        })
        .catch((err) => {
            console.error(err)
        })
}

async function msgHandler (client, message) {
    try {
        // console.log(message)
        const { type, id, from, t, sender, isGroupMsg, chat, caption, isMedia, mimetype, quotedMsg, mentionedJidList } = message
        let { body } = message
        const { name } = chat
        let { pushname, verifiedName } = sender
        pushname = pushname || verifiedName // verifiedName is the name of someone who uses a business account
        // if (pushname === undefined) console.log(sender + '\n\n' + chat)

        const prefix = '#'
        body = (type === 'chat' && body.startsWith(prefix)) ? body : ((type === 'image' && caption) && caption.startsWith(prefix)) ? caption : ''
        const command = body.slice(prefix.length).trim().split(/ +/).shift().toLowerCase()
        const args = body.slice(prefix.length).trim().split(/ +/).slice(1)
        const isCmd = body.startsWith(prefix)
        const time = moment(t * 1000).format('DD/MM HH:mm:ss')

        if (!isCmd && !isGroupMsg) return console.log('[RECV]', color(time, 'yellow'), 'Message from', color(pushname))
        if (!isCmd && isGroupMsg) return console.log('[RECV]', color(time, 'yellow'), 'Message from', color(pushname), 'in', color(name))
        if (isCmd && !isGroupMsg) console.log(color('[EXEC]'), color(time, 'yellow'), color(`${command} [${args.length}]`), 'from', color(pushname))
        if (isCmd && isGroupMsg) console.log(color('[EXEC]'), color(time, 'yellow'), color(`${command} [${args.length}]`), 'from', color(pushname), 'in', color(name))

        const botNumber = await client.getHostNumber()
        const groupId = isGroupMsg ? chat.groupMetadata.id : ''
        const groupAdmins = await client.getGroupAdmins(groupId)
        const groupMembers = await client.getGroupMembersId(groupId)
        const isGroupAdmins = groupAdmins.includes(sender.id)
        const isBotGroupAdmins = groupAdmins.includes(botNumber + '@c.us')

        // Checking function speed
        // const timestamp = moment()
        // const latensi = moment.duration(moment() - timestamp).asSeconds()
        const uaOverride = 'WhatsApp/2.2029.4 Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36'
        const url = args.length !== 0 ? args[0] : ''
        const isUrl = new RegExp(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/gi)
        const isMediaGiphy = url.match(new RegExp(/https?:\/\/media.giphy.com\/media/, 'gi'))
        const isGiphy = url.match(new RegExp(/https?:\/\/(www\.)?giphy.com/, 'gi'))

        switch (command) {
        case 'tnc':
            await client.sendText(from, '1. *Jangan Spam Bot Saat Bot OFF*\n2. *Bot Tidak Menyimpan Data Anda di Server Kami*\n3. *Gunakan Bahasa Yang Sopan Agar Tidak Kena Banned*\n4. *Gunakan Bot Sewajarnya,Karena Akan Mengakibatkan Delay*\n\n*Gunakan bot dengan Bijak*\n\n _Dandi_.')
            break
        case 'menu':
        case 'help': {
            const text = `Hai, ${pushname}! 👋️ \n\nPerintah!✨\n\n*Sticker Creator*\nCMD: #sticker\nDeskripsi: Mengubah gambar menjadi stiker, kirim gambar dengan caption #sticker atau balas gambar yang sudah dikirim dengan #sticker\n\nCMD: #sticker <url gambar>\nDeskripsi: Ubah url gambar jadi stiker\n\n*Gif Sticker*\nCMD : #gif Giphy URL\nDeskripsi: ubah gif jadi sticker (hanya dari giphy)\n\n*Downloader*\nCMD: #tiktok <post/video url>\nDescription: Return a Tiktok video\n\nCMD: #fb <post/video url>\nDescription: Return a Facebook video download link\n\nCMD: #ig <post/video url>\nDescription: Return a Instagram video download link\n\nCMD: #twt <post/video url>\nDescription: Return a Twitter video download link\n\n*Other*\nCMD: #tnc\nDeskripsi: Syarat dan Ketentuan\n\nHope you have a great day!✨`
            await client.sendText(from, text)
            break
        }
        // Sticker Creator
        case 'sticker':
        case 'stiker':
            if (isMedia) {
                const mediaData = await decryptMedia(message, uaOverride)
                const imageBase64 = `data:${mimetype};base64,${mediaData.toString('base64')}`
                await client.sendImageAsSticker(from, imageBase64)
            } else if (quotedMsg && quotedMsg.type === 'image') {
                const mediaData = await decryptMedia(quotedMsg)
                const imageBase64 = `data:${quotedMsg.mimetype};base64,${mediaData.toString('base64')}`
                await client.sendImageAsSticker(from, imageBase64)
            } else if (args.length === 1) {
                if (!url.match(isUrl)) await client.reply(from, '_URl Tidak Valid_.', id)
                await client.sendStickerfromUrl(from, url)
                    .then((r) => {
                        if (!r && r !== undefined) client.sendText(from, '_Link yang dikirim tidak memuat gambar_.')
                    })
            } else {
                await client.reply(from, '_Tidak ada gambar_', id)
            }
            break
        case 'stikergif':
        case 'stickergif':
        case 'gifstiker':
        case 'gifsticker':
            if (args.length !== 1) return client.reply(from, '_Format pesan salah_', id)
            if (isGiphy) {
                const getGiphyCode = url.match(new RegExp(/(\/|\-)(?:.(?!(\/|\-)))+$/, 'gi'))
                if (!getGiphyCode) return client.reply(from, 'Gagal mengambil kode giphy', id)
                const giphyCode = getGiphyCode[0].replace(/[-\/]/gi, '')
                console.log(giphyCode)
                const smallGiftUrl = 'https://media.giphy.com/media/' + giphyCode + '/giphy-downsized.gif'
                await client.sendGiphyAsSticker(from, smallGiftUrl).catch((err) => console.log(err))
            } else if (isMediaGiphy) {
                const giftUrl = url.match(new RegExp(/(giphy|source).(gif|mp4)/, 'gi'))
                if (!giftUrl) return client.reply(from, 'Gagal mengambil kode giphy', id)
                const smallGiftUrl = url.replace(giftUrl[0], 'giphy-downsized.gif')
                await client.sendGiphyAsSticker(from, smallGiftUrl).catch((err) => console.log(err))
            } else {
                await client.reply(from, '_Untuk saat ini gif hanya bisa dari giphy_.', id)
            }
            break
        // Video Downloader
        case 'tiktok':
            if (args.length !== 1) return client.reply(from, '_Format pesan salah_', id)
            if (!url.match(isUrl) && !url.includes('tiktok.com')) return client.reply(from, '_Link tidak valid_', id)
            await client.sendText(from, '*Mengambil Data...*')
            await tiktok(url)
                .then((videoMeta) => {
                    const filename = videoMeta.authorMeta.name + '.mp4'
                    const caps = `*Data:*\nUsername: ${videoMeta.authorMeta.name} \nMusic: ${videoMeta.musicMeta.musicName} \nView: ${videoMeta.playCount.toLocaleString()} \nLike: ${videoMeta.diggCount.toLocaleString()} \nComment: ${videoMeta.commentCount.toLocaleString()} \nShare: ${videoMeta.shareCount.toLocaleString()} \nCaption: ${videoMeta.text.trim() ? videoMeta.text : '-'} \n\nDonasi: Bantu bot agar tetap aktif dengan menyawer melalui https://saweria.co/donate/dandisubhani \nTerimakasih.`
                    client.sendFileFromUrl(from, videoMeta.url, filename, videoMeta.NoWaterMark ? caps : `⚠ Video tanpa watermark tidak tersedia. \n\n${caps}`, '', { headers: { 'User-Agent': 'okhttp/4.5.0' } })
                        .catch(err => console.log('Caught exception: ', err))
                }).catch(() => {
                    client.reply(from, '_Gagal,Link tidak valid_', id)
                })
            break
        case 'ig':
        case 'instagram':
            if (args.length !== 1) return client.reply(from, '_Format pesan salah_', id)
            if (!url.match(isUrl) && !url.includes('instagram.com')) return client.reply(from, '_Link tidak valid_', id)
            await client.sendText(from, '*Mengambil Data...*')
            instagram(url)
                .then(async (videoMeta) => {
                    const content = []
                    for (let i = 0; i < videoMeta.length; i++) {
                        await urlShortener(videoMeta[i].video)
                            .then((result) => {
                                console.log('Shortlink: ' + result)
                                content.push(`${i + 1}. ${result}`)
                            }).catch((err) => {
                                client.sendText(from, 'Error, ' + err)
                            })
                    }
                    await client.sendText(from, `Agar Tidak Membebankan Server.Silahkan Klik Link dibawah ini untuk Download\n\nLink Download:\n${content.join('\n')} \n\nDonasi: Bantu bot agar tetap aktif dengan menyawer melalui https://saweria.co/donate/dandisubhani \nTerimakasih.`)
                }).catch((err) => {
                    if (err === 'Not a video') return client.reply(from, 'Error, tidak ada video di link yang kamu kirim', id)
                    client.reply(from, 'Error, user private atau link salah', id)
                })
            break
        case 'twt':
        case 'twitter':
            if (args.length !== 1) return client.reply(from, '_Format pesan salah_', id)
            if (!url.match(isUrl) & !url.includes('twitter.com') || url.includes('t.co')) return client.reply(from, 'Maaf, url yang kamu kirim tidak valid', id)
            await client.sendText(from, '*Mengambil Data...*')
            twitter(url)
                .then(async (videoMeta) => {
                    try {
                        if (videoMeta.type === 'video') {
                            const content = videoMeta.variants.filter(x => x.content_type !== 'application/x-mpegURL').sort((a, b) => b.bitrate - a.bitrate)
                            const result = await urlShortener(content[0].url)
                            console.log('Shortlink: ' + result)
                            await client.sendFileFromUrl(from, content[0].url, 'TwitterVideo.mp4', `Agar Tidak Membebankan Server.Silahkan Klik Link dibwah ini untuk Download\n\nLink Download: ${result} \n\nDonasi: Bantu bot agar tetap aktif dengan menyawer melalui https://saweria.co/donate/dandisubhani \nTerimakasih.`)
                        } else if (videoMeta.type === 'photo') {
                            for (let i = 0; i < videoMeta.variants.length; i++) {
                                await client.sendFileFromUrl(from, videoMeta.variants[i], videoMeta.variants[i].split('/media/')[1], '')
                            }
                        }
                    } catch (err) {
                        await client.sendText(from, 'Error, ' + err)
                    }
                }).catch(() => {
                    client.sendText(from, '_link tidak valid atau tidak ada video di link yang kamu kirim_')
                })
            break
        case 'fb':
        case 'facebook':
            if (args.length !== 1) return client.reply(from, '_Format pesan salah_', id)
            if (!url.match(isUrl) && !url.includes('facebook.com')) return client.reply(from, 'Maaf, url yang kamu kirim tidak valid', id)
            await client.sendText(from, '*Mengambil Data...*')
            facebook(url)
                .then(async (videoMeta) => {
                    try {
                        const title = videoMeta.response.title
                        const thumbnail = videoMeta.response.thumbnail
                        const links = videoMeta.response.links
                        const shorts = []
                        for (let i = 0; i < links.length; i++) {
                            const shortener = await urlShortener(links[i].url)
                            console.log('Shortlink: ' + shortener)
                            links[i].short = shortener
                            shorts.push(links[i])
                        }
                        const link = shorts.map((x) => `${x.resolution} Quality: ${x.short}`)
                        const caption = `Text: ${title} \nLink Download: \n${link.join('\n')} \n\nDonasi: Bantu bot agar tetap aktif dengan menyawer melalui https://saweria.co/donate/dandisubhani \nTerimakasih.`
                        await client.sendFileFromUrl(from, thumbnail, 'videos.jpg', caption)
                    } catch (err) {
                        await client.reply(from, 'Error, ' + err, id)
                    }
                })
                .catch((err) => {
                    client.reply(from, `_Error_ \n\n${err}`, id)
                })
            break
        // Other Command
        case 'mim':
        case 'memes':
        case 'meme': {
            const { title, url } = await fetchMeme()
            await client.sendFileFromUrl(from, `${url}`, 'meme.jpg', `${title}`)
            break
        }
        case 'ocr':
            if (isMedia) {
                const mediaData = await decryptMedia(message, uaOverride)
                const imageBase64 = `data:${mimetype};base64,${mediaData.toString('base64')}`
                const text = await getText(imageBase64)
                await client.sendText(from, text)
            } else if (quotedMsg && quotedMsg.type === 'image') {
                const mediaData = await decryptMedia(quotedMsg)
                const imageBase64 = `data:${quotedMsg.mimetype};base64,${mediaData.toString('base64')}`
                const text = await getText(imageBase64)
                await client.sendText(from, text)
            } else if (args.length === 1) {
                if (!url.match(isUrl)) await client.reply(from, 'Maaf, format pesan salah silahkan periksa menu.', id)
                const text = await getText(url)
                await client.sendText(from, text)
            } else {
                await client.reply(from, 'Tidak ada gambar! Untuk membuka daftar perintah kirim #menu', id)
            }
            break
        // Group Commands (group admin only)
        case 'kick':
            if (!isGroupMsg) return client.reply(from, 'Maaf, perintah ini hanya dapat dipakai didalam grup!', id)
            if (!isGroupAdmins) return client.reply(from, 'Gagal, perintah ini hanya dapat digunakan oleh admin grup!', id)
            if (!isBotGroupAdmins) return client.reply(from, 'Gagal, silahkan tambahkan bot sebagai admin grup!', id)
            if (mentionedJidList.length === 0) return client.reply(from, 'Maaf, format pesan salah silahkan periksa menu.', id)
            await client.sendText(from, `Request diterima, mengeluarkan:\n${mentionedJidList.join('\n')}`)
            for (let i = 0; i < mentionedJidList.length; i++) {
                if (groupAdmins.includes(mentionedJidList[i])) return await client.sendText('Gagal, kamu tidak bisa mengeluarkan admin grup.')
                await client.removeParticipant(groupId, mentionedJidList[i])
            }
            break
        case 'promote': {
            if (!isGroupMsg) return await client.reply(from, 'Maaf, perintah ini hanya dapat dipakai didalam grup!', id)
            if (!isGroupAdmins) return await client.reply(from, 'Gagal, perintah ini hanya dapat digunakan oleh admin grup!', id)
            if (!isBotGroupAdmins) return await client.reply(from, 'Gagal, silahkan tambahkan bot sebagai admin grup!', id)
            if (mentionedJidList.length === 0) return await client.reply(from, 'Maaf, format pesan salah silahkan periksa menu.', id)
            if (mentionedJidList.length <= 2) return await client.reply(from, 'Maaf, vote kick hanya dapat digunakan kepada 1 user.', id)
            if (groupAdmins.includes(mentionedJidList[0])) return await client.reply(from, 'Maaf, user tersebut sudah menjadi admin.', id)
            await client.promoteParticipant(groupId, mentionedJidList[0])
            await client.sendTextWithMentions(from, `Request diterima, menambahkan @${mentionedJidList[0].replace('@c.us', '')} sebagai admin.`)
            break
        }
        case 'demote': {
            if (!isGroupMsg) return client.reply(from, 'Maaf, perintah ini hanya dapat dipakai didalam grup!', id)
            if (!isGroupAdmins) return client.reply(from, 'Gagal, perintah ini hanya dapat digunakan oleh admin grup!', id)
            if (!isBotGroupAdmins) return client.reply(from, 'Gagal, silahkan tambahkan bot sebagai admin grup!', id)
            if (mentionedJidList.length === 0) return client.reply(from, 'Maaf, format pesan salah silahkan periksa menu.', id)
            if (mentionedJidList.length <= 2) return await client.reply(from, 'Maaf, vote kick hanya dapat digunakan kepada 1 user.', id)
            if (!groupAdmins.includes(mentionedJidList[0])) return await client.reply(from, 'Maaf, user tersebut tidak menjadi admin.', id)
            await client.demoteParticipant(groupId, mentionedJidList[0])
            await client.sendTextWithMentions(from, `Request diterima, menghapus jabatan @${mentionedJidList[0].replace('@c.us', '')}.`)
            break
        }

        case 'Keluar':
            if (!isGroupMsg) return client.reply(from, 'Maaf, perintah ini hanya dapat dipakai didalam grup!', id)
            if (!isGroupAdmins) return client.reply(from, 'Maaf, perintah ini hanya dapat dilakukan oleh admin grup!', id)
            await client.sendText(from, 'Good bye... ( ⇀‸↼‶ )').then(() => client.leaveGroup(groupId))
            break
        default:
            console.log(color('[ERROR]', 'red'), color(time, 'yellow'), 'Unregistered Command from', color(pushname))
            break
        }
    } catch (err) {
        console.log(color('[ERROR]', 'red'), err)
    }
}

startServer()
