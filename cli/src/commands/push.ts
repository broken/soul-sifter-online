import { spawn } from 'node:child_process';
import fs from 'node:fs';

import { Args, Command, Flags } from '@oclif/core'
import { simpleGit, SimpleGit } from 'simple-git';
import { supabase } from '../supabase-client.js';


const tables: string[] = [
  'BasicGenres',
  'Albums',
  'AlbumParts',
  'Styles',
  'StyleChildren',
  'MusicVideos',
  'Songs',
  'Mixes',
  'SongStyles',
  'Playlists',
  'PlaylistEntries',
  'PlaylistStyles'
]

const fields: Record<string, string[]> = {
  'BasicGenres': ['id', 'name'],
  'Albums': ['id', 'name', 'artist', 'coverfilepath', 'mixed', 'label', 'catalogid', 'releasedateyear', 'releasedatemonth', 'releasedateday', 'basicgenreid'],
  'AlbumParts': ['id', 'pos', 'name', 'albumid'],
  'Styles': ['id', 'name', 'relabel', 'reid', 'description'],
  'StyleChildren': ['parentId', 'childId'],
  'MusicVideos': ['id', 'filepath', 'thumbnailfilepath'],
  'Songs': ['id', 'artist', 'track', 'title', 'remixer', 'featuring', 'filepath', 'resongid', 'albumid', 'rating', 'dateadded', 'comments', 'trashed', 'albumpartid', 'bpm', 'lowquality', 'tonickey', 'energy', 'googlesongid', 'durationinms', 'curator', 'musicvideoid', 'youtubeid', 'youtubemusicid', 'bpmlock', 'tonickeylock', 'spotifyid', 'dupeid', 'explicitlyrics'],
  'Mixes': ['id', 'outsongid', 'insongid', 'bpmdiff', 'rating', 'comments', 'addon'],
  'SongStyles': ['songId', 'styleId'],
  'Playlists': ['id', 'name', 'query', 'gmusicid', 'youtubeid', 'spotifyid'],
  'PlaylistEntries': ['id', 'playlistid', 'songid', 'position'],
  'PlaylistStyles': ['playlistId', 'styleId']
}

type RowKey = number | [number, number];

const getChangesFromGit = async (baseDir: string, table: string): Promise<[RowKey[], RowKey[]]> => {
  const git: SimpleGit = simpleGit(baseDir);

  // get diff from the commits
  const oldHash = readCommitHashFromFile();
  const diff = await git.diff([`${oldHash}..HEAD`, '--', `${table}.txt`]);

  // force multi-line strings into a single line
  const cleaned = diff.replace(/\\\n/g, '  ');

  // split the diff into individual lines
  const lines = cleaned.split('\n');

  // filter to only show lines that are changed (starting with + or - but not "+++" or "---")
  const changedLines = lines.filter((line) =>
    /^[+-][0-9]/.test(line)
  );

  const isAssoc = fields[table][0] !== 'id';
  const parseKey = (line: string): RowKey => {
    const parts = line.slice(1).trim().split(/\s+/);
    if (isAssoc) {
      if (parts.length >= 2) {
        const a = Number(parts[0]);
        const b = Number(parts[1]);
        if (!isNaN(a) && !isNaN(b)) {
          return [a, b];
        }
      }
      throw new Error(`Failed to parse association key for table '${table}' from line: "${line}"`);
    }
    const id = Number(parts[0]);
    if (isNaN(id)) {
      throw new Error(`Failed to parse entity ID for table '${table}' from line: "${line}"`);
    }
    return id;
  };
  const keyToString = (k: RowKey): string => Array.isArray(k) ? `${k[0]}:${k[1]}` : String(k);

  // split changes & reduce to just keys
  const added = changedLines
    .filter(line => line.startsWith('+'))
    .map(parseKey);
  const addedKeys = new Set(added.map(keyToString));
  const removed = changedLines
    .filter(line => line.startsWith('-'))
    .map(parseKey)
    .filter(k => !addedKeys.has(keyToString(k)));
  return [removed, added];
};


const writeHeadCommitToFile = async (baseDir: string) => {
  const git: SimpleGit = simpleGit(baseDir);
  const filePath = process.env.LAST_COMMIT_SYNCED
  if (!filePath) {
    throw new Error('LAST_COMMIT_SYNCED environment variable is not set.');
  }

  // Get the latest commit
  const log = await git.log({ maxCount: 1 });

  // Extract the commit hash of the HEAD (most recent commit)
  const headCommitHash = log.latest?.hash;

  if (!headCommitHash) {
    throw new Error('No commits found in the repository.');
  }

  // Write the commit hash to the specified file
  fs.writeFileSync(filePath, headCommitHash, 'utf8');
  console.log(`HEAD commit hash (${headCommitHash}) written to ${filePath}`);
};


const readCommitHashFromFile = (): string => {
  const filePath = process.env.LAST_COMMIT_SYNCED
  if (!filePath) {
    throw new Error('LAST_COMMIT_SYNCED environment variable is not set.');
  }
  // Read the content of the file (commit hash)
  const commitHash = fs.readFileSync(filePath, 'utf8').trim();
  return commitHash;
};


