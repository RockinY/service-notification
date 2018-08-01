export const newDocuments = (db: any) =>
  db
    .row('old_val')
    .eq(null)
    .and(db.not(db.row('new_val').eq(null)))