import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const id = request.nextUrl.pathname.split('/').pop(); // Extract id from URL

    if (!id) {
      return NextResponse.json({ error: 'Missing policy ID' }, { status: 400 });
    }

    const policy = await prisma.policy.findUnique({
      where: { id },
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

export async function PUT(request: NextRequest) {
  try {
    const id = request.nextUrl.pathname.split('/').pop(); // Extract id from URL

    if (!id) {
      return NextResponse.json({ error: 'Missing policy ID' }, { status: 400 });
    }

    const { name, description, keywords } = await request.json();

    const policy = await prisma.policy.update({
      where: { id },
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

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.pathname.split('/').pop(); // Extract id from URL

    if (!id) {
      return NextResponse.json({ error: 'Missing policy ID' }, { status: 400 });
    }

    await prisma.sentiment.deleteMany({
      where: { tweet: { policyId: id } },
    });

    await prisma.tweet.deleteMany({ where: { policyId: id } });

    await prisma.policy.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
}
