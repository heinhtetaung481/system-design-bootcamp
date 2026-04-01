import { NextResponse } from 'next/server';
import { getModelOptions } from '@/modules/prompt-templates';

export async function GET() {
  try {
    const models = await getModelOptions();
    return NextResponse.json({ models });
  } catch (error) {
    console.error('models route error:', error);
    return NextResponse.json({ models: [] }, { status: 500 });
  }
}
