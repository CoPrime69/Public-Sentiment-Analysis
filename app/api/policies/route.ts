import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const policies = await prisma.policy.findMany({
      include: {
        _count: {
          select: { tweets: true }
        }
      }
    });
    
    return NextResponse.json(policies);
  } catch (error: unknown) {
    const errorMessage = typeof error === 'string' ? error : 'An error occurred';

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }  // Fixed: was 5000 which is invalid
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, description, keywords } = await request.json();
    
    if (!name || !description || !keywords) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const policy = await prisma.policy.create({
      data: {
        name,
        description,
        keywords
      }
    });
    
    return NextResponse.json(policy);
  } catch (error: unknown) {
    const errorMessage = typeof error === 'string' ? error : 'An error occurred';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
