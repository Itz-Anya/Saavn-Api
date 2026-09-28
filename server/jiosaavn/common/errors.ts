export class HTTPException extends Error {
  status: number
  constructor(status: number, options?: { message?: string }) {
    super(options?.message ?? 'HTTP error')
    this.status = status
    this.name = 'HTTPException'
  }
}
