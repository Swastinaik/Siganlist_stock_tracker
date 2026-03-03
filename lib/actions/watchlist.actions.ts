'use server';

import { connectToDatabase } from '@/database/mongoose';
import { Watchlist } from '@/database/models/watchlist.model';
import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
export async function getWatchlistSymbolsByEmail(email: string): Promise<string[]> {
  if (!email) return [];

  try {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error('MongoDB connection not found');

    // Better Auth stores users in the "user" collection
    const user = await db.collection('user').findOne<{ _id?: unknown; id?: string; email?: string }>({ email });

    if (!user) return [];

    const userId = (user.id as string) || String(user._id || '');
    if (!userId) return [];

    const items = await Watchlist.find({ userId }, { symbol: 1 }).lean();
    return items.map((i) => String(i.symbol));
  } catch (err) {
    console.error('getWatchlistSymbolsByEmail error:', err);
    return [];
  }
}


export async function isSymbolInWatchlist(symbol: string): Promise<boolean> {
  try {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) return false;

    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return false;

    const userId = session.user.id;
    const existing = await Watchlist.findOne({ userId, symbol: symbol.toUpperCase() }).lean();
    return !!existing;
  } catch (err) {
    console.error('isSymbolInWatchlist error:', err);
    return false;
  }
}

export async function addSymbolToWatchlist(symbol: string) {
  try {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error('MongoDB connection not found');
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) throw new Error('User not found');
    const userId = session.user.id;
    await Watchlist.create({ userId, symbol });
  } catch (err) {
    console.error('addSymbolToWatchlist error:', err);
  }
}

export async function removeSymbolFromWatchlist(symbol: string) {
  try {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error('MongoDB connection not found');
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) throw new Error('User not found');
    const userId = session.user.id;
    await Watchlist.deleteOne({ userId, symbol: symbol.toUpperCase() });
  } catch (err) {
    console.error('removeSymbolFromWatchlist error:', err);
  }
}
