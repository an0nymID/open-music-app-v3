const routes = (handler) => [
  {
    method: 'POST',
    path: '/albums/{albumId}/likes',
    handler: handler.postAlbumLikesHandler,
    options: {
      auth: 'playlistsapp_jwt',
    },
  },
  {
    method: 'GET',
    path: '/albums/{albumId}/likes',
    handler: handler.getAlbumLikesHandler,
  },
  {
    method: 'DELETE',
    path: '/albums/{albumId}/likes',
    handler: handler.deleteAlbumLikesHandler,
    options: {
      auth: 'playlistsapp_jwt',
    },
  },
];

module.exports = routes;
