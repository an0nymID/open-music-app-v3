const { nanoid } = require('nanoid');
const { Pool } = require('pg');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const AuthorizationError = require('../../exceptions/AuthorizationError');
const ClientError = require('../../exceptions/ClientError');

class AlbumLikesService {
  constructor(cacheService) {
    this._pool = new Pool();
    this._cacheService = cacheService;
  }

  async addLikeAlbum(userId, albumId) {
    const id = `likealbum-${nanoid(16)}`;

    const query = {
      text: 'INSERT INTO user_album_likes VALUES($1, $2, $3) returning id',
      values: [id, userId, albumId],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('like gagal ditambahkan');
    }

    await this._cacheService.delete(`likes:${albumId}`);
    return result.rows[0].id;
  }

  async getAlbumLikesByAlbumId(albumId) {
    try {
      const result = await this._cacheService.get(`likes:${albumId}`);
      return { likes: JSON.parse(result), isCache: true };
    } catch (error) {
      const query = {
        text: 'SELECT * FROM user_album_likes WHERE album_id=$1',
        values: [albumId],
      };
      const result = await this._pool.query(query);
      if (!result.rowCount) {
        throw new NotFoundError('album yang dilike tidak ada');
      }

      await this._cacheService.set(
        `likes:${albumId}`,
        JSON.stringify(result.rowCount),
      );
      return { likes: result.rowCount, isCache: false };
    }
  }

  async dislikeAlbum(albumId, userId) {
    const query = {
      text: 'DELETE FROM user_album_likes WHERE album_id=$1 AND user_id=$2 RETURNING id',
      values: [albumId, userId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Gagal dislike album. Id tidak ditemukan');
    }
    await this._cacheService.delete(`likes:${albumId}`);
  }

  async verifyAlbumsOwner(albumId, userId) {
    const query = {
      text: 'SELECT * FROM user_album_likes WHERE album_id=$1',
      values: [albumId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Album like tidak ditemukan');
    }

    const album = result.rows[0];

    if (album.userId !== userId) {
      throw new AuthorizationError('Anda tidak berhak mengakses resource ini');
    }
  }

  async verifyUserLike(albumId, userId) {
    const query = {
      text: 'SELECT * FROM user_album_likes WHERE album_id = $1 AND user_id = $2',
      values: [albumId, userId],
    };

    const result = await this._pool.query(query);

    if (result.rowCount > 0) {
      throw new ClientError('Anda sudah memberi like');
    }
  }
}

module.exports = AlbumLikesService;
