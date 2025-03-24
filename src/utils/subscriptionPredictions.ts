import { subscriptionPredictions } from './subscriptionData';

export function predictSubscription(name: string): {
  url: string;
  monthlyCost: number;
  icon: string;
} | null {
  const searchTerm = name.toLowerCase().trim();
  
  if (searchTerm.length < 2) return null;
  
  if (subscriptionPredictions[searchTerm]) {
    return subscriptionPredictions[searchTerm];
  }
  
  for (const [key, prediction] of Object.entries(subscriptionPredictions)) {
    if (key.includes(searchTerm) || searchTerm.includes(key)) {
      return prediction;
    }
  }
  
  return null;
}

export function getSubscriptionCategory(name: string): string {
  const lowerName = name.toLowerCase();
  
  // AI and Productivity Tools
  if (lowerName.includes('chatgpt') || lowerName.includes('claude') || 
      lowerName.includes('gemini') || lowerName.includes('perplexity') ||
      lowerName.includes('anthropic') || lowerName.includes('bard')) {
    return 'AI Chat';
  }
  
  if (lowerName.includes('bolt.new') || lowerName.includes('cursor') || 
      lowerName.includes('v0') || lowerName.includes('copilot') || 
      lowerName.includes('codeium') || lowerName.includes('replit') ||
      lowerName.includes('github') || lowerName.includes('gitlab')) {
    return 'Coding';
  }
  
  if (lowerName.includes('midjourney') || lowerName.includes('runway') || 
      lowerName.includes('magnific') || lowerName.includes('photoai') || 
      lowerName.includes('krea') || lowerName.includes('stable diffusion') ||
      lowerName.includes('leonardo') || lowerName.includes('dall-e')) {
    return 'Diffusion';
  }

  // Productivity and Note-taking
  if (lowerName.includes('notion') || lowerName.includes('obsidian') ||
      lowerName.includes('linear') || lowerName.includes('asana') ||
      lowerName.includes('trello') || lowerName.includes('clickup')) {
    return 'Productivity';
  }

  // Creative Tools
  if (lowerName.includes('adobe') || lowerName.includes('creative cloud') ||
      lowerName.includes('figma') || lowerName.includes('sketch') ||
      lowerName.includes('affinity') || lowerName.includes('procreate')) {
    return 'Creative';
  }

  // Social and Communication
  if (lowerName.includes('primal') || lowerName.includes('discord') ||
      lowerName.includes('slack') || lowerName.includes('telegram') ||
      lowerName.includes('twitter') || lowerName.includes('mastodon')) {
    return 'Social';
  }

  // Streaming Services
  if (lowerName.includes('netflix') || lowerName.includes('disney') ||
      lowerName.includes('hbo') || lowerName.includes('prime video') ||
      lowerName.includes('apple tv') || lowerName.includes('hulu')) {
    return 'Streaming';
  }

  // Music Services
  if (lowerName.includes('spotify') || lowerName.includes('apple music') ||
      lowerName.includes('tidal') || lowerName.includes('deezer') ||
      lowerName.includes('youtube music')) {
    return 'Music';
  }

  // Gaming
  if (lowerName.includes('xbox') || lowerName.includes('playstation') ||
      lowerName.includes('nintendo') || lowerName.includes('steam') ||
      lowerName.includes('ea play') || lowerName.includes('game pass')) {
    return 'Gaming';
  }

  // Audio/Video Generation
  if (lowerName.includes('elevenlabs') || lowerName.includes('suno') ||
      lowerName.includes('udio') || lowerName.includes('mubert')) {
    return 'Audio Generation';
  }

  if (lowerName.includes('opus') || lowerName.includes('heygen') ||
      lowerName.includes('synthesia') || lowerName.includes('descript')) {
    return 'Video Generation';
  }

  // Cloud Services
  if (lowerName.includes('aws') || lowerName.includes('azure') ||
      lowerName.includes('gcp') || lowerName.includes('digitalocean') ||
      lowerName.includes('vercel') || lowerName.includes('netlify')) {
    return 'Cloud Services';
  }

  // Fitness and Health
  if (lowerName.includes('fitbit') || lowerName.includes('strava') ||
      lowerName.includes('peloton') || lowerName.includes('zwift') ||
      lowerName.includes('gympass') || lowerName.includes('classpass')) {
    return 'Fitness';
  }

  if (lowerName.includes('calm') || lowerName.includes('headspace') ||
      lowerName.includes('noom') || lowerName.includes('myfitnesspal') ||
      lowerName.includes('nike') || lowerName.includes('withings')) {
    return 'Health';
  }

  // Food and Transport
  if (lowerName.includes('hellofresh') || lowerName.includes('bluechef') ||
      lowerName.includes('doordash') || lowerName.includes('ubereats') ||
      lowerName.includes('grubhub') || lowerName.includes('instacart')) {
    return 'Food';
  }

  if (lowerName.includes('uber') || lowerName.includes('lyft') ||
      lowerName.includes('bird') || lowerName.includes('lime') ||
      lowerName.includes('citibike') || lowerName.includes('trainline')) {
    return 'Transport';
  }

  // Financial Services
  if (lowerName.includes('robinhood') || lowerName.includes('coinbase') ||
      lowerName.includes('binance') || lowerName.includes('etoro') ||
      lowerName.includes('fidelity') || lowerName.includes('schwab')) {
    return 'Financial';
  }

  return 'Other';
}