import { PostgrestQueryBuilder, PostgrestFilterBuilder } from '@supabase/postgrest-js';
import { supabase } from '../App';
import { Tables } from '../database.types';

enum OrderBy {
  DATE_ADDED,
  RELEASE_DATE,
  RANDOM,
  BPM,
  ALBUM,
  PLAYLIST
};

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
};


enum Property {
  NONE = 0x00,
  NEGATED = 0x01,
  CASE_SENSITIVE = 0x02,
  LESS_THAN = 0x04,
  GREATER_THAN = 0x08,
  EQUAL = 0x10,
};


class Atom {
  value: string = '';
  type: Type = Type.ANY;
  props: number =  0;

  clear = () => {
    this.value = '';
    this.type = Type.ANY;
    this.props = 0;
  }
}


function splitString(str: string): string[] {
  const regex = /[^\s"]+|"([^"]*)"/g;
  const matches = [];
  let match;

  while ((match = regex.exec(str))) {
    if (match[1]) {
      // Matched a quoted string, remove the quotes
      matches.push(match[1]);
    } else {
      // Matched a non-quoted word
      matches.push(match[0]);
    }
  }

  return matches;
}


function parse(queryFragment: string): Atom | undefined {
  let atom = new Atom();

  // Replace boost::regex with JavaScript regular expression
  const regex = /^(-)?((id|a|artist|t|title|remixer|r|rating|comments|c|curator|e|energy|bpm|trashed|lowq|aid|n|album|m|mixed|l|label|y|year|month|day|q|query|limit|o|order|orderby|orderBy):)?(<|>)?(=)?(.+)$/;
  const match = queryFragment.match(regex);
  if (!match) {
    return undefined;
  }

  if (match[1]) {
    atom.props |= Property.NEGATED;
  }
  if (match[4]) {
    if (match[4] === "<") {
      atom.props |= Property.LESS_THAN;
    } else {
      atom.props |= Property.GREATER_THAN;
    }
  }
  if (match[5]) {
    atom.props |= Property.EQUAL;
  }

  // Set type
  if (match[2])  
 {
    switch (match[3]) {
      case "id":
        atom.type = Type.S_ID;
        break;
      case "a":
      case "artist":
        atom.type = Type.S_ARTIST;
        break;
      case "t":
      case "title":
        atom.type = Type.S_TITLE;
        break;
      case "remixer":
        atom.type = Type.S_REMIXER;
        break;
      case "r":
      case "rating":
        atom.type = Type.S_RATING;
        break;
      case "comments":
        atom.type = Type.S_COMMENTS;
        break;
      case "c":
      case "curator":
        atom.type = Type.S_CURATOR;
        break;
      case "e":
      case "energy":
        atom.type = Type.S_ENERGY;
        break;
      case "bpm":
        atom.type = Type.S_BPM;
        break;
      case "trashed":
        atom.type = Type.S_TRASHED;
        break;
      case "lowq":
        atom.type = Type.S_LOW_QUALITY;
        break;
      case "aid":
        atom.type = Type.A_ID;
        break;
      case "n":
      case "album":
        atom.type = Type.A_NAME;
        break;
      case "m":
      case "mixed":
        atom.type = Type.A_MIXED;
        break;
      case "label":
        atom.type = Type.A_LABEL;
        break;
      case "y":
      case "year":
        atom.type = Type.A_YEAR;
        break;
      case "month":
        atom.type = Type.A_MONTH;
        break;
      case "day":
        atom.type = Type.A_DAY;
        break;
      case "q":
      case "query":
        atom.type = Type.CUSTOM_QUERY_PREDICATE;
        break;
      case "limit":
        atom.type = Type.LIMIT;
        break;
      case "l":
        // Check if the value is a number
        const numRegex = /^[0-9]+$/;
        if (numRegex.test(match[6])) {
          atom.type = Type.LIMIT;
        } else {
          atom.type = Type.A_LABEL;
        }
        break;
      case "o":
      case "order":
      case "orderby":
      case "orderBy":
        atom.type = Type.ORDER_BY;
        break;
      default:
        // Error
        return undefined;
    }
  }

  // Set value
  if (atom.type === Type.CUSTOM_QUERY_PREDICATE) {
    atom.value = match[6];
  } else {
    // Replace single quotes with escaped single quotes
    atom.value = match[6].replace(/'/g, "\\'");
  }

  return atom;
}


function buildEqualityOperator(
    builder: PostgrestFilterBuilder<any, any, any[], 'songs', any>,
    field: string,
    props: Property,
    value: string,
    defaultProps: Property = Property.EQUAL
): PostgrestFilterBuilder<any, any, any[], 'songs', any> {
  const p = props ? props : defaultProps;
  const negated = p & Property.NEGATED;
  if (p & Property.LESS_THAN && p & Property.EQUAL) {
    if (negated) return builder.not('lte', field, value);
    else return builder.lte(field, value);
  } else if (p & Property.LESS_THAN) {
    if (negated) return builder.not('lt', field, value);
    else return builder.lt(field, value);
  } else if (p & Property.GREATER_THAN && p & Property.EQUAL) {
    if (negated) return builder.not('gte', field, value);
    else return builder.gte(field, value);
  } else if (p & Property.GREATER_THAN) {
    if (negated) return builder.not('gt', field, value);
    else return builder.gt(field, value);
  } else /* (p & Property.EQUAL)  */ {
    if (negated) return builder.not('eq', field, value);
    else return builder.eq(field, value);
  }
}


function buildQueryPredicate(
    builder: PostgrestFilterBuilder<any, any, any[], 'songs', any>,
    query: string,
    limit: number,
    orderBy: number,
    energy?: number
): [PostgrestFilterBuilder<any, any, any[], 'songs', any>, number /* limit */, number /* OrderBy */] {
  // Split query into fragments
  const fragments = query.split(" ");

  for (const fragment of fragments) {
    let atom = parse(fragment);
    console.log(atom);
    if (!atom) {
      console.warn(`ERROR: Unable to parse query fragment '${fragment}'`);
      continue;
    }

    const negated = atom.props & Property.NEGATED;

    // Handle different atom types
    switch (atom.type) {
      case Type.ANY:
        if (negated) builder = builder.not('ilike', 'search_text', `%${atom.value}%`);
        else builder = builder.ilike('search_text', `%${atom.value}%`);
        break;
      case Type.S_ID:
        builder = buildEqualityOperator(builder, 'id', atom.props, atom.value);
        break;
      case Type.S_ARTIST:
        if (atom.props & (Property.LESS_THAN | Property.GREATER_THAN | Property.EQUAL)) builder = buildEqualityOperator(builder, 'artist', atom.props, atom.value);
        else if (negated) builder = builder.not('ilike', 'artist', `%${atom.value}%`);
        else builder = builder.ilike('artist', `%${atom.value}%`);
        break;
      case Type.S_TITLE:
        if (atom.props & (Property.LESS_THAN | Property.GREATER_THAN | Property.EQUAL)) builder = buildEqualityOperator(builder, 'title', atom.props, atom.value);
        else if (negated) builder = builder.not('ilike', 'title', `%${atom.value}%`);
        else builder = builder.ilike('title', `%${atom.value}%`);
        break;
      case Type.S_REMIXER:
        if (negated) builder = builder.not('ilike', 'title', `%${atom.value}%`);
        else builder = builder.ilike('title', `%${atom.value}%`);
        break;
      case Type.S_RATING:
        builder = buildEqualityOperator(builder, 'rating', atom.props, atom.value);
        break;
      case Type.S_COMMENTS:
        if (negated) builder = builder.not('ilike', 'comments', `%${atom.value}%`);
        else builder = builder.ilike('comments', `%${atom.value}%`);
        break;
      case Type.S_CURATOR:
        if (negated) builder = builder.not('ilike', 'curator', `%${atom.value}%`);
        else builder = builder.ilike('curator', `%${atom.value}%`);
        break;
      case Type.S_TRASHED:
        if (negated) builder = builder.not('is', 'trashed', atom.value);
        else builder = builder.is('trashed', atom.value);
        break;
      case Type.S_LOW_QUALITY:
        if (negated) builder = builder.not('is', 'lowQuality', atom.value);
        else builder = builder.is('lowQuality', atom.value);
        break;
      case Type.A_ID:
        builder = buildEqualityOperator(builder, 'albums.id', atom.props, atom.value);
        break;
      case Type.A_NAME:
        if (negated) builder = builder.not('ilike', 'albums.name', `%${atom.value}%`);
        else builder = builder.ilike('albums.name', `%${atom.value}%`);
        break;
      case Type.A_MIXED:
        if (negated) builder = builder.not('is', 'mixed', atom.value);
        else builder = builder.is('mixed', atom.value);
        break;
      case Type.A_LABEL:
        if (negated) builder = builder.not('ilike', 'albums.label', `%${atom.value}%`);
        else builder = builder.ilike('albums.label', `%${atom.value}%`);
        break;
      case Type.A_YEAR:
        builder = buildEqualityOperator(builder, 'albums.releaseDateYear', atom.props, atom.value);
        break;
      case Type.A_MONTH:
        builder = buildEqualityOperator(builder, 'albums.releaseDateDayMonth', atom.props, atom.value);
        break;
      case Type.A_DAY:
        builder = buildEqualityOperator(builder, 'albums.releaseDateDay', atom.props, atom.value);
        break;
      case Type.CUSTOM_QUERY_PREDICATE:
        console.warn(`Custom query "{atom.value}" is unsupported.`);
        break;
      case Type.S_BPM:
        // Handle BPM range
        let minBpm = 0, maxBpm = 0;
        const parts = atom.value.split("-");
        if (parts.length === 2) {
          minBpm = parseInt(parts[0], 10);
          maxBpm = parseInt(parts[1], 10);
        } else if (atom.props & (Property.LESS_THAN | Property.GREATER_THAN | Property.EQUAL)) {
          builder = buildEqualityOperator(builder, 'bpm', atom.props, atom.value);
        } else {
          minBpm = parseInt(atom.value, 10);
          maxBpm = minBpm + 1;
        }
        if (minBpm > 0 && maxBpm > 0) {
          if (negated) builder = builder.not('gte', 'bpm', atom.value);
          else builder = builder.gte('bpm', atom.value);
          if (negated) builder = builder.not('lt', 'bpm', atom.value);
          else builder = builder.lt('bpm', atom.value);
          // if (maxBpm > 120) predicate += " or s.bpm between " + (minBpm / 2) + " and " + (maxBpm / 2);
          // if (minBpm <= 100) predicate += " or s.bpm between " + (minBpm * 2) + " and " + (maxBpm * 2);
        }
        break;
      case Type.LIMIT:
        limit = parseInt(atom.value, 10);
        break;
      case Type.S_ENERGY:
        // If an operator property is specified, it will overwrite what is used in the options build. Otherwise, we default to it.
        if (atom.props === 0) {
          energy = parseInt(atom.value, 10);
          const diff = 1;
          builder = builder.gte('energy', energy - diff);
          builder = builder.lte('energy', energy + diff);
        } else {
          builder = buildEqualityOperator(builder, 'energy', atom.props, atom.value);
        }
        break;
      case Type.ORDER_BY:
        if (atom.value === 'rand' || atom.value === "random") {
          orderBy = OrderBy.RANDOM;
        } else if (atom.value === "release_date" || atom.value === "rdate" || atom.value === "date_released" || atom.value === "released") {
          orderBy = OrderBy.RELEASE_DATE;
        } else if (atom.value === "added_date" || atom.value === "adate" || atom.value === "date_added" || atom.value === "added") {
          orderBy = OrderBy.DATE_ADDED;
        } else if (atom.value === "bpm") {
          orderBy = OrderBy.BPM;
        } else if (atom.value === "album") {
          orderBy = OrderBy.ALBUM;
        } else if (atom.value === "playlist") {
          orderBy = OrderBy.PLAYLIST;
        }
        break;
      }
    }

    return [builder, limit, orderBy];
  }

  // function buildOptionPredicate(bpm, key, styles, songsToOmit, playlists, limit, energy, orderBy) {
  //   const ss = [];
  //   function buildOptionPredicate(bpm, key, styles, songsToOmit, playlists, limit, energy, orderBy) {
  // const ss = [];

  // // Assuming CamelotKeys is an object with a map and rmap property
  // if (CamelotKeys.rmap && CamelotKeys.rmap.hasOwnProperty(key)) {
  //   // Key lock always on for now
  //   ss.push(" (");
  //   let num = 0;
  //   const keyIndex = CamelotKeys.rmap[key];

  //   switch (keyIndex) {
  //     // Handle B keys (0-11)
  //     case 5:  // B = 1B
  //       ss.push("tonicKey = '" + CamelotKeys.map["1A"] + "' OR tonicKey = '" + CamelotKeys.map["12B"] + "'");
  //       num++;
  //       break;
  //     case 6:  // Gb = 2B
  //     case 7:  // Db = 3B
  //     case 8:  // Ab = 4B
  //     case 9:  // Eb = 5B
  //     case 10: // Bb = 6B
  //     case 11: // F = 7B
  //       const offset = keyIndex - 5;
  //       ss.push("tonicKey = '" + CamelotKeys.map[(offset - 1).toString() + "A"] + "'"); // Key before
  //       if (num < 2) ss.push(" OR ");
  //       ss.push("tonicKey = '" + CamelotKeys.map[offset.toString() + "B"] + "'"); // Current key
  //       num = 2;
  //       break;
  //     case 0:  // C = 8B
  //     case 1:  // G = 9B
  //     case 2:  // D = 10B
  //     case 3:  // A = 11B
  //     case 4:  // E = 12B
  //       const nextOffset = (keyIndex + 1) % 12;
  //       ss.push("tonicKey = '" + CamelotKeys.map[(nextOffset + 1).toString() + "A"] + "'"); // Key after
  //       if (num < 2) ss.push(" OR ");
  //       ss.push("tonicKey = '" + CamelotKeys.map[nextOffset.toString() + "B"] + "'"); // Current key
  //       num = 2;
  //       if (keyIndex === 4) { // Handle wrapping around for E (12B)
  //         if (num < 3) ss.push(" OR ");
  //         ss.push("tonicKey = '" + CamelotKeys.map["12B"] + "'"); // Current key (again)
  //         if (num < 4) ss.push(" OR ");
  //         ss.push("tonicKey = '" + CamelotKeys.map["1A"] + "'"); // Key before (wrapping)
  //         num = 4;
  //       }
  //       break;

  //     // Handle A keys (12-23)
  //     case 17: // Abm = 1A
  //     case 18: // Ebm = 2A
  //     case 19: // Bbm = 3A
  //     case 20: // Fm = 4A
  //     case 21: // Cm = 5A
  //     case 22: // Gm = 6A
  //     case 23: // Dm = 7A
  //       const aOffset = keyIndex - 11;
  //       ss.push("tonicKey = '" + CamelotKeys.map[(aOffset - 1).toString() + "B"] + "'"); // Key before
  //       if (num < 2) ss.push(" OR ");
  //       ss.push("tonicKey = '" + CamelotKeys.map[aOffset.toString() + "A"] + "'"); // Current key
  //       num = 2;
  //       break;
  //     case 12: // Am = 8A
  //     case 13: // Em = 9A
  //     case 14: // Bm = 10A
  //     case 15: // Gbm = 11A
  //     case 16: // Csm = 12A
  //       const nextAOffset = (keyIndex + 1) % 12;
  //       ss.push("tonicKey = '" + CamelotKeys.map[(nextAOffset + 1).toString() + "B

  //   const pitchPctMax = 8; // TODO: Should be a setting
  //   const maxBpm = Math.floor(bpm * (100 + pitchPctMax) / 100);
  //   const minBpm = Math.floor(bpm * (100 - pitchPctMax) / 100);

  //   if (maxBpm > 0 && minBpm > 0) {
  //     ss.push(" (bpm BETWEEN " + minBpm + " AND " + maxBpm + ")");
  //     if (maxBpm > 120) {
  //       ss.push(" OR (bpm BETWEEN " + Math.floor(minBpm / 2) + " AND " + Math.floor(maxBpm / 2) + ")");
  //     }
  //     if (minBpm <= 90) {
  //       ss.push(" OR (bpm BETWEEN " + (minBpm * 2) + " AND " + (maxBpm * 2) + ")");
  //     }
  //   }


  //   if (styles.length > 0) {
  //     ss.push(" AND EXISTS (SELECT 1 FROM SongStyles g WHERE s.id = g.songId AND g.styleId IN (" + styles.map(s => s.getId()).join(",") + "))");
  //   }

  //   if (songsToO omit.length > 0) {
  //     ss.push(" AND s.id NOT IN (" + songsToOmit.map(s => s.getId()).join(",") + "))");
  //   }

  //   if (playlists.length > 0) {
  //     ss.push(" AND pe.playlistid IN (" + playlists.map(p => p.getId()).join(",") + ")");
  //   }

  //   let groupBy = "";
  //   if (playlists.length > 0) {
  //     groupBy = "pe.id, ";
  //   }
  //   groupBy += "s.id";

  //   let orderClause;
  //   switch (orderBy) {
  //     case "RELEASE_DATE":
  //       orderClause = "a.releaseDateYear DESC, a.releaseDateMonth DESC, a.releaseDateDay DESC";
  //       break;
  //     case "RANDOM":
  //       orderClause = "RAND()";
  //       break;
  //     case "BPM":
  //       orderClause = "s.bpm ASC";
  //       break;
  //     case "PLAYLIST":
  //       orderClause = "pe.playlistid DESC, pe.position ASC";
  //       break;
  //     case "ALBUM":
  //       orderClause = "a.id DESC, CAST(s.track AS UNSIGNED) ASC, s.track ASC";
  //       break;
  //     default:
  //       orderClause = "s.id DESC";
  //   }

  //   ss.push(" GROUP BY " + groupBy);
  //   ss.push(" ORDER BY " + orderClause);
  //   ss.push(" LIMIT " + limit);

  //   return ss.join(" ");
  // }


async function searchSongs(
    query: string,
    limit: number = 3,
    bpm: number = 0,
    key: string = '',
    styles: number[] = [],
    songsToOmit: Tables<'songs'>[] = [],
    playlists: number[] =  [],
    energy: number = 0,
    orderBy: number = OrderBy.DATE_ADDED,
    errorCallback: undefined): Promise<Tables<'songs'>[]> {
  console.log("q:", query, ", bpm:", bpm, ", key:", key, ", styles:", styles, ", playlists:", playlists, ", limit:", limit);

  let songList: Tables<'songs'>[] = []

  let builder: PostgrestQueryBuilder<any, any, 'songs', any> | PostgrestFilterBuilder<any, any, any[], 'songs', any>  = supabase.from('songs');
  if (playlists.length) builder = builder.select('*, albums!inner(*), playlistentries!inner(*)').in('playlistentries.playlistId', playlists);
  else if (styles.length) builder = builder.select('*, albums!inner(*), songstyles!inner(*)').in('songstyles.styleId', styles);
  else builder = builder.select('*, albums!inner(*)');

  [builder, limit, orderBy] = buildQueryPredicate(builder, query, limit, orderBy, energy);
  //   sql += await buildOptionPredicate(bpm, key, styles, songsToOmit, playlists, limit, orderBy);
  const { data, error } = await builder.limit(limit);
  if (error) {
    console.log(error);
  }
  if (data) {
    data.forEach((song: Tables<'songs'>) => {
      songList.push(song);
    })
  }

//   console.debug("Query:", sql);

//   // Replace database access with placeholder logic
//   for (let i = 0; i < 2; i++) {
//     try {
//       // Simulate fetching data
//       const mockData = [
//         { /* Song data */ },
//         { /* Song data */ },
//         // ...
//       ];
//       for (const songData of mockData) {
//         const song = new Song();
//         // Populate song data using songData (implementation needed)
//         song.setId(/* song id */);
//         song.setArtist(/* song artist */);

//         const album = new Album();
//         // Populate album data using songData (implementation needed)
//         album.setId(/* album id */);
//         album.setArtist(/* album artist */);
//         song.setAlbum(album);

//         songs.push(back);
//       }
//       return songs;
//     } catch (error) {
//       console.warn("Error simulating data fetching:", error);
//       if (i === 0) {
//         console.log("Retrying..."); // Simulate reconnection attempt (logic needed)
//       } else {
//         console.warn(error.message);
//         if (errorCallback) {
//           errorCallback(error.message);
//         } else {
//           console.warn("Undefined callback. Unable to send error.");
//         }
//       }
//     }
//   }

  console.log(songList);
  return songList;
}


export default searchSongs;
export {searchSongs, OrderBy};
