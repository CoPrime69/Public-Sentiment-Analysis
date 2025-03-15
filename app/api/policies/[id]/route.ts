import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest, { params } : any) {
  try {
    const policyId = params.id;

    const policy = await prisma.policy.findUnique({
      where: { id: policyId },
      include: {
        _count: {
          select: { tweets: true },
        },
      },
    });

    if (!policy) {
      return NextResponse.json({ error: 'Policy not found' }, { status: 404 });
    }

    return NextResponse.json(policy);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: any) {
  try {
    const policyId = params.id;
    const { name, description, keywords } = await request.json();

    const policy = await prisma.policy.update({
      where: { id: policyId },
      data: { name, description, keywords },
    });

    return NextResponse.json(policy);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: any) {
  try {
    const policyId = params.id;

    await prisma.sentiment.deleteMany({
      where: { tweet: { policyId } },
    });

    await prisma.tweet.deleteMany({ where: { policyId } });

    await prisma.policy.delete({ where: { id: policyId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
}
