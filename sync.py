import fire
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
import mysql.connector
import time
from functools import reduce
import json
import tqdm


class SoulSifterSync(object):
  """Sync local DB with Firebase.

  Commands:
    update_songs: uploads songs
  """

  def pull(self):
    # MySQL
    connection = connect_mysql()
    # Firebase
    cred = credentials.ApplicationDefault()
    firebase_admin.initialize_app(cred)
    db = firestore.Client('soul-sifter')
    changes = db.collection('changes')
    for change in tqdm.tqdm(changes):
      statement = f'update {change.table} set {change.field}={change.value} where id={change.id}'
      cursor = connection.cursor()
      cursor.execute(statement)
      # cursor.commit?
      cursor.close()
      # change.delete()


  def push(self):
    # Firebase
    cred = credentials.ApplicationDefault()
    firebase_admin.initialize_app(cred)
    db = firestore.Client('soul-sifter')

    # MySQL
    connection = connect_mysql()
    max_id = max_song_id(connection)
    step = 100
    for i in tqdm.tqdm(range(0, max_id, step)):
      cursor = connection.cursor()
      cursor.execute(f"select s.id, s.artist, s.track, s.title, s.remixer, s.rating, s.youtubeId, a.name, a.releaseDateYear, a.releaseDateMonth, a.releaseDateDay, group_concat('-', y.id, ':', y.name) as styles from Songs s inner join Albums a on s.albumid=a.id left outer join SongStyles ss on ss.songid=s.id inner join Styles y on ss.styleid=y.id where s.trashed != 1 group by s.id limit {i}, {step}")

      # Iterate over the rows
      for row in cursor:
        # Create a Firestore document
        genres = []
        for s in row[11][1:].split(',-'):
          g = s.split(':')
          genres.append({
            'id': g[0],
            'genre': g[1]
          })
        doc = {
          'id': row[0],
          'artist': row[1],
          'track': row[2],
          'title': row[3],
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
        db.collection('songs').document(str(doc['id'])).set(doc)
        time.sleep(.1)
      cursor.close()

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

def max_song_id(connection):
  cursor = connection.cursor()
  try:
    cursor.execute("select max(id) from songs")
    return reduce(lambda x, y: x, [x[0] for x in cursor])
  finally:
    cursor.close()

if __name__ == '__main__':
  fire.Fire(SoulSifterSync)