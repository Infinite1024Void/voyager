/** Shape persisted on disk for the last session. */
export interface SessionShape {
  tabs: SessionTabRecord[]
  activeIndex: number
}

/** A single restored tab. */
export interface SessionTabRecord {
  url: string
  title: string
  pinned: boolean
}
