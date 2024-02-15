exports.up = (pgm) => {
  // membuat user baru.
  pgm.sql(
    "INSERT INTO users(id, username, password, fullname) VALUES ('old_notes', 'old_notes', 'old_notes', 'old notes')",
  );

  // mengubah nilai owner pada playlist yang owner-nya bernilai NULL
  pgm.sql("UPDATE playlists SET owner = 'old_notes' WHERE owner IS NULL");

  // memberikan constraint foreign key pada owner terhadap kolom id dari tabel playlists
  pgm.addConstraint(
    'playlists',
    'fk_plsylists.owner_users.id',
    'FOREIGN KEY(owner) REFERENCES users(id) ON DELETE CASCADE',
  );
};

exports.down = (pgm) => {
  // menghapus constraint fk_playlists.owner_users.id pada tabel playlists
  pgm.dropConstraint('playlists', 'fk_playlists.owner_users.id');

  // mengubah nilai owner old_playlists pada playlist menjadi NULL
  pgm.sql("UPDATE playlists SET owner = NULL WHERE owner = 'old_playlists'");

  // menghapus user baru.
  pgm.sql("DELETE FROM users WHERE id = 'old_notes'");
};
