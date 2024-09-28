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

  if (match[1].length > 0) {
    atom.props |= Property.NEGATED;
  }
  if (match[4].length > 0) {
    if (match[4] === "<") {
      atom.props |= Property.LESS_THAN;
    } else {
      atom.props |= Property.GREATER_THAN;
    }
  }
  if (match[5].length > 0) {
    atom.props |= Property.EQUAL;
  }

  // Set type
  if (match[2].length > 0)  
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


function buildEqualityOperator(props: Property, defaultOp: string = '=') {
  if (props & Property.LESS_THAN && props & Property.EQUAL) {
    return "<=";
  } else if (props & Property.LESS_THAN) {
    return "<";
  } else if (props & Property.GREATER_THAN && props & Property.EQUAL) {
    return ">=";
  } else if (props & Property.GREATER_THAN) {
    return ">";
  } else if (props & Property.EQUAL) {
    return "=";
  } else {
    return defaultOp;
  }
}


function buildQueryPredicate(query: string, limit?: number, energy?: number, orderBy?: number) {
  // Split query into fragments
  const fragments = query.split(" ");

  let predicate = "";
  for (const fragment of fragments) {
    let atom = parse(fragment);
    if (!atom) {
      console.warn(`ERROR: Unable to parse query fragment '${fragment}'`);
      continue;
    }

    predicate += " and ";
    if (atom.props & Property.NEGATED) {
      predicate += "not ";
    }

    // Handle different atom types
    switch (atom.type) {
      case Type.ANY:
        predicate += `(
          ifnull(s.artist, '') like '%<span class="math-inline">\{atom\.value\}%'
or ifnull\(s\.title, ''\) like '%</span>{atom.value}%'
          or ifnull(s.remixer, '') like '%<span class="math-inline">\{atom\.value\}%'
or ifnull\(s\.comments, ''\) like '%</span>{atom.value}%'
          or ifnull(s.curator, '') like '%<span class="math-inline">\{atom\.value\}%'
or ifnull\(a\.name, ''\) like '%</span>{atom.value}%'
        )`;
        break;
      case Type.S_ID:
        predicate += `s.id ${buildEqualityOperator(atom.props)} ${atom.value}`;
        break;
      case Type.S_ARTIST:
      case Type.S_TITLE:
        predicate += `ifnull(s.${atom.type === Type.S_ARTIST ? 'artist' : 'title'}, '') `;
        if (atom.props & (Property.LESS_THAN | Property.GREATER_THAN | Property.EQUAL)) {
          predicate += `<span class="math-inline">\{buildEqualityOperator\(atom\.props\)\} '</span>{atom.value}'`;
        } else {
          predicate += `like '%${atom.value}%'`;
        }
        break;
      case Type.S_REMIXER:
        predicate += `ifnull(s.remixer, '') like '%${atom.value}%'`;
        break;
      case Type.S_RATING:
        predicate += `s.rating ${buildEqualityOperator(atom.props, ">=")} ${atom.value}`;
        break;
      case Type.S_COMMENTS:
      case Type.S_CURATOR:
        predicate += `ifnull(s.<span class="math-inline">\{atom\.type \=\=\= Type\.S\_COMMENTS ? 'comments' \: 'curator'\}, ''\) like '%</span>{atom.value}%'`;
        break;
      case Type.S_TRASHED:
      case Type.S_LOW_QUALITY:
        predicate += `s.${atom.type === Type.S_TRASHED ? 'trashed' : 'lowQuality'} = ${atom.value}`;
        break;
      case Type.A_ID:
        predicate += `a.id ${buildEqualityOperator(atom.props)} ${atom.value}`;
        break;
      case Type.A_NAME:
        predicate += `ifnull(a.name, '') like '%${atom.value}%'`;
        break;
      case Type.A_MIXED:
        predicate += `a.mixed = ${atom.value}`;
        break;
      case Type.A_LABEL:
        predicate += `ifnull(a.label, '') like '%${atom.value}%'`;
        break;
      case Type.A_YEAR:
      case Type.A_MONTH:
      case Type.A_DAY:
        const key = atom.type === Type.A_YEAR ? 'releaseDateYear' : (atom.type === Type.A_MONTH ? 'releaseDateMonth' : 'releaseDateDay');
        predicate += `a.${key} ${buildEqualityOperator(atom.props)} ${atom.value}`;
        break;
      case Type.CUSTOM_QUERY_PREDICATE:
        predicate += atom.value;
        break;
        case Type.S_BPM:
          // Handle BPM range
          let minBpm = 0, maxBpm = 0;
          const parts = atom.value.split("-");
          if (parts.length === 2) {
            minBpm = parseInt(parts[0], 10);
            maxBpm = parseInt(parts[1], 10);
          } else if (buildEqualityOperator(atom.props, "").length > 0) {
            predicate += `s.bpm ${buildEqualityOperator(atom.props)} ${atom.value}`;
          } else {
            minBpm = parseInt(atom.value, 10);
            maxBpm = minBpm + 1;
          }
          if (minBpm > 0 && maxBpm > 0) {
            predicate += "(s.bpm between " + minBpm + " and " + maxBpm;
            if (maxBpm > 120) predicate += " or s.bpm between " + (minBpm / 2) + " and " + (maxBpm / 2);
            if (minBpm <= 100) predicate += " or s.bpm between " + (minBpm * 2) + " and " + (maxBpm * 2);
            predicate += ")";
          }
          break;
        case Type.LIMIT:
          limit = parseInt(atom.value, 10);
          predicate += "true";
          break;
        case Type.S_ENERGY:
          // If an operator property is specified, it will overwrite what is used in the options build. Otherwise, we default to it.
          if (atom.props === 0) {
            energy = parseInt(atom.value, 10);
            predicate += "true";
          } else {
            predicate += `s.energy ${buildEqualityOperator(atom.props)} ${atom.value}`;
          }
          break;
        case Type.ORDER_BY:
          if (!atom.value.localeCompare("rand") || !atom.value.localeCompare("random")) {
            orderBy = OrderBy.RANDOM;
          } else if (!atom.value.localeCompare("release_date") || !atom.value.localeCompare("rdate") || !atom.value.localeCompare("date_released") || !atom.value.localeCompare("released")) {
            orderBy = OrderBy.RELEASE_DATE;
          } else if (!atom.value.localeCompare("added_date") || !atom.value.localeCompare("adate") || !atom.value.localeCompare("date_added") || !atom.value.localeCompare("added")) {
            orderBy = OrderBy.DATE_ADDED;
          } else if (!atom.value.localeCompare("bpm")) {
            orderBy = OrderBy.BPM;
          } else if (!atom.value.localeCompare("album")) {
            orderBy = OrderBy.ALBUM;
          } else if (!atom.value.localeCompare("playlist")) {
            orderBy = OrderBy.PLAYLIST;
          }
          predicate += "true";
          break;
      }
    }
    return predicate;
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

  //   if (energy > 0) {
  //     const diff = /* How to access settings in your JS code */; // Replace with logic to get "search.energyGap"
  //     ss.push(" AND (energy BETWEEN " + (energy - diff) + " AND " + (energy + diff) + ")");
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
    playlists: Tables<'playlists'>[] =  [],
    energy: number = 0,
    musicVideoMode: boolean = false,
    orderBy: number = OrderBy.DATE_ADDED,
    errorCallback: undefined): Promise<Tables<'songs'>[]> {
  console.log("q:", query, ", bpm:", bpm, ", key:", key, ", styles:", ", limit:", limit);

  let songList: Tables<'songs'>[] = []
  let builder: any = supabase.from('songs');
  if (styles.length) builder = builder.select('*, songstyles!inner(*)').in('songstyles.styleId', styles);
  else builder = builder.select();
  if (query.length) {
    // search_text is computed column
    // alter table songs add column search_text text generated always as (coalesce(artist,'') || ' ' || coalesce(title,'') || ' ' || coalesce(remixer,'') || ' ' || coalesce(comments,'') || ' ' || coalesce(curator,'')) stored;
    let q: string = query.split(' ').map(x => `%${x}%`)[0];
    console.log('query: ' + q);
    builder = builder.ilike('search_text', q);
  }
  const { data, error } = await builder.limit(limit);
  if (error) {
    console.log(error);
  }
  if (data) {
    data.forEach((song: Tables<'songs'>) => {
      songList.push(song);
    })
  }
//   let sql;
//   if (musicVideoMode) {
//     sql = `
//       SELECT s.*, s.id as songid, s.artist as songartist, GROUP_CONCAT(ss.styleid) as styleIds,
//              a.*, a.id as albumid, a.artist as albumartist, v.filepath as mvFilePath,
//              v.thumbnailFilePath as mvTnFilePath
//       FROM Songs s
//       INNER JOIN Albums a ON s.albumid = a.id
//       INNER JOIN MusicVideos v ON s.musicVideoId=v.id
//       LEFT JOIN SongStyles ss ON ss.songid=s.id
//       WHERE TRUE`;
//   } else if (playlists.length > 0) {
//     sql = `
//       SELECT s.*, s.id as songid, s.artist as songartist, GROUP_CONCAT(ss.styleid) as styleIds,
//              a.*, a.id as albumid, a.artist as albumartist
//       FROM PlaylistEntries pe
//       LEFT JOIN Songs s ON pe.songid=s.id
//       INNER JOIN Albums a ON s.albumid = a.id
//       LEFT JOIN SongStyles ss ON ss.songid=s.id
//       WHERE TRUE`;
//   } else {
//     sql = `
//       SELECT s.*, s.id as songid, s.artist as songartist, GROUP_CONCAT(ss.styleid) as styleIds,
//              a.*, a.id as albumid, a.artist as albumartist
//       FROM Songs s
//       INNER JOIN Albums a ON s.albumid = a.id
//       LEFT JOIN SongStyles ss ON ss.songid=s.id
//       WHERE TRUE`;
//   }

//   try {
//     // Assuming buildQueryPredicate and buildOptionPredicate are converted functions
//     sql += await buildQueryPredicate(query, limit, energy, orderBy);
//     sql += await buildOptionPredicate(bpm, key, styles, songsToOmit, playlists, limit, energy, orderBy);
//   } catch (error) {
//     console.warn("ERROR: Error parsing query.", error);
//     if (errorCallback) {
//       errorCallback(error.message);
//     } else {
//       console.warn("Undefined callback. Unable to send error.");
//     }
//     return songs;
//   }

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

//         if (musicVideoMode) {
//           const video = new MusicVideo();
//           // Populate video data using songData (implementation needed)
//           video.setId(/* video id */);
//           video.setFilePath(/* video filepath */);
//           video.setThumbnailFilePath(/* video thumbnail filepath */);
//           song.setMusicVideo(video);
//         }

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
