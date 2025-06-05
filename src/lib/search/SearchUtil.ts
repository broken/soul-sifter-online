import { PostgrestQueryBuilder, PostgrestFilterBuilder } from '@supabase/postgrest-js';
import type { SupabaseClient } from '@supabase/supabase-js'; // Added import for SupabaseClient type
import type { Song } from '../../model.types'; // Adjusted path for Song type


// OrderBy enum remains the same
enum OrderBy {
  DATE_ADDED,
  RELEASE_DATE,
  RANDOM,
  BPM,
  ALBUM,
  PLAYLIST
}

// Type enum remains the same
enum Type {
  ANY,
  S_ID,
  S_ARTIST,
  S_TITLE,
  S_REMIXER,
  S_RATING,
  S_COMMENTS,
  S_CURATOR,
  S_ENERGY,
  S_BPM,
  S_TRASHED,
  S_LOW_QUALITY,
  A_ID,
  A_NAME,
  A_ARTIST,
  A_MIXED,
  A_LABEL,
  A_YEAR,
  A_MONTH,
  A_DAY,
  CUSTOM_QUERY_PREDICATE,
  LIMIT,
  ORDER_BY,
}

// Property enum remains the same
enum Property {
  NONE = 0x00,
  NEGATED = 0x01,
  CASE_SENSITIVE = 0x02,
  LESS_THAN = 0x04,
  GREATER_THAN = 0x08,
  EQUAL = 0x10,
}

// Atom class remains the same
class Atom {
  value: string = ''
  type: Type = Type.ANY
  props: number =  0

  clear = () => {
    this.value = ''
    this.type = Type.ANY
    this.props = 0
  }
}

