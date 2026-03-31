import { NextResponse } from 'next/server';
import { getModelOptions } from '@/modules/prompt-templates';

export async function GET() {
  try {
    const options = await getModelOptions();
    return NextResponse.json({ options });
  } catch (error) {
    console.error('models route error:', error);
    return NextResponse.json({ options: [] }, { status: 500 });
  }
}
