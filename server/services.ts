import { AlbumService } from "./jiosaavn/modules/albums/services/album.service";
import { ArtistService } from "./jiosaavn/modules/artists/services/artist.service";
import { PlaylistService } from "./jiosaavn/modules/playlists/services/playlist.service";
import { SearchService } from "./jiosaavn/modules/search/services/search.service";
import { SongService } from "./jiosaavn/modules/songs/services/song.service";

export const services = {
  album: new AlbumService(),
  artist: new ArtistService(),
  playlist: new PlaylistService(),
  search: new SearchService(),
  song: new SongService(),
};
