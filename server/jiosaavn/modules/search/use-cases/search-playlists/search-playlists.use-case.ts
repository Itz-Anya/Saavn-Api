import { Endpoints } from '../../../../common/constants'
import { useFetch } from '../../../../common/helpers'
import { createSearchPlaylistPayload } from '../../helpers'
import { HTTPException } from '../../../../common/errors'
import type { IUseCase } from '../../../../common/types'
import type { SearchPlaylistAPIResponseModel, SearchPlaylistModel } from '../../models'
import type { z } from 'zod'

export interface SearchPlaylistsArgs {
  query: string
  page: number
  limit: number
}

export class SearchPlaylistsUseCase implements IUseCase<SearchPlaylistsArgs, z.infer<typeof SearchPlaylistModel>> {
  constructor() {}

  async execute({ query, limit, page }: SearchPlaylistsArgs): Promise<z.infer<typeof SearchPlaylistModel>> {
    const { data } = await useFetch<z.infer<typeof SearchPlaylistAPIResponseModel>>({
      endpoint: Endpoints.search.playlists,
      params: {
        q: query,
        p: page,
        n: limit
      }
    })

    if (!data) throw new HTTPException(404, { message: 'playlist not found' })

    return createSearchPlaylistPayload(data)
  }
}
