import { NextResponse } from 'next/server';

// Simple test API to check if routes are working
export async function GET() {
  return NextResponse.json({ 
    success: true,
    message: 'API route is working',
    timestamp: new Date().toISOString(),
    test: true
  });
}