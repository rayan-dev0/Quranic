// API for loading and processing hadith data from the database

// Define the database structure interfaces
export interface DbHadith {
  id: number;
  idInBook: number;
  chapterId: number;
  bookId: number;
  arabic: string;
  english: {
    narrator?: string;
    text: string;
  };
  grades?: {
    grade: string;
    graded_by: string;
  }[];
}

export interface DbChapter {
  id: number;
  bookId: number;
  arabic: string;
  english: string;
}

export interface DbBook {
  id: number;
  metadata: {
    id: number;
    length: number;
    arabic: {
      title: string;
      author: string;
      introduction?: string;
    };
    english: {
      title: string;
      author: string;
      introduction?: string;
    };
  };
  chapters: DbChapter[];
  hadiths: DbHadith[];
}

// Interface for the hadith search result
export interface HadithSearchResult {
  id: string; // Combined book and hadith ID (e.g., bukhari-123)
  bookId: number;
  bookName: string;
  hadithNumber: number;
  chapterName?: string;
  arabic: string;
  english: string;
  narrator?: string;
  grades?: {
    grade: string;
    gradedBy: string;
  }[];
  references?: {
    bookId: string;
    hadithNumber: number;
  }[];
}

// Cache for loaded books
const booksCache: Record<string, DbBook> = {};
const hadithsCache: HadithSearchResult[] = [];
let booksMetadataCache: BookMetadata[] = [];

export interface BookMetadata {
  id: string;
  name: string;
  arabicName: string;
  author: string;
  category: string;
  hadithCount: number;
  chapterCount: number;
}

