import fire
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
import mysql.connector
import re
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
    push_genres(connection, db)
    # push_playlists(connection, db)
    # push_songs(connection, db)

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
  return re.sub('[^a-z0-9 ]', '', str.lower())


def push_songs(mysql_connection, firestore_db):
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