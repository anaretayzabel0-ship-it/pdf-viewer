// Importing Deno's native HTTP server and Supabase's JS client.
// In Deno, we import modules directly from URLs instead of using package.json.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS (Cross-Origin Resource Sharing) headers.
// Without these, modern web browsers will block your frontend (React, Vue, etc.)
// from calling this Edge Function if they are hosted on different domains.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

// Simple lookup lists to classify our multimedia links based on their file extensions.
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif'];
const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov', '.m3u8'];

/**
 * Helper function to extract the file extension from a URL.
 * It tries using the native URL parser first, and falls back to string split operations
 * if the URL is formatted weirdly or has query parameters (e.g., ?token=123).
 */
function getUrlExtension(url: string): string {
  try {
    const { pathname } = new URL(url);
    const match = pathname.toLowerCase().match(/\.[a-z0-9]+$/);
    return match ? match[0] : '';
  } catch {
    const clean = url.split('?')[0].split('#')[0].toLowerCase();
    const match = clean.match(/\.[a-z0-9]+$/);
    return match ? match[0] : '';
  }
}

// Start the HTTP server to listen for incoming API requests.
serve(async (req) => {
  // 1. Handle CORS Preflight Requests (OPTIONS)
  // Browsers automatically send an HTTP OPTIONS request before POST/GET
  // to check if the server permits the actual request. We must reply with a 200 OK.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 2. Parse the Incoming Request Body
    // We expect a JSON body. We use a fallback `.catch()` block to prevent the app
    // from crashing if the client sends an empty body or malformed JSON.
    const { sale_id } = await req.json().catch(() => ({ sale_id: null }));

    // 3. Initialize the Supabase Client
    // We grab the environment variables automatically provided by Supabase.
    // The service role key bypasses Row Level Security (RLS) to query administrative data.
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // ----------------------------------------------------
    // STEP 1: Query the Database for Lots
    // ----------------------------------------------------
    // Build a base query to fetch the requested lot fields, including the
    // PDF document coordinates (page, x, y, zoom) that tell the UI where to highlight.
    let lotsQuery = supabase
      .from('lots')
      .select(`
        lot_id,
        lot_number,
        association_data,
        breed,
        name,
        registration_number,
        sale_id,
        page,
        x,
        y,
        zoom
      `);

    // If the client passed a specific sale_id, filter the lots to only return that sale's items.
    // Otherwise, it grabs everything in the table.
    if (sale_id) {
      lotsQuery = lotsQuery.eq('sale_id', sale_id);
    }

    const { data: lots, error: lotsError } = await lotsQuery;
    if (lotsError) throw lotsError;

    // Early exit: If no lots are found, return an empty array immediately.
    // This saves server processing time and memory.
    if (!lots || lots.length === 0) {
      return jsonResponse({ lots: [] }, 200);
    }

    // ----------------------------------------------------
    // PERFORMANCE OPTIMIZATION: Batch Fetching
    // ----------------------------------------------------
    // To avoid the "N+1 Query Problem" (making separate DB queries inside a loop
    // for every single lot, which kills performance), we gather all required IDs first...
    const lotIds = lots.map((l) => l.lot_id);

    // ...and gather all unique sale IDs (filtering out null/undefined values using Set).
    const uniqueSaleIds = [...new Set(lots.map((l) => l.sale_id).filter(Boolean))];

    // ...Then we run all queries in PARALLEL using Promise.all().
    // This fetches all parent sales, child multimedia records, and child ratings in 3 swift DB trips.
    const [salesRes, mediaRes, ratingsRes] = await Promise.all([
      supabase
        .from('sales')
        .select('sales_id, date, time, timezone, name, physical_location, online_location, sale_title, catalog_link')
        .in('sales_id', uniqueSaleIds),
      supabase
        .from('multimedia')
        .select('lot_id, multimedia_id, link, link_title')
        .in('lot_id', lotIds),
      supabase
        .from('ratings')
        .select('lot_id, rating')
        .in('lot_id', lotIds),
    ]);

    // Error handling block for the batch requests.
    if (salesRes.error) throw salesRes.error;
    if (mediaRes.error) throw mediaRes.error;
    if (ratingsRes.error) throw ratingsRes.error;

    // ----------------------------------------------------
    // DATA STRUCTURING: Mapping for Fast Lookups
    // ----------------------------------------------------
    // Instead of doing an array search (.find()) inside our main loop (which is slow: O(N) complexity),
    // we map the sales array into a Hash Map. This allows instant O(1) direct key lookups later.
    const salesMap = new Map(salesRes.data.map((s) => [s.sales_id, s]));

    // ----------------------------------------------------
    // STEP 2: Process and Structure Data for Each Lot
    // ----------------------------------------------------
    const responseLots = lots.map((lot) => {
      // Direct lookup: Grab parent sale info using our Map.
      const sale = salesMap.get(lot.sale_id);

      // Filter multimedia records belonging to this specific lot.
      const lotMedia = mediaRes.data.filter((m) => m.lot_id === lot.lot_id);

      const images: { url: string }[] = [];
      const videos: { url: string }[] = [];
      const links: { label: string; url: string }[] = [];

      // Sort and categorize multimedia links into arrays expected by frontend components.
      for (const item of lotMedia) {
        const url = item.link ?? '';
        const ext = getUrlExtension(url);

        if (IMAGE_EXTENSIONS.includes(ext)) {
          images.push({ url });
        } else if (VIDEO_EXTENSIONS.includes(ext)) {
          videos.push({ url });
        } else {
          links.push({
            label: item.link_title || 'Link',
            url,
          });
        }
      }

      // Filter ratings belonging to this lot, converting values safely to numbers.
      const lotRatings = ratingsRes.data
        .filter((r) => r.lot_id === lot.lot_id)
        .map((r) => Number(r.rating))
        .filter((r) => !isNaN(r));

      // Calculate the arithmetic mean (average rating) of the values.
      // If there are no ratings, we default the output value to null.
      const averageRating =
        lotRatings.length > 0
          ? lotRatings.reduce((a, b) => a + b, 0) / lotRatings.length
          : null;

      // Construct and return the final API object structure for this lot.
      return {
        lot_id: lot.lot_id,
        lot_number: lot.lot_number,
        association_data_url: lot.association_data,
        breed: lot.breed,
        lot_name: lot.name,
        registration_number: lot.registration_number,

        // Coordinates & PDF catalog document mapping fields
        page: lot.page ?? null,
        x: lot.x ?? null,
        y: lot.y ?? null,
        zoom: lot.zoom ?? null,

        // Parent Sale relationship data flattened for easy UI consumption
        ranch_name: sale?.name ?? null,
        sale_date: sale?.date ?? null,
        sale_time: sale?.time ?? null,
        sale_timezone: sale?.timezone ?? null,
        sale_title: sale?.sale_title ?? null,
        physical_location: sale?.physical_location ?? null,
        online_location: sale?.online_location ?? null,
        catalog_link: sale?.catalog_link ?? null,

        // Structured Multimedia Arrays
        images,
        videos,
        links,

        // Aggregated Ratings Data
        rating: averageRating,
        rating_count: lotRatings.length,
      };
    });

    // Send the structured array back to the client.
    return jsonResponse({ lots: responseLots }, 200);
  } catch (err) {
    // Standard catch block to prevent the edge server from crashing.
    // It prints the true error to the internal logs and replies with a clean 500 error.
    console.error(err);

    return jsonResponse(
      {
        error: err instanceof Error ? err.message : 'Unexpected error',
      },
      500
    );
  }
});

/**
 * Utility helper to quickly generate standard application/json HTTP responses
 * bundled with our CORS headers.
 */
function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}
