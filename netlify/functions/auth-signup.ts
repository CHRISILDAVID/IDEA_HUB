/**
 * Netlify Function: User Signup
 * POST /.netlify/functions/auth-signup
 */

import type { Handler, HandlerEvent } from '@netlify/functions';
import prisma from '../../src/lib/prisma';
import { hashPassword, generateToken } from '../../src/lib/auth';

export const handler: Handler = async (event: HandlerEvent) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { email, password, username, fullName } = JSON.parse(event.body || '{}');

    // Validation
    if (!email || !password || !username || !fullName) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: existingUser.email === email 
            ? 'Email already in use' 
            : 'Username already taken',
        }),
      };
    }

    // Hash password and create user
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        username,
        fullName,
        passwordHash,
      },
    });

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      username: user.username,
    });

    // Return user without password
    const { passwordHash: _, ...userWithoutPassword } = user;

    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user: userWithoutPassword,
        token,
        success: true,
      }),
    };
  } catch (error) {
    console.error('Signup error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
