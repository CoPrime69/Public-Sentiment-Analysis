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
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
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
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
