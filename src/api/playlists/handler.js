const autoBind = require('auto-bind');

class PlaylistsHandler {
  constructor(service, validator) {
    this._service = service;
    this._validator = validator;

    autoBind(this);
  }

  async postPlaylistHandler(request, h) {
    this._validator.validatePlaylistPayload(request.payload);
    const { name } = request.payload;
    const { id: credentialId } = request.auth.credentials;

    const playlistId = await this._service.addPlaylist({
      name,
      owner: credentialId,
    });

    const response = h.response({
      status: 'success',
      message: 'Playlist berhasil ditambahkan',
      data: {
        playlistId,
      },
    });
    response.code(201);
    return response;
  }

  async getPlaylistsHandler(request) {
    const { id: credentialId } = request.auth.credentials;
    const playlists = await this._service.getPlaylists(credentialId);
    return {
      status: 'success',
      data: {
        playlists,
      },
    };
  }

  async deletePlaylistByIdHandler(request) {
    const { id } = request.params;
    const { id: credentialId } = request.auth.credentials;

    await this._service.verifyPlaylistOwner(id, credentialId);
    this._service.deletePlaylistById(id);

    return {
      status: 'success',
      message: 'Playlist berhasil dihapus',
    };
  }

  // Playlist_songs Start

  async postPlaylistSongHandler(request, h) {
    this._validator.validatePlaylistSongPayload(request.payload);
    const { songId } = request.payload;
    const { playlistId } = request.params;
    const { id: credentialId } = request.auth.credentials;

    await this._service.verifyPlaylistAccess(playlistId, credentialId);
    await this._service.checkSongAvaible(songId);
    await this._service.checkSongOnList(playlistId, songId);

    const song = await this._service.addSongsToPlaylist({ playlistId, songId });
    const time = new Date().toISOString();
    await this._service.addPlaylistActivities(
      playlistId,
      songId,
      credentialId,
      'add',
      time,
    );
    const response = h.response({
      status: 'success',
      message: 'Berhasil menambahkan lagu ke playlist',
      data: {
        song,
      },
    });
    response.code(201);
    return response;
  }

  async getPlaylistAndSongHandler(request, h) {
    const { playlistId } = request.params;
    const { id: credentialId } = request.auth.credentials;
    await this._service.verifyPlaylistAccess(playlistId, credentialId);
    const playlist = await this._service.getPlaylistByPlaylistsId(playlistId);
    const songs = await this._service.getPlaylistWithSong(playlistId);
    const response = h.response({
      status: 'success',
      data: {
        playlist: {
          ...playlist,
          songs,
        },
      },
    });
    response.code(200);
    return response;
  }

  async deleteSongPlaylistHandler(request) {
    this._validator.validatePlaylistSongPayload(request.payload);
    const { songId } = request.payload;
    const { playlistId } = request.params;
    const { id: credentialId } = request.auth.credentials;
    await this._service.verifyPlaylistAccess(playlistId, credentialId);
    await this._service.deleteSongFromPlaylistSongs(playlistId, songId);
    const time = new Date().toISOString();
    await this._service.addPlaylistActivities(
      playlistId,
      songId,
      credentialId,
      'delete',
      time,
    );
    return {
      status: 'success',
      message: 'berhasil menghapus lagu',
    };
  }

  async getPlaylistActivitiesByPlaylistIdHandler(request) {
    const { playlistId } = request.params;
    const { id: credentialId } = request.auth.credentials;
    await this._service.verifyPlaylistAccess(playlistId, credentialId);
    const activities = await this._service.getPlaylistActivitiesByPlaylistsId(playlistId);
    return {
      status: 'success',
      data: {
        playlistId,
        activities,
      },
    };
  }

  // Playlist_songs End
}

module.exports = PlaylistsHandler;
