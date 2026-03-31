import { NextResponse } from 'next/server';
import { getCurriculum, getAllTopics } from '@/modules/curriculum';

export async function GET() {
  const [curriculum, allTopics] = await Promise.all([
    getCurriculum(),
    getAllTopics(),
  ]);

  return NextResponse.json({ curriculum, allTopics });
}
