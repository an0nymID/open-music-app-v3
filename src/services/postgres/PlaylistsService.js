const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const AuthorizationError = require('../../exceptions/AuthorizationError');
const ClientError = require('../../exceptions/ClientError');

class PlaylistsService {
  constructor(collaborationService) {
    this._pool = new Pool();
    this._collaborationService = collaborationService;
  }

  async addPlaylist({ name, owner }) {
    const id = `playlist-${nanoid(16)}`;

    const query = {
      text: 'INSERT INTO playlists VALUES($1, $2, $3) RETURNING id',
      values: [id, name, owner],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Playlist gagal ditambahkan');
    }
    return result.rows[0].id;
  }

  async getPlaylists(owner) {
    const query = {
      text: 'SELECT playlists.id, playlists.name, users.username FROM playlists LEFT JOIN users ON users.id = playlists.owner LEFT JOIN collaborations ON playlists.id = collaborations.playlist_id WHERE playlists.owner = $1 OR collaborations.user_id = $1',
      values: [owner],
    };
    const result = await this._pool.query(query);
    return result.rows;
  }

  async deletePlaylistById(id) {
    const query = {
      text: 'DELETE FROM playlists WHERE id = $1 RETURNING id',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Playlist gagal dihapus. Id tidak ditemukan');
    }
  }

  // Playlist_songs Start

  async addSongsToPlaylist({ playlistId, songId }) {
    const id = `playlist_songs-${nanoid(16)}`;
    const query = {
      text: 'INSERT INTO playlist_songs VALUES($1, $2, $3) RETURNING id',
      values: [id, playlistId, songId],
    };
    const result = await this._pool.query(query);
    if (!result.rows[0].id) {
      throw new InvariantError('Lagu gagal ditambahkan ke playlist');
    }
    return result.rows[0].id;
  }

  async addPlaylistActivities(playlistId, songId, credentialId, action, time) {
    const id = `activities-${nanoid(16)}`;
    const query = {
      text: 'INSERT INTO playlist_song_activities VALUES($1, $2, $3, $4, $5, $6) RETURNING id',
      values: [id, playlistId, songId, credentialId, action, time],
    };
    await this._pool.query(query);
  }

  async getPlaylistByPlaylistsId(playlistId) {
    const query = {
      text: 'SELECT playlists.id, playlists.name, users.username FROM playlists INNER JOIN users ON users.id = playlists.owner WHERE playlists.id = $1',
      values: [playlistId],
    };

    const result = await this._pool.query(query);
    if (!result.rows) {
      throw new NotFoundError(
        'Anda tidak memiliki playlist by getPlaylistById',
      );
    }
    return result.rows[0];
  }

  async getPlaylistWithSong(playlistId) {
    const query = {
      text: 'SELECT songs.id, songs.title, songs.performer FROM playlist_songs INNER JOIN songs ON songs.id = playlist_songs.song_id WHERE playlist_songs.playlist_id = $1',
      values: [playlistId],
    };
    const result = await this._pool.query(query);
    if (!result.rows) {
      throw new NotFoundError(
        'Anda tidak memiliki playlist by getPlaylistWithSong',
      );
    }
    return result.rows;
  }

  async deleteSongFromPlaylistSongs(playlistId, songId) {
    const query = {
      text: 'DELETE FROM playlist_songs WHERE playlist_id=$1 AND song_id=$2 RETURNING id',
      values: [playlistId, songId],
    };
    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new ClientError(
        'Lagu gagal dihapus dari playlist, song id tidak ditemukan',
      );
    }
  }

  async getPlaylistActivitiesByPlaylistsId(playlistId) {
    const query = {
      text: 'SELECT users.username, songs.title, playlist_song_activities.action, playlist_song_activities.time FROM playlist_song_activities LEFT JOIN users ON playlist_song_activities.user_id = users.id LEFT JOIN songs ON playlist_song_activities.song_id = songs.id WHERE playlist_id = $1',
      values: [playlistId],
    };

    const result = await this._pool.query(query);
    if (!result.rows) {
      throw new NotFoundError(
        'Anda tidak memiliki playlist by getPlaylistById',
      );
    }
    return result.rows;
  }

  async checkSongOnList(playlistId, songId) {
    const query = {
      text: 'SELECT * FROM playlist_songs WHERE playlist_id ILIKE $1 AND song_id ILIKE $2',
      values: [`%${playlistId}%`, `%${songId}%`],
    };
    const result = await this._pool.query(query);
    if (result.rowCount) {
      throw new InvariantError('Lagu sudah ada dalam playlist');
    }
  }

  async checkSongAvaible(songId) {
    const query = {
      text: 'SELECT id FROM songs WHERE id = $1',
      values: [songId],
    };
    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new NotFoundError('Lagu tidak terdaftar');
    }
  }

  // Playlist_songs End

  async verifyPlaylistOwner(id, owner) {
    const query = {
      text: 'SELECT * FROM playlists WHERE id=$1',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Playlist tidak ditemukan');
    }

    const playlist = result.rows[0];

    if (playlist.owner !== owner) {
      throw new AuthorizationError('Anda tidak berhak mengakses resource ini');
    }
  }

  async verifyPlaylistAccess(playlistId, userId) {
    try {
      await this.verifyPlaylistOwner(playlistId, userId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      try {
        await this._collaborationService.verifyCollaborator(playlistId, userId);
      } catch {
        throw error;
      }
    }
  }
}

module.exports = PlaylistsService;
