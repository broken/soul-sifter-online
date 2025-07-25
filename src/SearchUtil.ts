import { PostgrestQueryBuilder, PostgrestFilterBuilder } from '@supabase/postgrest-js'

import { supabase } from './components/App'
import { Song } from './model.types'


enum OrderBy {
  DATE_ADDED,
  RELEASE_DATE,
  RANDOM,
  BPM,
  ALBUM,
  PLAYLIST
}


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


enum Property {
  NONE = 0x00,
  NEGATED = 0x01,
  CASE_SENSITIVE = 0x02,
  LESS_THAN = 0x04,
  GREATER_THAN = 0x08,
  EQUAL = 0x10,
}


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


function splitString(str: string): string[] {
  const regex = /[^\s"]+|"([^"]*)"/g
  const matches = []
  let match

  while ((match = regex.exec(str))) {
    if (match[1]) {
      // Matched a quoted string, remove the quotes
      matches.push(match[1])
    } else {
      // Matched a non-quoted word
      matches.push(match[0])
    }
  }

  return matches
}


function parse(queryFragment: string): Atom | undefined {
  let atom = new Atom()

  // Replace boost::regex with JavaScript regular expression
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

  // Set type
  if (match[2])  
 {
    switch (match[3]) {
      case "id":
        atom.type = Type.S_ID
        break
      case "a":
      case "artist":
        atom.type = Type.S_ARTIST
        break
      case "t":
      case "title":
        atom.type = Type.S_TITLE
        break
      case "remixer":
        atom.type = Type.S_REMIXER
        break
      case "r":
      case "rating":
        atom.type = Type.S_RATING
        break
      case "comments":
        atom.type = Type.S_COMMENTS
        break
      case "c":
      case "curator":
        atom.type = Type.S_CURATOR
        break
      case "e":
      case "energy":
        atom.type = Type.S_ENERGY
        break
      case "bpm":
        atom.type = Type.S_BPM
        break
      case "trashed":
        atom.type = Type.S_TRASHED
        break
      case "lowq":
        atom.type = Type.S_LOW_QUALITY
        break
      case "aid":
        atom.type = Type.A_ID
        break
      case "n":
      case "album":
        atom.type = Type.A_NAME
        break
      case "m":
      case "mixed":
        atom.type = Type.A_MIXED
        break
      case "label":
        atom.type = Type.A_LABEL
        break
      case "y":
      case "year":
        atom.type = Type.A_YEAR
        break
      case "month":
        atom.type = Type.A_MONTH
        break
      case "day":
        atom.type = Type.A_DAY
        break
      case "q":
      case "query":
        atom.type = Type.CUSTOM_QUERY_PREDICATE
        break
      case "limit":
        atom.type = Type.LIMIT
        break
      case "l":
        // Check if the value is a number
        const numRegex = /^[0-9]+$/
        if (numRegex.test(match[6])) {
          atom.type = Type.LIMIT
        } else {
          atom.type = Type.A_LABEL
        }
        break
      case "o":
      case "order":
      case "orderby":
      case "orderBy":
        atom.type = Type.ORDER_BY
        break
      default:
        // Error
        return undefined
    }
  }

  // Set value
  if (atom.type === Type.CUSTOM_QUERY_PREDICATE) {
    atom.value = match[6]
  } else {
    // Replace single quotes with escaped single quotes
    atom.value = match[6].replace(/'/g, "\\'")
  }

  return atom
}


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


function buildQueryPredicate(
    builder: PostgrestFilterBuilder<any, any, any[], any, any>,
    query: string,
    limit: number,
    orderBy: number,
    energy: number | undefined,
    isPlaylistQuery: boolean
): [PostgrestFilterBuilder<any, any, any[], any, any>, number, number] {
  // Split query into fragments
  const fragments = splitString(query)

  for (const fragment of fragments) {
    let atom = parse(fragment)
    console.log(atom)
    if (!atom) {
      console.warn(`ERROR: Unable to parse query fragment '${fragment}'`)
      continue
    }

    const negated = atom.props & Property.NEGATED

    // Handle different atom types
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
        if (negated) builder = builder.not('is', 'mixed', atom.value)
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
        console.warn(`Custom query "{atom.value}" is unsupported.`)
        break
      case Type.S_BPM:
        // Handle BPM range
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
          maxBpm = minBpm + 1;
        }
        if (minBpm > 0 && maxBpm > 0) {
          if (negated) builder = builder.not('gte', bpmField, atom.value);
          else builder = builder.gte(bpmField, atom.value);
          if (negated) builder = builder.not('lt', bpmField, atom.value);
          else builder = builder.lt(bpmField, atom.value);
          // if (maxBpm > 120) predicate += " or s.bpm between " + (minBpm / 2) + " and " + (maxBpm / 2);
          // if (minBpm <= 100) predicate += " or s.bpm between " + (minBpm * 2) + " and " + (maxBpm * 2);
        }
        break
      case Type.LIMIT:
        limit = parseInt(atom.value, 10)
        break
      case Type.S_ENERGY:
        // If an operator property is specified, it will overwrite what is used in the options build. Otherwise, we default to it.
        const energyField = isPlaylistQuery ? 'songs.energy' : 'energy';
        if (atom.props === 0) {
          energy = parseInt(atom.value, 10);
          const diff = 1;
          builder = builder.gte(energyField, energy - diff);
          builder = builder.lte(energyField, energy + diff);
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


async function searchSongs(
    query: string,
    limit: number = 3,
    bpm: number = 0,
    key: string = '',
    styles: number[] = [],
    songsToOmit: Song[] = [],
    playlists: number[] =  [],
    energy: number = 0,
    offset: number = 0,
    orderBy: OrderBy = OrderBy.DATE_ADDED,
    errorCallback?: any): Promise<Song[]> {
  console.log("q:", query, ", limit:", limit, ", bpm:", bpm, ", key:", key, ", styles:", styles, ", songsToOmit:", songsToOmit.length, ", playlists:", playlists, ", energy:", energy, ", offset:", offset, ", orderBy:", orderBy);

  let songList: Song[] = []

  let builder: PostgrestQueryBuilder<any, any, any, any> | PostgrestFilterBuilder<any, any, any[], any, any>;
  const isPlaylistQuery = playlists.length > 0;

  if (isPlaylistQuery) {
    builder = supabase.from('playlistentries').select('*, songs!inner(*, albums!inner(*))').in('playlistid', playlists);
  } else if (styles.length) {
    builder = supabase.from('songs').select('*, albums!inner(*), songstyles!inner(*)').in('songstyles.styleid', styles);
  } else {
    builder = supabase.from('songs').select('*, albums!inner(*)');
  }

  [builder, limit, orderBy] = buildQueryPredicate(builder as PostgrestFilterBuilder<any, any, any[], any, any>, query, limit, orderBy, energy, isPlaylistQuery);

  switch (orderBy) {
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
      console.warn('Random order not supported (though it is possible).')
      break
    case OrderBy.BPM:
      if (isPlaylistQuery) {
        builder = builder.order('songs.bpm', { ascending: true })
      } else {
        builder = builder.order('bpm', { ascending: true })
      }
      break
    case OrderBy.PLAYLIST:
      builder = builder.order('playlistid', { ascending: false })
      builder = builder.order('position', { ascending: true })
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
    console.error(error);
  }

  let transformedData = data;
  if (isPlaylistQuery && data) {
    transformedData = data.map((item: any) => item.songs).filter(song => song != null);
  }

  if (transformedData) {
    transformedData.forEach((song: Song) => { // Ensure song type is used here
      songList.push(song);
    });
  }

  console.log(songList);
  return songList
}


export default searchSongs
export {searchSongs, OrderBy}
