const express = require("express");
const { Client } = require('pg');
const cors = require("cors");
const bodyparser = require("body-parser");
const config = require("./config");

const app = express();

app.use(express.json());
app.use(cors());
app.use(bodyparser.json());

var conString = config.urlConnection;
var client = new Client(conString);

client.connect(function (err) {
    if (err) {
        return console.error('Não foi possível conectar ao banco.', err);
    }
    client.query('SELECT NOW()', function (err, result) {
        if (err) {
            return console.error('Erro ao executar a query.', err);
        }
        console.log(result.rows[0]);
    });
});

app.get("/", (req, res) => {
    console.log("Response ok.");
    res.send("Ok – Servidor disponível.");
});
app.listen(config.port, () =>
    console.log("Servidor funcionando na porta " + config.port)
);

// READ (GET) CARDAPIO
app.get("/cardapio", (req, res) => {
    try {
      client.query("SELECT * FROM cardapio", function
        (err, result) {
        if (err) {
          return console.error("Erro ao executar a qry de SELECT", err);
        }
        res.send(result.rows);
        console.log("Rota: get cardapio");
      });
    } catch (error) {
      console.log(error);
    }
  });
  
  // READ (GET) CARDAPIO BY ID
  app.get("/cardapio/:id", (req, res) => {
    try {
      console.log("Rota: cardapio/" + req.params.id);
      client.query(
        "SELECT * FROM cardapio WHERE id = $1", [req.params.id],
        (err, result) => {
          if (err) {
            return console.error("Erro ao executar a qry de SELECT id", err);
          }
          res.send(result.rows);
          //console.log(result);
        }
      );
    } catch (error) {
      console.log(error);
    }
  });
  
  // DELETE CARDAPIO BY ID
  app.delete("/cardapio/:id", (req, res) => {
    try {
      console.log("Rota: delete/" + req.params.id);
      client.query(
        "DELETE FROM cardapio WHERE id = $1", [req.params.id], (err, result) => {
          if (err) {
            return console.error("Erro ao executar a qry de DELETE", err);
          } else {
            if (result.rowCount == 0) {
              res.status(404).json({ info: "Registro não encontrado." });
            } else {
              res.status(200).json({ info: "Registro excluído." });
            }
          }
          console.log(result);
        }
      );
    } catch (error) {
      console.log(error);
    }
  });
  
  // CREATE (POST) CARDAPIO
  app.post("/cardapio", (req, res) => {
    try {
      console.log("Alguém enviou um post com os dados:", req.body);
      const { data, refeicao, titulo } = req.body;
      client.query(
        "INSERT INTO cardapio (data, refeicao, titulo) VALUES ($1, $2, $3) RETURNING * ", [data, refeicao, titulo],
        (err, result) => {
          if (err) {
            return console.error("Erro ao executar a qry de INSERT", err);
          }
          const { id } = result.rows[0];
          res.setHeader("id", $`{id}`);
          res.status(201).json(result.rows[0]);
          console.log(result);
        }
      );
    } catch (erro) {
      console.error(erro);
    }
  });
  
  // UPDATE (PUT) CARDAPIO
  app.put("/cardapio/:id", (req, res) => {
    try {
      console.log("Alguém enviou um update com os dados:", req.body);
      const id = req.params.id;
      const { data, refeicao, titulo } = req.body;
      client.query(
        "UPDATE cardapio SET data=$1, refeicao=$2, titulo=$3 WHERE id =$4 ",
        [data, refeicao, titulo, id],
        function (err, result) {
          if (err) {
            return console.error("Erro ao executar a qry de UPDATE", err);
          } else {
            res.setHeader("id", id);
            res.status(202).json({ "identificador": id });
            console.log(result);
          }
        }
      );
    } catch (erro) {
      console.error(erro);
    }
  });

// READ (GET) ITENS BY CARDAPIO ID
app.get("/cardapio/:id/itens", (req, res) => {
    try {
      console.log("Rota: cardapio/" + req.params.id + "/itens");
      client.query(
        "SELECT i.* FROM Item i INNER JOIN Cardapio_Item ci ON i.ID = ci.Item_ID WHERE ci.Cardapio_ID = $1",
        [req.params.id],
        (err, result) => {
          if (err) {
            return console.error("Erro ao executar a qry de SELECT itens por cardápio id", err);
          }
          res.send(result.rows);
        }
      );
    } catch (error) {
      console.log(error);
    }
  });

// // CREATE (POST) ITEM
// app.post("/cardapio/:id/itens", (req, res) => {
//     try {
//       console.log("Alguém enviou um post com os dados de um item:", req.body);
//       const { nome, descricao, imagem_url } = req.body;
//       const cardapioId = req.params.id;
  
