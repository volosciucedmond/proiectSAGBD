import neo4j from "neo4j-driver";
const driver = neo4j.driver(
  "neo4j+s://ea5535af.databases.neo4j.io",
  neo4j.auth.basic("neo4j", "")
);
const session = driver.session();

export default async function handler(req, res) {
  const { method } = req;

  switch (method) {
    case "GET":
      try {
        // Obține județele cu populație totală mai mică sau egală cu M
        const countiesTxResultPromise = session.readTransaction(
          async (transaction) => {
            const cypher = `
            MATCH (county:County)-[:IN_COUNTY]->(city:City)
            WITH county, SUM(city.population) AS totalPopulation
            WHERE totalPopulation <= $maxPopulation
            RETURN county, totalPopulation
          `;

            const countiesTxResponse = await transaction.run(cypher, {
              maxPopulation: M,
            });
            const counties = countiesTxResponse.records.map((record) => {
              const county = record.get("county").properties;
              const totalPopulation = record.get("totalPopulation").toNumber();
              return { county, totalPopulation };
            });

            return counties;
          }
        );

        const counties = await countiesTxResultPromise;
        res.status(200).json({ success: true, counties });
      } catch (error) {
        console.log(error);
        res.status(400).json({ success: false });
      }
      break;

    case "POST":
      try {
        // Creează un nou județ cu numele specificat
        const { name } = req.body;

        const createTxResultPromise = session.writeTransaction(
          async (transaction) => {
            const cypher = `
            CREATE (:County {name: $name})
          `;

            await transaction.run(cypher, { name });
          }
        );

        await createTxResultPromise;
        res.status(200).json({ success: true });
      } catch (error) {
        console.log(error);
        res.status(400).json({ success: false });
      }
      break;

    case "PUT":
      try {
        // Actualizează populația unui județ
        const { name, newPopulation } = req.body;

        const updateTxResultPromise = session.writeTransaction(
          async (transaction) => {
            const cypher = `
            MATCH (city:City {name: $name})
            SET city.population = $newPopulation
          `;

            await transaction.run(cypher, { name, newPopulation });
          }
        );

        await updateTxResultPromise;
        res.status(200).json({ success: true });
      } catch (error) {
        console.log(error);
        res.status(400).json({ success: false });
      }
      break;

    case "DELETE":
      try {
        // Șterge un județ și relațiile asociate
        const { name } = req.body;

        const deleteTxResultPromise = session.writeTransaction(
          async (transaction) => {
            const cypher = `
            MATCH (:County {name: $name})-[r]-()
            DELETE r
          `;

            await transaction.run(cypher, { name });
          }
        );

        await deleteTxResultPromise;
        res.status(200).json({ success: true });
      } catch (error) {
        console.log(error);
        res.status(400).json({ success: false });
      }
      break;

    case "GET_COUNTIES":
      try {
        // Obține toate județele
        const allCountiesTxResultPromise = session.readTransaction(
          async (transaction) => {
            const cypher = `
            MATCH (county:County)
            RETURN county
          `;

            const allCountiesTxResponse = await transaction.run(cypher);
            const counties = allCountiesTxResponse.records.map(
              (record) => record.get("county").properties
            );
            return counties;
          }
        );

        const allCounties = await allCountiesTxResultPromise;
        res.status(200).json({ success: true, counties: allCounties });
      } catch (error) {
        console.log(error);
        res.status(400).json({ success: false });
      }
      break;

    case "GET_POPULATION":
      try {
        // Obține județele cu populație totală mai mare sau egală cu N
        const { minPopulation } = req.body;

        const populousCountiesTxResultPromise = session.readTransaction(
          async (transaction) => {
            const cypher = `
            MATCH (county:County)-[:IN_COUNTY]->(city:City)
            WITH county, SUM(city.population) AS totalPopulation
            WHERE totalPopulation >= $minPopulation
            RETURN county, totalPopulation
          `;

            const populousCountiesTxResponse = await transaction.run(cypher, {
              minPopulation,
            });
            const counties = populousCountiesTxResponse.records.map(
              (record) => {
                const county = record.get("county").properties;
                const totalPopulation = record
                  .get("totalPopulation")
                  .toNumber();
                return { county, totalPopulation };
              }
            );

            return counties;
          }
        );

        const populousCounties = await populousCountiesTxResultPromise;
        res.status(200).json({ success: true, counties: populousCounties });
      } catch (error) {
        console.log(error);
        res.status(400).json({ success: false });
      }
      break;

    default:
      res.status(400).json({ success: false });
      break;
  }
}
