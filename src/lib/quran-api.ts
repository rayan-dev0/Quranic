const API_BASE_URL = 'https://api.alquran.cloud/v1';

export interface Surah {
  id: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
}

export interface Verse {
  id: number;
  verse_number: number;
  verse_key: string;
  juz_number: number;
  hizb_number: number;
  rub_number: number;
  sajdah_type: null | string;
  text_uthmani: string;
  page_number: number;
  translations: Array<{
    id: number;
    language_name: string;
    text: string;
  }>;
}

export interface Chapter {
  id: number;
  revelation_place: string;
  revelation_order: number;
  bismillah_pre: boolean;
  name_simple: string;
  name_complex: string;
  name_arabic: string;
  verses_count: number;
  pages: number[];
  translated_name: {
    language_name: string;
    name: string;
  };
}

export interface Juz {
  id: number;
  juz_number: number;
  verse_mapping: Record<string, string>;
  first_verse_id: number;
  last_verse_id: number;
  verses_count: number;
}

export interface AudioRecitation {
  id: number;
  audio_url: string;
  segments: number[][]
  duration: number;
  format: string;
  verse_key: string;
}

export interface RecitationResponse {
  audio_files: AudioRecitation[];
}

export interface Reciter {
  id: string;
  name: string;
}

export const RECITERS: Reciter[] = [
  { id: '1', name: 'Mishary Rashid Al-Afasy' },
  { id: '2', name: 'Abu Bakr Al-Shatri' },
  { id: '3', name: 'Nasser Al-Qatami' },
  { id: '4', name: 'Yasser Al-Dosari' }
];

const DEFAULT_RECITER = RECITERS[0].id;

// Cache for audio elements to prevent reloading
const audioCache = new Map<string, HTMLAudioElement>();

// Add translation source mapping at the top of the file
export const TRANSLATION_SOURCES: Record<string, number> = {
  en: 131, // Saheeh International
  ar: 161, // Arabic Tafsir
  ur: 158, // Urdu Translation
  fr: 136, // French Translation
  id: 128, // Indonesian Translation
  tr: 135, // Turkish Translation
};

export const cleanupAudioCache = (keepLatest: number) => {
  const keys = Array.from(audioCache.keys());
  if (keys.length > keepLatest) {
    keys.slice(0, keys.length - keepLatest).forEach(key => {
      const audio = audioCache.get(key);
      if (audio) {
        audio.src = '';
        audio.load();
        audioCache.delete(key);
      }
    });
  }
};

export const getCachedAudio = (verseKey: string, reciterId: string) => {
  return audioCache.get(`${verseKey}-${reciterId}`);
};

export const getSurah = async (surahNumber: number): Promise<Chapter> => {
  try {
    const response = await fetch(`${API_BASE_URL}/surah/${surahNumber}`);
    if (!response.ok) throw new Error('Failed to fetch surah');
    const data = await response.json();
    
    // Map the API response to our Chapter interface
    return {
      id: data.data.number,
      revelation_place: data.data.revelationType,
      revelation_order: data.data.number,
      bismillah_pre: data.data.number !== 1 && data.data.number !== 9, // Bismillah is present for all surahs except At-Tawbah (9) and Al-Fatiha has it as first verse
      name_simple: data.data.englishName,
      name_complex: data.data.englishNameTranslation,
      name_arabic: data.data.name,
      verses_count: data.data.numberOfAyahs,
      pages: [data.data.page], // Single page number from API
      translated_name: {
        language_name: 'english',
        name: data.data.englishNameTranslation
      }
    };
  } catch (error) {
    console.error('Error fetching surah:', error);
    throw error;
  }
};

export const getVerses = async (surahNumber: number, language: string = 'en'): Promise<Verse[]> => {
  try {
    // Get both Arabic text and translation
    const response = await fetch(`${API_BASE_URL}/surah/${surahNumber}/editions/quran-uthmani,${language}.sahih`);
    if (!response.ok) throw new Error('Failed to fetch verses');
    
    const data = await response.json();
    const arabicVerses = data.data[0].ayahs;
    const translationVerses = data.data[1].ayahs;

    // Combine Arabic and translation
    return arabicVerses.map((verse: any, index: number) => ({
      id: verse.number,
      verse_number: verse.numberInSurah,
      verse_key: `${surahNumber}:${verse.numberInSurah}`,
      juz_number: verse.juz,
      hizb_number: verse.hizbQuarter,
      rub_number: 0,
      sajdah_type: null,
      text_uthmani: verse.text,
      page_number: verse.page,
      translations: [{
        id: 1,
        language_name: language,
        text: translationVerses[index].text
      }]
    }));
  } catch (error) {
    console.error('Error fetching verses:', error);
    throw error;
  }
};

export const getCurrentJuz = async (surahNumber: number, verseNumber: number): Promise<number> => {
  try {
    const response = await fetch(`${API_BASE_URL}/ayah/${surahNumber}:${verseNumber}`);
    if (!response.ok) throw new Error('Failed to fetch juz');
    const data = await response.json();
    return data.data.juz;
  } catch (error) {
    console.error('Error fetching current juz:', error);
    throw error;
  }
};

