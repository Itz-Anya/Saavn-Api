import { Endpoints } from '../../../../common/constants'
import { useFetch } from '../../../../common/helpers'
import { createAlbumPayload } from '../../helpers'
import { HTTPException } from '../../../../common/errors'
import type { IUseCase } from '../../../../common/types'
import type { AlbumAPIResponseModel, AlbumModel } from '../../models'
import type { z } from 'zod'

export class GetAlbumByIdUseCase implements IUseCase<string, z.infer<typeof AlbumModel>> {
  constructor() {}

  async execute(id: string) {
    const { data } = await useFetch<z.infer<typeof AlbumAPIResponseModel>>({
      endpoint: Endpoints.albums.id,
      params: { albumid: id }
    })

    if (!data) throw new HTTPException(404, { message: 'album not found' })

    return createAlbumPayload(data)
  }
}
