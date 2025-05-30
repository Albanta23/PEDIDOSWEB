require('dotenv').config();
const { MongoClient } = require('mongodb');

(async () => {
  // Lee la URI desde .env (MONGODB_URI)
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('No se ha definido MONGODB_URI en el archivo .env');
    process.exit(1);
  }
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(); // Usa el nombre de tu base de datos si es necesario: client.db('NOMBRE_DB')
    const col = db.collection('historialproveedors');
    // Encuentra documentos donde tiendaId es ObjectId
    const docs = await col.find({ tiendaId: { $type: 7 } }).toArray();
    if (docs.length === 0) {
      console.log('No hay documentos con tiendaId como ObjectId. Nada que migrar.');
      process.exit(0);
    }
    for (const doc of docs) {
      await col.updateOne(
        { _id: doc._id },
        { $set: { tiendaId: doc.tiendaId.toString() } }
      );
      console.log(`Actualizado _id=${doc._id}: tiendaId -> ${doc.tiendaId.toString()}`);
    }
    console.log('Migración completada.');
  } catch (e) {
    console.error('Error en migración:', e);
    process.exit(1);
  } finally {
    await client.close();
  }
})();
