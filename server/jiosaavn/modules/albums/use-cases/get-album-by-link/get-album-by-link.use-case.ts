import { Endpoints } from '../../../../common/constants'
import { useFetch } from '../../../../common/helpers'
import { createAlbumPayload } from '../../helpers'
import { HTTPException } from '../../../../common/errors'
import type { IUseCase } from '../../../../common/types'
import type { AlbumAPIResponseModel, AlbumModel } from '../../models'
import type { z } from 'zod'

export class GetAlbumByLinkUseCase implements IUseCase<string, z.infer<typeof AlbumModel>> {
  constructor() {}

  async execute(token: string) {
    const { data } = await useFetch<z.infer<typeof AlbumAPIResponseModel>>({
      endpoint: Endpoints.albums.link,
      params: {
        token,
        type: 'album'
      }
    })

    if (!data) throw new HTTPException(404, { message: 'album not found' })

    return createAlbumPayload(data)
  }
}
