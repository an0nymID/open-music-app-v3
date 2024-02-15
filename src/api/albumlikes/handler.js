const autoBind = require('auto-bind');

class AlbumLikesHandler {
  constructor(service, albumsService) {
    this._service = service;
    this._albumsService = albumsService;

    autoBind(this);
  }

  async postAlbumLikesHandler(request, h) {
    const { albumId } = request.params;
    const { id: credentialId } = request.auth.credentials;

    await this._albumsService.getAlbumById(albumId);
    await this._service.verifyUserLike(albumId, credentialId);
    // await this._service.verifyAlbumsOwner(albumId, credentialId);

    const albumLikes = await this._service.addLikeAlbum(credentialId, albumId);

    const response = h.response({
      status: 'success',
      message: 'like berhasil ditambahkan',
      data: {
        albumLikes,
      },
    });
    response.code(201);
    return response;
  }

  async getAlbumLikesHandler(request, h) {
    const { albumId } = request.params;
    const { likes, isCache } = await this._service.getAlbumLikesByAlbumId(
      albumId,
    );

    const response = h.response({
      status: 'success',
      data: { likes },
    });

    if (isCache) {
      response.header('X-Data-Source', 'cache');
    }
    return response;
  }

  async deleteAlbumLikesHandler(request) {
    const { albumId } = request.params;
    const { id: credentialId } = request.auth.credentials;

    this._service.dislikeAlbum(albumId, credentialId);

    return {
      status: 'success',
      message: 'berhasil dislike album',
    };
  }
}

module.exports = AlbumLikesHandler;
