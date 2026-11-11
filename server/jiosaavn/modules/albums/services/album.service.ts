import { Endpoints } from '../../../common/constants'
import { HTTPException } from '../../../common/errors'
import { useFetch } from '../../../common/helpers'
import { createAlbumPayload } from '../helpers'
import type { IUseCase } from '../../../common/types'
import type { AlbumAPIResponseModel, AlbumModel } from '../models'
import type { z } from 'zod'

class GetAlbumByIdUseCase implements IUseCase<string, z.infer<typeof AlbumModel>> {
  async execute(id: string) {
    const { data } = await useFetch<z.infer<typeof AlbumAPIResponseModel>>({
      endpoint: Endpoints.albums.id,
      params: { albumid: id }
    })

    if (!data) throw new HTTPException(404, { message: 'album not found' })

    return createAlbumPayload(data)
  }
}

class GetAlbumByLinkUseCase implements IUseCase<string, z.infer<typeof AlbumModel>> {
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

export class AlbumService {
  private readonly getAlbumByIdUseCase: GetAlbumByIdUseCase
  private readonly getAlbumByLinkUseCase: GetAlbumByLinkUseCase

  constructor() {
    this.getAlbumByIdUseCase = new GetAlbumByIdUseCase()
    this.getAlbumByLinkUseCase = new GetAlbumByLinkUseCase()
  }

  getAlbumById = (albumId: string) => {
    return this.getAlbumByIdUseCase.execute(albumId)
  }

  getAlbumByLink = (albumLink: string) => {
    return this.getAlbumByLinkUseCase.execute(albumLink)
  }
}
