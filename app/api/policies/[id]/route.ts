import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  // { params }: { params: { id: string } }
) {
  try {
    const id = request.nextUrl.pathname.split('/').pop(); // Extract id from URL
    
    const policy = await prisma.policy.findUnique({
      where: { id },
      include: {
        _count: {
          select: { tweets: true }
        }
      }
    });
    
    if (!policy) {
      return NextResponse.json(
        { error: 'Policy not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(policy);
  } catch (error: unknown) {
    const errorMessage = typeof error === 'string' ? error : 'An error occurred';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  // { params }: { params: { id: string } }
) {
  try {
    const id = request.nextUrl.pathname.split('/').pop(); // Extract id from URL
    const { name, description, keywords } = await request.json();
    
    const policy = await prisma.policy.update({
      where: { id },
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

export async function DELETE(
  request: NextRequest,
  // { params }: { params: { id: string } }
) {
  try {
    const id = request.nextUrl.pathname.split('/').pop(); // Extract id from URL
    
    // Delete associated sentiments first
    await prisma.sentiment.deleteMany({
      where: {
        tweet: {
          policyId : id
        }
      }
    });
    
    // Delete associated tweets
    await prisma.tweet.deleteMany({
      where: { policyId :id }
    });
    
    // Delete the policy
    await prisma.policy.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const errorMessage = typeof error === 'string' ? error : 'An error occurred';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
