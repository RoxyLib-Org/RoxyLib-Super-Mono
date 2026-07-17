/**
 * Mock song data for the orgel disc player.
 * Audio sources: SoundHelix (royalty-free procedurally generated music)
 */

export interface LyricLine {
  /** Start time in seconds */
  time: number;
  /** Lyric text for this line */
  text: string;
}

export interface Song {
  id: number;
  title: string;
  artist: string;
  album: string;
  /** Duration in seconds */
  duration: number;
  /** Direct MP3 URL */
  audioUrl: string;
  /** Color theme (matches disc palette) */
  color: string;
  lyrics: LyricLine[];
}

export const SONGS: Song[] = [
  {
    id: 0,
    title: "Midnight Waves",
    artist: "Celestial Drift",
    album: "Ocean Protocol",
    duration: 209,
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    color: "#1e3a5f",
    lyrics: [
      // Intro
      { time: 0, text: "..." },
      { time: 8, text: "..." },
      // Verse 1
      { time: 15, text: "窗外的海浪声 打在沉默的岸" },
      { time: 20, text: "你留下的杯子 还放在床头柜" },
      { time: 25, text: "凌晨三点醒来" },
      { time: 28, text: "以为你还在" },
      { time: 32, text: "月光穿过窗帘 像你的手一样凉" },
      // Pre-chorus
      { time: 40, text: "说好了不再想" },
      { time: 44, text: "可是午夜太长" },
      // Chorus
      { time: 48, text: "潮水涨了又退" },
      { time: 51, text: "退了又涨" },
      { time: 54, text: "我站在海边 等一个不会回来的人" },
      { time: 60, text: "浪花碎在脚下 像那些" },
      { time: 64, text: "说不出口的话" },
      // Verse 2
      { time: 72, text: "你走的那天 天气很好" },
      { time: 77, text: "好到让离别显得荒谬" },
      { time: 82, text: "后视镜里你越来越小" },
      { time: 87, text: "小到再也装不下 一句再见" },
      // Pre-chorus
      { time: 96, text: "都说时间会冲淡" },
      { time: 100, text: "为什么越淡越咸" },
      // Chorus
      { time: 105, text: "潮水涨了又退" },
      { time: 108, text: "退了又涨" },
      { time: 111, text: "我站在海边 数着第几个夜晚" },
      { time: 117, text: "沙滩上的脚印" },
      { time: 120, text: "一个人走不出两行" },
      // Bridge
      { time: 130, text: "..." },
      { time: 138, text: "如果海有记忆" },
      { time: 143, text: "它会不会也觉得累" },
      { time: 148, text: "反反复复 把同一片沙" },
      { time: 153, text: "推远 又拉回来" },
      // Final chorus (softer)
      { time: 162, text: "潮水涨了又退" },
      { time: 166, text: "我不再等了" },
      { time: 171, text: "把你的名字写进浪花" },
      { time: 177, text: "让大海替我 说再见" },
      // Outro
      { time: 186, text: "..." },
      { time: 192, text: "晚安" },
      { time: 200, text: "..." },
    ],
  },
  {
    id: 1,
    title: "Neon Pulse",
    artist: "Synthwave Collective",
    album: "Digital Horizons",
    duration: 237,
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    color: "#5f1e5f",
    lyrics: [
      // Synth intro
      { time: 0, text: "..." },
      { time: 6, text: "..." },
      // Verse 1
      { time: 12, text: "Driving down the 405" },
      { time: 15, text: "Neon bleeds across the windshield" },
      { time: 19, text: "Radio static fills the space" },
      { time: 22, text: "Where your voice used to be" },
      { time: 27, text: "Palm trees cut the sodium light" },
      { time: 31, text: "Into ribbons on the dash" },
      { time: 35, text: "I keep one hand on the wheel" },
      { time: 39, text: "And one reaching for the past" },
      // Chorus
      { time: 44, text: "Neon pulse, neon pulse" },
      { time: 47, text: "Burning through the night" },
      { time: 50, text: "Every sign says keep going" },
      { time: 53, text: "But I forgot where I was driving to" },
      { time: 58, text: "Neon pulse, neon pulse" },
      { time: 61, text: "Flickering and cruel" },
      { time: 64, text: "You left the city but the city" },
      { time: 68, text: "Never stopped spelling out your name" },
      // Verse 2
      { time: 76, text: "Gas station at 2 AM" },
      { time: 80, text: "Fluorescent humming overhead" },
      { time: 84, text: "A stranger's mixtape in the deck" },
      { time: 88, text: "Playing songs that sound like regret" },
      { time: 93, text: "I could turn around right now" },
      { time: 97, text: "But the highway only goes one way" },
      { time: 102, text: "And there's a comfort in the speed" },
      { time: 106, text: "When you've got nothing left to say" },
      // Chorus
      { time: 112, text: "Neon pulse, neon pulse" },
      { time: 115, text: "Burning through the night" },
      { time: 118, text: "The rearview mirror's just a screen" },
      { time: 122, text: "Playing reruns of a better time" },
      { time: 127, text: "Neon pulse, neon pulse" },
      { time: 130, text: "Flickering and cruel" },
      { time: 133, text: "I'll drive until the signs go dark" },
      { time: 137, text: "Or until I stop seeing your face" },
      // Bridge
      { time: 146, text: "..." },
      { time: 152, text: "Red light, green light" },
      { time: 155, text: "The city decides when I stop" },
      { time: 159, text: "When I go" },
      { time: 162, text: "I gave up choosing a long time ago" },
      // Breakdown
      { time: 172, text: "..." },
      { time: 178, text: "..." },
      // Final chorus (stripped)
      { time: 184, text: "Neon pulse..." },
      { time: 190, text: "Burning through the night..." },
      { time: 196, text: "I forgot where I was driving to" },
      { time: 202, text: "I forgot" },
      { time: 208, text: "But I'll keep driving" },
      // Outro
      { time: 216, text: "..." },
      { time: 228, text: "..." },
    ],
  },
  {
    id: 2,
    title: "Paper Lanterns",
    artist: "Quiet Gardens",
    album: "Floating World",
    duration: 195,
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    color: "#5f3a1e",
    lyrics: [
      // Intro (acoustic guitar)
      { time: 0, text: "..." },
      // Verse 1
      { time: 10, text: "あの夏の終わりに" },
      { time: 14, text: "君が書いた手紙" },
      { time: 18, text: "しわくちゃのまま" },
      { time: 21, text: "まだ引き出しの奥にある" },
      { time: 27, text: "読み返すたびに" },
      { time: 30, text: "インクが少し薄くなる" },
      { time: 35, text: "いつか全部消えてしまうかな" },
      // Chorus
      { time: 42, text: "紙灯籠を空に放つように" },
      { time: 47, text: "手を離したら もう届かない" },
      { time: 52, text: "でもきれいだね" },
      { time: 55, text: "遠くなるほど きれいだね" },
      // Verse 2
      { time: 64, text: "商店街の角を曲がれば" },
      { time: 68, text: "まだ君がいるような気がして" },
      { time: 73, text: "自転車を止めて" },
      { time: 76, text: "振り返ってみるけど" },
      { time: 80, text: "そこにはもう" },
      { time: 83, text: "知らない人の暮らしがあるだけ" },
      // Chorus
      { time: 90, text: "紙灯籠を空に放つように" },
      { time: 95, text: "手を離したら もう戻らない" },
      { time: 100, text: "でもあたたかいね" },
      { time: 104, text: "思い出すほど あたたかいね" },
      // Bridge
      { time: 112, text: "..." },
      { time: 118, text: "忘れたいわけじゃない" },
      { time: 122, text: "ただ重すぎて" },
      { time: 126, text: "持っていけないだけ" },
      { time: 132, text: "だから 空に返す" },
      // Final chorus (a cappella feel)
      { time: 140, text: "紙灯籠を空に放つように" },
      { time: 146, text: "ありがとう さようなら" },
      { time: 152, text: "小さくなって" },
      { time: 156, text: "星に混ざって" },
      { time: 160, text: "いつか本当の星になって" },
      // Outro
      { time: 168, text: "..." },
      { time: 176, text: "またね" },
      { time: 186, text: "..." },
    ],
  },
  {
    id: 3,
    title: "Iron Garden",
    artist: "Mechanical Bloom",
    album: "Rust & Petals",
    duration: 267,
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    color: "#3a5f1e",
    lyrics: [
      // Instrumental intro (heavy)
      { time: 0, text: "..." },
      { time: 8, text: "..." },
      { time: 14, text: "..." },
      // Verse 1 (spoken-word feel)
      { time: 20, text: "They paved the park and called it progress" },
      { time: 25, text: "Tore down the oaks for a parking garage" },
      { time: 30, text: "But something's pushing through the asphalt" },
      { time: 35, text: "Something they forgot to kill" },
      { time: 42, text: "A dandelion splits the concrete" },
      { time: 47, text: "Like a fist through a paper wall" },
      { time: 52, text: "They can bulldoze every meadow" },
      { time: 57, text: "But they can't stop a seed from falling" },
      // Chorus (anthemic)
      { time: 64, text: "This is the iron garden" },
      { time: 67, text: "Growing where nothing should" },
      { time: 70, text: "Roots wrapped around rebar" },
      { time: 73, text: "Blooming where they said nothing could" },
      { time: 78, text: "This is the iron garden" },
      { time: 81, text: "We don't need your permission" },
      { time: 84, text: "To exist" },
      // Verse 2
      { time: 94, text: "My grandmother kept tomatoes" },
      { time: 99, text: "On a fire escape in Queens" },
      { time: 104, text: "Said 'If you can't find the ground'" },
      { time: 108, text: "'Make the sky your soil'" },
      { time: 114, text: "Thirty stories up, those vines" },
      { time: 119, text: "Reached further than any tree" },
      { time: 124, text: "Because hunger makes you stretch" },
      { time: 129, text: "And concrete makes you mean" },
      // Chorus
      { time: 136, text: "This is the iron garden" },
      { time: 139, text: "Growing where nothing should" },
      { time: 142, text: "Weeds cracking highway medians" },
      { time: 146, text: "Moss reclaiming old neighborhoods" },
      { time: 151, text: "This is the iron garden" },
      { time: 154, text: "It doesn't ask, it takes" },
      { time: 157, text: "What's owed" },
      // Bridge (quiet, building)
      { time: 166, text: "..." },
      { time: 172, text: "They sprayed the roundup" },
      { time: 176, text: "They pulled the roots" },
      { time: 180, text: "They poured fresh concrete thick and smooth" },
      { time: 186, text: "..." },
      { time: 191, text: "But come spring..." },
      { time: 196, text: "But come spring..." },
      // Final chorus (explosive)
      { time: 204, text: "This is the iron garden!" },
      { time: 207, text: "And we are not going away!" },
      { time: 211, text: "Every crack is a doorway!" },
      { time: 214, text: "Every ruin is a nursery!" },
      { time: 218, text: "We'll outlast the concrete!" },
      { time: 221, text: "We'll outlast the steel!" },
      { time: 224, text: "Because the only thing harder than iron" },
      { time: 229, text: "Is the need to be real" },
      // Outro (fading)
      { time: 238, text: "Iron garden..." },
      { time: 246, text: "Growing..." },
      { time: 254, text: "..." },
    ],
  },
  {
    id: 4,
    title: "Glass Cathedral",
    artist: "Echo Assembly",
    album: "Transparent Architecture",
    duration: 224,
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
    color: "#1e5f5f",
    lyrics: [
      // Reverb intro
      { time: 0, text: "..." },
      // Verse 1 (ethereal)
      { time: 12, text: "I built a church out of everything you said" },
      { time: 17, text: "Stained glass windows from your promises" },
      { time: 22, text: "The architecture was immaculate" },
      { time: 27, text: "Until the first stone hit" },
      { time: 34, text: "Now sunlight falls where walls should be" },
      { time: 39, text: "And I can finally see the sky" },
      { time: 44, text: "Funny how destruction" },
      { time: 48, text: "Can look so much like freedom" },
      // Chorus
      { time: 54, text: "Glass cathedral, come undone" },
      { time: 58, text: "Every shard catches the sun" },
      { time: 62, text: "I'm not broken, I'm just" },
      { time: 65, text: "More transparent than before" },
      { time: 70, text: "Glass cathedral on the floor" },
      { time: 74, text: "Beautiful and nothing more" },
      // Verse 2
      { time: 84, text: "You said 'forever' like it was easy" },
      { time: 89, text: "Like a word that small could hold that much weight" },
      { time: 94, text: "I stacked your forevers into columns" },
      { time: 99, text: "And called it faith" },
      { time: 105, text: "But forever's got a hairline crack" },
      { time: 110, text: "You can't see until it splits" },
      { time: 115, text: "And by then you're standing barefoot" },
      { time: 119, text: "In the middle of it" },
      // Chorus
      { time: 126, text: "Glass cathedral, come undone" },
      { time: 130, text: "Every shard catches the sun" },
      { time: 134, text: "I'm not ruined, I'm just" },
      { time: 137, text: "Rearranged into something new" },
      { time: 142, text: "Glass cathedral, letting through" },
      { time: 146, text: "All the light I hid from you" },
      // Bridge (building pad)
      { time: 155, text: "..." },
      { time: 160, text: "I don't need a roof" },
      { time: 164, text: "To know where home is" },
      { time: 169, text: "I don't need your walls" },
      { time: 173, text: "To know I'm safe" },
      // Outro chorus (sparse)
      { time: 182, text: "Glass cathedral..." },
      { time: 188, text: "Let the rain in..." },
      { time: 194, text: "Let it wash the colors clean..." },
      { time: 202, text: "..." },
      { time: 210, text: "..." },
      { time: 218, text: "..." },
    ],
  },
  {
    id: 5,
    title: "Terminal Velocity",
    artist: "Freefall Theory",
    album: "Escape Mechanics",
    duration: 252,
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
    color: "#5f1e3a",
    lyrics: [
      // Drop beat intro
      { time: 0, text: "..." },
      { time: 4, text: "3" },
      { time: 5, text: "2" },
      { time: 6, text: "1" },
      // Verse 1 (rapid-fire)
      { time: 8, text: "城市从32楼看下去像电路板" },
      { time: 11, text: "每个窗口都是一个还没关的程序" },
      { time: 15, text: "我在天台抽着烟 想着辞职信" },
      { time: 19, text: "写了八遍 每一遍都比上一遍更礼貌" },
      { time: 24, text: "更虚伪" },
      { time: 27, text: "闹钟明天六点响 像往常一样" },
      { time: 31, text: "但我的心跳说" },
      { time: 33, text: "够了" },
      // Chorus (half-time)
      { time: 37, text: "终端速度 自由落体" },
      { time: 41, text: "到达极限之后反而不再加速" },
      { time: 46, text: "风阻等于重力 我悬在半空" },
      { time: 51, text: "不上不下 刚好" },
      { time: 55, text: "刚好能看清楚" },
      // Verse 2
      { time: 64, text: "三年前说'再熬一年就好'" },
      { time: 68, text: "一年前说'再等一个项目'" },
      { time: 72, text: "上个月说'下个月就辞'" },
      { time: 76, text: "人总是在 为不敢跳的自己" },
      { time: 80, text: "找一个更体面的站台" },
      { time: 85, text: "地铁到站 门开了" },
      { time: 88, text: "我没上去" },
      { time: 91, text: "第一次觉得被落下" },
      { time: 95, text: "比赶上更自由" },
      // Chorus
      { time: 100, text: "终端速度 自由落体" },
      { time: 104, text: "到达极限之后反而平静" },
      { time: 109, text: "风声不再尖叫 世界在放大" },
      { time: 114, text: "原来坠落到最后" },
      { time: 118, text: "像飞一样" },
      // Bridge (breakdown)
      { time: 126, text: "..." },
      { time: 132, text: "..." },
      { time: 138, text: "妈打电话来问 周末回不回家" },
      { time: 143, text: "我说回" },
      { time: 146, text: "她说 那我炖排骨" },
      { time: 151, text: "..." },
      { time: 155, text: "突然发现" },
      { time: 158, text: "降落伞一直在背上" },
      { time: 163, text: "只是忘了拉" },
      // Final section (euphoric)
      { time: 170, text: "终端速度" },
      { time: 174, text: "我不再往下坠" },
      { time: 178, text: "我在滑翔" },
      { time: 183, text: "三十二楼的风 原来这么暖" },
      { time: 189, text: "辞职信不用写了" },
      { time: 193, text: "直接走" },
      { time: 197, text: "背包里只需要放一样东西" },
      { time: 202, text: "回家的车票" },
      // Outro
      { time: 210, text: "终端速度..." },
      { time: 218, text: "..." },
      { time: 232, text: "自由" },
      { time: 244, text: "..." },
    ],
  },
  {
    id: 6,
    title: "Porcelain Dreams",
    artist: "Still Life",
    album: "Fragile Things",
    duration: 183,
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3",
    color: "#4a3a6f",
    lyrics: [
      // Piano intro
      { time: 0, text: "..." },
      { time: 7, text: "..." },
      // Verse 1 (intimate, close-mic)
      { time: 13, text: "I keep your photograph face-down" },
      { time: 17, text: "Not because I'm angry" },
      { time: 20, text: "But because your smile" },
      { time: 23, text: "Makes me forget why I left" },
      { time: 28, text: "And I need to remember" },
      { time: 32, text: "The way your love felt like holding my breath" },
      { time: 37, text: "Beautiful but not sustainable" },
      // Pre-chorus
      { time: 43, text: "We were porcelain" },
      { time: 46, text: "Displayed but never used" },
      { time: 50, text: "So perfect on the shelf" },
      { time: 53, text: "So empty" },
      // Chorus
      { time: 57, text: "Porcelain dreams don't bend" },
      { time: 60, text: "They shatter" },
      { time: 63, text: "And every piece reflects a different version" },
      { time: 68, text: "Of what we could have been" },
      { time: 72, text: "If we'd been made of something" },
      { time: 75, text: "Less precious and more real" },
      // Verse 2
      { time: 84, text: "You collected people like figurines" },
      { time: 89, text: "Arranged us by how well we matched" },
      { time: 93, text: "Your aesthetic" },
      { time: 96, text: "I wanted to be the chipped mug" },
      { time: 100, text: "You actually drink coffee from" },
      { time: 104, text: "But you only wanted the set" },
      { time: 108, text: "That never leaves the cabinet" },
      // Chorus
      { time: 114, text: "Porcelain dreams don't bend" },
      { time: 117, text: "They shatter" },
      { time: 120, text: "And in the aftermath you realize" },
      { time: 125, text: "The cracks were there before" },
      { time: 129, text: "We just painted over them" },
      { time: 133, text: "With gold and called it art" },
      // Outro (spoken, fading)
      { time: 142, text: "..." },
      { time: 148, text: "I'm learning to love things" },
      { time: 153, text: "That can survive being dropped" },
      { time: 158, text: "That get better with use" },
      { time: 163, text: "That aren't afraid of fingerprints" },
      { time: 170, text: "..." },
      { time: 177, text: "..." },
    ],
  },
  {
    id: 7,
    title: "Gravity Well",
    artist: "Orbital Mechanics",
    album: "Escape Velocity",
    duration: 246,
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
    color: "#1e1e5f",
    lyrics: [
      // Ambient intro (space sounds)
      { time: 0, text: "..." },
      { time: 6, text: "..." },
      { time: 12, text: "..." },
      // Verse 1
      { time: 18, text: "我们之间的距离" },
      { time: 22, text: "刚好是一个拥抱的长度" },
      { time: 27, text: "可谁都不肯先伸手" },
      { time: 32, text: "怕暴露自己有多需要对方" },
      { time: 38, text: "你绕着我转 我绕着你转" },
      { time: 43, text: "两颗星球假装各有轨道" },
      { time: 48, text: "但引力骗不了人" },
      { time: 53, text: "脚步总是往你的方向偏" },
      // Chorus
      { time: 60, text: "引力阱" },
      { time: 63, text: "我掉进去了 还假装在路过" },
      { time: 68, text: "引力阱" },
      { time: 71, text: "越想逃离 轨道越小" },
      { time: 76, text: "如果坠落是唯一的结局" },
      { time: 81, text: "那就让我" },
      { time: 84, text: "以最美的角度" },
      { time: 87, text: "落向你" },
      // Verse 2
      { time: 96, text: "你发的每条朋友圈" },
      { time: 100, text: "我都秒赞 然后假装误触" },
      { time: 105, text: "你在群里@所有人" },
      { time: 109, text: "我只看到你在叫我" },
      { time: 114, text: "多可笑 成年人的暗恋" },
      { time: 119, text: "像做贼一样 把喜欢藏在" },
      { time: 124, text: "正常社交的外壳里" },
      { time: 129, text: "小心翼翼 生怕被看穿" },
      // Chorus
      { time: 136, text: "引力阱" },
      { time: 139, text: "我掉进去了 还假装无所谓" },
      { time: 144, text: "引力阱" },
      { time: 147, text: "你知道的吧 你一定知道" },
      { time: 152, text: "可你也不说" },
      { time: 156, text: "是在等我" },
      { time: 159, text: "还是在给我 留退路" },
      // Bridge (zero gravity)
      { time: 168, text: "..." },
      { time: 174, text: "天体物理说" },
      { time: 178, text: "质量相近的两颗星" },
      { time: 183, text: "不是谁绕着谁转" },
      { time: 188, text: "是一起绕着" },
      { time: 192, text: "两人之间的那个点" },
      { time: 197, text: "那个看不见的中心" },
      // Final chorus (resolved)
      { time: 206, text: "引力阱" },
      { time: 209, text: "好吧 我不逃了" },
      { time: 213, text: "引力阱" },
      { time: 216, text: "也许坠落就是另一种飞" },
      { time: 222, text: "发消息给你" },
      { time: 225, text: "'今晚有空吗'" },
      { time: 230, text: "三个字打了删 删了打" },
      { time: 235, text: "最后按了发送" },
      // Outro
      { time: 240, text: "..." },
    ],
  },
];

/** Get song for a given disc index (wraps around) */
export function getSong(discIndex: number): Song {
  return SONGS[discIndex % SONGS.length];
}
