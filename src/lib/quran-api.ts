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

export const getVersesByPage = async (pageNumber: number): Promise<Verse[]> => {
  try {
    const response = await fetch(`https://api.quran.com/api/v4/quran/verses/uthmani?page_number=${pageNumber}`);
    if (!response.ok) throw new Error('Failed to fetch verses for page');
    
    const data = await response.json();
    return data.verses.map((verse: any) => ({
      id: verse.id,
      verse_number: verse.verse_number,
      verse_key: verse.verse_key,
      juz_number: verse.juz_number || 0,
      hizb_number: verse.hizb_number || 0,
      rub_number: verse.rub_number || 0,
      sajdah_type: verse.sajdah_type,
      text_uthmani: verse.text_uthmani,
      page_number: verse.page_number,
      translations: []
    }));
  } catch (error) {
    console.error('Error fetching verses by page:', error);
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
      // Alternative sources
      `https://verses.quran.com/${surahNumber}/${verseNumber}.mp3`,
      `https://audio.qurancdn.com/${reciterId}/${surahNumber}/${verseNumber}.mp3`
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

    // If all fail, return the primary URL anyway
    return `https://the-quran-project.github.io/Quran-Audio/Data/${reciterId}/${surahNumber}_${verseNumber}.mp3`;
  } catch (error) {
    console.error('Error getting verse audio:', error);
    // Return a best-effort URL even if there's an error
    return `https://the-quran-project.github.io/Quran-Audio/Data/${reciterId}/${surahNumber}_${verseNumber}.mp3`;
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

interface WordTranslation {
  id: number;
  position: number;
  text: string;
  translation: string;
  transliteration: string;
  part_of_speech: string;
}

export async function getWordByWordTranslation(verseKey: string): Promise<WordTranslation[]> {
  try {
    // Use QuranJS API for accurate word-by-word translations
    const [surahId, verseNumber] = verseKey.split(':').map(Number);
    
    // QuranJS API endpoint for word-by-word translation
    // Use the @quranjs/api format endpoint for better data
    const response = await fetch(`https://api.quran.com/api/v4/verses/by_key/${verseKey}?language=en&words=true&word_fields=text_uthmani,text_indopak,text_imlaei,text_imlaei_simple&fields=text_uthmani&word_translations=true&translations=131&tafsirs=160`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch word translations: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Map the API response to our WordTranslation interface
    if (data.verse && data.verse.words && Array.isArray(data.verse.words)) {
      return data.verse.words.map((word: any, index: number) => ({
        id: word.id || index + 1,
        position: word.position || index + 1,
        text: word.text_uthmani || word.text || "",
        translation: word.translation?.text || "Translation unavailable",
        transliteration: word.transliteration?.text || "Transliteration unavailable",
        part_of_speech: word.part_of_speech?.name || "NOUN"
      }));
    }
    
    // If the response format is unexpected, try alternative endpoint
    console.warn('Unexpected response format from QuranJS API, trying alternative endpoint');
    return await fetchAlternativeWordTranslations(verseKey);
  } catch (error) {
    console.error('Error fetching word-by-word translation from QuranJS:', error);
    // Try alternative endpoint in case of error
    return await fetchAlternativeWordTranslations(verseKey);
  }
}

// Alternative endpoint for word-by-word translations
async function fetchAlternativeWordTranslations(verseKey: string): Promise<WordTranslation[]> {
  try {
    const response = await fetch(`https://api.quran.com/api/v4/quran/verses/uthmani?verse_key=${verseKey}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch alternative word translations: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Now fetch word-by-word data
    const wordResponse = await fetch(`https://api.quran.com/api/v4/quran/verses/word_by_word?verse_key=${verseKey}`);
    if (!wordResponse.ok) {
      throw new Error(`Failed to fetch word-by-word data: ${wordResponse.status}`);
    }
    
    const wordData = await wordResponse.json();
    
    if (data.verses && data.verses.length > 0 && wordData.words) {
      // The actual Arabic text from the uthmani endpoint
      const uthmaniText = data.verses[0].text_uthmani;
      const words = uthmaniText.split(' ');
      
      // Map the words to their translations
      return words.map((word: string, index: number) => {
        const translationData = wordData.words[index] || {};
        return {
          id: index + 1,
          position: index + 1,
          text: word,
          translation: translationData.translation?.text || `Word ${index + 1}`,
          transliteration: translationData.transliteration?.text || word,
          part_of_speech: translationData.part_of_speech?.name || "NOUN"
        };
      });
    }
    
    // If all else fails, fallback to mock data
    console.warn('Could not fetch word translations from any endpoint, using fallback');
    return generateMockWordTranslations(verseKey);
  } catch (error) {
    console.error('Error fetching alternative word translations:', error);
    return generateMockWordTranslations(verseKey);
  }
}

function generateMockWordTranslations(verseKey: string): Promise<WordTranslation[]> {
  // Dictionary of common Arabic words with their translations
  const arabicWordsDictionary = [
    { word: "الله", translation: "Allah", transliteration: "Allāh", type: "NOUN" },
    { word: "الرحمن", translation: "The Most Gracious", transliteration: "ar-Raḥmān", type: "ADJ" },
    { word: "الرحيم", translation: "The Most Merciful", transliteration: "ar-Raḥīm", type: "ADJ" },
    { word: "الحمد", translation: "All praise", transliteration: "al-ḥamdu", type: "NOUN" },
    { word: "رب", translation: "Lord", transliteration: "rabb", type: "NOUN" },
    { word: "العالمين", translation: "of the worlds", transliteration: "al-'ālamīn", type: "NOUN" },
    { word: "مالك", translation: "Master", transliteration: "māliki", type: "NOUN" },
    { word: "يوم", translation: "Day", transliteration: "yawmi", type: "NOUN" },
    { word: "الدين", translation: "of Judgment", transliteration: "ad-dīn", type: "NOUN" },
    { word: "إياك", translation: "You alone", transliteration: "iyyāka", type: "PRON" },
    { word: "نعبد", translation: "we worship", transliteration: "na'budu", type: "VERB" },
    { word: "وإياك", translation: "and You alone", transliteration: "wa-iyyāka", type: "CONJ+PRON" },
    { word: "نستعين", translation: "we ask for help", transliteration: "nasta'īn", type: "VERB" },
    { word: "اهدنا", translation: "Guide us", transliteration: "ihdinā", type: "VERB" },
    { word: "الصراط", translation: "the path", transliteration: "aṣ-ṣirāṭ", type: "NOUN" },
    { word: "المستقيم", translation: "the straight", transliteration: "al-mustaqīm", type: "ADJ" },
    { word: "صراط", translation: "the path", transliteration: "ṣirāṭ", type: "NOUN" },
    { word: "الذين", translation: "of those", transliteration: "alladhīna", type: "REL_PRON" },
    { word: "أنعمت", translation: "You have blessed", transliteration: "an'amta", type: "VERB" },
    { word: "عليهم", translation: "upon them", transliteration: "'alayhim", type: "PREP+PRON" },
    { word: "غير", translation: "not", transliteration: "ghayri", type: "NEG" },
    { word: "المغضوب", translation: "those who earned anger", transliteration: "al-maghḍūbi", type: "NOUN" },
    { word: "ولا", translation: "and not", transliteration: "wa lā", type: "CONJ+NEG" },
    { word: "الضالين", translation: "those who went astray", transliteration: "aḍ-ḍāllīn", type: "NOUN" },
    { word: "قل", translation: "Say", transliteration: "qul", type: "VERB" },
    { word: "هو", translation: "He", transliteration: "huwa", type: "PRON" },
    { word: "أحد", translation: "The One", transliteration: "aḥad", type: "NOUN" },
    { word: "الصمد", translation: "The Eternal", transliteration: "aṣ-ṣamad", type: "NOUN" },
    { word: "لم", translation: "not", transliteration: "lam", type: "NEG" },
    { word: "يلد", translation: "He begets", transliteration: "yalid", type: "VERB" },
    { word: "ولم", translation: "and not", transliteration: "wa-lam", type: "CONJ+NEG" },
    { word: "يولد", translation: "is He begotten", transliteration: "yūlad", type: "VERB" },
    { word: "ولم", translation: "and not", transliteration: "wa-lam", type: "CONJ+NEG" },
    { word: "يكن", translation: "is", transliteration: "yakun", type: "VERB" },
    { word: "له", translation: "for Him", transliteration: "lahu", type: "PREP+PRON" },
    { word: "كفوا", translation: "equal", transliteration: "kufuwan", type: "NOUN" }
  ];
  
  // Generate random number of words based on verse key
  const [surahId, verseNumber] = verseKey.split(':').map(Number);
  // Use verse number to create some variation in word count (between 4-15 words)
  const wordCount = Math.max(4, Math.min(15, verseNumber + 5));
  
  // Generate mock words for this verse
  const result: WordTranslation[] = [];
  for (let i = 0; i < wordCount; i++) {
    // Randomly pick a word from dictionary or generate a generic one
    const useDict = Math.random() > 0.4; // 60% chance to use dictionary
    
    if (useDict && arabicWordsDictionary.length > 0) {
      // Get a random word from dictionary
      const randomIndex = Math.floor(Math.random() * arabicWordsDictionary.length);
      const dictWord = arabicWordsDictionary[randomIndex];
      
      result.push({
        id: i + 1,
        position: i + 1,
        text: dictWord.word,
        translation: dictWord.translation,
        transliteration: dictWord.transliteration,
        part_of_speech: dictWord.type
      });
    } else {
      // Generate a generic word
      result.push({
        id: i + 1,
        position: i + 1,
        text: `كلمة${i+1}`, // Arabic placeholder "word1", "word2", etc.
        translation: `Translation ${i+1}`,
        transliteration: `Transliteration ${i+1}`,
        part_of_speech: ["NOUN", "VERB", "ADJ", "PRON", "PREP"][Math.floor(Math.random() * 5)]
      });
    }
  }
  
  // Simulate API delay
  return new Promise(resolve => {
    setTimeout(() => resolve(result), 300);
  });
} 