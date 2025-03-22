interface LocalizedString {
  en: string
  ar: string
  [key: string]: string
}

export interface Dua {
  id: string
  title: string
  arabic: string
  translation: string
  transliteration: string
  reference: string
  category: string
  tags: string[]
  benefits?: string
  favorite?: boolean
}

export interface Zikr {
  id: string
  category: string
  arabic: string
  description: string
  count: number
  reference: string
  favorite?: boolean
}

export interface Category {
  id: string
  name: string
  description: string
  count: number
}

interface RawDua {
  id: string
  title: LocalizedString
  arabic: string
  translation: LocalizedString
  transliteration: string
  reference: string
  category: LocalizedString
  tags: string[]
  benefits?: LocalizedString
}

interface RawCategory {
  id: string
  name: LocalizedString
  description: LocalizedString
  count: number
}

interface DuaData {
  categories: RawCategory[]
  duas: RawDua[]
}

// Import data from JSON files
import duaData from '@/data/duas.json'
import azkarData from '@/data/azkar.json'

// Function to format azkar data into our app structure
function formatAzkarData(): Zikr[] {
  try {
    // If the data is in the format shown in the file
    if (azkarData.rows && Array.isArray(azkarData.rows)) {
      return azkarData.rows.map((row, index) => ({
        id: `zikr-${index}`,
        category: typeof row[0] === 'string' ? row[0] : '',
        arabic: typeof row[1] === 'string' ? row[1] : '',
        description: typeof row[2] === 'string' ? row[2] : '',
        count: typeof row[3] === 'number' ? row[3] : parseInt(String(row[3])) || 1,
        reference: typeof row[4] === 'string' ? row[4] : '',
      }));
    }
    console.error('Azkar data format is not as expected');
    return [];
  } catch (error) {
    console.error('Error formatting azkar data:', error);
    return [];
  }
}

// Get unique categories from azkar data
export function getAzkarCategories(): Category[] {
  try {
    if (!azkarData.rows || !Array.isArray(azkarData.rows)) {
      return [];
    }
    
    // Get unique categories and ensure they are strings
    const categoriesSet = new Set<string>();
    azkarData.rows.forEach(row => {
      if (typeof row[0] === 'string') {
        categoriesSet.add(row[0]);
      }
    });
    
    const categories = Array.from(categoriesSet);
    
    return categories.map((category, index) => {
      // Count items in this category
      const count = azkarData.rows.filter(row => row[0] === category).length;
      
      return {
        id: `azkar-category-${index}`,
        name: category,
        description: `Collection of ${count} azkar for ${category}`,
        count: count
      };
    });
  } catch (error) {
    console.error('Error getting azkar categories:', error);
    return [];
  }
}

export async function getDuas(language: string = 'en'): Promise<Dua[]> {
  try {
    return (duaData as DuaData).duas.map(dua => ({
      id: dua.id,
      title: dua.title[language] || dua.title.en,
      arabic: dua.arabic,
      translation: dua.translation[language] || dua.translation.en,
      transliteration: dua.transliteration,
      reference: dua.reference,
      category: dua.category[language] || dua.category.en,
      tags: dua.tags || [],
      benefits: dua.benefits?.[language] || dua.benefits?.en
    }))
  } catch (error) {
    console.error('Error getting duas:', error)
    return []
  }
}

export async function getAzkar(): Promise<Zikr[]> {
  try {
    return formatAzkarData();
  } catch (error) {
    console.error('Error getting azkar:', error);
    return [];
  }
}

export async function getCategories(language: string = 'en'): Promise<Category[]> {
  try {
    return (duaData as DuaData).categories.map(category => ({
      id: category.id,
      name: category.name[language] || category.name.en,
      description: category.description[language] || category.description.en,
      count: category.count
    }))
  } catch (error) {
    console.error('Error getting categories:', error)
    return []
  }
}

export async function getAllCategories(language: string = 'en'): Promise<Category[]> {
  try {
    const duaCategories = await getCategories(language);
    const azkarCategories = await getAzkarCategories();
    
    return [...duaCategories, ...azkarCategories];
  } catch (error) {
    console.error('Error getting all categories:', error);
    return [];
  }
}

export async function getDuasByCategory(categoryId: string, language: string = 'en'): Promise<Dua[]> {
  try {
    const duas = await getDuas(language)
    const categories = await getCategories(language)
    const category = categories.find(c => c.id === categoryId)
    
    if (!category) {
      return []
    }

    return duas.filter(dua => {
      const duaCategory = dua.category.toLowerCase().trim()
      const categoryName = category.name.toLowerCase().trim()
      return duaCategory === categoryName
    })
  } catch (error) {
    console.error('Error filtering duas by category:', error)
    return []
  }
}

export async function getAzkarByCategory(categoryName: string): Promise<Zikr[]> {
  try {
    const azkar = await getAzkar();
    return azkar.filter(zikr => zikr.category.toLowerCase().trim() === categoryName.toLowerCase().trim());
  } catch (error) {
    console.error('Error filtering azkar by category:', error);
    return [];
  }
}

export async function searchDuas(query: string, language: string = 'en'): Promise<Dua[]> {
  const duas = await getDuas(language)
  const searchQuery = query.toLowerCase()
  
  return duas.filter(dua => 
    dua.title.toLowerCase().includes(searchQuery) ||
    dua.translation.toLowerCase().includes(searchQuery) ||
    dua.transliteration.toLowerCase().includes(searchQuery) ||
    dua.tags.some(tag => tag.toLowerCase().includes(searchQuery))
  )
}

export async function searchAzkar(query: string): Promise<Zikr[]> {
  const azkar = await getAzkar();
  const searchQuery = query.toLowerCase();
  
  return azkar.filter(zikr => 
    zikr.arabic.toLowerCase().includes(searchQuery) ||
    zikr.description.toLowerCase().includes(searchQuery) ||
    zikr.reference.toLowerCase().includes(searchQuery) ||
    zikr.category.toLowerCase().includes(searchQuery)
  );
}

// Local storage functions for favorites
const FAVORITES_KEY = 'dua_favorites'
const AZKAR_FAVORITES_KEY = 'azkar_favorites'

export function getFavoriteDuas(): string[] {
  try {
    const favorites = localStorage.getItem(FAVORITES_KEY)
    return favorites ? JSON.parse(favorites) : []
  } catch {
    return []
  }
}

export function getFavoriteAzkar(): string[] {
  try {
    const favorites = localStorage.getItem(AZKAR_FAVORITES_KEY);
    return favorites ? JSON.parse(favorites) : [];
  } catch {
    return [];
  }
}

export function toggleFavoriteDua(duaId: string): boolean {
  try {
    const favorites = getFavoriteDuas()
    const index = favorites.indexOf(duaId)
    
    if (index === -1) {
      favorites.push(duaId)
    } else {
      favorites.splice(index, 1)
    }
    
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites))
    return index === -1 // Return true if dua was added to favorites
  } catch {
    return false
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
  } catch {
    return false;
  }
}

export function isFavoriteDua(duaId: string): boolean {
  try {
    const favorites = getFavoriteDuas()
    return favorites.includes(duaId)
  } catch {
    return false
  }
}

export function isFavoriteZikr(zikrId: string): boolean {
  try {
    const favorites = getFavoriteAzkar();
    return favorites.includes(zikrId);
  } catch {
    return false;
  }
}