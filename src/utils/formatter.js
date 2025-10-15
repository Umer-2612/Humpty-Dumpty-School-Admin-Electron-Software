export function toClientDoc(doc) {
  if (!doc) return null;
  const obj =
    typeof doc.toObject === "function"
      ? doc.toObject({ virtuals: true })
      : { ...doc };
  const { _id, ...rest } = obj;
  return {
    id: _id?.toString() || null,
    ...rest,
  };
}

export function toClientList(docs) {
  if (!Array.isArray(docs)) return [];
  return docs.map(toClientDoc);
}