export const getJuzData = async (juzNumber: number): Promise<Juz> => {
  try {
    const response = await fetch(`${API_BASE_URL}/juz/${juzNumber}/quran-uthmani`);
    if (!response.ok) throw new Error('Failed to fetch juz data');
    const data = await response.json();
    
    // Transform the response to match our Juz interface
    const firstVerse = data.data.ayahs[0];
    const lastVerse = data.data.ayahs[data.data.ayahs.length - 1];
    
    return {
      id: juzNumber,
      juz_number: juzNumber,
      verse_mapping: {
        [firstVerse.surah.number]: `${firstVerse.numberInSurah}-${lastVerse.numberInSurah}`
      },
      first_verse_id: firstVerse.number,
      last_verse_id: lastVerse.number,
      verses_count: data.data.ayahs.length
    };
  } catch (error) {
    console.error('Error fetching juz data:', error);
    throw error;
  }
};

export const getVerseAudio = async (verseKey: string, reciterId: string = DEFAULT_RECITER): Promise<string> => {
  const [surahNumber, verseNumber] = verseKey.split(':').map(Number);
  const cacheKey = `${verseKey}-${reciterId}`;
  
  // Check cache first
  if (audioCache.has(cacheKey)) {
    const audio = audioCache.get(cacheKey);
    if (audio) {
      return audio.src;
    }
  }

  try {
    // Try multiple audio sources in order of preference
    const audioUrls = [
      // Primary source - GitHub hosted
      `https://the-quran-project.github.io/Quran-Audio/Data/${reciterId}/${surahNumber}_${verseNumber}.mp3`,
      // Fallback source - CloudFlare Pages (for first 3 reciters)
      reciterId <= '3' ? `https://quranaudio.pages.dev/${reciterId}/${surahNumber}_${verseNumber}.mp3` : null,
      // Original mp3quran.net URLs based on reciter
      reciterId === '1' ? `https://server8.mp3quran.net/afs/${surahNumber.toString().padStart(3, '0')}.mp3` :
      reciterId === '2' ? `https://server11.mp3quran.net/shatri/${surahNumber.toString().padStart(3, '0')}.mp3` :
      reciterId === '3' ? `https://server6.mp3quran.net/qtm/${surahNumber.toString().padStart(3, '0')}.mp3` :
      `https://server11.mp3quran.net/yasser/${surahNumber.toString().padStart(3, '0')}.mp3`
    ].filter(Boolean) as string[];

    // Try each URL until one works
    for (const url of audioUrls) {
      try {
        const response = await fetch(url, { method: 'HEAD' });
        if (response.ok) {
          return url;
        }
      } catch (error) {
        console.warn(`Failed to access audio URL ${url}:`, error);
        continue;
      }
    }

    throw new Error('No available audio source found');
  } catch (error) {
    console.error('Error getting verse audio:', error);
    throw error;
  }
};

export const preloadVerseAudio = async (verseKey: string, reciterId: string = DEFAULT_RECITER): Promise<void> => {
  const cacheKey = `${verseKey}-${reciterId}`;
  
  // Don't preload if already cached
  if (audioCache.has(cacheKey)) {
    return;
  }

  try {
    const audioUrl = await getVerseAudio(verseKey, reciterId);
    const audio = new Audio();
    
    // Create a promise that resolves when the audio is loaded
    const loadPromise = new Promise<void>((resolve, reject) => {
      const loadHandler = () => {
        audio.removeEventListener('loadeddata', loadHandler);
        audio.removeEventListener('error', errorHandler);
        resolve();
      };
      const errorHandler = (error: Event) => {
        audio.removeEventListener('loadeddata', loadHandler);
        audio.removeEventListener('error', errorHandler);
        reject(error);
      };
      audio.addEventListener('loadeddata', loadHandler, { once: true });
      audio.addEventListener('error', errorHandler, { once: true });
    });

    // Start loading the audio
    audio.src = audioUrl;
    audio.preload = 'auto';
    audio.crossOrigin = 'anonymous';
    
    // Wait for the audio to load and cache it
    await loadPromise;
    audioCache.set(cacheKey, audio);
  } catch (error) {
    console.error('Error preloading verse audio:', error);
    // Remove from cache if preload failed
    audioCache.delete(cacheKey);
  }
};

export async function getSurahs(): Promise<Chapter[]> {
  const response = await fetch('https://api.quran.com/api/v4/chapters?language=en');
  const data = await response.json();
  return data.chapters;
}

export async function getAudioUrl(chapterId: number, verseNumber: number): Promise<string> {
  const response = await fetch(
    `${API_BASE_URL}/recitations/1/by_ayah/${chapterId}:${verseNumber}`
  );
  const data = await response.json();
  return data.audio_files[0]?.url || '';
}

export async function searchVerses(query: string, page: number = 1): Promise<any> {
  const response = await fetch(
    `${API_BASE_URL}/search?q=${encodeURIComponent(query)}&size=10&page=${page}&language=en`
  );
  const data = await response.json();
  return data;
}

export async function getJuzList(): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/juzs`);
  const data = await response.json();
  return data.juzs;
}

export async function getJuzVerses(juzNumber: number, page: number = 1): Promise<any> {
  const response = await fetch(
    `${API_BASE_URL}/verses/by_juz/${juzNumber}?language=en&words=true&page=${page}&per_page=10&translations=131`
  );
  const data = await response.json();
  return data;
}

export const getChapterAudio = async (chapterId: number): Promise<{ [key: string]: { reciter: string; url: string; originalUrl: string } }> => {
  try {
    const response = await fetch(`https://quranapi.pages.dev/api/audio/${chapterId}.json`);
    if (!response.ok) {
      throw new Error(`Failed to fetch chapter audio: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching chapter audio:', error);
    throw error;
  }
}; 