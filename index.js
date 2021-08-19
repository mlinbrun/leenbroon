const oracledb = require("oracledb");
const config = require("./config");
const fs = require("fs");
async function databaseInitialize() {
  await oracledb.createPool({
    user: config.dragon.database.user,
    password: config.dragon.database.password,
    connectString: config.dragon.database.connectString,
    poolIncrement: config.dragon.database.poolIncrement,
    poolMax: config.dragon.database.poolMax,
    poolMin: config.dragon.database.poolMin,
    poolTimeout: config.dragon.database.poolTimeout,
    poolAlias: config.dragon.database.poolAlias,
    queueMax: config.dragon.database.queueMax,
    queueTimeout: config.dragon.database.queueMax,
  });
}
async function databaseClose() {
  await oracledb.getPool().close(10);
}
async function getDocument(connection, documentId, customerId) {
  try {
    let result = await connection.execute(`SELECT * FROM DOCUMENT WHERE DOCUMENT_ID = ${documentId}`, [], {
      resultSet: false,
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      fetchArraySize: 1,
      fetchInfo: { DOCUMENT_CONTENTS: { type: oracledb.BUFFER } },
    });
    for (row of result.rows) {
      if (row.DOCUMENT_CONTENTS) {
        if (!fs.existsSync(`${__dirname}/pdf/${customerId}`)) {
          await fs.promises.mkdir(`${__dirname}/pdf/${customerId}`);
        }
        await fs.promises.writeFile(`${__dirname}/pdf/${customerId}/${row.DOCUMENT_NAME}.${row.DOCUMENT_FORMAT_TYPE}`, row.DOCUMENT_CONTENTS, {
          encoding: "utf8",
        });
      }
    }
  } catch (error) {
    console.log(error);
    throw error;
  }
}
(async function () {
  let connection;
  try {
    await databaseInitialize();
    const pool = oracledb.getPool(config.dragon.database.poolAlias);
    connection = await pool.getConnection();
    /* Future setup    const sql = ``;    const result = await connection.execute(sql, [], {      resultSet: true,      outFormat: oracledb.OUT_FORMAT_OBJECT,      fetchArraySize: 1500,    });    const resultSet = result.resultSet;    let row;    while ((row = await resultSet.getRow())) {      await getDocument(connection, row.DOCUMENT_ID, row.CUSTOMER_ID)    }    */    const customerId = 44444444444;
    const documentId = 32528147836;
    await getDocument(connection, documentId, customerId);
  } catch (error) {
    console.log(error);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (error) {
        console.error(error);
      }
    }
    try {
      await databaseClose();
    } catch (error) {
      console.log(error);
    }
  }
})();
