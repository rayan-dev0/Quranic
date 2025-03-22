export async function generateStaticParams() {
  // Generate for all 114 surahs
  return Array.from({ length: 114 }, (_, i) => ({
    id: String(i + 1),
  }));
} 