const executePsql = (sql: string) => {
  return new Promise((resolve, reject) => {
    console.log(`Executing ${sql}`);
    let stdout = '';
    let stderr = '';
    const childProcess = spawn('psql', ['-h', process.env.SUPABASE_SERVER, '-p', '6543', '-d', 'postgres', '-U', process.env.SUPABASE_USER, '-c', sql], { env: { ...process.env, PGPASSWORD: process.env.SUPABASE_PASSWD } });

    // Capture standard output
    childProcess.stdout.on('data', (data) => {
      stdout += data.toString();
      console.error(stdout);
    });

    // Capture standard error
    childProcess.stderr.on('data', (data) => {
      stderr += data.toString();
      console.error(stderr);
    });

    // Handle process close
    childProcess.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        console.error(stderr);
        reject(new Error(`Process exited with code ${code}: ${stderr}`));
      }
    });

    // Handle errors from the spawn process
    childProcess.on('error', (error) => {
      console.error(error);
      reject(error);
    });
  });
};


const filterUpdates = (table: string, added: RowKey[], dir: string) => {
  return new Promise((resolve, reject) => {
    let pattern = '';
    if (added.length > 0) {
      if (fields[table][0] !== 'id') {
        const pairs = (added as [number, number][]).map(([a, b]) => `${a}\\t${b}`);
        pattern = ` | grep -E '^(${pairs.join('|')})'`;
      } else {
        pattern = ` | grep -E '^(${added.join('|')})'`;
      }
    }
    const cmd = `perl -p -e 's/\\\\\\R/  /g;' ${table}.txt${pattern}`;
    const childProcess = spawn('sh', ['-c', cmd], { cwd: dir });

    childProcess.stdout.pipe(fs.createWriteStream(`/tmp/${table}.txt`));

    // Capture standard output
    childProcess.stdout.on('data', (data) => {
    });

    // Capture standard error
    let stderr = '';
    childProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    // Handle process close
    childProcess.on('close', (code) => {
      if (code === 0) {
        resolve({ stderr });
      } else {
        reject(new Error(`Process exited with code ${code}: ${stderr}`));
      }
    });

    // Handle errors from the spawn process
    childProcess.on('error', (error) => {
      reject(error);
    });
  });
};


export default class Push extends Command {
  static override args = {
    dir: Args.string({ description: 'base directory of mysql dump files', required: true }),
  }

  static override description = 'describe the command here'

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  static override flags = {
    // flag with no value (-f, --force)
    force: Flags.boolean({ char: 'f' }),
    // flag with a value (-n, --name=VALUE)
    name: Flags.string({ char: 'n', description: 'name to print' }),
  }

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(Push)

    // get the changed lines
    for (const t of tables) {
      const data = await getChangesFromGit(args.dir, t);
      const [removed, added] = data;
      if (removed.length > 0) {
        this.log(`${t} to remove: ${JSON.stringify(removed)}`)
        if (fields[t][0] !== 'id') {
          const [col1, col2] = fields[t];
          const tuples = removed as [number, number][];
          const chunkSize = 500;
          for (let i = 0; i < tuples.length; i += chunkSize) {
            const chunk = tuples.slice(i, i + chunkSize);
            const tupleSql = chunk.map(([a, b]) => `(${a}, ${b})`).join(', ');
            await executePsql(`DELETE FROM ${t.toLowerCase()} WHERE (${col1}, ${col2}) IN (${tupleSql})`);
          }
        } else {
          const ids = removed as number[];
          const chunkSize = 500;
          for (let i = 0; i < ids.length; i += chunkSize) {
            const chunk = ids.slice(i, i + chunkSize);
            const { error } = await supabase.from(t).delete().in('id', chunk);
            if (error) {
              this.error(`Error deleting from ${t}: ${error.message}`);
            }
          }
        }
      }
      if (added.length > 0) {
        this.log(`${t} to add: ${added.length}`)
        // pipe update to new file
        await filterUpdates(t, added.length > 1000 ? [] : added, args.dir);
        // execute upsert
        // create temporary table first
        await executePsql(`CREATE TEMP TABLE staging_${t.toLowerCase()} AS SELECT ${fields[t].join(', ')} FROM ${t.toLowerCase()} LIMIT 0`);
        await executePsql(`\\COPY staging_${t.toLowerCase()} FROM '/tmp/${t}.txt' WITH DELIMITER E'\\t'`);
        if (fields[t][0] === 'id') {
          const fieldUpdates = fields[t].filter(x => x !== 'id').map(f => `${f}=excluded.${f}`);
          await executePsql(`INSERT INTO ${t.toLowerCase()} (${fields[t].join(', ')}) SELECT ${fields[t].join(', ')} FROM staging_${t.toLowerCase()} ON CONFLICT(id) DO UPDATE SET ${fieldUpdates.join(', ')}`);
        } else {
          await executePsql(`INSERT INTO ${t.toLowerCase()} (${fields[t].join(', ')}) SELECT ${fields[t].join(', ')} FROM staging_${t.toLowerCase()} ON CONFLICT(${fields[t].join(', ')}) DO NOTHING`);
        }
        await executePsql(`DROP TABLE staging_${t.toLowerCase()}`);
      }
    }
    writeHeadCommitToFile(args.dir)
  }
}