// Helper function to fetch JSON data
async function fetchJsonFile(filePath: string) {
  try {
    // Make sure path is relative to the base URL and handle different environments
    let url;
    
    // In the browser, we need to use the same origin
    if (typeof window !== 'undefined') {
      const baseUrl = window.location.origin;
      // Remove any leading slash to avoid double slashes
      const cleanPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
      url = `${baseUrl}/${cleanPath}`;
    } else {
      // For server-side rendering
      url = filePath.startsWith('/') ? filePath : `/${filePath}`;
    }
    
    console.log(`[DEBUG] Fetching hadith data from: ${url}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`[ERROR] Error fetching ${filePath}:`, error);
    return null;
  }
}

// Function to load a specific book
export async function loadBook(bookId: string): Promise<DbBook | null> {
  console.log(`[DEBUG] Loading book: ${bookId}`);
  
  // Check if book is already in cache
  if (booksCache[bookId]) {
    console.log(`[DEBUG] Returning cached book data for ${bookId}`);
    return booksCache[bookId];
  }
  
  // Try loading from different possible paths
  const possiblePaths = [
    `src/data/db/by_book/the_9_books/${bookId}.json`,
    `src/data/db/by_book/other_books/${bookId}.json`,
    `src/data/db/by_book/forties/${bookId}.json`
  ];
  
  for (const path of possiblePaths) {
    try {
      const bookData = await fetchJsonFile(path);
      if (bookData && bookData.hadiths) {
        console.log(`[DEBUG] Successfully loaded book ${bookId} from ${path}`);
        booksCache[bookId] = bookData;
        return bookData;
      }
    } catch (error) {
      console.log(`[DEBUG] Failed to load ${bookId} from ${path}: ${error}`);
    }
  }
  
  console.error(`[ERROR] Could not find book data for ${bookId} in any location`);
  return null;
}

// Function to load all books metadata
export async function getAvailableBooks(): Promise<BookMetadata[]> {
  console.log('[DEBUG] Fetching all available books');
  
  if (booksMetadataCache.length > 0) {
    console.log(`[DEBUG] Returning ${booksMetadataCache.length} cached book metadata entries`);
    return booksMetadataCache;
  }
  
  const bookMetadata: BookMetadata[] = [];
  
  // Book collections to scan
  const collections = [
    {
      path: 'src/data/db/by_book/the_9_books',
      category: 'The 9 Books'
    },
    {
      path: 'src/data/db/by_book/other_books',
      category: 'Other Books'
    },
    {
      path: 'src/data/db/by_book/forties',
      category: 'Forties Collections'
    }
  ];
  
  // Function to extract book ID from filename
  const getBookIdFromFilename = (filename: string): string => {
    return filename.replace('.json', '');
  };
  
  for (const collection of collections) {
    try {
      // We would need a way to list files in a directory
      // For this implementation, we'll use a predefined list of book IDs
      const bookIds = await getPredefinedBookIdsForCollection(collection.path);
      
      for (const bookId of bookIds) {
        const book = await loadBook(bookId);
        
        if (book) {
          bookMetadata.push({
            id: bookId,
            name: book.metadata?.english?.title || bookId,
            arabicName: book.metadata?.arabic?.title || '',
            author: book.metadata?.english?.author || '',
            category: collection.category,
            hadithCount: book.hadiths?.length || 0,
            chapterCount: book.chapters?.length || 0
          });
        }
      }
    } catch (error) {
      console.error(`[ERROR] Error fetching books for collection ${collection.path}:`, error);
    }
  }
  
  console.log(`[DEBUG] Found ${bookMetadata.length} books in total`);
  booksMetadataCache = bookMetadata;
  return bookMetadata;
}

// Predefined list of book IDs based on the directory
async function getPredefinedBookIdsForCollection(collectionPath: string): Promise<string[]> {
  if (collectionPath.includes('the_9_books')) {
    return [
      'bukhari', 'muslim', 'abudawud', 'tirmidhi', 'nasai',
      'ibnmajah', 'malik', 'ahmed', 'darimi'
    ];
  }
  
  if (collectionPath.includes('other_books')) {
    return [
      'aladab_almufrad', 'bulugh_almaram', 'mishkat_almasabih',
      'riyad_assalihin', 'shamail_muhammadiyah'
    ];
  }
  
  if (collectionPath.includes('forties')) {
    return ['nawawi40', 'qudsi40', 'shahwaliullah40'];
  }
  
  return [];
}

// Function to search through hadiths
export async function searchHadiths(query: string, options: {
  bookIds?: string[];
  limit?: number;
  offset?: number;
} = {}): Promise<{
  results: HadithSearchResult[];
  total: number;
}> {
  const { bookIds = [], limit = 20, offset = 0 } = options;
  const searchQuery = query.toLowerCase().trim();
  
  console.log(`[DEBUG] Searching hadiths with query: "${searchQuery}", bookIds: ${bookIds.join(', ')}, limit: ${limit}, offset: ${offset}`);
  
  // If no query, return empty results
  if (!searchQuery) {
    return { results: [], total: 0 };
  }
  
  // Load all available books if no specific books selected
  const booksToSearch = bookIds.length > 0 
    ? bookIds 
    : (await getAvailableBooks()).map(book => book.id);
  
  const allResults: HadithSearchResult[] = [];
  
  // Search through each book
  for (const bookId of booksToSearch) {
    const book = await loadBook(bookId);
    
    if (!book || !book.hadiths) {
      console.log(`[DEBUG] Book ${bookId} has no hadiths, skipping`);
      continue;
    }
    
    // Search through hadiths in this book
    for (const hadith of book.hadiths) {
      const arabicText = hadith.arabic || '';
      const englishText = hadith.english?.text || '';
      const narratorText = hadith.english?.narrator || '';
      
      // Check if query is found in any of the text fields
      if (
        arabicText.toLowerCase().includes(searchQuery) ||
        englishText.toLowerCase().includes(searchQuery) ||
        narratorText.toLowerCase().includes(searchQuery)
      ) {
        // Find chapter info if available
        const chapter = book.chapters.find(c => c.id === hadith.chapterId);
        
        // Create result object
        const result: HadithSearchResult = {
          id: `${bookId}-${hadith.idInBook}`,
          bookId: hadith.bookId,
          bookName: book.metadata?.english?.title || bookId,
          hadithNumber: hadith.idInBook,
          chapterName: chapter?.english,
          arabic: arabicText,
          english: englishText,
          narrator: narratorText,
          grades: hadith.grades?.map(g => ({
            grade: g.grade,
            gradedBy: g.graded_by
          }))
        };
        
        allResults.push(result);
      }
    }
  }
  
  // Calculate total before pagination
  const total = allResults.length;
  console.log(`[DEBUG] Found ${total} hadiths matching the query`);
  
  // Apply pagination
  const paginatedResults = allResults.slice(offset, offset + limit);
  
  return {
    results: paginatedResults,
    total
  };
}

// Function to get a specific hadith by its ID
export async function getHadithById(fullId: string): Promise<HadithSearchResult | null> {
  console.log(`[DEBUG] Getting hadith by ID: ${fullId}`);
  
  // Split the ID into book ID and hadith number
  const [bookId, hadithNumberStr] = fullId.split('-');
  const hadithNumber = parseInt(hadithNumberStr, 10);
  
  if (!bookId || isNaN(hadithNumber)) {
    console.error(`[ERROR] Invalid hadith ID format: ${fullId}`);
    return null;
  }
  
  // Load the book
  const book = await loadBook(bookId);
  
  if (!book || !book.hadiths) {
    console.error(`[ERROR] Book ${bookId} not found or has no hadiths`);
    return null;
  }
  
  // Find the hadith
  const hadith = book.hadiths.find(h => h.idInBook === hadithNumber);
  
  if (!hadith) {
    console.error(`[ERROR] Hadith number ${hadithNumber} not found in book ${bookId}`);
    return null;
  }
  
  // Find the chapter
  const chapter = book.chapters.find(c => c.id === hadith.chapterId);
  
  // Create the result
  const result: HadithSearchResult = {
    id: fullId,
    bookId: hadith.bookId,
    bookName: book.metadata?.english?.title || bookId,
    hadithNumber: hadith.idInBook,
    chapterName: chapter?.english,
    arabic: hadith.arabic || '',
    english: hadith.english?.text || '',
    narrator: hadith.english?.narrator,
    grades: hadith.grades?.map(g => ({
      grade: g.grade,
      gradedBy: g.graded_by
    }))
  };
  
  return result;
}

// Get all hadiths from a specific book (with pagination)
export async function getHadithsByBook(bookId: string, options: {
  limit?: number;
  offset?: number;
  chapterId?: number;
} = {}): Promise<{
  results: HadithSearchResult[];
  total: number;
}> {
  const { limit = 20, offset = 0, chapterId } = options;
  
  console.log(`[DEBUG] Getting hadiths from book ${bookId}, limit: ${limit}, offset: ${offset}, chapterId: ${chapterId}`);
  
  // Load the book
  const book = await loadBook(bookId);
  
  if (!book || !book.hadiths) {
    console.error(`[ERROR] Book ${bookId} not found or has no hadiths`);
    return { results: [], total: 0 };
  }
  
  // Filter by chapter if specified
  let filteredHadiths = book.hadiths;
  if (chapterId !== undefined) {
    filteredHadiths = filteredHadiths.filter(h => h.chapterId === chapterId);
  }
  
  // Calculate total before pagination
  const total = filteredHadiths.length;
  
  // Apply pagination
  const paginatedHadiths = filteredHadiths.slice(offset, offset + limit);
  
  // Convert to result format
  const results = paginatedHadiths.map(hadith => {
    // Find the chapter
    const chapter = book.chapters.find(c => c.id === hadith.chapterId);
    
    return {
      id: `${bookId}-${hadith.idInBook}`,
      bookId: hadith.bookId,
      bookName: book.metadata?.english?.title || bookId,
      hadithNumber: hadith.idInBook,
      chapterName: chapter?.english,
      arabic: hadith.arabic || '',
      english: hadith.english?.text || '',
      narrator: hadith.english?.narrator,
      grades: hadith.grades?.map(g => ({
        grade: g.grade,
        gradedBy: g.graded_by
      }))
    };
  });
  
  console.log(`[DEBUG] Returning ${results.length} hadiths out of ${total} total`);
  
  return {
    results,
    total
  };
}

// Get all chapters from a specific book
export async function getChaptersByBook(bookId: string): Promise<DbChapter[]> {
  console.log(`[DEBUG] Getting chapters from book ${bookId}`);
  
  // Load the book
  const book = await loadBook(bookId);
  
  if (!book || !book.chapters) {
    console.error(`[ERROR] Book ${bookId} not found or has no chapters`);
    return [];
  }
  
  return book.chapters;
}

// Get book metadata
export async function getBookMetadata(bookId: string): Promise<BookMetadata | null> {
  console.log(`[DEBUG] Getting metadata for book ${bookId}`);
  
  // Check if we have the metadata cached
  if (booksMetadataCache.length > 0) {
    const cached = booksMetadataCache.find(b => b.id === bookId);
    if (cached) {
      return cached;
    }
  }
  
  // Load the book to get metadata
  const book = await loadBook(bookId);
  
  if (!book) {
    console.error(`[ERROR] Book ${bookId} not found`);
    return null;
  }
  
  // Create metadata object
  const metadata: BookMetadata = {
    id: bookId,
    name: book.metadata?.english?.title || bookId,
    arabicName: book.metadata?.arabic?.title || '',
    author: book.metadata?.english?.author || '',
    category: determineCategoryForBook(bookId),
    hadithCount: book.hadiths?.length || 0,
    chapterCount: book.chapters?.length || 0
  };
  
  return metadata;
}

// Helper function to determine category for a book
function determineCategoryForBook(bookId: string): string {
  if (['bukhari', 'muslim', 'abudawud', 'tirmidhi', 'nasai', 'ibnmajah', 'malik', 'ahmed', 'darimi'].includes(bookId)) {
    return 'The 9 Books';
  }
  
  if (['nawawi40', 'qudsi40', 'shahwaliullah40'].includes(bookId)) {
    return 'Forties Collections';
  }
  
  return 'Other Books';
} 