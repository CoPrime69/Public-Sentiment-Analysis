import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Define the proper params type for Next.js App Router
type Params = {
  id: string;
};

export async function GET(
  request: NextRequest,
  context: { params: Params }
) {
  try {
    const policyId = context.params.id;

    const policy = await prisma.policy.findUnique({
      where: { id: policyId },
      include: {
        _count: {
          select: { tweets: true },
        },
      },
    });

    if (!policy) {
      return NextResponse.json(
        { error: 'Policy not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(policy);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Params }
) {
  try {
    const policyId = context.params.id;
    const { name, description, keywords } = await request.json();

    const policy = await prisma.policy.update({
      where: { id: policyId },
      data: {
        name,
        description,
        keywords,
      },
    });

    return NextResponse.json(policy);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Params }
) {
  try {
    const policyId = context.params.id;

    // Delete associated sentiments first
    await prisma.sentiment.deleteMany({
      where: {
        tweet: {
          policyId,
        },
      },
    });

    // Delete associated tweets
    await prisma.tweet.deleteMany({
      where: { policyId },
    });

    // Delete the policy
    await prisma.policy.delete({
      where: { id: policyId },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}