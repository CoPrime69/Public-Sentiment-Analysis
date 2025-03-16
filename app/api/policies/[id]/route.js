import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request, context) {
  try {
    const policyId = context.params.id;
    
    const policy = await prisma.policy.findUnique({
      where: { id: policyId },
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
  } catch (error) {
    const errorMessage = typeof error === 'string' ? error : 'An error occurred';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function PUT(request, context) {
  try {
    const policyId = context.params.id;
    const { name, description, keywords } = await request.json();
    
    const policy = await prisma.policy.update({
      where: { id: policyId },
      data: {
        name,
        description,
        keywords
      }
    });
    
    return NextResponse.json(policy);
  } catch (error) {
    const errorMessage = typeof error === 'string' ? error : 'An error occurred';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(request, context) {
  try {
    const policyId = context.params.id;
    
    // Delete associated sentiments first
    await prisma.sentiment.deleteMany({
      where: {
        tweet: {
          policyId
        }
      }
    });
    
    // Delete associated tweets
    await prisma.tweet.deleteMany({
      where: { policyId }
    });
    
    // Delete the policy
    await prisma.policy.delete({
      where: { id: policyId }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    const errorMessage = typeof error === 'string' ? error : 'An error occurred';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}