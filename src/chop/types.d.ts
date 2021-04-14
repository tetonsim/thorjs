export type Face = Array<number>;

export type Vector = [number, number, number];

export type FixedArray<T> = Array<[T, T, T]>;

export type VertexArray = FixedArray<number>
export type IndexArray = FixedArray<number>

export type Transform = [
  number, number, number, number,
  number, number, number, number,
  number, number, number, number,
  number, number, number, number,
];