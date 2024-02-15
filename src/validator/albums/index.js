const InvariantError = require('../../exceptions/InvariantError');
const { AlbumPayLoadSchema } = require('./schema');

const AlbumsValidator = {
  validateAlbumPayLoad: (payload) => {
    const validationResult = AlbumPayLoadSchema.validate(payload);
    if (validationResult.error) {
      throw new InvariantError(validationResult.error.message);
    }
  },
};

module.exports = AlbumsValidator;
