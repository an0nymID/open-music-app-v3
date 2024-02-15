exports.up = (pgm) => {
  // membuat album baru.
  pgm.sql(
    "INSERT INTO albums(id, name, year) VALUES ('old_songs', 'old_songs', 1900)",
  );

  // mengubah nilai album_id pada songs yang album_id-nya bernilai NULL
  pgm.sql("UPDATE songs SET albumid = 'old_songs' WHERE albumid IS NULL");

  // memberikan constraint foreign key pada album_id terhadap kolom id dari tabel songs
  pgm.addConstraint(
    'songs',
    'fk_songs.albumid_albums.id',
    'FOREIGN KEY(albumid) REFERENCES albums(id) ON DELETE CASCADE',
  );
};

exports.down = (pgm) => {
  // menghapus constraint fk_playlists.owner_users.id pada tabel playlists
  pgm.dropConstraint('songs', 'fk_songs.albumid_albums.id');

  // mengubah nilai owner old_playlists pada playlist menjadi NULL
  pgm.sql("UPDATE albums SET albumid = NULL WHERE albumid = 'old_songs'");

  // menghapus user baru.
  pgm.sql("DELETE FROM albums WHERE id = 'old_songs'");
};
