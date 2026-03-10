import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const supabase = await createClient();

    // Exchange the code for a session
    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !user) {
      return NextResponse.redirect(`${origin}/login?error=auth_failed`);
    }

    // Check if the user is in the allowed_users table
    const email = user.email;
    const githubUsername = user.user_metadata?.user_name || user.user_metadata?.preferred_username;

    const { data: allowedUser } = await supabase
      .from('allowed_users')
      .select('id')
      .or(`email.eq.${email},github_username.eq.${githubUsername}`)
      .limit(1)
      .single();

    if (!allowedUser) {
      // User is not allowed — sign them out and redirect
      await supabase.auth.signOut();
      return NextResponse.redirect(`${origin}/login?error=not_allowed`);
    }

    return NextResponse.redirect(origin);
  }

  // No code — redirect to login
  return NextResponse.redirect(`${origin}/login?error=no_code`);
}
