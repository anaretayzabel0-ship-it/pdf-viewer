// // Resolves the caller's geo location server-side, using the IP Supabase's
// // edge network forwards in `x-forwarded-for`. Doing this server-side (rather
// // than a client-side call to a third-party geo API) avoids depending on a
// // public API being reachable from every visitor's network, and keeps the
// // lookup provider swappable in one place.
// import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// const corsHeaders = {
//   'Access-Control-Allow-Origin': '*',
//   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
// };

// serve(async (req) => {
//   if (req.method === 'OPTIONS') {
//     return new Response('ok', { headers: corsHeaders });
//   }

//   try {
//     const forwardedFor = req.headers.get('x-forwarded-for') ?? '';
//     const ip = forwardedFor.split(',')[0].trim();

//     if (!ip) {
//       return jsonResponse({ ip: null, city: null, region: null, country: null }, 200);
//     }

//     // Swap for your preferred geo-IP provider; ipapi.co is used here as a
//     // reasonable default with a free tier suitable for low volume.
//     const res = await fetch(`https://ipapi.co/${ip}/json/`);
//     if (!res.ok) {
//       return jsonResponse({ ip, city: null, region: null, country: null }, 200);
//     }

//     const data = await res.json();
//     return jsonResponse(
//       {
//         ip,
//         city: data.city ?? null,
//         region: data.region ?? null,
//         country: data.country_name ?? null,
//         latitude: data.latitude ?? null,
//         longitude: data.longitude ?? null,
//       },
//       200
//     );
//   } catch (err) {
//     console.error(err);
//     return jsonResponse({ ip: null, city: null, region: null, country: null }, 200);
//   }
// });

// function jsonResponse(body: unknown, status: number) {
//   return new Response(JSON.stringify(body), {
//     status,
//     headers: { ...corsHeaders, 'Content-Type': 'application/json' },
//   });
// }
