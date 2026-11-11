import { Endpoints } from '../../../../common/constants'
import { useFetch } from '../../../../common/helpers'
import { createSongPayload } from '../../../songs/helpers'
import { HTTPException } from '../../../../common/errors'
import type { IUseCase } from '../../../../common/types'
import type { ArtistSongAPIResponseModel, ArtistSongModel } from '../../models'
import type { z } from 'zod'

export interface GetArtistSongsArgs {
  artistId: string
  page: number
  sortBy: 'popularity' | 'latest' | 'alphabetical'
  sortOrder: 'asc' | 'desc'
}

export class GetArtistSongsUseCase implements IUseCase<GetArtistSongsArgs, z.infer<typeof ArtistSongModel>> {
  constructor() {}

  async execute({ artistId, page, sortOrder, sortBy }: GetArtistSongsArgs) {
    const { data } = await useFetch<z.infer<typeof ArtistSongAPIResponseModel>>({
      endpoint: Endpoints.artists.songs,
      params: {
        artistId,
        page,
        sort_order: sortOrder,
        category: sortBy
      }
    })

    if (!data) throw new HTTPException(404, { message: 'artist songs not found' })

    return {
      total: data.topSongs.total,
      songs: data.topSongs.songs.map((song) => createSongPayload(song))
    }
  }
}
