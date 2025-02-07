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
  'Songs': ['id', 'artist', 'track', 'title', 'remixer', 'featuring', 'filepath', 'resongid', 'albumid', 'rating', 'dateadded', 'comments', 'trashed', 'albumpartid', 'bpm', 'lowquality', 'tonickey', 'energy', 'googlesongid', 'durationinms', 'curator', 'musicvideoid', 'youtubeid', 'bpmlock', 'tonickeylock', 'spotifyid', 'dupeid'],
  'Mixes': ['id', 'outsongid', 'insongid', 'bpmdiff', 'rating', 'comments', 'addon'],
  'SongStyles': ['songId', 'styleId'],
  'Playlists': ['id', 'name', 'query', 'gmusicid', 'youtubeid', 'spotifyid'],
  'PlaylistEntries': ['id', 'playlistid', 'songid', 'position'],
  'PlaylistStyles': ['playlistId', 'styleId']
}

const getChangesFromGit = async (baseDir: string, table: string): Promise<[number[], number[]]> => {
  try {
    const git: SimpleGit = simpleGit(baseDir);

    // get diff from the commits
    const oldHash = readCommitHashFromFile();
    const diff = await git.diff([`${oldHash}..HEAD`, '--', `${table}.txt`]);

    // force multi-line strings into a single line
    const cleaned = diff.replace(/\\\n/g, '  ')

    // split the diff into individual lines
    const lines = cleaned.split('\n');

    // filter to only show lines that are changed (starting with + or - but not "+++" or "---")
    const changedLines = lines.filter((line) =>
      /^[+-][0-9]/.test(line)
    );

    // split changes & reduce to just keys
    const added = changedLines.filter(line => /^\+([0-9]+)/.test(line))
                              .map(line => line.match(/^\+([0-9]+)/)[1])
                              .map(k => Number(k));
    const removed = changedLines.filter(line => /^-([0-9]+)/.test(line))
                                .map(line => line.match(/^-([0-9]+)/)[1])
                                .map(k => Number(k))
                                .filter(k => !added.includes(k));
    return [removed, added];
  } catch (error) {
    console.error('Error fetching changes from the last two commits:', error);
  }
  return [[], []];
};


const writeHeadCommitToFile = async (baseDir: string) => {
  const git: SimpleGit = simpleGit(baseDir);
  const filePath = process.env.LAST_COMMIT_SYNCED

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


const readCommitHashFromFile = (): string | null => {
  const filePath = process.env.LAST_COMMIT_SYNCED
  // Read the content of the file (commit hash)
  const commitHash = fs.readFileSync(filePath, 'utf8').trim();
  return commitHash;
};


const executePsql = (sql: string) => {
  return new Promise((resolve, reject) => {
    console.log(`Executing ${sql}`);
    let stdout = '';
    let stderr = '';
    const childProcess = spawn('psql', ['-h', process.env.SUPABASE_SERVER, '-p', '6543', '-d', 'postgres', '-U', process.env.SUPABASE_USER, '-c', sql], { env: { ...process.env, PGPASSWORD: process.env.SUPABASE_PASSWD} });

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


const filterUpdates = (table: string, added: number[], dir: string) => {
  return new Promise((resolve, reject) => {
    let stdout = '';
    let stderr = '';
    const childProcess = spawn('sh', ['-c', `perl -p -e 's/\\\\\\R/  /g;' ${table}.txt | grep -E '^(${added.join('|')})'`], {cwd: dir});

    childProcess.stdout.pipe(fs.createWriteStream(`/tmp/${table}.txt`));

    // Capture standard output
    childProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    // Capture standard error
    childProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    // Handle process close
    childProcess.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
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
    dir: Args.string({description: 'base directory of mysql dump files'}),
  }

  static override description = 'describe the command here'

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  static override flags = {
    // flag with no value (-f, --force)
    force: Flags.boolean({char: 'f'}),
    // flag with a value (-n, --name=VALUE)
    name: Flags.string({char: 'n', description: 'name to print'}),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Push)

    // get the changed lines
    for (const t of tables) {
      const data = await getChangesFromGit(args.dir, t);
      const [removed, added] = data;
      if (removed.length > 0) {
        this.log(`${t} to remove: ${removed}`)
        supabase.from(t).delete().in('id', removed);
      }
      if (added.length > 0) {
        this.log(`${t} to add: ${added}`)
        // pipe update to new file
        await filterUpdates(t, added, args.dir);
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