//       client.query(
//         "INSERT INTO Item (nome, descricao, imagem_url) VALUES ($1, $2, $3) RETURNING *",
//         [nome, descricao, imagem_url],
//         (err, result) => {
//           if (err) {
//             return console.error("Erro ao executar a qry de INSERT item", err);
//           }
  
//           const itemId = result.rows[0].id;
  
//           client.query(
//             "INSERT INTO CardapioItem (Cardapio_ID, Item_ID) VALUES ($1, $2) RETURNING *",
//             [cardapioId, itemId],
//             (err, result) => {
//               if (err) {
//                 return console.error("Erro ao executar a qry de associação do item ao cardápio", err);
//               }
//               res.status(201).json(result.rows[0]);
//             }
//           );
//         }
//       );
//     } catch (erro) {
//       console.error(erro);
//     }
//   });

// UPDATE (PUT) ITEM
app.put("/itens/:id", (req, res) => {
    try {
      console.log("Alguém enviou um update com os dados do item:", req.body);
      const id = req.params.id;
      const { nome, descricao, imagem_url } = req.body;
      client.query(
        "UPDATE Item SET nome=$1, descricao=$2, imagem_url=$3 WHERE id=$4",
        [nome, descricao, imagem_url, id],
        (err, result) => {
          if (err) {
            return console.error("Erro ao executar a qry de UPDATE item", err);
          } else {
            res.status(202).json({ "identificador": id });
            console.log(result);
          }
        }
      );
    } catch (erro) {
      console.error(erro);
    }
  });

// DELETE ITEM BY ID
app.delete("/itens/:id", (req, res) => {
    try {
      console.log("Rota: delete item/" + req.params.id);
      client.query(
        "DELETE FROM Item WHERE id = $1",
        [req.params.id],
        (err, result) => {
          if (err) {
            return console.error("Erro ao executar a qry de DELETE item", err);
          } else {
            if (result.rowCount == 0) {
              res.status(404).json({ info: "Item não encontrado." });
            } else {
              res.status(200).json({ info: `Item excluído.` });
            }
          }
          console.log(result);
        }
      );
    } catch (error) {
      console.log(error);
    }
  });
  
// READ (GET) ITENS
app.get("/itens", (req, res) => {
    try {
      console.log("Rota: get itens");
      client.query("SELECT * FROM Item", (err, result) => {
        if (err) {
          return console.error("Erro ao executar a qry de SELECT", err);
        }
        res.send(result.rows);
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Erro interno do servidor." });
    }
  });

// ADD ITEM TO CARDAPIO
app.post("/cardapio/:id/adicionar-item", (req, res) => {
  const { id } = req.params; // Cardapio ID
  const { itemId } = req.body; // Item ID

  try {
      client.query(
          "INSERT INTO Cardapio_Item (Cardapio_ID, Item_ID) VALUES ($1, $2)",
          [id, itemId],
          (err, result) => {
              if (err) {
                  return console.error("Erro ao executar a qry de INSERT na tabela Cardapio_Item", err);
              }
              res.status(201).json({ message: "Item adicionado ao cardápio com sucesso!" });
          }
      );
  } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Erro interno do servidor." });
  }
});

// DELETE ITEM FROM CARDAPIO
app.delete("/cardapio/:id/remover-item/:itemId", (req, res) => {
  const { id, itemId } = req.params; // Cardapio ID and Item ID

  try {
      client.query(
          "DELETE FROM Cardapio_Item WHERE Cardapio_ID = $1 AND Item_ID = $2",
          [id, itemId],
          (err, result) => {
              if (err) {
                  return console.error("Erro ao executar a qry de DELETE na tabela Cardapio_Item", err);
              }
              if (result.rowCount > 0) {
                  res.status(200).json({ message: "Item removido do cardápio com sucesso!" });
              } else {
                  res.status(404).json({ message: "Item ou cardápio não encontrado." });
              }
          }
      );
  } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Erro interno do servidor." });
  }
});

// CREATE (POST) ITEM
app.post("/itens", (req, res) => {
  try {
      console.log("Alguém enviou um post com os dados:", req.body);
      const { nome, descricao, imagem_url} = req.body;

      // Validação dos dados
      if (!nome || !descricao) {
          return res.status(400).json({ error: "Nome e descrição são obrigatórios." });
      }

      client.query(
          "INSERT INTO Item (nome, descricao, imagem_url) VALUES ($1, $2, $3) RETURNING *",
          [nome, descricao, imagem_url],
          (err, result) => {
              if (err) {
                  console.error("Erro ao executar a qry de INSERT", err);
                  return res.status(500).json({ error: "Erro ao criar item." });
              }

              const { id } = result.rows[0];
              res.setHeader("id", id); // Configurando o header com o ID do novo item
              res.status(201).json(result.rows[0]); // Retornando o item criado
              console.log(result);
          }
      );
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erro ao processar a requisição." });
  }
});

