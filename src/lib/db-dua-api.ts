// Remove Node.js modules that can't be used in client-side code
// import fs from 'fs';
// import path from 'path';

export interface Dua {
  id: string;
  title: string;
  arabic: string;
  transliteration: string;
  translation: string;
  reference: string;
  category: string;
  benefits?: string;
  tags: string[];
  favorite?: boolean;
}

export interface Zikr {
  id: string;
  arabic: string;
  description: string;
  reference: string;
  category: string;
  count: number;
  favorite?: boolean;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  count: number;
}

// Interfaces for the database structure
interface DbHadith {
  id: string;
  bookId: string;
  chapterId: string;
  idInBook: string;
  arabic: string;
  english: {
    text: string;
  };
}

interface DbChapter {
  id: string;
  english: string;
}

interface DbBook {
  metadata?: {
    english?: {
      title: string;
    };
  };
  chapters?: DbChapter[];
  hadiths?: DbHadith[];
}

// Cache for loaded data
let duasCache: Dua[] | null = null;
let azkarCache: Zikr[] | null = null;
let categoriesCache: Category[] | null = null;
let booksDataCache: Record<string, DbBook> = {};

// Helper function to fetch JSON data
async function fetchJsonFile(path: string): Promise<any> {
  try {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${path}:`, error);
    return null;
  }
}

// Function to determine if a hadith contains dua terms
function containsDuaTerms(text: string): boolean {
  const duaTerms = [
    // English terms
    'dua', 'supplication', 'prayer', 'invoke', 'invocation', 'ask Allah', 'implore',
    'beseech', 'entreaty', 'petition', 'plea', 'appeal', 'entreated', 'beseeched',
    'supplicate', 'supplicated', 'seeking refuge', 'seek refuge', 'protect', 'protection',
    'forgive', 'forgiveness', 'mercy', 'grant', 'bestow', 'bless', 'blessing',
    'pray', 'prayed', 'would say', 'used to say', 'taught', 'recite', 'seeking protection',
    // Arabic terms
    'دعاء', 'يدعو', 'اللهم', 'ادع', 'استغفر', 'استغفار', 'رب', 'اللَّهُمَّ',
    'أعوذ', 'أَعُوذُ', 'بسم', 'بِسْمِ', 'صلى', 'سبحان', 'الحمد', 'استعاذ',
    'يستعيذ', 'غفر', 'اغفر', 'ارحم', 'احفظ', 'انصر', 'اهد', 'بارك'
  ];
  
  const lowerText = text.toLowerCase();
  
  // Check for exact match first
  for (const term of duaTerms) {
    if (lowerText.includes(term.toLowerCase())) {
      return true;
    }
  }
  
  // Check for patterns that indicate duas
  const duaPatterns = [
    /O Allah/i, /Oh Allah/i, /My Lord/i,
    /Allahumma/i, /I seek refuge/i, /we seek refuge/i,
    /Allah's Messenger.*used to/i, /Prophet.*used to/i,
    /when.*would/i, /whenever.*would/i,
    /In the name of Allah/i,
    /taught.*(say|recite|dua|supplication)/i,
    /when entering/i, /when leaving/i, 
    /when waking/i, /before sleeping/i,
    /upon seeing/i, /after completing/i,
    /after (the|) prayer/i, /before (the|) prayer/i
  ];
  
  for (const pattern of duaPatterns) {
    if (pattern.test(lowerText)) {
      return true;
    }
  }
  
  return false;
}

// Function to determine if a hadith contains zikr terms
function containsZikrTerms(text: string): boolean {
  const zikrTerms = [
    // English terms
    'dhikr', 'zikr', 'remembrance', 'glorify', 'praise', 'tasbih', 'takbir',
    'glorification', 'exaltation', 'remembering', 'extol', 'magnify', 'exalt',
    'glory', 'glorified', 'praised', 'extolled', 'magnified', 'exalted',
    'celebrate', 'revere', 'venerate', 'honor', 'worship', 'holy', 'hallowed',
    'blessed', 'prayer', 'recitation', 'litany', 'formula', 'invocation',
    'glorifying', 'remembers', 'remember', 'extols', 'magnifies', 'exalts',
    'praises', 'exalteth', 'extolleth', 'magnifieth',
    
    // Arabic terms
    'ذكر', 'أذكار', 'تسبيح', 'تهليل', 'تكبير', 'تحميد', 'تمجيد',
    'سبحان', 'الحمد', 'لا إله', 'الله اكبر', 'استغفر',
    'سُبْحَانَ', 'الْحَمْدُ', 'لَا إِلَهَ', 'اللَّهُ أَكْبَرُ', 'أَسْتَغْفِرُ'
  ];
  
  // Common zikr phrases
  const zikrPhrases = [
    'subhan allah', 'alhamdulillah', 'allahu akbar', 'la ilaha',
    'glory be to allah', 'praise be to allah', 'allah is the greatest',
    'there is no god but allah', 'there is no deity except allah',
    'glory and praise', 'laa hawla', 'la hawla', 'bismillah',
    'bismillahir rahmanir rahim', 'subhanahu wa taala',
    'azza wa jall', 'jalla jalaluhu', 'wallahu alam'
  ];
  
  const lowerText = text.toLowerCase();
  
  // Check for terms
  for (const term of [...zikrTerms, ...zikrPhrases]) {
    if (lowerText.includes(term.toLowerCase())) {
      return true;
    }
  }
  
  // Check for patterns that indicate adhkar
  const zikrPatterns = [
    /glorify.*Allah/i, /praise.*Allah/i, /exalt.*Allah/i,
    /remember.*Allah/i, /remembrance.*Allah/i,
    /repeat.*times/i, /say.*times/i, /recite.*times/i,
    /morning.*evening/i, /after.*prayer/i,
    /repeated.*(morning|evening)/i, /said in the (morning|evening)/i,
    /whoever says/i, /whoever recites/i, /one who says/i,
    /virtues of/i, /excellence of/i, /reward for/i,
    /best words/i, /best of words/i, /beloved to Allah/i
  ];
  
  for (const pattern of zikrPatterns) {
    if (pattern.test(lowerText)) {
      return true;
    }
  }
  
  return false;
}

// Function to load book data from the database
async function loadBookData(bookId: string): Promise<DbBook | null> {
  // Check if data is already in cache
  if (booksDataCache[bookId]) {
    return booksDataCache[bookId];
  }
  
  // First try the 9 books
  try {
    const data = await fetchJsonFile(`/src/data/db/by_book/the_9_books/${bookId}.json`);
    if (data) {
      booksDataCache[bookId] = data;
      return data;
    }
  } catch (error) {
    console.log(`No data found in the_9_books for ${bookId}`);
  }
  
  // Then try other books
  try {
    const data = await fetchJsonFile(`/src/data/db/by_book/other_books/${bookId}.json`);
    if (data) {
      booksDataCache[bookId] = data;
      return data;
    }
  } catch (error) {
    console.log(`No data found in other_books for ${bookId}`);
  }
  
  // Finally try forties
  try {
    const data = await fetchJsonFile(`/src/data/db/by_book/forties/${bookId}.json`);
    if (data) {
      booksDataCache[bookId] = data;
      return data;
    }
  } catch (error) {
    console.log(`No data found in forties for ${bookId}`);
  }
  
  console.error(`No data found for book ${bookId}`);
  return null;
}

// Helper function to convert a database hadith to a Dua
function convertToDua(hadith: DbHadith, bookTitle: string, chapterTitle?: string): Dua {
  // Generate a unique ID for the dua
  const duaId = `dua-${hadith.bookId}-${hadith.idInBook}`;
  
  // Extract title from the text
  let title = hadith.english.text;
  if (title.length > 50) {
    title = title.substring(0, 47) + '...';
  }
  
  // Determine category from chapter or book title
  let category = chapterTitle || bookTitle || 'General';
  
  // Create tags based on content
  const tags: string[] = [];
  const text = hadith.english.text.toLowerCase();
  
  if (text.includes('morning')) tags.push('morning');
  if (text.includes('evening')) tags.push('evening');
  if (text.includes('prayer') || text.includes('salah')) tags.push('prayer');
  if (text.includes('protection')) tags.push('protection');
  if (text.includes('forgiveness')) tags.push('forgiveness');
  if (text.includes('illness') || text.includes('sick')) tags.push('healing');
  
  // Add book as a tag
  tags.push(bookTitle.toLowerCase().replace(/\s+/g, '-'));
  
  // Create reference with chapter when available
  let reference = `${bookTitle} ${hadith.idInBook}`;
  if (chapterTitle) {
    reference = `${bookTitle}, ${chapterTitle} (${hadith.idInBook})`;
  }
  
  // Check for benefits in the text
  let benefits = '';
  const benefitPatterns = [
    /whoever says this[^.]*will[^.]*/i,
    /the virtues? of[^.]*:/i,
    /the benefits? of[^.]*:/i,
    /this has the benefit of[^.]*/i
  ];
  
  for (const pattern of benefitPatterns) {
    const match = hadith.english.text.match(pattern);
    if (match) {
      benefits = match[0];
      break;
    }
  }
  
  return {
    id: duaId,
    title,
    arabic: hadith.arabic,
    transliteration: '', // We don't have transliteration in the database
    translation: hadith.english.text,
    reference,
    category,
    benefits,
    tags,
    favorite: false
  };
}

// Helper function to convert a database hadith to a Zikr
function convertToZikr(hadith: DbHadith, bookTitle: string, chapterTitle?: string): Zikr {
  // Generate a unique ID for the zikr
  const zikrId = `zikr-${hadith.bookId}-${hadith.idInBook}`;
  
  // Determine category from chapter or book title
  let category = chapterTitle || bookTitle || 'General Adhkar';
  
  // Try to extract count from text (e.g., "... repeat 3 times" or "... three times")
  const countMatch = hadith.english.text.match(/(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+times/i);
  let count = 1;
  
  if (countMatch) {
    const countText = countMatch[1].toLowerCase();
    const numberMap: Record<string, number> = {
      'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
      'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
    };
    
    count = numberMap[countText] || parseInt(countText) || 1;
  }
  
  // Create reference with chapter when available
  let reference = `${bookTitle} ${hadith.idInBook}`;
  if (chapterTitle) {
    reference = `${bookTitle}, ${chapterTitle} (${hadith.idInBook})`;
  }
  
  return {
    id: zikrId,
    arabic: hadith.arabic,
    description: hadith.english.text,
    reference,
    category,
    count,
    favorite: false
  };
}

// Primary API functions
export async function getDuas(language: string = 'en'): Promise<Dua[]> {
  console.log(`[DEBUG] getDuas called with language: ${language}`);
  
  if (duasCache) {
    console.log(`[DEBUG] Returning cached duas, length: ${duasCache.length}`);
    return duasCache;
  }
  
  try {
    // If static file doesn't work, try loading from DB
    const bookIds = [
      // The 9 main books
      'bukhari', 'muslim', 'abudawud', 'tirmidhi', 'nasai',
      'ibnmajah', 'malik', 'ahmed', 'darimi',
      // Forties collections
      'nawawi40', 'qudsi40', 'shahwaliullah40',
      // Other books
      'aladab_almufrad', 'bulugh_almaram', 'mishkat_almasabih',
      'riyad_assalihin', 'shamail_muhammadiyah'
    ];
    
    const duas: Dua[] = [];
    
    // Process each book
    for (const bookId of bookIds) {
      const book = await loadBookData(bookId);
      if (!book) {
        console.log(`[DEBUG] Could not load book: ${bookId}`);
        continue;
      }
      
      const bookTitle = book.metadata?.english?.title || bookId;
      console.log(`[DEBUG] Processing book: ${bookId} (${bookTitle}) with ${book.hadiths?.length || 0} hadiths`);
      
      const chapters = book.chapters || [];
      console.log(`[DEBUG] Book has ${chapters.length} chapters`);
      
      let bookDuaCount = 0;
      
      // Process each hadith
      for (const hadith of book.hadiths || []) {
        // Skip if arabic is empty
        if (!hadith.arabic) {
          continue;
        }
        
        // Check if it contains dua terms
        const hasDuaTerms = containsDuaTerms(hadith.english.text + ' ' + hadith.arabic);
        
        if (!hasDuaTerms) {
          continue;
        }
        
        // Find chapter title if available
        const chapter = chapters.find(c => c.id === hadith.chapterId);
        const chapterTitle = chapter?.english || '';
        
        // Convert to dua format
        const dua = convertToDua(hadith, bookTitle, chapterTitle);
        duas.push(dua);
        bookDuaCount++;
        
        // Debug log periodically (every 10 duas)
        if (bookDuaCount % 10 === 0) {
          console.log(`[DEBUG] Processed ${bookDuaCount} duas from ${bookTitle}, latest reference: ${dua.reference}`);
        }
      }
      
      console.log(`[DEBUG] Found ${bookDuaCount} duas in book ${bookId}`);
    }
    
    if (duas.length > 0) {
      console.log(`[DEBUG] Successfully loaded ${duas.length} duas from DB`);
      duasCache = duas;
      return duas;
    }
    
    console.warn('[WARN] No duas found in DB, using hardcoded fallback data');
    // Fallback data if all else fails
    const fallbackDuas: Dua[] = [
      {
        id: "dua-morning-1",
        title: "Morning supplication",
        arabic: "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لاَ إِلَـهَ إِلاَّ اللهُ وَحْدَهُ لاَ شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ",
        translation: "We have entered a new day and with it all the kingdom belongs to Allah. Praise be to Allah. None has the right to be worshipped but Allah alone, Who has no partner.",
        transliteration: "Asbahna wa asbahal-mulku lillah, walhamdu lillah, la ilaha illallahu wahdahu la shareeka lah, lahul-mulku wa lahul-hamd, wa huwa 'ala kulli shay'in qadeer.",
        reference: "Muslim 2723",
        category: "Morning Adhkar",
        tags: ["morning", "protection", "praise"],
        benefits: "Whoever says this in the morning will be protected throughout the day."
      },
      {
        id: "dua-evening-1",
        title: "Evening supplication",
        arabic: "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ للهِ، وَالْحَمْدُ للهِ، لَا إِلَهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ",
        translation: "We have entered a new evening and with it all the kingdom belongs to Allah. Praise be to Allah. None has the right to be worshipped but Allah alone, Who has no partner.",
        transliteration: "Amsayna wa amsal-mulku lillah, walhamdu lillah, la ilaha illallahu wahdahu la shareeka lah, lahul-mulku wa lahul-hamd, wa huwa 'ala kulli shay'in qadeer.",
        reference: "Muslim 2723",
        category: "Evening Adhkar",
        tags: ["evening", "protection", "praise"],
        benefits: "Whoever says this in the evening will be protected throughout the night."
      }
    ];
    
    duasCache = fallbackDuas;
    return fallbackDuas;
  } catch (error) {
    console.error('[ERROR] Error fetching duas:', error);
    // Return a minimal fallback when everything fails
    const absoluteFallback: Dua[] = [
      {
        id: "dua-fallback",
        title: "Fallback Dua",
        arabic: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ",
        translation: "Glory is to Allah and praise is to Him",
        transliteration: "Subhanallahi wa bihamdihi",
        reference: "Bukhari",
        category: "General",
        tags: ["general"],
        benefits: ""
      }
    ];
    duasCache = absoluteFallback;
    return absoluteFallback;
  }
}

export async function getAzkar(language: string = 'en'): Promise<Zikr[]> {
  console.log(`[DEBUG] getAzkar called with language: ${language}`);
  
  if (azkarCache) {
    console.log(`[DEBUG] Returning cached azkar, length: ${azkarCache.length}`);
    return azkarCache;
  }
  
  try {
    // If static file doesn't work, try loading from DB
    const bookIds = [
      // The 9 main books
      'bukhari', 'muslim', 'abudawud', 'tirmidhi', 'nasai',
      'ibnmajah', 'malik', 'ahmed', 'darimi',
      // Forties collections
      'nawawi40', 'qudsi40', 'shahwaliullah40',
      // Other books
      'aladab_almufrad', 'bulugh_almaram', 'mishkat_almasabih',
      'riyad_assalihin', 'shamail_muhammadiyah'
    ];
    
    const azkar: Zikr[] = [];
    
    // Process each book
    for (const bookId of bookIds) {
      const book = await loadBookData(bookId);
      if (!book) {
        console.log(`[DEBUG] Could not load book: ${bookId}`);
        continue;
      }
      
      const bookTitle = book.metadata?.english?.title || bookId;
      console.log(`[DEBUG] Processing book: ${bookId} (${bookTitle}) with ${book.hadiths?.length || 0} hadiths for azkar`);
      
      const chapters = book.chapters || [];
      console.log(`[DEBUG] Book has ${chapters.length} chapters for azkar processing`);
      
      let bookZikrCount = 0;
      
      // Process each hadith
      for (const hadith of book.hadiths || []) {
        // Skip if arabic is empty
        if (!hadith.arabic) {
          continue;
        }
        
        // Check if it contains zikr terms
        const hasZikrTerms = containsZikrTerms(hadith.english.text + ' ' + hadith.arabic);
        
        if (!hasZikrTerms) {
          continue;
        }
        
        // Find chapter title if available
        const chapter = chapters.find(c => c.id === hadith.chapterId);
        const chapterTitle = chapter?.english || '';
        
        // Convert to zikr format
        const zikr = convertToZikr(hadith, bookTitle, chapterTitle);
        azkar.push(zikr);
        bookZikrCount++;
        
        // Debug log periodically (every 10 azkar)
        if (bookZikrCount % 10 === 0) {
          console.log(`[DEBUG] Processed ${bookZikrCount} azkar from ${bookTitle}, latest reference: ${zikr.reference}`);
        }
      }
      
      console.log(`[DEBUG] Found ${bookZikrCount} azkar in book ${bookId}`);
    }
    
    if (azkar.length > 0) {
      console.log(`[DEBUG] Successfully loaded ${azkar.length} azkar from DB`);
      azkarCache = azkar;
      return azkar;
    }
    
    console.warn('[WARN] No azkar found in DB, using hardcoded fallback data');
    // Fallback data if all else fails
    const fallbackAzkar: Zikr[] = [
      {
        id: "zikr-morning-1",
        category: "Morning Adhkar",
        arabic: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ",
        description: "Glory is to Allah and praise is to Him. Repeat 100 times in the morning for tremendous rewards.",
        count: 100,
        reference: "Muslim 2692"
      },
      {
        id: "zikr-evening-1",
        category: "Evening Adhkar",
        arabic: "لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ",
        description: "None has the right to be worshipped but Allah alone, Who has no partner. His is the dominion and His is the praise and He is Able to do all things. Repeat 10 times in the evening.",
        count: 10,
        reference: "Bukhari 3293"
      }
    ];
    
    azkarCache = fallbackAzkar;
    return fallbackAzkar;
  } catch (error) {
    console.error('[ERROR] Error fetching azkar:', error);
    // Return a minimal fallback when everything fails
    const absoluteFallback: Zikr[] = [
      {
        id: "zikr-fallback",
        category: "General",
        arabic: "لا إله إلا الله",
        description: "There is no god but Allah",
        count: 3,
        reference: "General"
      }
    ];
    azkarCache = absoluteFallback;
    return absoluteFallback;
  }
}

export async function getCategories(type: 'duas' | 'azkar' = 'duas'): Promise<Category[]> {
  console.log(`[DEBUG] getCategories called for type: ${type}`);
  
  if (categoriesCache) {
    // Filter by type
    const filteredCategories = categoriesCache.filter(cat => 
      cat.id.startsWith(type === 'duas' ? 'dua-cat-' : 'zikr-cat-')
    );
    console.log(`[DEBUG] Returning ${filteredCategories.length} cached categories for ${type}`);
    console.log(`[DEBUG] Category IDs:`, filteredCategories.map(c => c.id));
    return filteredCategories;
  }
  
  try {
    console.log(`[DEBUG] Building categories from scratch for ${type}`);
    // Get all duas and azkar first
    const duas = await getDuas();
    const azkar = await getAzkar();
    
    console.log(`[DEBUG] Found ${duas.length} duas and ${azkar.length} azkar`);
    
    // Create category maps to count items in each category
    const duaCategories = new Map<string, number>();
    const zikrCategories = new Map<string, number>();
    
    // Process dua categories
    duas.forEach(dua => {
      const count = duaCategories.get(dua.category) || 0;
      duaCategories.set(dua.category, count + 1);
    });
    
    // Process zikr categories
    azkar.forEach(zikr => {
      const count = zikrCategories.get(zikr.category) || 0;
      zikrCategories.set(zikr.category, count + 1);
    });
    
    console.log(`[DEBUG] Extracted ${duaCategories.size} dua categories and ${zikrCategories.size} zikr categories`);
    console.log(`[DEBUG] Dua categories:`, Array.from(duaCategories.keys()));
    console.log(`[DEBUG] Zikr categories:`, Array.from(zikrCategories.keys()));
    
    // Convert to Category objects
    const categories: Category[] = [];
    
    // Add dua categories
    duaCategories.forEach((count, name) => {
      categories.push({
        id: `dua-cat-${name.toLowerCase().replace(/\s+/g, '-')}`,
        name,
        description: `Collection of ${count} duas related to ${name}`,
        count
      });
    });
    
    // Add zikr categories
    zikrCategories.forEach((count, name) => {
      categories.push({
        id: `zikr-cat-${name.toLowerCase().replace(/\s+/g, '-')}`,
        name,
        description: `Collection of ${count} adhkar related to ${name}`,
        count
      });
    });
    
    console.log(`[DEBUG] Generated ${categories.length} total categories (${duaCategories.size} dua, ${zikrCategories.size} zikr)`);
    console.log(`[DEBUG] Category IDs:`, categories.map(c => c.id));
    categoriesCache = categories;
    
    // Filter by type
    const filteredCategories = categories.filter(cat => 
      cat.id.startsWith(type === 'duas' ? 'dua-cat-' : 'zikr-cat-')
    );
    
    console.log(`[DEBUG] Returning ${filteredCategories.length} categories for ${type}`);
    console.log(`[DEBUG] Filtered Category IDs:`, filteredCategories.map(c => c.id));
    
    return filteredCategories;
  } catch (error) {
    console.error('[ERROR] Error generating categories:', error);
    // Return minimal fallback
    const fallback: Category[] = [];
    
    if (type === 'duas') {
      fallback.push({
        id: 'dua-cat-general',
        name: 'General',
        description: 'General duas',
        count: 1
      });
    } else {
      fallback.push({
        id: 'zikr-cat-general',
        name: 'General',
        description: 'General adhkar',
        count: 1
      });
    }
    
    return fallback;
  }
}

export function searchDuas(query: string, duas: Dua[]): Dua[] {
  const searchQuery = query.toLowerCase().trim();
  if (!searchQuery) return duas;
  
  return duas.filter(dua => {
    return (
      dua.title.toLowerCase().includes(searchQuery) ||
      dua.translation.toLowerCase().includes(searchQuery) ||
      dua.transliteration.toLowerCase().includes(searchQuery) ||
      dua.arabic.includes(searchQuery) ||
      dua.category.toLowerCase().includes(searchQuery) ||
      dua.tags.some(tag => tag.toLowerCase().includes(searchQuery))
    );
  });
}

export function searchAzkar(query: string, azkar: Zikr[]): Zikr[] {
  const searchQuery = query.toLowerCase().trim();
  if (!searchQuery) return azkar;
  
  return azkar.filter(zikr => {
    return (
      zikr.category.toLowerCase().includes(searchQuery) ||
      zikr.description.toLowerCase().includes(searchQuery) ||
      zikr.arabic.includes(searchQuery)
    );
  });
}

export function filterDuas(duas: Dua[], category?: string): Dua[] {
  if (!category) return duas;
  
  // Handle special case for category that comes from category ID
  if (category.startsWith('dua-cat-')) {
    const categoryName = category
      .replace('dua-cat-', '')
      .replace(/-/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    return duas.filter(dua => 
      dua.category.toLowerCase() === categoryName.toLowerCase()
    );
  }
  
  return duas.filter(dua => 
    dua.category.toLowerCase() === category.toLowerCase()
  );
}

export function filterAzkar(azkar: Zikr[], category?: string): Zikr[] {
  if (!category) return azkar;
  
  // Handle special case for category that comes from category ID
  if (category.startsWith('zikr-cat-')) {
    const categoryName = category
      .replace('zikr-cat-', '')
      .replace(/-/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    return azkar.filter(zikr => 
      zikr.category.toLowerCase() === categoryName.toLowerCase()
    );
  }
  
  return azkar.filter(zikr => 
    zikr.category.toLowerCase() === category.toLowerCase()
  );
}

export function toggleFavorite(id: string, type: 'duas' | 'azkar'): void {
  console.log(`[DEBUG] Toggling favorite for ${type} with id: ${id}`);
  
  if (type === 'duas' && duasCache) {
    const dua = duasCache.find(d => d.id === id);
    if (dua) {
      dua.favorite = !dua.favorite;
    }
  } else if (type === 'azkar' && azkarCache) {
    const zikr = azkarCache.find(z => z.id === id);
    if (zikr) {
      zikr.favorite = !zikr.favorite;
    }
  }
}

// Favorites functionality
const FAVORITES_KEY = 'dua_favorites';
const AZKAR_FAVORITES_KEY = 'azkar_favorites';

export function getFavoriteDuas(): string[] {
  try {
    if (typeof window === 'undefined') return [];
    const favorites = localStorage.getItem(FAVORITES_KEY);
    return favorites ? JSON.parse(favorites) : [];
  } catch {
    return [];
  }
}

export function getFavoriteAzkar(): string[] {
  try {
    if (typeof window === 'undefined') return [];
    const favorites = localStorage.getItem(AZKAR_FAVORITES_KEY);
    return favorites ? JSON.parse(favorites) : [];
  } catch {
    return [];
  }
}

export function toggleFavoriteDua(duaId: string): boolean {
  try {
    const favorites = getFavoriteDuas();
    const index = favorites.indexOf(duaId);
    
    if (index === -1) {
      favorites.push(duaId);
    } else {
      favorites.splice(index, 1);
    }
    
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    return index === -1; // Return true if dua was added to favorites
  } catch (error) {
    console.error('Error toggling favorite dua:', error);
    return false;
  }
}

export function toggleFavoriteZikr(zikrId: string): boolean {
  try {
    const favorites = getFavoriteAzkar();
    const index = favorites.indexOf(zikrId);
    
    if (index === -1) {
      favorites.push(zikrId);
    } else {
      favorites.splice(index, 1);
    }
    
    localStorage.setItem(AZKAR_FAVORITES_KEY, JSON.stringify(favorites));
    return index === -1; // Return true if zikr was added to favorites
  } catch (error) {
    console.error('Error toggling favorite zikr:', error);
    return false;
  }
}

export function isFavoriteDua(duaId: string): boolean {
  try {
    const favorites = getFavoriteDuas();
    return favorites.includes(duaId);
  } catch (error) {
    console.error('Error checking if dua is favorite:', error);
    return false;
  }
}

export function isFavoriteZikr(zikrId: string): boolean {
  try {
    const favorites = getFavoriteAzkar();
    return favorites.includes(zikrId);
  } catch (error) {
    console.error('Error checking if zikr is favorite:', error);
    return false;
  }
}

// Helper debug function to test category generation
export async function testCategories() {
  try {
    const duas = await getDuas();
    const azkar = await getAzkar();
    
    // Create category maps to count items in each category
    const duaCategories = new Map<string, number>();
    const zikrCategories = new Map<string, number>();
    
    // Process dua categories
    duas.forEach(dua => {
      const count = duaCategories.get(dua.category) || 0;
      duaCategories.set(dua.category, count + 1);
    });
    
    // Process zikr categories
    azkar.forEach(zikr => {
      const count = zikrCategories.get(zikr.category) || 0;
      zikrCategories.set(zikr.category, count + 1);
    });
    
    console.log('Dua Categories:', Array.from(duaCategories.entries()));
    console.log('Zikr Categories:', Array.from(zikrCategories.entries()));
    
    return {
      duaCategories: Array.from(duaCategories.keys()),
      zikrCategories: Array.from(zikrCategories.keys()),
      duaCount: duas.length,
      zikrCount: azkar.length
    };
  } catch (error) {
    console.error('Error in testCategories:', error);
    return { 
      duaCategories: [], 
      zikrCategories: [], 
      duaCount: 0, 
      zikrCount: 0 
    };
  }
} 