interface PredictedSubscription {
  url: string;
  monthlyCost: number;
  icon: string;
}

export const subscriptionPredictions: Record<string, PredictedSubscription> = {
  // AI Chat Tools
  'anthropic': { url: 'claude.com', monthlyCost: 20, icon: 'Bot' },
  'claude': { url: 'claude.com', monthlyCost: 20, icon: 'Bot' },
  'chatgpt': { url: 'chat.openai.com', monthlyCost: 20, icon: 'MessageSquare' },
  'openai': { url: 'openai.com', monthlyCost: 20, icon: 'MessageSquare' },
  'gpt': { url: 'chat.openai.com', monthlyCost: 20, icon: 'MessageSquare' },
  'gemini': { url: 'gemini.google.com', monthlyCost: 20, icon: 'Bot' },
  'google ai': { url: 'gemini.google.com', monthlyCost: 20, icon: 'Bot' },
  'perplexity': { url: 'perplexity.ai', monthlyCost: 20, icon: 'Search' },

  // Coding Tools
  'cursor': { url: 'cursor.sh', monthlyCost: 20, icon: 'Code' },
  'codeium': { url: 'codeium.com', monthlyCost: 15, icon: 'Code' },
  'copilot': { url: 'github.com/features/copilot', monthlyCost: 10, icon: 'Code' },
  'replit': { url: 'replit.com', monthlyCost: 10, icon: 'Code' },
  'vercel': { url: 'vercel.com', monthlyCost: 20, icon: 'Code' },
  'railway': { url: 'railway.app', monthlyCost: 10, icon: 'Code' },
  'bolt.new': { url: 'bolt.new', monthlyCost: 15, icon: 'Zap' },
  'v0': { url: 'v0.dev', monthlyCost: 20, icon: 'Code' },
  'v0.dev': { url: 'v0.dev', monthlyCost: 20, icon: 'Code' },
  'github': { url: 'github.com', monthlyCost: 10, icon: 'Code' },

  // AI Generation Tools
  'suno': { url: 'suno.ai', monthlyCost: 20, icon: 'Music' },
  'udio': { url: 'udio.com', monthlyCost: 15, icon: 'Music' },
  'elevenlabs': { url: 'elevenlabs.io', monthlyCost: 22, icon: 'Mic' },
  'opus': { url: 'opus.pro', monthlyCost: 29, icon: 'Video' },
  'heygen': { url: 'heygen.com', monthlyCost: 25, icon: 'Video' },
  'runway': { url: 'runway.ml', monthlyCost: 15, icon: 'Video' },
  'runwayml': { url: 'runway.ml', monthlyCost: 15, icon: 'Video' },
  'mj': { url: 'midjourney.com', monthlyCost: 10, icon: 'Image' },
  'midjourney': { url: 'midjourney.com', monthlyCost: 10, icon: 'Image' },
  'magnific': { url: 'magnific.ai', monthlyCost: 39, icon: 'Image' },

  // Productivity Tools
  'figma': { url: 'figma.com', monthlyCost: 15, icon: 'Palette' },
  'notion': { url: 'notion.so', monthlyCost: 8, icon: 'MessageSquare' },
  'linear': { url: 'linear.app', monthlyCost: 8, icon: 'MessageSquare' },
  'obsidian': { url: 'obsidian.md', monthlyCost: 50, icon: 'FileText' },
  'adobe': { url: 'adobe.com/de/creativecloud', monthlyCost: 33.21, icon: 'Palette' },
  'adobe creative suite': { url: 'adobe.com/de/creativecloud', monthlyCost: 33.21, icon: 'Palette' },
  'creative cloud': { url: 'adobe.com/de/creativecloud', monthlyCost: 33.21, icon: 'Palette' },
  'primal': { url: 'primal.net/home', monthlyCost: 7, icon: 'MessageSquare' },

  // Streaming Services
  'netflix': { url: 'netflix.com', monthlyCost: 15, icon: 'Tv' },
  'disney+': { url: 'disneyplus.com', monthlyCost: 8, icon: 'Tv' },
  'apple tv+': { url: 'tv.apple.com', monthlyCost: 7, icon: 'Tv' },
  'apple tv': { url: 'tv.apple.com', monthlyCost: 7, icon: 'Tv' },
  'amazon prime': { url: 'amazon.com', monthlyCost: 15, icon: 'ShoppingBag' },
  'prime video': { url: 'primevideo.com', monthlyCost: 9, icon: 'Video' },
  'youtube': { url: 'youtube.com', monthlyCost: 12, icon: 'Video' },
  'youtube premium': { url: 'youtube.com/premium', monthlyCost: 12, icon: 'Video' },
  'hulu': { url: 'hulu.com', monthlyCost: 8, icon: 'Tv' },
  'paramount+': { url: 'paramountplus.com', monthlyCost: 10, icon: 'Tv' },
  'hbo max': { url: 'max.com', monthlyCost: 16, icon: 'Tv' },
  'max': { url: 'max.com', monthlyCost: 16, icon: 'Tv' },
  'peacock': { url: 'peacocktv.com', monthlyCost: 6, icon: 'Tv' },
  'crunchyroll': { url: 'crunchyroll.com', monthlyCost: 8, icon: 'Tv' },

  // Music Services
  'spotify': { url: 'spotify.com', monthlyCost: 10, icon: 'Music' },
  'apple music': { url: 'music.apple.com', monthlyCost: 11, icon: 'Music' },
  'tidal': { url: 'tidal.com', monthlyCost: 10, icon: 'Music' },
  'deezer': { url: 'deezer.com', monthlyCost: 11, icon: 'Music' },
  'amazon music': { url: 'music.amazon.com', monthlyCost: 9, icon: 'Music' },
  'soundcloud': { url: 'soundcloud.com', monthlyCost: 10, icon: 'Music' },
  'youtube music': { url: 'music.youtube.com', monthlyCost: 10, icon: 'Music' },

  // Gaming
  'xbox game pass': { url: 'xbox.com/game-pass', monthlyCost: 15, icon: 'Gamepad' },
  'playstation plus': { url: 'playstation.com/plus', monthlyCost: 15, icon: 'Gamepad' },
  'nintendo switch online': { url: 'nintendo.com/switch/online', monthlyCost: 4, icon: 'Gamepad' },
  'ea play': { url: 'ea.com/ea-play', monthlyCost: 5, icon: 'Gamepad' },
  'ubisoft+': { url: 'ubisoft.com/plus', monthlyCost: 15, icon: 'Gamepad' },
  'discord nitro': { url: 'discord.com/nitro', monthlyCost: 10, icon: 'MessageSquare' },
  'steam': { url: 'store.steampowered.com', monthlyCost: 0, icon: 'Gamepad' }
};