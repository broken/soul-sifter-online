import fire
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
import mysql.connector
import re
import subprocess
import time
from functools import reduce
import json
import tqdm


"""
tracks
  map genres
genres
playlists
  subcollection entries

get tracks in a genre:
1. array of genres => array_contains genre on tracks (only 1)
2. map of genres => chain together where statements

algolia for full text search

"""

class SoulSifterSync(object):
  """Sync local DB with Firebase."""

  def pull(self):
    # MySQL
    connection = connect_mysql()
    # Firebase
    cred = credentials.ApplicationDefault()
    firebase_admin.initialize_app(cred)
    db = firestore.Client('soul-sifter')
    changes = db.collection('changes').order_by('timestamp', direction=firestore.Query.ASCENDING).stream()
    for c in tqdm.tqdm(list(changes)):
      change = c.to_dict()
      statement = f"update {change['table']} set {change['field']}={change['value']} where id={change['id']}"
      cursor = connection.cursor()
      cursor.execute(statement)
      connection.commit()
      cursor.close()
      c.reference.delete()
    connection.close()

  def push(self):
    # Firebase
    cred = credentials.ApplicationDefault()
    firebase_admin.initialize_app(cred)
    db = firestore.Client('soul-sifter')

    # MySQL
    connection = connect_mysql()

    # Update songs
    # push_genres(connection, db)
    # push_playlists(connection, db)
    push_song_updates(connection, db)

    # Close the MySQL connection
    connection.close()


def connect_mysql():
  with open('.mysql_settings.json', 'r') as f:
    settings = json.load(f)
    return mysql.connector.connect(
      host=settings['host'],
      user=settings['user'],
      password=settings['password'],
      database=settings['database']
    )


def get_max_id(connection, table):
  cursor = connection.cursor()
  try:
    cursor.execute("select max(id) from " + table)
    return reduce(lambda x, y: x, [x[0] for x in cursor])
  finally:
    cursor.close()


def normalize_string(str):
  if not str:
    return str;
  return re.sub('[^a-z0-9 ]', '', str.lower())


def push_song_updates(mysql_connection, firestore_db):
  with open('.musicdb_settings.json', 'r') as f:
    settings = json.load(f)
    music_db_dir = settings['dir']
    last_commit = settings['last_commit']

  command = "git log -1 --oneline | awk '{print $1}'"
  process = subprocess.run(command, cwd=music_db_dir, capture_output=True, text=True, shell=True)
  if process.returncode != 0:
    print('Error:', process.stderr)
    return
  latest_commit = process.stdout.rstrip()

  print('Finding songs requiring updates.')
  songs_to_remove = []
  new_songs = []
  # git diff b696f75 9e1e061 Songs.txt | awk '{print $1}' | perl -nle 'print if m{^[+-]\d+$}'
  command = f'git diff {last_commit} {latest_commit} Songs.txt | ' "awk '{print $1}' | perl -nle 'print if m{^[+-]\d+$}'"
  process = subprocess.run(command, cwd=music_db_dir, capture_output=True, text=True, shell=True)
  if process.returncode != 0:
    print('Error:', process.stderr)
    return
  output_lines = process.stdout.splitlines()
  for line in output_lines:
    if line[0:1] == '-':
      songs_to_remove.append(line[1:])
    else:
      new_songs.append(line[1:])

  print('Finding songs that were trashed.')
  trashed_songs = []
  if new_songs:
    cursor = mysql_connection.cursor()
    cursor.execute(f"select id from Songs where trashed = 1 and id in ({','.join(new_songs)})")
    for row in cursor:
      trashed_songs.append(row[0])
    cursor.close()

  print('initial songs_to_remove: ', songs_to_remove)
  print('initial new_songs: ', new_songs)
  print('initial trashed_songs: ', trashed_songs)

  songs_to_remove = [x for x in songs_to_remove if x not in new_songs]
  songs_to_remove.extend(trashed_songs)
  new_songs = [x for x in new_songs if x not in trashed_songs]

  print('final songs_to_remove: ', songs_to_remove)
  print('final new_songs: ', new_songs)

  print(f'Updating / adding {len(new_songs)} new songs.')
  songs_ref = firestore_db.collection('songs')
  if new_songs:
    cursor = mysql_connection.cursor()
    cursor.execute(f"select s.id, s.artist, s.track, s.title, s.remixer, s.rating, s.youtubeId, a.name, a.releaseDateYear, a.releaseDateMonth, a.releaseDateDay, group_concat('-', y.id, ':', y.name) as styles from Songs s inner join Albums a on s.albumid=a.id left outer join SongStyles ss on ss.songid=s.id inner join Styles y on ss.styleid=y.id where s.trashed != 1 and s.id in ({','.join(new_songs)}) group by s.id")
    for row in cursor:
      # Create a Firestore document
      genres = {}
      for s in row[11][1:].split(',-'):
        g = s.split(':')
        genres[g[0]] = g[1]
      doc = {
        'id': row[0],
        'artist': row[1],
        'normArtist': normalize_string(row[1]),
        'track': row[2],
        'title': row[3],
        'normTitle': normalize_string(row[3]),
        'remixer': row[4],
        'rating': row[5],
        'youtubeId': row[6],
        'albumName': row[7],
        'releaseDateYear': row[8],
        'releaseDateMonth': row[9],
        'releaseDateDay': row[10],
        'genres': genres
      }

      # Add the document to Firestore
      songs_ref.document(str(doc['id'])).set(doc)
      time.sleep(.1)
    cursor.close()

  print(f'Removing {len(songs_to_remove)} trashed songs.')
  for sid in songs_to_remove:
    songs_ref.document(str(sid)).delete()
    time.sleep(.1)

  with open('.musicdb_settings.json', 'w') as f:
    settings['last_commit'] = latest_commit
    json.dump(settings, f, indent=2)


