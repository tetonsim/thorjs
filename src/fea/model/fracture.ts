/**
 * Fracture properties.
 */
export interface Fracture {
  /**
   * Mode I fracture toughness.
   */
  KIc: number;
}

export class Fracture {
  KIc: number;

  constructor(KIc?: number) {
    this.KIc = KIc
  }
}