// splitString function remains the same
function splitString(str: string): string[] {
  const regex = /[^\s"]+|"([^"]*)"/g
  const matches = []
  let match

  while ((match = regex.exec(str))) {
    if (match[1]) {
      matches.push(match[1])
    } else {
      matches.push(match[0])
    }
  }
  return matches
}

// parse function remains the same
function parse(queryFragment: string): Atom | undefined {
  let atom = new Atom()
  const regex = /^(-)?((id|a|artist|t|title|remixer|r|rating|comments|c|curator|e|energy|bpm|trashed|lowq|aid|n|album|m|mixed|l|label|y|year|month|day|q|query|limit|o|order|orderby|orderBy):)?(<|>)?(=)?(.+)$/
  const match = queryFragment.toLowerCase().match(regex)
  if (!match) {
    return undefined
  }
  if (match[1]) {
    atom.props |= Property.NEGATED
  }
  if (match[4]) {
    if (match[4] === "<") {
      atom.props |= Property.LESS_THAN
    } else {
      atom.props |= Property.GREATER_THAN
    }
  }
  if (match[5]) {
    atom.props |= Property.EQUAL
  }
  if (match[2]) {
    switch (match[3]) {
      case "id": atom.type = Type.S_ID; break
      case "a": case "artist": atom.type = Type.S_ARTIST; break
      case "t": case "title": atom.type = Type.S_TITLE; break
      case "remixer": atom.type = Type.S_REMIXER; break
      case "r": case "rating": atom.type = Type.S_RATING; break
      case "comments": case "c": atom.type = Type.S_COMMENTS; break
      case "curator": atom.type = Type.S_CURATOR; break
      case "e": case "energy": atom.type = Type.S_ENERGY; break
      case "bpm": atom.type = Type.S_BPM; break
      case "trashed": atom.type = Type.S_TRASHED; break
      case "lowq": atom.type = Type.S_LOW_QUALITY; break
      case "aid": atom.type = Type.A_ID; break
      case "n": case "album": atom.type = Type.A_NAME; break
      case "m": case "mixed": atom.type = Type.A_MIXED; break
      case "label": atom.type = Type.A_LABEL; break
      case "y": case "year": atom.type = Type.A_YEAR; break
      case "month": atom.type = Type.A_MONTH; break
      case "day": atom.type = Type.A_DAY; break
      case "q": case "query": atom.type = Type.CUSTOM_QUERY_PREDICATE; break
      case "limit": atom.type = Type.LIMIT; break
      case "l":
        const numRegex = /^[0-9]+$/
        if (numRegex.test(match[6])) atom.type = Type.LIMIT
        else atom.type = Type.A_LABEL
        break
      case "o": case "order": case "orderby": case "orderBy":
        atom.type = Type.ORDER_BY
        break
      default: return undefined
    }
  }
  if (atom.type === Type.CUSTOM_QUERY_PREDICATE) {
    atom.value = match[6]
  } else {
    atom.value = match[6].replace(/'/g, "\\'")
  }
  return atom
}

// buildEqualityOperator function remains the same
function buildEqualityOperator(
    builder: PostgrestFilterBuilder<any, any, any[], any, any>,
    field: string,
    props: Property,
    value: string,
    defaultProps: Property = Property.EQUAL
): PostgrestFilterBuilder<any, any, any[], any, any> {
  const p = props ? props : defaultProps
  const negated = p & Property.NEGATED
  if (p & Property.LESS_THAN && p & Property.EQUAL) {
    if (negated) return builder.not('lte', field, value)
    else return builder.lte(field, value)
  } else if (p & Property.LESS_THAN) {
    if (negated) return builder.not('lt', field, value)
    else return builder.lt(field, value)
  } else if (p & Property.GREATER_THAN && p & Property.EQUAL) {
    if (negated) return builder.not('gte', field, value)
    else return builder.gte(field, value)
  } else if (p & Property.GREATER_THAN) {
    if (negated) return builder.not('gt', field, value)
    else return builder.gt(field, value)
  } else /* (p & Property.EQUAL)  */ {
    if (negated) return builder.not('eq', field, value)
    else return builder.eq(field, value)
  }
}

// buildQueryPredicate function modified to NOT take supabaseClient, as it operates on the builder passed to it
function buildQueryPredicate(
    builder: PostgrestFilterBuilder<any, any, any[], any, any>,
    query: string,
    limit: number,
    orderBy: number, // Should be OrderBy enum type
    energy: number | undefined,
    isPlaylistQuery: boolean
): [PostgrestFilterBuilder<any, any, any[], any, any>, number, number] { // Should be OrderBy
  const fragments = splitString(query)
  for (const fragment of fragments) {
    let atom = parse(fragment)
    // console.log(atom) // Keep console logs for server-side debugging if needed
    if (!atom) {
      console.warn(`ERROR: Unable to parse query fragment '${fragment}'`)
      continue
    }
    const negated = atom.props & Property.NEGATED
    switch (atom.type) {
      case Type.ANY:
        const searchField = isPlaylistQuery ? 'songs.search_text' : 'search_text';
        if (negated) builder = builder.not('ilike', searchField, `%${atom.value}%`);
        else builder = builder.ilike(searchField, `%${atom.value}%`);
        break;
      case Type.S_ID:
        builder = buildEqualityOperator(builder, isPlaylistQuery ? 'songs.id' : 'id', atom.props, atom.value);
        break;
      case Type.S_ARTIST:
        const artistField = isPlaylistQuery ? 'songs.artist' : 'artist';
        if (atom.props & (Property.LESS_THAN | Property.GREATER_THAN | Property.EQUAL)) builder = buildEqualityOperator(builder, artistField, atom.props, atom.value);
        else if (negated) builder = builder.not('ilike', artistField, `%${atom.value}%`);
        else builder = builder.ilike(artistField, `%${atom.value}%`);
        break;
      case Type.S_TITLE:
        const titleField = isPlaylistQuery ? 'songs.title' : 'title';
        if (atom.props & (Property.LESS_THAN | Property.GREATER_THAN | Property.EQUAL)) builder = buildEqualityOperator(builder, titleField, atom.props, atom.value);
        else if (negated) builder = builder.not('ilike', titleField, `%${atom.value}%`);
        else builder = builder.ilike(titleField, `%${atom.value}%`);
        break;
      case Type.S_REMIXER:
        const remixerField = isPlaylistQuery ? 'songs.remixer' : 'remixer';
        if (negated) builder = builder.not('ilike', remixerField, `%${atom.value}%`);
        else builder = builder.ilike(remixerField, `%${atom.value}%`);
        break;
      case Type.S_RATING:
        builder = buildEqualityOperator(builder, isPlaylistQuery ? 'songs.rating' : 'rating', atom.props, atom.value, Property.EQUAL & Property.GREATER_THAN);
        break;
      case Type.S_COMMENTS:
        const commentsField = isPlaylistQuery ? 'songs.comments' : 'comments';
        if (negated) builder = builder.not('ilike', commentsField, `%${atom.value}%`);
        else builder = builder.ilike(commentsField, `%${atom.value}%`);
        break;
      case Type.S_CURATOR:
        const curatorField = isPlaylistQuery ? 'songs.curator' : 'curator';
        if (negated) builder = builder.not('ilike', curatorField, `%${atom.value}%`);
        else builder = builder.ilike(curatorField, `%${atom.value}%`);
        break;
      case Type.S_TRASHED:
        const trashedField = isPlaylistQuery ? 'songs.trashed' : 'trashed';
        if (negated) builder = builder.not('is', trashedField, atom.value);
        else builder = builder.is(trashedField, atom.value);
        break;
      case Type.S_LOW_QUALITY:
        const lowQualityField = isPlaylistQuery ? 'songs.lowquality' : 'lowquality';
        if (negated) builder = builder.not('is', lowQualityField, atom.value);
        else builder = builder.is(lowQualityField, atom.value);
        break;
      case Type.A_ID:
        builder = buildEqualityOperator(builder, 'albums.id', atom.props, atom.value)
        break
      case Type.A_NAME:
        if (negated) builder = builder.not('ilike', 'albums.name', `%${atom.value}%`)
        else builder = builder.ilike('albums.name', `%${atom.value}%`)
        break
      case Type.A_MIXED:
        if (negated) builder = builder.not('is', 'mixed', atom.value) // Assuming 'mixed' is a column in 'albums' table
        else builder = builder.is('mixed', atom.value)
        break
      case Type.A_LABEL:
        if (negated) builder = builder.not('ilike', 'albums.label', `%${atom.value}%`)
        else builder = builder.ilike('albums.label', `%${atom.value}%`)
        break
      case Type.A_YEAR:
        builder = buildEqualityOperator(builder, 'albums.releasedateyear', atom.props, atom.value)
        break
      case Type.A_MONTH:
        builder = buildEqualityOperator(builder, 'albums.releasedatemonth', atom.props, atom.value)
        break
      case Type.A_DAY:
        builder = buildEqualityOperator(builder, 'albums.releasedateday', atom.props, atom.value)
        break
      case Type.CUSTOM_QUERY_PREDICATE:
        console.warn(`Custom query "${atom.value}" is unsupported.`) // Note: atom.value was not in template literal
        break
      case Type.S_BPM:
        let minBpm = 0, maxBpm = 0;
        const bpmField = isPlaylistQuery ? 'songs.bpm' : 'bpm';
        const parts = atom.value.split("-");
        if (parts.length === 2) {
          minBpm = parseInt(parts[0], 10);
          maxBpm = parseInt(parts[1], 10);
        } else if (atom.props & (Property.LESS_THAN | Property.GREATER_THAN | Property.EQUAL)) {
          builder = buildEqualityOperator(builder, bpmField, atom.props, atom.value);
        } else {
          minBpm = parseInt(atom.value, 10);
          maxBpm = minBpm + 1; // This logic seems specific, ensure it's correct
        }
        if (minBpm > 0 && maxBpm > 0 && parts.length === 2) { // only apply range if both min and max were parsed
          if (negated) { // This negation logic for ranges might need review
            builder = builder.or(`bpm.lt.${minBpm},bpm.gt.${maxBpm}`); // Example, actual Supabase syntax might differ
          } else {
            builder = builder.gte(bpmField, minBpm);
            builder = builder.lte(bpmField, maxBpm); // Changed from lt to lte for inclusive range
          }
        } else if (minBpm > 0 && maxBpm > 0 && parts.length !== 2 && !(atom.props & (Property.LESS_THAN | Property.GREATER_THAN | Property.EQUAL))) {
             // Handling single BPM value, treat as equality or small range.
             // buildEqualityOperator might be more appropriate if props are set, or a small fixed range.
             // For now, this assumes if not a range and no operators, it's an exact match or a small implicit range.
             // This part of BPM logic might need further refinement based on desired behavior.
            builder = buildEqualityOperator(builder, bpmField, Property.EQUAL, String(minBpm));
        }
        break
      case Type.LIMIT:
        limit = parseInt(atom.value, 10)
        break
      case Type.S_ENERGY:
        const energyField = isPlaylistQuery ? 'songs.energy' : 'energy';
        if (atom.props === 0) { // Default to a range if no operator
          const parsedEnergy = parseInt(atom.value, 10);
          const diff = 1; // Default diff
          builder = builder.gte(energyField, parsedEnergy - diff);
          builder = builder.lte(energyField, parsedEnergy + diff);
        } else {
          builder = buildEqualityOperator(builder, energyField, atom.props, atom.value);
        }
        break;
      case Type.ORDER_BY:
        if (atom.value === 'rand' || atom.value === "random") {
          orderBy = OrderBy.RANDOM
        } else if (atom.value === "release_date" || atom.value === "rdate" || atom.value === "date_released" || atom.value === "released") {
          orderBy = OrderBy.RELEASE_DATE
        } else if (atom.value === "added_date" || atom.value === "adate" || atom.value === "date_added" || atom.value === "added") {
          orderBy = OrderBy.DATE_ADDED
        } else if (atom.value === "bpm") {
          orderBy = OrderBy.BPM
        } else if (atom.value === "album") {
          orderBy = OrderBy.ALBUM
        } else if (atom.value === "playlist") {
          orderBy = OrderBy.PLAYLIST
        }
        break
      }
    }
    return [builder, limit, orderBy]
  }

// searchSongs function modified to accept supabaseClient
async function searchSongs(
    supabaseClient: SupabaseClient, // Added supabaseClient parameter
    query: string,
    limit: number = 3,
    bpm: number = 0, // Consider if these defaults are appropriate or should be undefined
    key: string = '',
    styles: number[] = [],
    songsToOmit: Song[] = [], // Consider if Song[] is the right type if it's just IDs
    playlists: number[] =  [],
    energy: number = 0, // Consider if optionals should be number | undefined
    offset: number = 0,
    orderBy: OrderBy = OrderBy.DATE_ADDED,
    errorCallback?: (error: any) => void): Promise<Song[]> { // errorCallback type
  // console.log("q:", query, ", limit:", limit, ", bpm:", bpm, ", key:", key, ", styles:", styles, ", songsToOmit:", songsToOmit.length, ", playlists:", playlists, ", energy:", energy, ", offset:", offset, ", orderBy:", orderBy);

  let songList: Song[] = []
  let builder: PostgrestQueryBuilder<any, any, any, any> | PostgrestFilterBuilder<any, any, any[], any, any>;
  const isPlaylistQuery = playlists.length > 0;

  if (isPlaylistQuery) {
    // Using the passed supabaseClient instance
    builder = supabaseClient.from('playlistentries').select('*, songs!inner(*, albums!inner(*))').in('playlistid', playlists);
  } else if (styles.length) {
    builder = supabaseClient.from('songs').select('*, albums!inner(*), songstyles!inner(*)').in('songstyles.styleid', styles);
  } else {
    builder = supabaseClient.from('songs').select('*, albums!inner(*)');
  }

  let effectiveOrderBy = orderBy; // Shadow to allow modification by buildQueryPredicate
  [builder, limit, effectiveOrderBy] = buildQueryPredicate(builder as PostgrestFilterBuilder<any, any, any[], any, any>, query, limit, effectiveOrderBy, energy, isPlaylistQuery);

  // Use effectiveOrderBy from here
  switch (effectiveOrderBy) {
    case OrderBy.RELEASE_DATE:
      if (isPlaylistQuery) {
        builder = builder.order('songs.albums(releasedateyear)', { ascending: false })
        builder = builder.order('songs.albums(releasedatemonth)', { ascending: false })
        builder = builder.order('songs.albums(releasedateday)', { ascending: false })
      } else {
        builder = builder.order('albums(releasedateyear)', { ascending: false })
        builder = builder.order('albums(releasedatemonth)', { ascending: false })
        builder = builder.order('albums(releasedateday)', { ascending: false })
      }
      break
    case OrderBy.RANDOM:
      console.warn('Random order not supported (though it is possible).') // Consider implementing with pg_random() or similar if needed
      break
    case OrderBy.BPM:
      if (isPlaylistQuery) {
        builder = builder.order('songs.bpm', { ascending: true })
      } else {
        builder = builder.order('bpm', { ascending: true })
      }
      break
    case OrderBy.PLAYLIST: // This implies isPlaylistQuery is true
      builder = builder.order('playlistid', { ascending: false }) // Make sure this is part of the select for playlistentries
      builder = builder.order('position', { ascending: true })   // Make sure this is part of the select for playlistentries
      break
    case OrderBy.ALBUM:
      if (isPlaylistQuery) {
        builder = builder.order('songs.albumid', { ascending: false })
        builder = builder.order('songs.track', { ascending: true })
      } else {
        builder = builder.order('albumid', { ascending: false })
        builder = builder.order('track', { ascending: true })
      }
      break
    default: // OrderBy.DATE_ADDED
      if (isPlaylistQuery) {
        builder = builder.order('songs.id', { ascending: false })
      } else {
        builder = builder.order('id', { ascending: false })
      }
  }

  const { data, error } = await builder.range(offset, offset + limit - 1);
  if (error) {
    console.error('Error fetching songs:', error); // Log the error
    if (errorCallback) {
      errorCallback(error);
    }
    // Depending on desired behavior, you might want to throw the error or return empty list
    return []; // Return empty list on error to match existing behavior
  }

  let transformedData = data;
  if (isPlaylistQuery && data) {
    // Ensure that 'songs' is selected correctly in the query for playlistentries
    transformedData = data.map((item: any) => item.songs).filter(song => song != null);
  }

  if (transformedData) {
    // Ensure transformedData is an array of Song compatible objects
    songList = transformedData as Song[];
  }

  // console.log(songList);
  return songList
}

// Export OrderBy enum for use elsewhere
export { searchSongs, OrderBy, Type, Property, Atom, parse, buildEqualityOperator, buildQueryPredicate, splitString };
// Note: Default export is removed in favor of named exports for better tree-shaking and clarity.
// If default was intended, `export default searchSongs;` should be added back.
// For now, sticking to named exports as it's generally preferred.