def push_all_songs(mysql_connection, firestore_db):
  max_id = get_max_id(mysql_connection, 'songs')
  step = 50
  songsRef = firestore_db.collection('songs')
  for i in tqdm.tqdm(range(0, max_id, step), desc="songs"):
    cursor = mysql_connection.cursor()
    cursor.execute(f"select s.id, s.artist, s.track, s.title, s.remixer, s.rating, s.youtubeId, a.name, a.releaseDateYear, a.releaseDateMonth, a.releaseDateDay, group_concat('-', y.id, ':', y.name) as styles from Songs s inner join Albums a on s.albumid=a.id left outer join SongStyles ss on ss.songid=s.id inner join Styles y on ss.styleid=y.id where s.trashed != 1 group by s.id limit {i}, {step}")

    # Iterate over the rows
    for row in cursor:
      # Create a Firestore document
      genres = {}
      for s in row[11][1:].split(',-'):
        g = s.split(':')
        genres[g[0]] = g[1]
      doc = {
        'id': row[0],
        'artist': row[1],
        'normArtist': normalize_string(row[1]),
        'track': row[2],
        'title': row[3],
        'normTitle': normalize_string(row[3]),
        'remixer': row[4],
        'rating': row[5],
        'youtubeId': row[6],
        'albumName': row[7],
        'releaseDateYear': row[8],
        'releaseDateMonth': row[9],
        'releaseDateDay': row[10],
        'genres': genres
      }

      # Add the document to Firestore
      songsRef.document(str(doc['id'])).set(doc)
      time.sleep(.1)
    cursor.close()


def push_genres(mysql_connection, firestore_db):
  max_id = get_max_id(mysql_connection, 'styles')
  step = 5
  for i in tqdm.tqdm(range(0, max_id, step), desc="genres"):
    cursor = mysql_connection.cursor()
    cursor.execute(f"select s.id, s.name, group_concat(parentId) from Styles s left outer join StyleChildren c on s.id=c.childid group by s.id limit {i}, {step}")

    # Iterate over the rows
    for row in cursor:
      # Create a Firestore document
      parents = row[2].split(',') if row[2] else []
      doc = {
        'id': row[0],
        'name': row[1],
        'parents': [int(x) for x in parents],
      }

      # Add the document to Firestore
      firestore_db.collection('genres').document(str(doc['id'])).set(doc)
      time.sleep(.1)
    cursor.close()


def push_playlists(mysql_connection, firestore_db):
  max_id = get_max_id(mysql_connection, 'playlists')
  step = 2
  playlistsCollectionRef = firestore_db.collection('playlists')
  for i in tqdm.tqdm(range(0, max_id, step), desc='playlists'):
    playlistQuery = mysql_connection.cursor()
    playlistQuery.execute(f'select id, name, query, youtubeId from Playlists limit {i}, {step}')

    # Iterate over the rows
    for playlistRow in playlistQuery.fetchall():
      # Create a Firestore document
      playlist = {
        'id': playlistRow[0],
        'name': playlistRow[1],
        'query': playlistRow[2],
        'youtubeId': playlistRow[3],
      }

      # Add the document to Firestore
      playlistDocRef = playlistsCollectionRef.document(str(playlist['id']))
      playlistDocRef.set(playlist)

      # Add subcollection of song IDs
      entriesQuery = mysql_connection.cursor()
      entriesQuery.execute(f'select songId, position from playlistEntries where playlistId = {playlist["id"]}')
      entriesCollectionRef = playlistDocRef.collection('entries')
      for entryRow in entriesQuery:
        entry = {
          'id': entryRow[0],
          'position': entryRow[1],
        }
        entriesCollectionRef.document(str(entry['id'])).set(entry)
        time.sleep(.1)
      entriesQuery.close()

      time.sleep(.1)
    playlistQuery.close()

if __name__ == '__main__':
  fire.Fire(SoulSifterSync)