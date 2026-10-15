import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Function started.');

    const userSupabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )
    const { data: { user } } = await userSupabase.auth.getUser()

    if (!user) {
      console.error('Error: User not found in auth context.');
      throw new Error('User not found');
    }
    console.log(`User ${user.id} found.`)

    const adminSupabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    
    // 1. Fetch the user's profile to get their image URLs
    console.log(`Fetching profile for user ${user.id}...`);
    const { data: profile, error: profileSelectError } = await adminSupabase
      .from('profiles')
      .select('profile_image_urls')
      .eq('user_id', user.id)
      .single()

    if (profileSelectError) {
        console.error('Error fetching profile:', profileSelectError.message);
        throw profileSelectError;
    }
    console.log('Profile fetched successfully. Image URLs:', profile?.profile_image_urls);

    // 2. If URLs exist, delete them from Cloudinary
    if (profile && profile.profile_image_urls && profile.profile_image_urls.length > 0) {
      console.log('Attempting to delete images from Cloudinary...');
      const publicIds = profile.profile_image_urls.map((url: string) => url.split('/').pop()!.split('.')[0]);
      console.log('Public IDs to delete:', publicIds);
      
      const cloudName = Deno.env.get('CLOUDINARY_CLOUD_NAME')!;
      const apiKey = Deno.env.get('CLOUDINARY_API_KEY')!;
      const apiSecret = Deno.env.get('CLOUDINARY_API_SECRET')!;
      
      // Delete each image individually using the correct endpoint
      const deletePromises = publicIds.map(async (publicId) => {
        console.log(`Deleting image with public_id: ${publicId}`);
        
        const deleteUrl = `https://api.cloudinary.com/v1_1/${cloudName}/resources/image/upload`;
        const params = new URLSearchParams({
          public_ids: publicId
        });

        const response = await fetch(`${deleteUrl}?${params.toString()}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Basic ${btoa(`${apiKey}:${apiSecret}`)}`,
          },
        });

        if (!response.ok) {
          const responseText = await response.text();
          console.error(`Failed to delete ${publicId}:`, response.status, responseText);
          // Don't throw - continue with other deletions
          return { success: false, publicId, error: responseText };
        }
        
        const result = await response.json();
        console.log(`Successfully deleted ${publicId}:`, result);
        return { success: true, publicId, result };
      });

      const results = await Promise.allSettled(deletePromises);
      console.log('Cloudinary deletion results:', JSON.stringify(results, null, 2));
      
      // Log summary
      const successful = results.filter(r => r.status === 'fulfilled').length;
      console.log(`Deleted ${successful}/${publicIds.length} images from Cloudinary`);
    } else {
      console.log('No image URLs found for user, skipping Cloudinary deletion.');
    }

    // 3. Delete the user's profile row from your database
    console.log(`Deleting profile for user ${user.id} from Supabase...`);
    const { error: profileDeleteError } = await adminSupabase.from('profiles').delete().eq('user_id', user.id)
    if (profileDeleteError) {
        console.error('Error deleting profile:', profileDeleteError.message);
        throw profileDeleteError;
    }
    console.log('Profile deleted successfully.');

    // 4. Finally, delete the user from Supabase Auth
    console.log(`Deleting user ${user.id} from Supabase Auth...`);
    const { error: authError } = await adminSupabase.auth.admin.deleteUser(user.id)
    if (authError) {
        console.error('Error deleting user from Auth:', authError.message);
        throw authError;
    }
    console.log('User deleted from Auth successfully.');

    return new Response(JSON.stringify({ message: 'User and all associated data deleted successfully' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Caught an unhandled error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})